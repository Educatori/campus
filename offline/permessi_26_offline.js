/**
 * ⚠️  DUMMY FILE — DATI FANTOCCIO (solo dati personali)
 * ─────────────────────────────────────────────────────────────
 * Questo file contiene nomi inventati e permessi fantoccio.
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
 *     js/core/config-static.js, caricato SEMPRE (online e offline).
 *
 *     In ONLINE i dati personali arrivano da Firebase e
 *     sovrascrivono questi valori (vedi data-loader.js §3).
 *     In OFFLINE questi valori sono gli unici disponibili.
 *
 * Copertura dei casi:
 *   - DUMMY     → PP con orari normali + override turno (tutti i giorni)
 *   - ALFA      → PP con "NO R" (no rientro) il giorno 3
 *   - BETA      → ASSENTI_PERMESSO il giorno 1 (non cena)
 *   - GAMMA     → OVERRIDE_TURNI_DINNER (turno 1 tutti i giorni, contro il base)
 *   - EPSILON   → PP con orari su un solo giorno (2)
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
    "DUMMY":  { 1: 2, 2: 2, 3: 2, 4: 2 },
    "GAMMA":  { 1: 1, 2: 1, 3: 1, 4: 1 }
};

// ─────────────────────────────────────────────────────────────
// ORARI_PP: permessi permanenti per studente
// In online arriva da Firebase (nodo `permessi_pp`).
// ─────────────────────────────────────────────────────────────
const ORARI_PP = {

    // DUMMY: permessi tutti i giorni
    "DUMMY": {
        1: { out: "12:00", in: "15:00" },
        2: { out: "17:00", in: "20:00" },
        3: { out: "18:15", in: "19:45" },
        4: { out: "20:15", in: "21:30" }
    },

    // ALFA: "NO R" (no rientro) il giorno 3
    "ALFA": {
        3: { out: "13:30", in: "NO R" }
    },

    // EPSILON: orari su un solo giorno (per test "parziali")
    "EPSILON": {
        2: { out: "17:00", in: "20:00" }
    }

};

// ─────────────────────────────────────────────────────────────
// ASSENTI_PERMESSO: studenti che hanno permesso di non cenare
// In online arriva da Firebase (nodo `assenti_permesso`).
// ─────────────────────────────────────────────────────────────
const ASSENTI_PERMESSO = {
    1: ['BETA'],
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
