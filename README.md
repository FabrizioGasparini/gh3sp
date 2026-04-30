# Gh3sp — Linguaggio di programmazione

Gh3sp è un linguaggio interpretato, dinamico e progettato per essere semplice da leggere, estendere e integrare. Offre una sintassi espressiva per il lavoro quotidiano (script, prototipi, tooling) e strumenti per estendere il runtime tramite librerie native.

Questo documento descrive in modo completo e professionale le funzionalità attualmente presenti nel linguaggio e come usarle.

---

Indice
- Panoramica
- Requisiti e avvio rapido
- Sintassi di base
  - Commenti e spazio bianco
  - Tipi di valore
  - Dichiarazioni di variabili
  - Operatori e assegnazioni composte
- Strutture di controllo
  - If / else
  - Cicli: while, for, foreach
  - Choose / case (switch-like)
- Funzioni
  - Dichiarazione (block / inline)
  - Chiusure e ambiente di dichiarazione
- Oggetti e liste
  - Oggetti: creazione, accesso (dot / computed)
  - Liste: indicizzazione, operazioni e funzioni built-in
- Classi e istanze
  - Dichiarazione di classi, blocchi public/private, init
  - `this` e visibilità dei membri
  - Costruttori e parametri
- Moduli e librerie
  - Import / Export
  - Librerie built-in principali
  - Come creare librerie native (helper)
- Funzioni built-in principali
- Errori e debug
- Contribuire
- Licenza

---

Panoramica
---------
Gh3sp è un linguaggio pensato per essere pratico e facilmente estendibile. L'esecuzione è interpretata dal runtime incluso nel repository: il codice è analizzato dal lexer/parser e valutato da un interprete che rappresenta i valori con un sistema unificato di `RuntimeValue`.

Requisiti e avvio rapido
------------------------
- Deno (consigliato) come runtime per l'esecuzione degli strumenti di sviluppo.
- Per eseguire un file `.gh3` con il runner incluso:

```/dev/null/README_examples.sh#L1-3
# Esempio: esegui un file con il runner CLI
# ( dalla root del repository )
deno run -A packages/cli/gh3sp.ts ./script.gh3
```

Sintassi di base
----------------
Commenti e spazio bianco
- Commento su singola riga: `# commento`
- Commento multiriga: `/* ... */`

Esempio:
```/dev/null/README_examples.gh3#L1-4
# Questo è un commento su singola riga
/*
  Questo è un commento
  su più righe
*/
```

Tipi di valore
- `number` (numero, intero o float)
- `string`
- `boolean`
- `null`
- `list` (array di valori runtime)
- `object` (mappa di proprietà)
- `function` e `native-function`
- `class` e `class-instance`
- `reactive` (valore reattivo che viene ricalcolato quando valutato)

Dichiarazioni di variabili
- `let` per variabili modificabili, `const` per costanti.
- È possibile dichiarare variabili reactive con `let reactive name = expression`.

```/dev/null/README_examples.gh3#L1-5
let a = 10
const pi = 3.14
let reactive e = 2.718
```

Il runtime supporta lo shadowing di variabili: è possibile dichiarare un parametro di funzione con lo stesso nome di una proprietà di classe; internamente `this` rimane il riferimento all'istanza.

Operatori e assegnazioni composte
- Operatori aritmetici: `+`, `-`, `*`, `/`, `%`, `^`.
- Operatori di confronto e logici: `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`.
- Assegnazioni composte: `+=`, `-=`, `*=`, `/=`, etc.

Strutture di controllo
---------------------
If / else

```/dev/null/README_examples.gh3#L1-5
if (a > b) {
    print("a > b")
} else if (a < b) {
    print("a < b")
} else {
    print("a == b")
}
```

Cicli: `while`, `for`, `foreach`

```/dev/null/README_examples.gh3#L1-6
while (i < 10) {
  i += 1
}

for (let i = 0; i < 5; i += 1) {
  print(i)
}

foreach (let x in arr) {
  print(x)
}
```

Choose / Case (switch-like)
- Il linguaggio include una forma `choose/case` — simile a uno switch con supporto per `default` e `chooseAll` behavior.

Funzioni
--------
Dichiarazione di funzioni:
- `fn name(params) { ... }` per blocchi multi-linea.
- `fn name(params) => expr` per funzioni inline che ritornano l'espressione.

Le funzioni sono closures: conservano l'ambiente di dichiarazione. L'implementazione ritorna l'ultimo valore valutato del corpo.

```/dev/null/README_examples.gh3#L1-6
fn add(x, y) {
  x + y
}

fn mul(x, y) => x * y

print(add(2,3))
print(mul(3,4))
```

Oggetti e liste
---------------
Oggetti
- Creazione con literal `{ key: value, ... }`.
- Accesso tramite `obj.key` o `obj["key"]` o `obj[varContainingKey]` (identificatore calcolato).

Liste
- Literal con `[v1, v2, ...]`.
- Accesso con indice `list[idx]` (supporta indici negativi come offset dalla fine in alcune API interne).
- Molte funzioni utili esposte dalla libreria built-in `List` (v. sezione librerie).

Esempio
```/dev/null/README_examples.gh3#L1-8
let person = { name: "Fabrizio", age: 25 }
print(person.name)
print(person["age"])

let nums = [1,2,3]
print(nums[1])
```

