## TODO Risolti

- **10/08/2026 B-001**
  Riproduzione: Apri un record qualsiasi -> refresha la pagina
  Bug: invece di rimanere sulla stessa pagina vieni reindirizzato sulla home del database
  Motivazione Bug: l'utente veniva settato da un effect che arrivava un render dopo rispetto al loading. Quindi le guard facevano -> path -> login -> arrivava la risposta -> home, solo che in tutti questi trasferimenti il path si perdeva
  Risoluzione: la chiamata al backend per controllare l'utente è fatta direttamente nel provider, in questo modo setUser e setLoading avvengono nello stesso render

- **10/08/2026 B-002**
  Riproduzione: Crea un oggetto con multipli record type -> Apri setup -> Fields
  Bug: invece di vedere tutti i campi, si vedono tutti i campi di tutti i record type (quindi ci sono 3 id, 3 create date, etc..)
  Risoluzione: La lista delle colonne viene presa in base al record type richiesto. Per fixare il bug viene preso solo il record type master (indipendentemente se attivo o no), che è la definizione di base dell'oggetto.
