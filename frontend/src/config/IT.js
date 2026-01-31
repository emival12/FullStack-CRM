//App
export const DB_INTRO_LABEL = "Seleziona una tabella dalla sidebar";
//LoadingScreen
export const LOADING_LABEL = "Caricamento...";

//MissingPage
export const MISSING_DEFAULT_LABEL = "Pagina non trovata";
export const MISSING_TABLE_LABEL = "Tabella non trovata";
export const MISSING_RECORD_LABEL = "Nessun record trovato";

//ModalScreen
export const CONFIRM_LABEL = "Conferma";
export const CANCEL_LABEL = "Annulla";

//NavBar
export const DATABASE_LABEL = "Database";
export const IMPORT_LABEL = "Import";

//DatabaseMainPage
export const TABLES_LABEL = "Tabelle";

//RecordForm
export const NEW_LABEL = "Nuovo";
export const MANDATORY_FIELD_LABEL = "Campo obbligatorio";
export const MAX_FIELD_LABEL = "Massimo X caratteri";
export const MAX_NUMBER_LABEL = "Valore massimo accettato: X";
export const MIN_NUMBER_LABEL = "Valore minimo accettato: X";
export const TEXT_AREA_HELP_LABEL = "Dividere ogni valore con l'accapo";

//RecordButtons
export const DELETE_LABEL = "Elimina";
export const EDIT_LABEL = "Modifica";
export const SAVE_LABEL = "Salva";

export const TITLE_MODAL_DELETE_LABEL = "Conferma Cancellazione";
export const BODY_MODAL_DELETE_LABEL =
  "Sei sicuro di voler cancellare il record?";

export const ERROR_TOAST_TITLE_LABEL = "Errore";
export const ERROR_TOAST_BODY_LABEL =
  "E' avvenuto un errore. Contattare un admin";

export const SUCCESS_TOAST_TITLE_LABEL = "Successo";
export const SUCCESS_TOAST_BODY_LABEL = "Operazione conclusa correttamente";

//NewRecord
export const NEW_RECORD_TITLE_LABEL = "Nuovo record";

//RecordDetail
export const DETAIL_TAB_LABEL = "Dettaglio";
export const RELATED_TAB_LABEL = "Correlati";

//SetupSidebar
export const SETUP_TABLE_SELECTION_LABEL = "Tabella da modificare";

//SetupNewObject
export const SETUP_MSG_SELECT_TABLE_LABEL =
  "Seleziona una tabella da modificare";

//SetupNewFields
export const NEW_FIELD_TITLE_LABEL = "Nuovo campo";
export const NEXT_LABEL = "Avanti";
export const PREVIOUS_LABEL = "Indietro";

//Import
export const UPLOAD_FILE_LABEL = "Carica File";

export const API_ERROR_MESSAGES = {
  IMPORT_FILE_MISSING_REQUIRED_FIELDS: (data) => (
    <>Le colonne: [ {data.columns.join(", ")} ] sono obbligatorie</>
  ),

  IMPORT_FILE_UNKNOWN_FIELDS: (data) => (
    <>
      Le colonne: [ {data.columns.join(", ")} ] non esistono sull'oggetto
      indicato
    </>
  ),

  IMPORT_FIELD_LENGTH_EXCEEDED: (data) => (
    <>
      La riga {data.row} nella colonna "{data.column}" ha un valore troppo
      lungo.
      <br />
      Lunghezza massima: {data.max_length}, Lunghezza attuale:{" "}
      {data.actual_length}
    </>
  ),

  INPUT_FIELD_INVALID_BOOLEAN: (data) => (
    <>
      La riga {data.row} nella colonna "{data.column}" ha un valore errato.
      <br /> I valori ammessi sono: [ {data.accepted_values.join(", ")} ] (case
      insensitive)
    </>
  ),

  INPUT_FIELD_INVALID_NUMBER: (data) => (
    <>
      La riga {data.row} nella colonna "{data.column}" ha un valore non numerico
    </>
  ),

  INPUT_FIELD_SCALE_EXCEEDED: (data) => (
    <>
      La riga {data.row} nella colonna "{data.column}" ha un valore decimale non
      corretto.
      <br />
      Lunghezza massima decimali: {data.max_length}, Lunghezza attuale:{" "}
      {data.actual_length}
    </>
  ),

  INPUT_FIELD_PRECISION_EXCEEDED: (data) => (
    <>
      La riga {data.row} nella colonna "{data.column}" ha un valore troppo
      lungo.
      <br />
      Lunghezza massima: {data.max_length}, Lunghezza attuale:{" "}
      {data.actual_length}
    </>
  ),

  IMPORT_FIELD_ROLLUP_UNAUTHORIZED: (data) => (
    <>
      La riga {data.row} ha un valore nella colonna "{data.column}".
      <br />
      Le colonne rollup non accettano valori in input
    </>
  ),

  INPUT_FIELD_INVALID_RADIO: (data) => (
    <>
      La riga {data.row} nella colonna "{data.column}" ha un valore inesistente.
      <br />
      Valore attuale: {data.actual_value}
    </>
  ),

  INPUT_FIELD_INVALID_LOOKUP_PICKLIST: (data) => (
    <>
      La riga {data.row} nella colonna "{data.column}" ha un valore inesistente.
      <br />
      Valore attuale: {data.actual_value}
    </>
  ),
};
