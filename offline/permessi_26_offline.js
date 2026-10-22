/**
 * ⚠️  DUMMY FILE — DATI FANTOCCIO E CONFIGURAZIONE
 * ─────────────────────────────────────────────────────────────
 * Questo file contiene nomi inventati (Frankenstein, Dracula,
 * Mummia, Wolf…) e configurazioni di test (es. classi 6A, 7B).
 * Serve a proteggere la privacy degli studenti reali su repository
 * pubblici (GitHub).
 *
 * ⚠️  NON aggiungere dati reali qui.
 *     Sul terminale offline, questo file viene SOSTITUITO con
 *     la versione contenente i dati veri (mai committata).
 *
 * 📌 NOTA SULL'ARCHITETTURA:
 *     Questo file è l'UNICA fonte di verità per le configurazioni
 *     statiche (LAB_PRANZO, TURNI_DINNER, LAB_DINNER, ecc.).
 *     La vecchia duplicazione in data-loader.js è stata rimossa:
 *     modificare qui vale sia per la modalità Online (Firebase)
 *     che per la modalità Offline (locale).
 * ─────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────
// PAROLE-CHIAVE PER L'INTERPRETAZIONE DEI PERMESSI PERMANENTI
// ─────────────────────────────────────────────────────────────

window.PAROLE_ASSENZA = [
    "ass", "assente",
    "sosp", "sospeso", "sospesa",
    "gita", "trasferta", "malattia"
];

window.PAROLE_NO_RIENTRO = [
    "n", "no", "non", "nor",
    "no r", "no rientro", "x"
];


// LAB_PRANZO: classi che vanno in laboratorio a pranzo per giorno settimana (1=Lunedì, ...)
const LAB_PRANZO = {
    "1": ["3A", "5A", "5B"],
    "2": ["3B", "4A"],
    "3": ["1A", "4B"],
    "4": ["1B", "4C"],
    "5": ["6A", "7B"]           /*solo per test*/
};

// TURNI_DINNER: classi divise per turno cena
const TURNI_DINNER = {
    "1": ["1A", "1B", "1P", "2A", "2B", "2P", "3P"],
    "2": ["3A", "3B", "4A", "4B", "4C", "5A", "5B"]
};

// LAB_DINNER: classi che vanno in laboratorio a cena
const LAB_DINNER = {
    "1": ["2P"],
    "2": ["2A"],
    "3": ["2B"],
    "4": ["5A", "5B"],
    "5": ["6A", "7B"]         /*solo per test*/
};

// OVERRIDE_TURNI_DINNER: override individuali per turno cena
// Formato: "COGNOME": { "giornoSettimana": turno }
const OVERRIDE_TURNI_DINNER = {
    "WOLF":     { 1: 2, 2: 2, 3: 2, 4: 2 },
   
};

// OVERRIDE_TURNI_DINNER_CLASSI: override del turno cena per INTERA CLASSE
// Formato: "CLASSE": { "giornoSettimana": turno }
// Ha PRIORITÀ MINORE rispetto a OVERRIDE_TURNI_DINNER (individuale).
const OVERRIDE_TURNI_DINNER_CLASSI = {
    "1A": { 3: 2 },
    "1B": { 3: 2 },
};

// ORARI_PP: permessi permanenti per studente
// ⚠️ Questo NON è duplicato in data-loader.js (in online arriva da Firebase)
const ORARI_PP = {
   
    "FRANKENSTEIN": {
        1: { out: "12:00", in: "20:45" },
        2: { out: "17:00", in: "18:45" },
        3: { out: "18:15", in: "19:15" },
        4: { out: "20:15", in: "21:30" }
    },
    
    "DRACULA": {
        1: { out: "23:00", in: "05:00" },
        2: { out: "22:00", in: "06:00" },
        3: { out: "23:00", in: "05:00" },
        4: { out: "22:00", in: "06:00" }
    },
    
    "MUMMIA": {
        1: { out: "10:00", in: "18:00" },
        2: { out: "10:00", in: "18:00" },
        3: { out: "10:00", in: "18:00" },
        4: { out: "10:00", in: "18:00" }
    },
    
     "WOLF": {
        1: { out: "19:00", in: "23:00" },
        2: { out: "20:00", in: "23:00" },
        3: { out: "21:00", in: "23:00" },
        4: { out: "22:00", in: "23:00" }
    },
    
};

// ASSENTI_PERMESSO: studenti che hanno permesso di non cenare
// ⚠️ Questo NON è duplicato in data-loader.js (in online arriva da Firebase)
const ASSENTI_PERMESSO = {
    1: [''],
    2: [''],
    3: [''],
    4: [''],
};

// CALENDARIO_GRUPPI_DINNER: calendario dei gruppi per i laboratori a cena
const CALENDARIO_GRUPPI_DINNER = {
    "01/01/2026": "gr1", "02/01/2026": "gr2"    /*solo per test*/
};

// Esponi globalmente
if (typeof window !== 'undefined') {
    window.LAB_PRANZO = LAB_PRANZO;
    window.TURNI_DINNER = TURNI_DINNER;
    window.LAB_DINNER = LAB_DINNER;
    window.OVERRIDE_TURNI_DINNER = OVERRIDE_TURNI_DINNER;
    window.OVERRIDE_TURNI_DINNER_CLASSI = OVERRIDE_TURNI_DINNER_CLASSI;
    window.ORARI_PP = ORARI_PP;
    window.ASSENTI_PERMESSO = ASSENTI_PERMESSO;
    window.CALENDARIO_GRUPPI_DINNER = CALENDARIO_GRUPPI_DINNER;
}

// ─────────────────────────────────────────────────────────────
// WARNING IN CONSOLE
// ─────────────────────────────────────────────────────────────
console.warn(
    `⚠️  permessi_26_offline.js — DUMMY FILE ` +
    `(${Object.keys(ORARI_PP).length} PP fantoccio, ` +
    `${Object.keys(CALENDARIO_GRUPPI_DINNER).length} date calendario test). ` +
    `Sul terminale offline questo file deve essere SOSTITUITO con i dati reali.`
);