Classi e istanze
----------------
Gh3sp include una costruzione `class` completa con blocchi `public` e `private` e un initializer `init` opzionale. La sintassi di base è:

```/dev/null/README_examples.gh3#L1-16
export class Persona(nome, anno, indirizzoIniziale) {
    # variabili "di classe" / private al corpo
    let specie = "Homo Sapiens"

    public {
        let reactive eta = 2025 - anno
        fn setAnno(anno) { this.anno = anno }
        fn getEta() => this.eta
    }

    private {
        let codiceSegreto = 123456
    }
}
```

Caratteristiche principali delle classi:
- Parametri di costruttore dichiarati alla definizione `class Nome(params)`.
- Blocchi `public`, `private` e `body` (default) per separare visibilità e comportamento.
- `init` (se presente) è una funzione eseguita all'istanziazione.
- `this` è un riferimento diretto all'oggetto istanza — non una copia. Assegnare `this.x` aggiorna direttamente l'istanza.
- I membri privati vengono mantenuti in una mappa separata (`privateMembers`) e non sono esposti come proprietà pubbliche.

Moduli e librerie
-----------------
Import
- Supportato l'import da file `.gh3` e dalle librerie precompilate. Esempi:

```/dev/null/README_examples.gh3#L1-4
import "Persona.gh3" as P
let p = P.Persona("Fabrizio", 2008, "Correggio")
```

- Supporta anche l'import selettivo: `import { a, b } from "file.gh3"`.

Librerie built-in
- Il runtime include librerie native già pronte, tra cui:
  - `Math` (costanti e funzioni matematiche)
  - `Random` (numeri casuali, `rand`, `pick`)
  - `JSON` (`parse`, `stringify`)
  - `List` (push, pop, shift, unshift, slice, contains, reverse, filter, map, sort)
  - `String` (join, upper, lower, split)
  - `Object` (keys, values)
  - `Utils` (clone, deepEqual, range, sum, unique, flatten, merge, reduce)
  - esempi / helper: `MyMath`

Creare librerie native
- Per sviluppare librerie native in TypeScript nel runtime sono disponibili helper:
  - `createLibrary(name, functions, constants)` — factory che costruisce la shape attesa dal loader.
  - `func_builder.build(descriptors, handler)` — costruisce una `FunctionCall` con validazione automatica di arità e tipi (supporta parametri opzionali, default, variadics).
  - `func_builder.simple(types, handler)` — scorciatoia per casi semplici.

Esempio (library compatta)
```/dev/null/README_examples.ts#L1-9
import { createLibrary } from "@core/runtime/built-in/lib_factory.ts";
import { simple } from "@core/runtime/built-in/func_builder.ts";
import { MK_NUMBER } from "@core/runtime/values.ts";

const add = simple(["number","number"], (a,b) => MK_NUMBER(a.value + b.value));
export default createLibrary("MyMath", { add }, {});
```

Funzioni built-in principali
---------------------------
A livello globale sono disponibili funzioni native:
- `print(...)` — stampa ciascun argomento in console.
- `input(prompt?)` — legge da console e coerces in number/string/bool.
- `int(s)` / `float(s)` — conversioni numeriche.
- `str(value)` — conversione a stringa (serializzazione runtime value-aware).
- `type(value)` — restituisce il tipo runtime.
- `length(value)` — lunghezza per stringhe, liste e oggetti.
- `time()` — timestamp in millisecondi.
- `unreactive(reactiveValue)` — disattiva la reattività e assegna il valore reale in ambiente.

Errori e comportamento a runtime
--------------------------------
- Il sistema produce eccezioni specifiche con informazioni di linea/colonna: `ParserError`, `InterpreterError`, `LexerError`, `MathError`, `ImportError`.
- L'handler degli errori (`handleError`) stampa una traccia leggibile e termina l'esecuzione con code 1.

Architettura del runtime (breve)
--------------------------------
- Frontend: `lexer` e `parser` producono un AST.
- Valutatore: `interpreter` che esegue l'AST su un `Environment` (catena di scope) e usa tipi unificati `RuntimeValue`.
- Tipi principali definito in `packages/core/runtime/values.ts`.
- Le librerie native vengono caricate tramite `compileLibrary` (su `packages/core/libraries/index.ts`) e aggiunte all'environment globale.

Test e qualità
--------------
- È disponibile un file `main.gh3` di smoke-tests che esegue e verifica molte delle API built-in.
- Eseguire i test manualmente con il runner CLI (vedi sezione Avvio rapido).

Contribuire
-----------
- Segnala problemi, bug e richieste di feature sul repository GitHub.
- Per implementare nuove librerie native, usa `createLibrary` + `func_builder` e registra la libreria nel loader (`packages/core/runtime/built-in/libraries.ts`).
- Mantieni i test in `main.gh3` aggiornati quando aggiungi API pubbliche.

Licenza
-------
Gh3sp è rilasciato sotto licenza MIT.

Repository: https://github.com/FabrizioGasparini/gh3sp

---

Se vuoi, posso:
- generare automaticamente uno script `tools/run_gh3_tests.ts` che esegue tutti i .gh3 di test;
- aggiungere `simpleNative` wrapper (per scrivere handler JS che ricevono valori JS nativi invece di `RuntimeValue`);
- produrre una guida rapida per la scrittura di librerie native con esempi reali.

Dimmi quale di questi preferisci e procedo.