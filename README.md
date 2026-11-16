# Campus Hub

Cruscotto operativo per la gestione del convitto: appello, turni cena,
permessi, assenze programmate, stampe e storico giornaliero.

## Struttura del progetto

`campus_hub.html` funge da orchestratore: contiene l'HTML dell'interfaccia
e il bootstrap inline. Tutta la logica è suddivisa in 14 file tematici
con responsabilità isolate.
campus_hub.html
│
├── js/
│ ├── ambiente.js rilevamento modalità (offline/online/demo)
│ ├── firebase-campus_hub-config.js configurazione Firebase
│ ├── data-loader.js caricamento dati da Firebase
│ ├── campus_hub-script.js main applicativo (~330 righe)
│ ├── core/ (5 file) stato, turni, PP, filtri, persistenza
│ ├── pannello/ (2 file) side panel, assenze programmate
│ ├── stampe/ (6 file) layout + stampe
│ └── reset/ (1 file) reset permessi
│
└── offline/
├── studenti_26_offline.js dati studenti (dummy nel repo pubblico)
└── permessi_26_offline.js permessi PP (dummy nel repo pubblico)


**Caricamento ordinato:** core → pannello → main → stampe → reset.

**Nessuna modifica funzionale:** il refactor ha solo spostato codice,
la logica e il comportamento sono rimasti identici.

## Modalità di esecuzione

| Modalità | URL / contesto | Dati |
|----------|----------------|------|
| **Locale (reale)** | `file://` | Dati reali da `offline/*.js` |
| **Demo (dummy)** | `?offline=1` su HTTP | Dati fantoccio da `offline/*.js` |
| **Sviluppo** | `localhost` / `127.0.0.1` | Dati locali |
| **Online** | qualsiasi altro host | Firebase (login richiesto) |

Il rilevamento avviene in `js/ambiente.js` e imposta `window.APP_MODE`
(`offline` / `online`) e `window.APP_ORIGIN` (`locale-reale`, `github-demo`,
`localhost-demo`, `firebase`).

## Note

- `offline/studenti_26_offline.js` e `offline/permessi_26_offline.js`
  contengono **dati fantoccio** nel repository pubblico, a tutela della
  privacy. Sul terminale reale vengono sostituiti con i dati veri
  (mai committati).
- Le stampe (`js/stampe/`) condividono CSS e helper tramite
  `_layout.js` e `bus-helpers.js`.
