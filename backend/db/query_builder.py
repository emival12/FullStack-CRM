from __future__ import annotations
from enum import Enum

class QueryBuilderComparisonOperator(Enum):
    EQUAL              = "="
    NOT_EQUAL          = "!="
    GREATER_THAN       = ">"
    GREATER_EQUAL_THAN = ">="
    LESS_THAN          = "<"
    LESS_EQUAL_THAN    = "<="
    IN                 = "IN"
    NOT_IN             = "NOT IN"


class QueryBuilderLogicalOperator(Enum):
    AND = "AND"
    OR  = "OR"


class QueryBuilderJoinType(Enum):
    INNER = "INNER"
    LEFT  = "LEFT"
    RIGHT = "RIGHT"


def build_insert_query(table_name: str, fields: list[str]) -> str:
    """Build a parameterized INSERT INTO ... VALUES (...) query string."""
    field_list = ', '.join(fields)
    placeholders = ', '.join(['%s'] * len(fields))
    return f"INSERT INTO {table_name} ({field_list}) VALUES ({placeholders})"

def build_update_query(table_name: str, fields: list[str], primary_key_field: str, include_record_type: bool = False) -> str:
    """Build a parameterized UPDATE ... SET ... WHERE ... query string."""
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    where = f"{primary_key_field} = %s"
    if include_record_type:
        where += " AND record_type_name = %s"
    return f"UPDATE {table_name} SET {set_clause} WHERE {where}"

def build_delete_query(table_name: str, where_filter: list[str], operator: QueryBuilderLogicalOperator = QueryBuilderLogicalOperator.AND) -> str:
    """Build a parameterized DELETE FROM ... WHERE ... query string."""
    parts = [
        f"DELETE FROM {table_name}"
    ]

    if where_filter:
        where_clause = f" {operator.value} ".join(where_filter)
        parts.append(f"WHERE {where_clause}")

    return "\n".join(parts)

