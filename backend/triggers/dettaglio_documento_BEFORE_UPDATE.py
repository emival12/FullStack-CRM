from triggers.trigger_manager import load_module

def execute(cursor, record, old_record):
    helper = load_module("dettaglio_documento_helper.py")

    articolo = record["articolo"]
    documento = record["documento"]

    old_articolo = old_record["articolo"]
    old_documento = old_record["documento"]

    input_prezzo = record["prezzo"]
    input_regime_iva = record["regime_iva"]

    
    if articolo != old_articolo or str(documento) != str(old_documento):
        record["prezzo"] = helper.get_prezzo_articolo_from_documento(cursor, articolo, documento)
        record["regime_iva"] = helper.get_iva_from_articolo(cursor, documento, articolo)

    if input_prezzo is None:
        record["prezzo"] = helper.get_prezzo_articolo_from_documento(cursor, articolo, documento)
    if input_regime_iva is None:
        record["regime_iva"] = helper.get_iva_from_articolo(cursor, documento, articolo)

    if articolo != old_articolo:
        record["unita_di_misura"] = helper.get_unita_di_misura_from_articolo(cursor, articolo)
    return record