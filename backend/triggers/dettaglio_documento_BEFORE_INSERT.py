from triggers.trigger_manager import load_module

def execute(cursor, record):
    helper = load_module("dettaglio_documento_helper.py")

    articolo = record["articolo"]
    documento = record["documento"]

    input_prezzo = record["prezzo"]
    if input_prezzo is None:
        record["prezzo"] = helper.get_prezzo_articolo_from_documento(cursor, articolo, documento)

    input_regime_iva = record["regime_iva"]
    if input_regime_iva is None:
        record["regime_iva"] = helper.get_iva_from_articolo(cursor, documento, articolo)

    record["unita_di_misura"] = helper.get_unita_di_misura_from_articolo(cursor, articolo)
    record["magazzino"] = helper.get_magazzino_id(cursor)
    return record