class QueryBuilder:
    """
        Fluent SQL SELECT query builder with parameterized output.

        Builds a query incrementally and returns both the SQL string and the
        bound parameters as a tuple, ready for cursor.execute().

        Usage:
            query, params = (
                QueryBuilder("my_table", ["field1", "field2"])
                .add_join(QueryBuilderJoinType.LEFT, "other_table", [("my_table__tab.id", "other_table__tab.fk_id")])
                .begin_filter()
                    .add("field1", QueryBuilderComparisonOperator.EQUAL, "value")
                    .begin_or()
                        .add("field2", QueryBuilderComparisonOperator.IN, [1, 2, 3])
                        .add("field3", QueryBuilderComparisonOperator.NOT_EQUAL, "x")
                    .end()
                .end_filter()
                .order_by(["field1 ASC"])
                .get_query()
            )
            cursor.execute(query, params)
    """

    @staticmethod
    def alias(table_name: str) -> str:
        """Return the standard SQL alias for a table name"""
        return f"{table_name}__tab"

    @staticmethod
    def alias_join(table_name: str, table_field: str) -> str:
        """Return a per-field SQL alias for a joined table, unique when the same table is joined more than once in a query."""
        return f"{table_name}__tab_{table_field}"

    @staticmethod
    def build_join_clause(table_name: str, table_field: str, join_table_name: str, join_field: str, join_reference_field: str) -> tuple[str, tuple]:
        """
            Build a LEFT JOIN clause and its SELECT field for a lookup/reference join.

            Args:
                table_name (str): Name of the main table
                table_field (str): Field on the main table used as the join key
                join_table_name (str): Name of the table to join
                join_field (str): Field on the joined table used as the join key
                join_reference_field (str): Field on the joined table to include in the SELECT

            Returns:
                tuple[str, tuple]: SELECT field expression and JOIN clause in QueryBuilder format
        """
        table_name_alias = QueryBuilder.alias(table_name)
        join_table_alias = QueryBuilder.alias_join(join_table_name, table_field)

        join_clause = (QueryBuilderJoinType.LEFT, join_table_name, [(f"{table_name_alias}.{table_field}", f"{join_table_alias}.{join_field}")], join_table_alias)
        select_field = f"{join_table_alias}.{join_reference_field} {table_field}"

        return (select_field, join_clause)

    @staticmethod
    def build_join_clause_aggregated(table_name: str, table_field: str, join_table_name: str, join_field: str, aggregation_function: str, detail_field: str, master_field: str) -> tuple[str, tuple]:
        """Build a LEFT JOIN clause and aggregated SELECT field for a rollup join.

            Args:
                table_name (str): Name of the main (master) table
                table_field (str): Field on the main table used as the join key
                join_table_name (str): Name of the detail table to join
                join_field (str): Field on the detail table used as the join key
                aggregation_function (str): SQL aggregation function (e.g. SUM, COUNT, AVG)
                detail_field (str): Field on the detail table to aggregate
                master_field (str): Alias for the aggregated result in the SELECT

            Returns:
                tuple[str, tuple]: Aggregated SELECT field expression and JOIN clause in QueryBuilder format
        """
        table_name_alias = QueryBuilder.alias(table_name)
        join_table_alias = QueryBuilder.alias_join(join_table_name, master_field)

        join_clause = (QueryBuilderJoinType.LEFT, join_table_name, [(f"{table_name_alias}.{table_field}", f"{join_table_alias}.{join_field}")], join_table_alias)
        select_field = f"{aggregation_function}({join_table_alias}.{detail_field}) {master_field}"

        return (select_field, join_clause)



    class FilterBuilder:
        """
            Builds a nested WHERE clause tree.
            Each node holds a list of conditions joined by its logical operator.
            Nesting is achieved via begin_and() / begin_or() + end().
        """

        def __init__(
            self,
            qb: QueryBuilder,
            logic_operator: QueryBuilderLogicalOperator,
            parent: QueryBuilder.FilterBuilder = None,
        ):
            self._filters: list[str] = []
            self._params: list = []
            self._qb = qb
            self._logic_operator = logic_operator
            self._parent = parent

        def add(
            self,
            field_name: str,
            comparison_operator: QueryBuilderComparisonOperator,
            field_value,
        ) -> QueryBuilder.FilterBuilder:
            """
                Append a condition to this filter node.
                Values are always bound via %s — never interpolated into the SQL string.
            """
            if not field_name or not comparison_operator:
                raise ValueError("field_name and comparison_operator are required")

            if comparison_operator in (
                QueryBuilderComparisonOperator.IN,
                QueryBuilderComparisonOperator.NOT_IN,
            ):
                if not hasattr(field_value, "__iter__") or isinstance(field_value, str):
                    raise ValueError("IN / NOT IN require an iterable value")

                placeholders = ", ".join(["%s"] * len(field_value))
                self._filters.append(f"{field_name} {comparison_operator.value} ({placeholders})")
                self._params.extend(field_value)
            else:
                self._filters.append(f"{field_name} {comparison_operator.value} %s")
                self._params.append(field_value)

            return self

        def add_if(self, condition, field_name: str, comparison_operator: QueryBuilderComparisonOperator, field_value) -> QueryBuilder.FilterBuilder:
            """Add a condition only if condition is truthy. Returns self unchanged otherwise."""
            if condition:
                return self.add(field_name, comparison_operator, field_value)
            return self

        def add_tuple_in(self, columns: list[str], values: list[tuple]) -> QueryBuilder.FilterBuilder:
            """
                Append a multi-column IN condition, e.g. (col1, col2) IN ((%s, %s), ...).
                Values are flattened and bound via %s — never interpolated into the SQL string.
            """
            placeholders = ", ".join(["(" + ", ".join(["%s"] * len(columns)) + ")"] * len(values))
            self._filters.append(f"({', '.join(columns)}) IN ({placeholders})")
            self._params.extend(v for row in values for v in row)
            return self

        def add_raw(self, conditions: list[str], params: list | None = None) -> QueryBuilder.FilterBuilder:
            """Append raw SQL condition strings directly into the filter, bypassing query builder operators."""
            if not conditions:
                raise ValueError("conditions must be a non-empty list")
                
            self._filters.extend(conditions)
            if params:
                self._params.extend(params)
            return self

        def begin_and(self) -> QueryBuilder.FilterBuilder:
            """Open a nested AND block."""
            return QueryBuilder.FilterBuilder(self._qb, QueryBuilderLogicalOperator.AND, self)

        def begin_or(self) -> QueryBuilder.FilterBuilder:
            """Open a nested OR block."""
            return QueryBuilder.FilterBuilder(self._qb, QueryBuilderLogicalOperator.OR, self)

        def end(self) -> QueryBuilder.FilterBuilder | None:
            """
                Close this filter node and merge its output into the parent node.
                Returns the parent node (or None if this is the root).
            """
            if self._parent is not None and self._filters:
                joined = f" {self._logic_operator.value} ".join(self._filters)
                self._parent._filters.append(f"({joined})")
                self._parent._params.extend(self._params)
            return self._parent

        def end_filter(self) -> QueryBuilder:
            """
                Close all open filter nodes and return the QueryBuilder.
                Safe to call at any nesting depth.
            """
            current = self
            while current is not None:
                current = current.end()
            return self._qb


    def __init__(self, table_name: str, fields: list[str], logical_operator: QueryBuilderLogicalOperator = QueryBuilderLogicalOperator.AND):
        self._table_name = table_name
        self._fields = fields
        self._joins: list[str] = []
        self._root_filter = QueryBuilder.FilterBuilder(self, logical_operator)
        self._order_by: list[str] = []
        self._group_by: list[str] = []

    def add_join(
        self,
        join_type: QueryBuilderJoinType,
        join_table: str,
        on_conditions: list[tuple[str,str]],
        alias: str | None = None
    ) -> QueryBuilder:
        """
            Append a JOIN clause.

            Args:
                join_type:     INNER / LEFT / RIGHT
                join_table:    name of the table to join
                on_conditions: list of (left, right) pairs joined with AND in the ON clause
                alias:         explicit table alias; defaults to the standard table alias when omitted
        """
        if not join_type or not join_table or not on_conditions:
            raise ValueError("join_type, join_table and on_conditions are required")

        join_alias = alias or QueryBuilder.alias(join_table)
        join_conditions = " AND ".join(f"{l} = {r}" for l, r in on_conditions)
        self._joins.append(f"{join_type.value} JOIN {join_table} {join_alias} ON {join_conditions}")
        return self

    def begin_filter(self) -> FilterBuilder:
        return self._root_filter

    def order_by(self, fields: list[str]) -> QueryBuilder:
        """Set the ORDER BY clause. Call with a list of 'field [ASC|DESC]' strings."""
        self._order_by = fields
        return self

    def group_by(self, fields: list[str]) -> QueryBuilder:
        """Set the GROUP BY clause"""
        self._group_by = fields
        return self

    def get_query(self) -> tuple[str, tuple]:
        """
            Build and return the final SQL string together with its bound parameters.

            Returns:
                tuple[str, tuple]: (sql_string, params_tuple) ready for cursor.execute()
        """
        alias = QueryBuilder.alias(self._table_name)

        parts = [
            f"SELECT {', '.join(self._fields)}",
            f"FROM {self._table_name} {alias}",
        ]

        if self._joins:
            parts.extend(self._joins)

        if self._root_filter._filters:
            where = f" {self._root_filter._logic_operator.value} ".join(self._root_filter._filters)
            parts.append(f"WHERE {where}")

        if self._group_by:
            parts.append(f"GROUP BY {', '.join(self._group_by)}")

        if self._order_by:
            parts.append(f"ORDER BY {', '.join(self._order_by)}")

        return "\n".join(parts), tuple(self._root_filter._params)
