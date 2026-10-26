/**
 * ⚠️  DUMMY FILE — DATI FANTOCCIO (solo dati personali)
 * ─────────────────────────────────────────────────────────────
 * Questo file contiene nomi inventati (Frankenstein, Dracula,
 * Mummia, Wolf…) e permessi fantoccio.
 * Serve a proteggere la privacy degli studenti reali su repository
 * pubblici (GitHub).
 *
 * ⚠️  NON aggiungere dati reali qui.
 *     Sul terminale offline, questo file viene SOSTITUITO con
 *     la versione contenente i dati veri (mai committata).
 *
 * 📌 NOTA SULL'ARCHITETTURA:
 *     Questo file contiene SOLO dati personali:
 *       - OVERRIDE_TURNI_DINNER  (cognomi → turno cena per giorno)
 *       - ORARI_PP               (permessi permanenti per studente)
 *       - ASSENTI_PERMESSO       (permessi di non-cena)
 *
 *     La CONFIGURAZIONE STATICA (PAROLE_*, LAB_PRANZO,
 *     TURNI_DINNER, LAB_DINNER, OVERRIDE_TURNI_DINNER_CLASSI,
 *     CALENDARIO_GRUPPI_DINNER) NON è più qui: vive in
 *     js/config-static.js, caricato SEMPRE (online e offline).
 *
 *     In ONLINE i dati personali arrivano da Firebase e
 *     sovrascrivono questi valori (vedi data-loader.js §3).
 *     In OFFLINE questi valori sono gli unici disponibili.
 * ─────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────
// OVERRIDE_TURNI_DINNER: override individuali per turno cena
// Formato: "COGNOME": { "giornoSettimana": turno }
// In online arriva da Firebase (nodo `overrides_turni_dinner`),
// ma questo file è l'unica fonte per la modalità OFFLINE.
// ⚠️ Nel repo pubblico restano solo nomi fantoccio.
// ─────────────────────────────────────────────────────────────
const OVERRIDE_TURNI_DINNER = {

    "GASPARD":     { 1: 2, 2: 2, 3: 2, 4: 2 },
    "RONCO A":     { 1: 1, 2: 1, 3: 1, 4: 1 },
    "CONSOL":      { 1: 1, 2: 1, 3: 1, 4: 1 },
    "CASTELLANO":  { 1: 1, 2: 1, 3: 1, 4: 1 },
    "GHILARDINI":  { 1: 1, 2: 1, 3: 1, 4: 1 },
    "GORREX":      { 1: 1, 2: 1, 3: 1, 4: 1 },
    "CASTROREALE": { 1: 1, 2: 1, 3: 1, 4: 1 },
    "DUROUX":      { 1: 2, 2: 2, 3: 2, 4: 2 },
};

// ─────────────────────────────────────────────────────────────
// ORARI_PP: permessi permanenti per studente
// In online arriva da Firebase (nodo `permessi_pp`).
// ─────────────────────────────────────────────────────────────
const ORARI_PP = {

    
    "BERRUTI": {
        3: { out: "13:30", in: "NO R" }
    },
    
    "CATTARINUSSI": {
        1: { out: "18:00", in: "19:00" },
        2: { out: "20:00", in: "21:00" },
        3: { out: "18:00", in: "19:00" },
        4: { out: "18:00", in: "19:00" }
    },
    
    "CHIADÒ CAPONET": {
        1: { out: "18:00", in: "21:30" },
        3: { out: "18:00", in: "21:30" },
        4: { out: "18:00", in: "21:30" }
    },
    
    "DE FRANCESCH": {
        4: { out: "16:40", in: "NO R" }
    },
    "DELL'AQUILA": {
        1: { out: "17:30", in: "20:00" },
        2: { out: "17:30", in: "20:00" },
        3: { out: "17:30", in: "20:00" },
        4: { out: "17:30", in: "20:00" }   
    },
    
    "GIOVANNELLI P": {  
        2: { out: "17:30", in: "20:30" },
        4: { out: "17:00", in: "20:30" }
    },
    
    "MARANGELO": {
        1: { out: "16:50", in: "19:05" },
        2: { out: "16:50", in: "19:05" },
        4: { out: "16:50", in: "19:05" }
    },
    
    "MENALDINO": {
        1: { out: "16:00", in: "20:45" },
        2: { out: "17:00", in: "18:45" },
        3: { out: "18:15", in: "20:15" },
        4: { out: "20:15", in: "21:30" }
    },  
    
    "PAONESSA": {
        1: { out: "08:30", in: "11:00" },
        2: { out: "16:00", in: "21:30" },
        3: { out: "15:00", in: "18:00" },
        4: { out: "16:00", in: "18:00" }
    },
    
    "RONCO M": {
        3: { out: "17:30", in: "NO R" }
    },
    
     "SAITTA": {
        2: { out: "18:30", in: "20:00" }
    },
  
};
// ─────────────────────────────────────────────────────────────
// ASSENTI_PERMESSO: studenti che hanno permesso di non cenare
// In online arriva da Firebase (nodo `assenti_permesso`).
// ─────────────────────────────────────────────────────────────
const ASSENTI_PERMESSO = {
    1: [''],
    2: [''],
    3: [''],
    4: ['']
};

// ─────────────────────────────────────────────────────────────
// ESPOSIZIONE GLOBALE
// ─────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.OVERRIDE_TURNI_DINNER = OVERRIDE_TURNI_DINNER;
    window.ORARI_PP              = ORARI_PP;
    window.ASSENTI_PERMESSO      = ASSENTI_PERMESSO;
}

// ─────────────────────────────────────────────────────────────
// WARNING IN CONSOLE
// ─────────────────────────────────────────────────────────────
console.warn(
    `⚠️  permessi_26_offline.js — DUMMY FILE ` +
    `(${Object.keys(ORARI_PP).length} PP fantoccio, ` +
    `${Object.keys(OVERRIDE_TURNI_DINNER).length} override turni fantoccio). ` +
    `Sul terminale offline questo file deve essere SOSTITUITO con i dati reali.`
);
