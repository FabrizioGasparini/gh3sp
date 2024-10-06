# Gh3sp - Linguaggio di Programmazione

**Gh3sp** è un linguaggio di programmazione progettato per essere semplice, intuitivo e flessibile. Nasce con l'obiettivo di fornire una sintassi chiara e strumenti efficaci per la scrittura di codice, ispirandosi a diversi concetti di linguaggi moderni ma con la propria personalità e specifiche caratteristiche.

## Caratteristiche Principali

### 1. Dichiarazioni di Variabili
Le variabili possono essere dichiarate con le parole chiave 'let' e 'const'. I punti e virgola sono obbligatori solo per dichiarazioni di variabili senza assegnazione (e.g. 'let i;').

Esempi:
```
let a = 10
const b = 20
let i;  // Dichiarazione senza valore assegnato
```

### 2. Strutture di Controllo

#### 2.1 Condizionali: 'If'
Le strutture condizionali permettono l'esecuzione di codice in base a una condizione specifica. Gh3sp supporta sia condizionali multilinea che condizionali a linea singola (quest'ultimo richiede il ';').

Esempi:
```
if (a > b) {
    print("a è maggiore di b")
} else if (a < b) {
    print ("a è minore di b")
} else {
    print ("a è uguale a b)
}

if (x == 10) print("x è 10");
```

#### 2.2 Cicli: 'While', 'For' e 'Foreach'
Gh3sp include il supporto per i cicli 'while' e 'for', con possibilità di strutture multilinea o linea singola.

Esempi:
```
while (a < 10) {
    a += 1
}

for (let i = 0; i < 5; i += 1) {
    print(i)
}

// Struttura a linea singola (richiede il ';')
for (let i = 0; i < 5; i += 1) print(i);
```

### 3. Funzioni

Le funzioni in Gh3sp si definiscono con la parola chiave 'fn', seguita da parametri e corpo della funzione.

Esempio:
```
fn add(x, y) {
    return x + y
}

let sum = add(10, 5)
```

### 4. Oggetti e Accesso alle Proprietà

Gh3sp supporta la creazione di oggetti e l'accesso alle loro proprietà sia con la notazione a punto 'obj.key' che con la notazione a chiavi 'obj["key"]'.

Esempio:
```
let person = {
    name: "Fabri",
    age: 15
};

print(person.name)         // Accesso con notazione a punto
print(person["age"])       // Accesso con notazione a chiavi
```

### 5. Assegnazioni Complicate (Compound Assignment)

Gh3sp include supporto per le operazioni di assegnazione composta come '+=', '-=', '*=', '/=', ecc.

Esempio:
```
a += 5  // Equivalente a: a = a + 5
```

### 6. Stringhe

Le stringhe sono supportate e possono essere concatenate o manipolate con facilità.

Esempio:
```
let greeting = "Ciao, " + name
```

### 7. Funzioni Built-In

Gh3sp include diverse funzioni built-in utili per operazioni comuni, tra cui:
- 'print(...)': Stampa il valore nella console.
- 'int(value)': Converte un valore in numero intero.
- 'str(value)': Converte un valore in stringa.
- 'type(value)': Restituisce il tipo del valore passato.

Esempio:
```
print("Il tipo di '10' è: " + type(10))
```

### 8. Liste
- **Dichiarazione di Liste**: Ora è possibile dichiarare una lista utilizzando la sintassi `list = [value, ...]`.
  - Esempio:
    ```gh3sp
    let myList = [1, 2, 3, 4]
    ```
- **Stampa delle Liste**: È possibile stampare una lista o accedere ai suoi elementi tramite indice.
  - Esempio:
    ```gh3sp
    let myList = [1, 2, 3, 4]
    print(myList)  // Output: [1, 2, 3, 4]
    print(myList[2])  // Output: 3
    ```
- **Restituzione di Valori da Liste**: È possibile accedere ai valori della lista tramite il loro indice.
- **Assegnazione di Valori a Liste**: È possibile modificare i valori di una lista tramite l'indice.
  - Esempio:
    ```gh3sp
    let myList = [1, 2, 3, 4]
    myList[1] = 5
    print(myList)  // Output: [1, 5, 3, 4]
    ```
