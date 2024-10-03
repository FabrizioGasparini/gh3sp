
# Gh3sp - Linguaggio di Programmazione

**Gh3sp** è un linguaggio di programmazione progettato per essere semplice, intuitivo e flessibile. Nasce con l'obiettivo di fornire una sintassi chiara e strumenti efficaci per la scrittura di codice, ispirandosi a diversi concetti di linguaggi moderni ma con la propria personalità e specifiche caratteristiche.

## Caratteristiche Principali

### 1. Dichiarazioni di Variabili
Le variabili possono essere dichiarate con le parole chiave `let` e `const`. I punti e virgola sono obbligatori solo per:
- Dichiarazioni di variabili senza assegnazione (e.g. `let i;`).
- Strutture su linea singola (e.g. `if(condizione) print();`).

Esempi:
```gh3sp
let a = 10
const b = 20
let i;  // Dichiarazione senza valore assegnato
```

### 2. Strutture di Controllo

#### 2.1 Condizionali: `If`
Le strutture condizionali permettono l'esecuzione di codice in base a una condizione specifica. Gh3sp supporta sia condizionali multilinea che condizionali a linea singola.

Esempi:
```gh3sp
if (a > b) {
    print("a è maggiore di b")
}

if (x == 10) print("x è 10");
```

#### 2.2 Cicli: `While` e `For`
Gh3sp include il supporto per i cicli `while` e `for`, con possibilità di strutture multilinea o linea singola.

Esempi:
```gh3sp
while (a < 10) {
    a += 1
}

for (let i = 0; i < 5; i += 1) {
    print(i)
}

// Struttura a linea singola
for (let i = 0; i < 5; i += 1) print(i)
```

### 3. Funzioni

Le funzioni in Gh3sp si definiscono con la parola chiave `fn`, seguita da parametri e corpo della funzione.

Esempio:
```gh3sp
fn add(x, y) {
    return x + y
}

let sum = add(10, 5)
```

### 4. Oggetti e Accesso alle Proprietà

Gh3sp supporta la creazione di oggetti e l'accesso alle loro proprietà sia con la notazione a punto `obj.key` che con la notazione a chiavi `obj["key"]`.

Esempio:
```gh3sp
let person = {
    name: "Fabri",
    age: 15
};

print(person.name)         // Accesso con notazione a punto
print(person["age"])       // Accesso con notazione a chiavi
```

### 5. Assegnazioni Complicate (Compound Assignment)

Gh3sp include supporto per le operazioni di assegnazione composta come `+=`, `-=`, `*=`, `/=`, ecc.

Esempio:
```gh3sp
a += 5  // Equivalente a: a = a + 5
```

### 6. Stringhe

Le stringhe sono supportate e possono essere concatenate o manipolate con facilità.

Esempio:
```gh3sp
let greeting = "Ciao, " + name
```

### 7. Funzioni Built-In

Gh3sp include diverse funzioni built-in utili per operazioni comuni, tra cui:
- **`print(...)`**: Stampa il valore nella console.
- **`int(value)`**: Converte un valore in numero intero.
- **`str(value)`**: Converte un valore in stringa.
- **`type(value)`**: Restituisce il tipo del valore passato.

Esempio:
```gh3sp
print("Il tipo di '10' è: " + type(10))
```

## Sintassi e Struttura del Codice

### 1. Token

Gh3sp lavora con vari tipi di token, tra cui:
- **Identificatori**: per variabili e funzioni.
- **Numeri**: supporta numeri interi e decimali.
- **Stringhe**: racchiuse tra virgolette doppie.
- **Operatori**: come `+`, `-`, `*`, `/`, `==`, `!=`, ecc.
- **Parole chiave**: come `let`, `const`, `fn`, `if`, `while`, `for`.

### 2. Parser

Il parser elabora i token e costruisce un AST (Abstract Syntax Tree) che rappresenta la struttura sintattica del codice. Supporta la sintassi per dichiarazioni, espressioni e oggetti.

## Contributo

Questo linguaggio è in continua evoluzione e miglioramento. Sei invitato a contribuire con idee, suggerimenti e segnalazioni di bug tramite il repository GitHub ufficiale.

## Licenza

Gh3sp è rilasciato sotto licenza MIT.

**Repository GitHub**: [Gh3sp su GitHub](https://github.com/FabrizioGasparini/gh3sp)

