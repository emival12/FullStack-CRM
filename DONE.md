## TODO Risolti

- **10/08/2026 B-002**
  Riproduzione: Crea un oggetto con multipli record type -> Apri setup -> Fields
  Bug: invece di vedere tutti i campi, si vedono tutti i campi di tutti i record type (quindi ci sono 3 id, 3 create date, etc..)
  Risoluzione: La lista delle colonne viene presa in base al record type richiesto. Per fixare il bug viene preso solo il record type master (indipendentemente se attivo o no), che è la definizione di base dell'oggetto.
