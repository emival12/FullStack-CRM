from db.db_queries import get_single_record_or_none
from db.query_builder import QueryBuilder, QueryBuilderComparisonOperator
from core.exceptions import raise_trigger_exception

def get_documento(cursor, id_documento: str):
    table_name = "documento"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        {"field_name": "id"},
        {"field_name": "listino"}
    ]
    record_documento = get_single_record_or_none(
        cursor,
        table_name,
        select_fields,
        [f"{table_alias}.id = %s"],
        [id_documento]
    )
    if not record_documento:
        raise_trigger_exception(404, "DETTAGLIO_DOCUMENTO_HELPER_DOCUMENTO_NOT_FOUND", {"id_documento": id_documento})
    
    return record_documento

def get_voce_listino(cursor, id_articolo: str, id_listino:str):
    table_name = "voce_listino"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        {"field_name": "id"},
        {"field_name": "prezzo"}
    ]
    record_voce_listino = get_single_record_or_none(
        cursor,
        table_name,
        select_fields,
        [
            f"{table_alias}.articolo = %s",
            f"{table_alias}.listino = %s"
        ],
        [
            id_articolo,
            id_listino
        ]
    )
    if not record_voce_listino:
        raise_trigger_exception(404, "DETTAGLIO_DOCUMENTO_HELPER_VOCE_LISTINO_NOT_FOUND", {"id_articolo": id_articolo, "id_listino": id_listino})

    return record_voce_listino