- **Concatenazione di Liste**: Ora è possibile concatenare due liste utilizzando l'operatore `+`.
  - Esempio:
    ```gh3sp
    let list_a = [1, 2]
    let list_b = [3, 4]
    let list_c = list_a + list_b
    print(list_c)  // Output: [1, 2, 3, 4]
    ```
- **Funzioni delle Liste**: Aggiunte diverse funzioni built-in per la manipolazione delle liste:
  - `push(list, value)`: Aggiunge un valore alla fine della lista.
    ```gh3sp
    let myList = [1, 5, 3, 4]
    push(myList, 6)  // Risultato: [1, 5, 3, 4, 6]
    ```
  - `pop(list)`: Rimuove e restituisce l'ultimo valore della lista.
    ```gh3sp
    let myList = [1, 5, 3, 4, 6]
    let lastValue = pop(myList)  // Output: 6, myList: [1, 5, 3, 4]
    ```
  - `shift(list)`: Rimuove e restituisce il primo valore della lista.
    ```gh3sp
    let myList = [1, 5, 3, 4]
    let firstValue = shift(myList)  // Output: 1, myList: [5, 3, 4]
    ```
  - `unshift(list, value)`: Aggiunge un valore all'inizio della lista.
    ```gh3sp
    let myList = [5, 3, 4]
    unshift(myList, 10)  // Risultato: [10, 5, 3, 4]
    ```
  - `slice(list, start, end?)`: Restituisce una porzione della lista.
    ```gh3sp
    let myList = [10, 5, 3, 4]
    let sublist = slice(myList, 1, 3)  // Output: [5, 3]
    ```
  - `contains(list, value)`: Verifica se un valore è presente nella lista.
    ```gh3sp
    let myList = [10, 5, 3, 4]
    let exists = contains(myList, 5)  // Output: true
    ```
  - `reverse(list)`: Inverte l'ordine degli elementi nella lista.
    ```gh3sp
    let myList = [10, 5, 3, 4]
    reverse(myList)  // Risultato: [4, 3, 5, 10]
    ```
  - `filter(list, function)`: Filtra i valori della lista in base a una funzione.
    ```gh3sp
    let myList = [4, 3, 5, 10]
    let filtered = filter(myList, fn(x) { x > 3 })  // Output: [4, 5, 10]
    ```
  - `map(list, function)`: Applica una funzione a tutti gli elementi della lista.
    ```gh3sp
    let myList = [4, 3, 5, 10]
    let mapped = map(myList, fn(x) { x * 2 })  // Output: [8, 6, 10, 20]
    ```
  - `sort(list, inverted?)`: Ordina gli elementi della lista.
    ```gh3sp
    let myList = [4, 3, 5, 10]
    sort(myList)  // Output: [3, 4, 5, 10]
    sort(myList, true)  // Output: [10, 5, 4, 3]
    ```


### 9. Numeri Negativi
Gh3sp supporta numeri negativi, ad esempio `-10`, `-1.5`.

### 10. Funzione Built-In 'length'
Gh3sp include la funzione `length` per ottenere la lunghezza di variabili:
- `length(10)`
- `length("string")`
- `length([1, true, "three"])`

### 11. Dichiarazione di Funzioni
Le funzioni possono ora essere dichiarate in questo modo:
```
let function = fn(args) { body }
```

### 12. Accesso agli Oggetti tramite Identificatori Calcolati
Gh3sp supporta l'accesso agli oggetti tramite identificatori calcolati:
```
let obj = {
    ciao: "hello"
}

let ident = "ciao"

obj[ident]
```

## Contributo

Questo linguaggio è in continua evoluzione e miglioramento. Sei invitato a contribuire con idee, suggerimenti e segnalazioni di bug tramite il repository GitHub ufficiale.

## Licenza

Gh3sp è rilasciato sotto licenza MIT.

Repository GitHub: [Gh3sp su GitHub](https://github.com/FabrizioGasparini/gh3sp)