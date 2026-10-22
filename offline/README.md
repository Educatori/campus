# Cartella `offline/` — dati locali

Questa cartella contiene i file di dati usati dalla modalità **offline** di Campus Hub (terminale locale senza rete).

## ⚠️ Importante: file fantoccio

I file `studenti_26_offline.js` e `permessi_26_offline.js` in questo repository contengono **dati fantoccio** (Frankenstein, Dracula, Mummia, Wolf…), NON i dati reali degli studenti. Questo serve a proteggere la privacy su un repository pubblico.

## Come funziona in pratica

- **Su GitHub** (questo repo): i file contengono i dati fantoccio.
- **Sul terminale offline della scuola**: i file vengono **sostituiti** con la versione contenente i dati reali, che non viene mai committata né caricata online.

## Regola d'oro

La **struttura** dei file (chiavi degli oggetti, forma dei dati) deve essere **identica** tra versione fantoccio e versione reale. Se cambi una chiave nel dummy, devi cambiarla anche nel reale, altrimenti il codice va in errore.

## File presenti

| File | Contenuto | Struttura |
|---|---|---|
| `studenti_26_offline.js` | Array di studenti | `window.tuttiStudenti = [{ id, cognome, nome, classe, room, percorso, gruppo? }]` |
| `permessi_26_offline.js` | Configurazione + permessi | `LAB_PRANZO`, `TURNI_DINNER`, `LAB_DINNER`, `OVERRIDE_TURNI_DINNER`, `OVERRIDE_TURNI_DINNER_CLASSI`, `ORARI_PP`, `ASSENTI_PERMESSO`, `CALENDARIO_GRUPPI_DINNER`, `PAROLE_ASSENZA`, `PAROLE_NO_RIENTRO` |