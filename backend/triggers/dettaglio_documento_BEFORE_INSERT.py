from triggers.trigger_manager import load_module
from core.exceptions import raise_trigger_exception

def execute(cursor, record):
    helper = load_module("dettaglio_documento_helper.py")

    articolo = record["articolo"]
    documento = record["documento"]

    record_documento = helper.get_documento(cursor, documento)
    listino = record_documento["listino"]

    # Retrieve the voce_listino associated to the pair (articolo, listino)
    record_voce_listino = helper.get_voce_listino(cursor, articolo, listino)
    
    record["prezzo"] = record_voce_listino["prezzo"]
    return record