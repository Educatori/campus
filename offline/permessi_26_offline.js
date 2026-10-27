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

    "DUMMY":     { 1: 2, 2: 2, 3: 2, 4: 2 },
    
};

// ─────────────────────────────────────────────────────────────
// ORARI_PP: permessi permanenti per studente
// In online arriva da Firebase (nodo `permessi_pp`).
// ─────────────────────────────────────────────────────────────
const ORARI_PP = {

    
     "DUMMY": {
        1: { out: "10:00", in: "20:00" },
        2: { out: "10:00", in: "20:00" },
        3: { out: "10:00", in: "20:00" },
        4: { out: "10:00", in: "20:00" }
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
