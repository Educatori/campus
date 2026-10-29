// js/core/config-static.js
// Configurazione statica: caricata SEMPRE (online e offline).
// NIENTE dati personali: solo tabelle classe→turno/lab e calendario.

window.PAROLE_ASSENZA = ["ass","assente","sosp","sospeso","sospesa","gita","trasferta","malattia"];
window.PAROLE_NO_RIENTRO = ["n","no","non","nor","no r","no rientro","x"];

window.LAB_PRANZO = {
    "1": ["3A", "5A", "5B"],
    "2": ["3B", "4A"],
    "3": ["1A", "4B"],
    "4": ["1B", "4C"]
};

window.TURNI_DINNER = {
    "1": ["1A", "1B", "1P", "2A", "2B", "2P", "3P"],
    "2": ["3A", "3B", "4A", "4B", "4C", "5A", "5B"]
};

window.LAB_DINNER = {
    "1": ["2P"],
    "2": ["2A"],
    "3": ["2B"],
    "4": ["5A", "5B"]
};

window.OVERRIDE_TURNI_DINNER_CLASSI = {
    "1A": { 3: 2 },
    "1B": { 3: 2 }
};

window.CALENDARIO_GRUPPI_DINNER = {
    "10/09/2026": "gr1", "17/09/2026": "gr2", "24/09/2026": "gr1", "01/10/2026": "gr2",
    "08/10/2026": "gr1", "15/10/2026": "gr2", "22/10/2026": "gr1", "29/10/2026": "gr2",
    "05/11/2026": "gr1", "12/11/2026": "gr2", "19/11/2026": "gr1", "26/11/2026": "gr2",
    "03/12/2026": "gr1", "10/12/2026": "gr2", "17/12/2026": "gr1", "07/01/2027": "gr2",
    "14/01/2027": "gr1", "21/01/2027": "gr2", "28/01/2027": "gr1", "04/02/2027": "gr2",
    "18/02/2027": "gr2", "25/02/2027": "gr1", "04/03/2027": "gr2", "11/03/2027": "gr1",
    "18/03/2027": "gr2", "01/04/2027": "gr2", "08/04/2027": "gr1", "15/04/2027": "gr2",
    "22/04/2027": "gr1", "29/04/2027": "gr2", "06/05/2027": "gr1", "13/05/2027": "gr2",
    "20/05/2027": "gr1", "27/05/2027": "gr2", "03/06/2027": "gr1"
};

// OVERRIDE_TURNI_DINNER: vuoto qui — arriva da Firebase
window.OVERRIDE_TURNI_DINNER = window.OVERRIDE_TURNI_DINNER || {};
// ─────────────────────────────────────────────────────────────
// Helper condivisi (disponibili in entrambe le modalità)
// ─────────────────────────────────────────────────────────────

/**
 * Filtra un array di studenti restituendo solo i convittori (room 101–221).
 * Usato da: data-loader.js (§1, §3b), avviaOffline() in campus_hub.html.
 */
window.filtraConvittori = function(studenti) {
    return (studenti || []).filter(s => {
        const n = parseInt(s.room, 10);
        return !isNaN(n) && n >= 101 && n <= 221;
    });
};