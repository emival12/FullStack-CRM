from db.db_queries import get_single_record_or_none
from db.query_builder import QueryBuilder, QueryBuilderComparisonOperator
from core.exceptions import raise_trigger_exception

# Retrieve records
def get_documento(cursor, id_documento: str):
    table_name = "documento"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        {"field_name": "id"},
        {"field_name": "listino"},
        {"field_name": "record_type_name"}
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

def get_articolo(cursor, id_articolo: str):
    table_name = "articolo"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        {"field_name": "id"},
        {"field_name": "iva_acquisto"},
        {"field_name": "iva_vendita"},
        {"field_name": "unita_di_misura"},
    ]
    record_articolo = get_single_record_or_none(
        cursor,
        table_name,
        select_fields,
        [
            f"{table_alias}.id = %s"
        ],
        [
            id_articolo,
        ]
    )
    if not record_articolo:
        raise_trigger_exception(404, "DETTAGLIO_DOCUMENTO_HELPER_ARTICOLO_NOT_FOUND", {"id_articolo": id_articolo})

    return record_articolo

def get_magazzino(cursor):
    table_name = "magazzino"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        {"field_name": "id"},
        {"field_name": "descrizione"}
    ]
    record_magazzino = get_single_record_or_none(
        cursor,
        table_name,
        select_fields,
        [
            f"{table_alias}.magazzino_di_default = %s"
        ],
        [
            True,
        ]
    )
    if not record_magazzino:
        raise_trigger_exception(404, "DETTAGLIO_DOCUMENTO_HELPER_MAGAZZINO_NOT_FOUND")

    return record_magazzino



# Utils
def get_prezzo_articolo_from_documento(cursor, articolo: str, documento: str):
    record_documento = get_documento(cursor, documento)
    listino = record_documento["listino"]

    # Retrieve the voce_listino associated to the pair (articolo, listino)
    record_voce_listino = get_voce_listino(cursor, articolo, listino)
    return record_voce_listino["prezzo"]

def get_iva_from_articolo(cursor, id_documento: str, id_articolo: str):
    record_documento = get_documento(cursor, id_documento)
    record_type_documento = record_documento["record_type_name"]

    record_articolo = get_articolo(cursor, id_articolo)
    if record_type_documento == "acquisto":
        regime_iva = record_articolo["iva_acquisto"]
    elif record_type_documento == "vendita":
        regime_iva = record_articolo["iva_vendita"]
    else: 
        raise_trigger_exception(422, "DETTAGLIO_DOCUMENTO_HELPER_MAPPING_IVA_NOT_FOUND", {"record_type_documento": record_type_documento})
    
    return regime_iva

def get_unita_di_misura_from_articolo(cursor, id_articolo: str):
    record_articolo = get_articolo(cursor, id_articolo)
    return record_articolo["unita_di_misura"]

def get_magazzino_id(cursor):
    record_magazzino = get_magazzino(cursor)
    return record_magazzino["id"]