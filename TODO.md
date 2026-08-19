# TODO

Registro delle cose da fare e del debito tecnico.

---

## Bug (NEXT INDEX: 4)

## Milestone (NEXT INDEX: 5)

- **NS-001 — Profili e segregazione dei dati** — _agosto 2026_
  Profili utente con visibilità/permessi differenziati. Ancora da definire cosa si segrega (oggetti, record, campi, azioni) e con quale granularità.

- **NS-002 — Primo rilascio** — _agosto 2026_
  Perimetro: solo CRM e Import.

- **NS-003 — Generazione documenti** — _da definire_
  Generazione di reportistiche di analisi e di pdf a partire da record.

- **NS-004 — App React Native** — _da definire_
  Porzione mobile che interagisce con l'app desktop

## Improvments (NEXT INDEX: 2)

- **I-001 — Redirect Looup**
  Le picklist e le lookup al click reinderizzano sul record linkato

---

## Backlog (NEXT INDEX: 8)

- **BL-001 — Test**
  **Backend** — si testa ogni file. Riferimento: `backend/tests/test_db_queries.py`.

  **Frontend** — due categorie, ognuna con il suo file di riferimento:
  1. _Funzioni pure_ — `utils/string.ts`, `DynamicForm/helpers.ts`, i puri di `useFieldTypes.ts`, `endpoints.ts`, `routes.ts`. Riferimento: `src/api/errors.test.ts`.
  2. _Hook e context_ — `api/client.ts`, `useApiMutation`, `Toast`, `Label`, `useFeedback`, `Auth`. Riferimento: `src/hooks/useApiQuery.test.ts`.

- **BL-003 — Completare il setup**
  Le sezioni Layout, Record Types e Related Lists sono placeholder `<p>TODO</p>` (`SetupSections.tsx:39-41`) ma già raggiungibili dalla sidebar. Il salvataggio della modifica di un campo è uno stub: `onSubmit` è un `console.log` (`SetupSectionFieldsEdit.tsx:113`), mentre creazione e cancellazione funzionano.

- **BL-004 — Completare l'import**
  L'import massivo accetta solo file per Insert. Se si selezione Update viene mostrato un messaggio: "Funzionalità non implementata"

- **BL-005 — Artefatti runtime del backend in `frontend/src/config/`**
  `backup_manager.py:7` e `core/log_manager.py:6` scrivono `backups/` e `logs/` dentro il sorgente frontend quando in dev. Vanno sotto `backend/`.

- **BL-006 — Portare `K_SetupFormsStructure` in Python**
  Oggi `get_field_info` (`setup_services.py:153-185`) riceve la struttura dei form dal client, quindi `POST /setup/{table}/fields/{field}` è una READ con body. Portando le costanti nel backend l'endpoint diventa GET e `SetupSectionFieldsEdit` torna su `useApiQuery`.

- **BL-007 — Cancellazione setup non atomica**
  Il `DROP TABLE` fa implicit commit non rollbackabile: se fallisce dopo la DELETE dei metadati, resta config persa e tabella intatta. Fix proposto: soft-delete + routine di reconciliation. Priorità bassa su `.exe` monoutente.
