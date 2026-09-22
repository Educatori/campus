/**
 * js/studenti_26_DEMO.js
 * ─────────────────────────────────────────────────────────────
 * Database studenti DEMO (fallback locale quando Firebase non è
 * disponibile o i dati remoti sono vuoti).
 *
 * Struttura di ogni studente:
 *   {
 *     id:       "S001",          // identificativo univoco
 *     cognome:  "ROSSI",         // MAIUSCOLO (usato come chiave)
 *     nome:     "MARIO",
 *     classe:   "3A",            // "1A", "1B", "1P", "2A", "2B", "2P",
 *                                // "3A", "3B", "3P", "4A", "4B", "4C",
 *                                // "5A", "5B"
 *     room:     "101",           // numero camera (101-221 = convittore)
 *                                // "-" oppure "" = esterno (pendolare)
 *     gruppo:   "G1",            // "G1" / "G2" / "" (solo per alcune classi)
 *     percorso: "sala"           // "sala" / "" (percorso formativo)
 *   }
 *
 * ⚠️  Le stanze 101-221 identificano i CONVITTORI.
 *     Gli esterni hanno room "-" e NON compaiono nella lista convitto.
 * ─────────────────────────────────────────────────────────────
 */

window.tuttiStudenti = [
    // ── 1A ─────────────────────────────────────────────────
    { id: "S001", cognome: "BIANCHI",   nome: "Luca",     classe: "1A", room: "101", gruppo: "",   percorso: "" },
    { id: "S004", cognome: "FERRARI",   nome: "Anna",     classe: "1A", room: "-",   gruppo: "",   percorso: "" },
   
];

console.log(`📚 studenti_26_DEMO.js caricato: ${window.tuttiStudenti.length} studenti`);