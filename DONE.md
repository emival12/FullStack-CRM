## TODO Risolti

- **23/08/2026 B-004**
  Riproduzione: Crea una tabella A -> Crea più record Type -> Crea unat tabella B -> Crea una lookup da B ad A -> Crea un record nella tabella A -> Crea un record nella tabella B che punta al record creato precedentemente
  Bug: l'insert fallisce con 500 `Max recursion depth reached`
  Motivazione Bug: il record type del padre veniva preso da `rollup_definition`, che ripete la rollup per ogni record type: un padre diventava N padri, e lo skip ne toglieva uno
  Risoluzione: record type letto dalla riga del padre, con una query per tabella invece di due per rollup

- **19/08/2026 BL-002 — Convenzione trigger custom**
  Contenuto: Definizione convenzione dei trigger: naming file, firma della funzione, comportamento su eccezione, etc..
  Risoluzione: fissata scrivendo il primo trigger reale: file `{object}_{TIMING}_{EVENT}.py` + riga in `trigger_definition`, `execute(cursor, record)`, `raise_trigger_exception` per rifiutare la scrittura, ogni altra eccezione è un bug e diventa 500.

- **18/08/2026 B-003**
  Riproduzione: Crea una tabella A -> Crea una tabella B -> In A crea un campo numerico X -> In B crea un field lookup che punta a A e un formula field che punta a X -> Crea 2 record -> Alla creazione il campo formula in B viene valorizzato correttamento, ma se viene modificato X il cambio non viene rispecchiato nella formula
  Bug: I campi fanno ripartire i calcoli delle rollup presenti nei padri, ma non c'è nulla che scende nei figli
  Risoluzione: aggiunta `get_impacted_children` (un figlio conta solo se una sua formula legge il padre via `field.<lookup>__obj.`) e `update_record` riordinato in scrivi → rinfresca i figli → riscrivi → risali.
  La seconda scrittura del padre serve perché i suoi rollup erano stati calcolati sui figli ancora vecchi; i figli in risalita escludono il solo padre chiamante, non l'intera direzione.

- **10/08/2026 B-001**
  Riproduzione: Apri un record qualsiasi -> refresha la pagina
  Bug: invece di rimanere sulla stessa pagina vieni reindirizzato sulla home del database
  Motivazione Bug: l'utente veniva settato da un effect che arrivava un render dopo rispetto al loading. Quindi le guard facevano -> path -> login -> arrivava la risposta -> home, solo che in tutti questi trasferimenti il path si perdeva
  Risoluzione: la chiamata al backend per controllare l'utente è fatta direttamente nel provider, in questo modo setUser e setLoading avvengono nello stesso render

- **10/08/2026 B-002**
  Riproduzione: Crea un oggetto con multipli record type -> Apri setup -> Fields
  Bug: invece di vedere tutti i campi, si vedono tutti i campi di tutti i record type (quindi ci sono 3 id, 3 create date, etc..)
  Risoluzione: La lista delle colonne viene presa in base al record type richiesto. Per fixare il bug viene preso solo il record type master (indipendentemente se attivo o no), che è la definizione di base dell'oggetto.
