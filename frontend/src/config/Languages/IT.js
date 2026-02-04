export const IT = {
  NAVBAR: { DATABASE_LABEL: "Database", IMPORT_LABEL: "Import" },
  BUTTONS: {
    NEW_LABEL: "Nuovo",
    EDIT_LABEL: "Modifica",
    SAVE_LABEL: "Salva",
    DELETE_LABEL: "Elimina",
    CONFIRM_LABEL: "Conferma",
    CANCEL_LABEL: "Annulla",
    NEXT_LABEL: "Avanti",
    PREVIOUS_LABEL: "Indietro",
  },
  FORM_ERRORS: {
    MANDATORY_FIELD_LABEL: "Campo obbligatorio",
    MAX_FIELD_LABEL: (data) => `Massimo ${data} caratteri`,
    MAX_NUMBER_LABEL: (data) => `Valore massimo accettato: ${data}`,
    MIN_NUMBER_LABEL: (data) => `Valore minimo accettato: ${data}`,
  },
  TOAST: {
    ERROR_TOAST_TITLE_LABEL: "Errore",
    ERROR_TOAST_BODY_LABEL: "E' avvenuto un errore. Contattare un admin",
    SUCCESS_TOAST_TITLE_LABEL: "Successo",
    SUCCESS_TOAST_BODY_LABEL: "Operazione conclusa correttamente",
  },
  MODAL: {
    DELETE: {
      TITLE_MODAL_DELETE_LABEL: "Conferma Cancellazione",
      BODY_MODAL_DELETE_LABEL: "Sei sicuro di voler cancellare il record?",
    },
    NEW_FIELD: {
      NEW_FIELD_TITLE_LABEL: "Nuovo campo",
    },
  },
  MISSING: {
    MISSING_DEFAULT_LABEL: "Pagina non trovata",
    MISSING_TABLE_LABEL: "Tabella non trovata",
    MISSING_RECORD_LABEL: "Nessun record trovato",
  },
  MASSIVE: {
    UPLOAD_FILE_LABEL: "Carica File",
  },
  MOBILE: {
    TABLES_LABEL: "Tabelle",
  },
  GENERIC: {
    LOADING_LABEL: "Caricamento...",
    DB_INTRO_LABEL: "Seleziona una tabella dalla sidebar",
    NEW_RECORD_TITLE_LABEL: "Nuovo record",
    TEXT_AREA_HELP_LABEL: "Dividere ogni valore con l'accapo",
    DETAIL_TAB_LABEL: "Dettaglio",
    RELATED_TAB_LABEL: "Correlati",
    SETUP_MSG_SELECT_TABLE_LABEL: "Seleziona una tabella da modificare",
    SETUP_TABLE_SELECTION_LABEL: "Tabella da modificare",
  },
  API_ERROR_MESSAGES: {
    IMPORT_FILE_MISSING_REQUIRED_FIELDS: (data) =>
      `Le colonne: [ ${data.columns.join(", ")} ] sono obbligatorie`,

    IMPORT_FILE_UNKNOWN_FIELDS: (data) =>
      `Le colonne: [ ${data.columns.join(", ")} ] non esistono sull'oggetto indicato`,

    IMPORT_FIELD_LENGTH_EXCEEDED: (data) =>
      `La riga ${data.row} nella colonna "${data.column}" ha un valore troppo lungo.\n
    Lunghezza massima: ${data.max_length}, Lunghezza attuale: ${data.actual_length}`,

    INPUT_FIELD_INVALID_BOOLEAN: (data) =>
      `La riga ${data.row} nella colonna "${data.column}" ha un valore errato.\n
    I valori ammessi sono: [ ${data.accepted_values.join(", ")} ](case insensitive)`,

    INPUT_FIELD_INVALID_NUMBER: (data) =>
      `La riga ${data.row} nella colonna "${data.column}" ha un valore non numerico`,

    INPUT_FIELD_SCALE_EXCEEDED: (data) =>
      `La riga ${data.row} nella colonna "${data.column}" ha un valore decimale non corretto.\n
    Lunghezza massima decimali: ${data.max_length}, Lunghezza attuale: ${data.actual_length}`,

    INPUT_FIELD_PRECISION_EXCEEDED: (data) =>
      `La riga ${data.row} nella colonna "${data.column}" ha un valore troppo lungo.\n
    Lunghezza massima: ${data.max_length}, Lunghezza attuale: ${data.actual_length}`,

    IMPORT_FIELD_ROLLUP_UNAUTHORIZED: (data) =>
      `La riga ${data.row} ha un valore nella colonna "${data.column}".\n
    Le colonne rollup non accettano valori in input`,

    INPUT_FIELD_INVALID_RADIO: (data) =>
      `La riga ${data.row} nella colonna "${data.column}" ha un valore inesistente.\n
    Valore attuale: ${data.actual_value}`,

    INPUT_FIELD_INVALID_LOOKUP_PICKLIST: (data) =>
      `La riga ${data.row} nella colonna "${data.column}" ha un valore inesistente.\n
    Valore attuale: ${data.actual_value}`,
  },
};
