/**
 * js/studenti_26_DEMO.js
 * ─────────────────────────────────────────────────────────────
 * Database studenti DEMO (fallback locale quando Firebase non è
 * disponibile o i dati remoti sono vuoti).
 *
 * Struttura di ogni studente:
 *   {
 *     id:       "1",          // identificativo univoco
 *     cognome:  "LINCOLN",         // MAIUSCOLO (usato come chiave)
 *     nome:     "Abraham",
 *     classe:   "4A",            // "1A", "1B", "1P", "2A", "2B", "2P",
 *                                // "3A", "3B", "3P", "4A", "4B", "4C",
 *                                // "5A", "5B"
 *     room:     "101",           // numero camera (101-221 = convittore)
 *                                // "-" oppure "" = esterno (pendolare)
 *     gruppo:   "G1",            // "G1" / "G2" / "" (solo per alcune classi)
 *     percorso: "🍷"           // "🍷" / "🍴" (percorso formativo)
 *   }
 *
 * ⚠️  Le stanze 101-221 identificano i CONVITTORI.
 *     Gli esterni hanno room "-" e NON compaiono nella lista convitto.
 * ─────────────────────────────────────────────────────────────
 */

window.tuttiStudenti = [
    { id: "$1", cognome: "Washington",   nome: "George",     classe: "1A", room: "101", gruppo: "",   percorso: "" },
    { id: "$20", cognome: "Jackson",   nome: "Andrew",     classe: "5B", room: "-",   gruppo: "G1",   percorso: "🍷" }
   
];

console.log(`📚 studenti_26_DEMO.js caricato: ${window.tuttiStudenti.length} studenti`);
