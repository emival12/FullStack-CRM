import logging
from core.exceptions import raise_trigger_exception
from db.db_queries import get_single_record_or_none
from db.query_builder import QueryBuilder, QueryBuilderComparisonOperator

def execute(cursor, record):
    articolo = record["articolo"]
    documento = record["documento"]

    # Retrieve the listino used in the documento
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
        [documento]
    )
    if not record_documento:
        raise_trigger_exception(404, "DETTAGLIO_DOCUMENTO_BEFORE_INSERT_DOCUMENTO_NOT_FOUND", {"id_documento": documento})

    id_listino = record_documento["listino"]

    # Retrieve the voce_listino associated to the pair (articolo, listino)
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
            articolo,
            id_listino
        ]
    )
    if not record_voce_listino:
        raise_trigger_exception(404, "DETTAGLIO_DOCUMENTO_BEFORE_INSERT_VOCE_LISTINO_NOT_FOUND", {"id_articolo": articolo, "id_listino": id_listino})
    
    record["prezzo"] = record_voce_listino["prezzo"]
    return record