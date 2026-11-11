/**
 * ⚠️  DUMMY FILE — DATI FANTOCCIO
 * ─────────────────────────────────────────────────────────────
 * Questo file contiene SOLO nomi inventati
 *  a scopo dimostrativo. Serve a proteggere la
 * privacy degli studenti reali su repository pubblici (GitHub).
 *
 * ⚠️  NON aggiungere dati reali qui.
 *     Sul terminale offline, questo file viene SOSTITUITO con
 *     la versione contenente i dati veri (mai committata).
 *
 * La struttura (chiavi: id, cognome, nome, classe, room,
 * percorso, gruppo) deve rimanere IDENTICA a quella del file
 * reale, altrimenti il codice va in errore.
 *
 * Copertura dei casi:
 *   - 1A, 3A, 4A, 4B   → classi normali (bus sì)
 *   - 5A, 5B           → gruppi G1/G2 (test turni/lab)
 *   - 2A, 2B, 4C       → escluse dal bus pomeriggio
 *   - 1P, 2P, 3P       → classi P (sempre escluse)
 *   - Foresteria       → letti foresteria
 *   - CAMERA_FORESTERIA_M/F → per test stampa convitto
 * ─────────────────────────────────────────────────────────────
 */
window.tuttiStudenti = [

    // ── 1A (classe normale, turno 1) ──
    { "id": 300, "cognome": "DUMMY",     "nome": "Rub",      "classe": "1A", "room": "101", "percorso": "🍴" },
    { "id": 301, "cognome": "ALFA",      "nome": "Anna",     "classe": "1A", "room": "102", "percorso": "🍷" },

    // ── 3A (classe normale, turno 2) ──
    { "id": 302, "cognome": "BETA",      "nome": "Bruno",    "classe": "3A", "room": "103", "percorso": "🍴" },

    // ── 4A (classe normale, turno 2, percorso 🍷) ──
    { "id": 303, "cognome": "GAMMA",     "nome": "Carla",    "classe": "4A", "room": "104", "percorso": "🍷" },

    // ── 4B (classe normale, turno 2) ──
    { "id": 304, "cognome": "DELTA",     "nome": "Dario",    "classe": "4B", "room": "105", "percorso": "🍴" },

    // ── 5A (turno 2, GRUPPO G1 e G2) ──
    { "id": 305, "cognome": "EPSILON",   "nome": "Elena",    "classe": "5A", "room": "106", "percorso": "🍴", "gruppo": "G1" },
    { "id": 306, "cognome": "ZETA",      "nome": "Fabio",    "classe": "5A", "room": "107", "percorso": "🍴", "gruppo": "G2" },

    // ── 5B (turno 2, GRUPPO G1 e G2) ──
    { "id": 307, "cognome": "ETA",       "nome": "Gina",     "classe": "5B", "room": "108", "percorso": "🍷", "gruppo": "G1" },
    { "id": 308, "cognome": "THETA",     "nome": "Hugo",     "classe": "5B", "room": "109", "percorso": "🍷", "gruppo": "G2" },

    // ── 2A (ESCLUSA dal bus) ──
    { "id": 309, "cognome": "IOTA",      "nome": "Irene",    "classe": "2A", "room": "110", "percorso": "" },

    // ── 2B (ESCLUSA dal bus) ──
    { "id": 310, "cognome": "KAPPA",     "nome": "Luca",     "classe": "2B", "room": "111", "percorso": "" },

    // ── 4C (esclusa dal bus pomeriggio, inclusa mattina "solo GIO") ──
    { "id": 311, "cognome": "LAMBDA",    "nome": "Marta",    "classe": "4C", "room": "112", "percorso": "🍷" },

    // ── 1P, 2P, 3P (classi P, sempre escluse) ──
    { "id": 312, "cognome": "MI",        "nome": "Nadia",    "classe": "1P", "room": "113", "percorso": "" },
    { "id": 313, "cognome": "NI",        "nome": "Oscar",    "classe": "2P", "room": "114", "percorso": "" },
    { "id": 314, "cognome": "XI",        "nome": "Paola",    "classe": "3P", "room": "115", "percorso": "" },

    // ── Foresteria (letti) ──
    { "id": 315, "cognome": "OMICRON",   "nome": "Quirino",  "classe": "Foresteria", "room": "124", "percorso": "" },
    { "id": 316, "cognome": "PI",        "nome": "Rosa",     "classe": "Foresteria", "room": "212", "percorso": "" },

];

console.warn(
    `⚠️  studenti_26_offline.js — DUMMY FILE (${window.tuttiStudenti.length} studenti fantoccio). ` +
    `Sul terminale offline questo file deve essere SOSTITUITO con i dati reali.`
);
