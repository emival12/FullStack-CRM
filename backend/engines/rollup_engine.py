from __future__ import annotations
import logging
from core.exceptions import raise_server_exception
from core.models import SystemFieldName_FD, SystemFieldName_ROLLD, StandardObjectField
from db.query_builder import QueryBuilder, QueryBuilderComparisonOperator
from db.db_queries import (
    make_rollup_key_from_row,
    get_rollup_definitions_by_detail_object,
    get_fields_referencing_object,
    get_fields_definition,
    make_table_key_from_row,
    get_primary_keys_from_multiple_objects,
    get_primary_key_from_fields
)

logger = logging.getLogger(__name__) 

def get_impacted_parents(cursor, table_name: str, new_record: dict, old_record: dict | None = None) -> set:
    """
        Returns the set of parent records whose rollup fields are affected by a child record change.

        A parent is impacted if the child's join key value points to it (new_val),
        or if the join key changed and the old parent (old_val) also needs recalculation.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query.
            table_name (str): Name of the child object table.
            new_record (dict): The new state of the child record after write.
            old_record (dict | None): The previous state of the child record before write (for UPDATE).

        Returns:
            set: Set of tuples (parent_table, parent_record_type, parent_id)
    """
    # fetch all rollup definitions where this table is the child
    rollup_definitions = get_rollup_definitions_by_detail_object(cursor, table_name)

    impacted = set()
    for agg in rollup_definitions:
        parent_table = agg[SystemFieldName_ROLLD.MASTER_OBJECT_NAME]
        parent_record_type = agg[SystemFieldName_ROLLD.MASTER_RECORD_TYPE_NAME]
        join_key = agg[SystemFieldName_ROLLD.DETAIL_JOIN_KEY] 

        new_val = new_record.get(join_key, None)
        old_val = old_record.get(join_key, None) if old_record else None

        # the new parent needs recalculation
        if new_val is not None:
            impacted.add((parent_table, parent_record_type, str(new_val)))

        # if the FK is changed, the old parent also needs recalculation
        if old_val is not None and old_val != new_val:
            impacted.add((parent_table, parent_record_type, str(old_val)))

    return impacted

def get_impacted_children(cursor, table_name: str, new_record: dict) -> set:
    """
        Returns the set of child records whose cross-object formulas read a field of the changed parent.

        Having a lookup to the parent is not enough: an object qualifies only when one of its formulas references the parent through the `field.<lookup>__obj.` 
        For every qualifying object, all rows whose lookup points at the parent are collected. 
        The record type is read from the row itself, not from the field definition, since the same lookup is defined once per record type and would otherwise mislabel the children.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query.
            table_name (str): Name of the parent object table that was just written.
            new_record (dict): The new state of the parent record, used to read its primary key value.

        Returns:
            set: Set of tuples (child_table, child_record_type, child_id)
    """

    lookup_definition = get_fields_referencing_object(cursor, table_name)
    objects = []
    for lookup in lookup_definition:
        objects.append((lookup[SystemFieldName_FD.OBJECT_NAME], lookup[SystemFieldName_FD.RECORD_TYPE_NAME]))

    fields = get_fields_definition(cursor, objects, is_visible=0)
    impacted_lookup = []
    for lookup in lookup_definition:
        obj_key = make_table_key_from_row(lookup)
        obj_fields = fields.get(obj_key)
        lookup_field_name = lookup[SystemFieldName_FD.FIELD_NAME]
        for f in obj_fields:
            formula_def = f[SystemFieldName_FD.FORMULA_DEFINITION]
            if formula_def is not None and f"field.{lookup_field_name}__obj." in f[SystemFieldName_FD.FORMULA_DEFINITION] and lookup not in impacted_lookup:
                impacted_lookup.append(lookup)
        
    map_object_primary_key_names = get_primary_keys_from_multiple_objects(cursor, [table_name])

    impacted = set()
    for lookup in impacted_lookup:
        lookup_obj_name = lookup[SystemFieldName_FD.OBJECT_NAME]
        lookup_field_name = lookup[SystemFieldName_FD.FIELD_NAME]
        table_alias = QueryBuilder.alias(lookup_obj_name)
        
        obj_key = make_table_key_from_row(lookup)
        obj_pk_name = get_primary_key_from_fields(fields.get(obj_key))
        try:
            query, params = (
                QueryBuilder(lookup_obj_name, [f"{table_alias}.{StandardObjectField.RECORD_TYPE_NAME}", f"{table_alias}.{obj_pk_name}"])
                .begin_filter()
                    .add(f"{table_alias}.{lookup_field_name}", QueryBuilderComparisonOperator.EQUAL, new_record.get(map_object_primary_key_names.get(table_name)))
                .end_filter()
                .get_query()
            )
            cursor.execute(query, params)

            records = cursor.fetchall()
            for r in records:
                impacted.add((lookup_obj_name, r[StandardObjectField.RECORD_TYPE_NAME], r[obj_pk_name]))

        except Exception as e:
            raise_server_exception(logger, "DB query failed", query=query)

    return impacted

def calculate_record_rollups(cursor, table_name: str, primary_key_field: str, record_id: str, rollup_fields: list[dict], rollup_map: dict) -> dict:
    """
        Calculates all rollup field values for an existing record.
        Executes one aggregation query per rollup field against child records.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query.
            table_name (str): Name of the parent object table.
            primary_key_field (str): Primary key column name of the parent object.
            record_id (str): Primary key value of the record to calculate rollups for.
            rollup_fields (list[dict]): Rollup field rows from field_definition.
            rollup_map (dict): Rollup definitions keyed by rollup map key.

        Returns:
            dict: Mapping of rollup field names to their aggregated values.
    """

    table_alias = QueryBuilder.alias(table_name)
    result = {}
    for row in rollup_fields:
        rollup_definition = rollup_map.get(make_rollup_key_from_row(row))
        (select_field, joins) = QueryBuilder.build_join_clause_aggregated(
            table_name,
            rollup_definition[SystemFieldName_ROLLD.MASTER_PRIMARY_KEY],
            row[SystemFieldName_FD.REFERENCE_OBJECT],
            rollup_definition[SystemFieldName_ROLLD.DETAIL_JOIN_KEY],
            rollup_definition[SystemFieldName_ROLLD.AGGREGATION_FUNCTION],
            rollup_definition[SystemFieldName_ROLLD.DETAIL_FIELD_NAME],
            rollup_definition[SystemFieldName_ROLLD.MASTER_FIELD_NAME]
        )

        try:
            query, params = (
                QueryBuilder(table_name, [select_field])
                .add_join(*joins)
                .begin_filter()
                    .add(f"{table_alias}.{primary_key_field}", QueryBuilderComparisonOperator.EQUAL, record_id)
                .end_filter()
                .get_query()
            )
            cursor.execute(query, params)
        except Exception as e:
            raise_server_exception(logger, "DB query failed", query=query)

        rollup_record = cursor.fetchone()
        if rollup_record:
            result[row[SystemFieldName_FD.FIELD_NAME]] = rollup_record[rollup_definition[SystemFieldName_ROLLD.MASTER_FIELD_NAME]]

    return result

