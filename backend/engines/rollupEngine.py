from __future__ import annotations
import services.recordServices
from core.exceptions import raise_server_exception
from core.models import SystemFieldName_FD, SystemFieldName_ROLLD
from db.queryBuilder import QueryBuilder, QueryBuilderComparisonOperator
from db.dbQueries import (
    get_primary_keys_from_multiple_objects,
    get_rollup_definitions_by_detail_object,
    get_rollup_map_key
)


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

def calculate_record_rollups(cursor, table_name: str, primary_key_field: str, record_id: str, rollup_fields: list[dict], rollup_map: dict) -> dict:
    """
        Calculates all rollup field values for an existing record.

        Executes one aggregation query per rollup field against child records.
        Returns an empty dict if record_id is not provided (e.g. new INSERT before the record exists).

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

    if not record_id or not rollup_fields:
        return {}

    table_alias = QueryBuilder.alias(table_name)
    result = {}
    for row in rollup_fields:
        rollup_definition = rollup_map.get(get_rollup_map_key(row))
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
            raise_server_exception(f"calculate_record_rollups: {str(e)}")

        rollup_record = cursor.fetchone()
        if rollup_record:
            result[row[SystemFieldName_FD.FIELD_NAME]] = rollup_record[rollup_definition[SystemFieldName_ROLLD.MASTER_FIELD_NAME]]

    return result

def refresh_parents(cursor, db, impacted_parents: set, user_id: str) -> None:
    """
        Recalculates rollup and formula fields for all impacted parent records and persists them.

        Pre-fetches primary key names for all impacted objects in a single query, then for each
        parent recalculates rollup aggregations, re-evaluates formula fields, and persists the result.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            db (MySQLConnection): Database connection object used to commit or rollback changes
            impacted_parents (set): Set of tuples (parent_table, parent_record_type, parent_id)
            user_id (str): Id of the user who triggered the cascade
    """
    
    objects_list = list(set(p_table for p_table, _, _ in impacted_parents if p_table))
    map_object_primary_key_names = get_primary_keys_from_multiple_objects(cursor, objects_list)

    for p_table, p_rt, p_id in impacted_parents:
        _ = services.recordServices.update_record(cursor, db, p_table, p_rt, p_id, {}, user_id, map_object_primary_key_names)


