/**
 * js/permessi_26_DEMO.js
 * ─────────────────────────────────────────────────────────────
 * Permessi permanenti (ORARI_PP) e assenze fisse (ASSENTI_PERMESSO)
 * DEMO. Vengono usati come fallback quando Firebase non è
 * disponibile o i nodi remoti sono vuoti.
 *
 * ─────────────────────────────────────────────────────────────
 * ORARI_PP  →  { COGNOME: { 1: {out, in}, 2: {...}, ... } }
 *              1 = Lunedì, 2 = Martedì, ..., 5 = Venerdì
 *              "out" = orario di uscita abituale
 *              "in"  = orario di rientro abituale
 *
 * ASSENTI_PERMESSO  →  { 1: [COGNOME1, COGNOME2], 2: [...], ... }
 *              giorno → lista di cognomi assenti quel giorno
 * ─────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────
// PERMESSI PERMANENTI (uscite/rientri abituali)
// ─────────────────────────────────────────────────────────────
window.ORARI_PP = {
    // Studente con permesso solo il lunedì
    "Washington": {
        1: { out: "17:00", in: "19:30" }
    },

    // Studente con permesso tutti i giorni (rientro sera)
    "Jefferson": {
        1: { out: "16:40", in: "20:00" },
        2: { out: "16:40", in: "20:00" },
        3: { out: "16:40", in: "20:00" },
        4: { out: "16:40", in: "20:00" }
    },

    // Studente con NO RIENTRO (pernotta fuori) il mercoledì
    "Lincoln": {
        3: { out: "17:00", in: "no rientro" }
    },

    // Studente con permesso solo il venerdì
    "Jackson": {
        5: { out: "15:00", in: "18:30" }
    },

    // Studente che esce tutti i giorni alle 17 e rientra alle 21
    "Grant": {
        1: { out: "17:00", in: "21:00" },
        2: { out: "17:00", in: "21:00" },
        3: { out: "17:00", in: "21:00" },
        4: { out: "17:00", in: "21:00" }
    }

    
};

// ─────────────────────────────────────────────────────────────
// ASSENZE FISSE SETTIMANALI (es. studenti che non ci sono
// tutti i lunedì per tirocinio, palestra, ecc.)
// ─────────────────────────────────────────────────────────────
window.ASSENTI_PERMESSO = {
    // Lunedì: questi studenti sono sempre assenti
    1: ["Washington"],

    // Martedì
    2: ["Jefferson"],

    // Mercoledì
    3: ["Lincoln"],

    // Giovedì
    4: ["Jackson"]
   
};

console.log(
    `🔑 permessi_26_DEMO.js caricato: ${Object.keys(window.ORARI_PP).length} studenti con PP, ` +
    `${Object.keys(window.ASSENTI_PERMESSO).length} giorni con assenze fisse`
);