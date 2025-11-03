# 📍 Roadmap Gh3sp

Questa roadmap descrive lo sviluppo e l'evoluzione del linguaggio di programmazione **Gh3sp**, con le versioni, le date di rilascio stimate e le funzionalità principali introdotte ad ogni passo.

---

## ✅ v1.0.0-alpha (30 Settembre 2024)
### Funzionalità principali:
- Lexer & Parser funzionanti.
- Dichiarazioni `let` e `const`.
- Espressioni binarie (`+`, `-`, `*`, `/`, `%`, `^`).
- Supporto per oggetti.
- Funzioni definite con `fn`.

---

## ✅ v1.1.0-alpha (2 Ottobre 2024)
### Aggiunte:
- Implementati i costrutti `if`, `for` e `while`.
- Assegnamenti composti (`+=`, `-=`, ecc.).
- Funzioni built-in: `int()`, `str()`, `type()`.

---

## ✅ v1.1.1-alpha (3 Ottobre 2024)
### Aggiunte:
 - Implementanti i costrutti 'if', 'for' e 'while' su singola linea
### Correzioni:
 - Aggiornate i costrutti 'if', 'for' e 'while' da 'Expressions' a 'Statements'
 - Corretta la della variabile iteratore nel ciclo 'for': dichiarare una variabile iteratore direttamente nel ciclo non causa più un errore

---

## ✅ v1.2.0-alpha (6 Ottobre 2024)
### Aggiunte:
- Liste (`[]`) e operazioni su liste:
  - Accesso per indice.
  - Concatenazione (`a + b`).
  - Modifica tramite indice.
- Funzioni built-in per liste:
  - `push`, `pop`, `shift`, `unshift`, `slice`, `contains`, `reverse`, `filter`, `map`, `sort`.
- Supporto ai numeri negativi.
- Funzione `length()`.
- Funzioni anonime.
- Variabili come statements: `let f = fn(x) {}`.
- Supporto `foreach`.

---

## ✅ v1.2.1-alpha (14 Ottobre 2024)
### Aggiunte:
- `i++`, `i--` come operatori validi.
- Supporto all'incremento per `for(...;...;...)` tramite espressione o variabile.
- Errori più dettagliati con `ParserError` e `InterpreterError`.

### Correzioni:
- Corretto errore nel lexer: ora gli spazi e i caratteri skippabili vengono ignorati correttamente.

---

## ✅ v1.2.2-alpha (15 Ottobre 2024)
### Correzioni:
- Corretto grave errore nel lexer: ora gli spazi e i caratteri skippabili vengono ignorati correttamente.

---

## ✅ v1.2.3-alpha (16 Ottobre 2024)
### Aggiunte:
- Funzione `input()` per input da terminale.

### Correzioni:
- Corretto errore nei cicli `foreach` e `while`: ora il corpo dei cicli gestisce correttamente le linee vuote e gli spazi.

---

## ✅ v2.0.0 (21 Ottobre 2024)
### Aggiunte:
- Operatori logici: `==`, `!=`, `||`, `&&`, `!`.

---

## ✅ v2.0.1 (22 Ottobre 2024)
### Aggiunte:
- Operatore di divisione intera: `//`.

### Modifiche:
- Commenti singola riga ora con `#` anziché `//`.

---

## ✅ v2.1.0 (27 Ottobre 2024)
### Aggiunte:
- Librerie: Built-in (`List`), Default (`Math`).
- Builder per librerie.
- Libreria npm `gh3-lib`.
- Gestione errori matematici (`MathError`).

### Modifiche:
- Funzioni lista ora usano `List.push(...)`.

### Correzioni:
- Corretto errore nelle espressioni di elevamento a potenza
- Corretto errore dato dalla presenza di più linee vuoto consecutive
- Corretto errore nelle funzioni: ora il corpo delle funzioni gestisce correttamente le linee vuote e gli spazi. 

---

## ✅ v2.2.0 (1 Novembre 2024)
### Aggiunte:
- Gh3sp IDE
- Libraria 'String'
- Libreria 'JSON'
- Libreria 'GMath' 
- Operatore ternario `condizione ? val1 : val2`.
- Operatore nullish `??`.

### Modifiche:
- I costrutti su singola linea (if, for, foreach, while, function) ora richiedono una 'Arrow Function' prima del corpo: '=>'
- Le variabili ora supportano '_' nel nome
- Le chiavi degli oggetti ora possono essere stringhe
- Le chiavi degli oggetti che non sono definite restituiscono 'null' invece di causare un errore

### Correzioni:
- Corretto il confronto tra liste con operatori binari: ==, !=

---

## ✅ v2.2.1 (1 Dicembre 2024)
### Aggiunte:
- Variabili reattive: `let reactive b = a + 2`.
- Funzione `unreactive(...)`.
- Accesso a lista con indice negativo: `list[-1]`.
- Supporto a `break`, `continue`, `pass`.

### Modifiche:
- Accedere a un oggetto con una chiave inesistente ora aggiunge la nuova chiave all'interno dell'oggetto
- Il parser ora non avvia in automatico l'evalutation del programma attraverso l'interprete, ma lo restituisce al file principale, che avrà il compito di eseguire l'evalutation attraverso l'interprete
- Completa revisione e correzione del codice
- Aggiunta di commenti all'interno del codice

### Correzioni:
- Le variabili ora supportano numeri (0 - 9) nel nome, ma non come primo carattere
- Le operazioni binarie tra numeri negativi e variabili ora funzionano correttamente
---

## v2.2.2 (30 Maggio 2025)
### Aggiunte:
- Enumerazione per le iterazioni del ciclo 'foreach'
- Funzioni e costanti aggiunte alla libraria 'GMath': sin(), cos(), tan(), log(), E
- Importazione e esportazione tra file Gh3sp

### Correzioni:
- Corretto il comportamento della funzione 'convert' della libreria 'GMath'
- Corretto il token 'EOF' che adesso funziona correttamente anche con più linee vuote all fine del file

---

## v2.3.0 (2 Giugno 2025)
### Aggiunte:
- Espressioni di appartenenza: `x in list|object|string`.
- Operatore 'not'
- Costrutti 'choose' e 'chooseall'
### Correzioni:
- Nella mappature delle liste, se la funzione mappatrice restituisce 'null', ora il valore di ritorno sarà di default il valore originale invece di restituire un errore

---

# ⏳ Prossime Versioni

## v2.3.1
### Aggiunte:
### Correzioni:
- Nella concatenazione di oggetti adesso il valore dell'ultimo oggetto viene selezionato correttamente invece di restituisce 'null' 

---

**Creato da**: Fabrizio Gasparini  
**Repository GitHub**: [https://github.com/FabrizioGasparini/gh3sp](https://github.com/FabrizioGasparini/gh3sp)
