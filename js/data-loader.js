// data-loader.js
// Carica i dati sensibili (studenti, permessi) da Firebase Realtime Database.
// In caso di errore, mantiene i dati DEMO eventualmente già presenti in window.

import { db, ref, get } from './firebase-campus_hub-config.js';

// ─────────────────────────────────────────────────────────────
// 0. BACKUP dei dati DEMO già caricati da studenti_26_DEMO.js
//    e permessi_26_DEMO.js (via <script> classici nell'HTML)
// ─────────────────────────────────────────────────────────────
const demoStudenti  = Array.isArray(window.tuttiStudenti) ? window.tuttiStudenti.slice() : [];
const demoPP        = window.ORARI_PP ? { ...window.ORARI_PP } : {};
const demoAssenti   = window.ASSENTI_PERMESSO ? { ...window.ASSENTI_PERMESSO } : {};

console.log(`📦 Backup DEMO: ${demoStudenti.length} studenti, ${Object.keys(demoPP).length} PP`);

// ─────────────────────────────────────────────────────────────
// 1. CONFIGURAZIONE LOCALE (non sensibile — sempre disponibile)
// ─────────────────────────────────────────────────────────────
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

window.OVERRIDE_TURNI_DINNER = {
    "GASPARD":      { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1 },
    "RONCO A":      { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    "CONSOL":       { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    "CASTELLANO":   { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    "GHILARDINI":   { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    "GORREX":       { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
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

// ─────────────────────────────────────────────────────────────
// 2. INIZIALIZZAZIONE con valori DEMO (fallback immediato)
//    In questo modo, se Firebase è lento o KO, la pagina ha già
//    qualcosa da mostrare.
// ─────────────────────────────────────────────────────────────
window.tuttiStudenti     = demoStudenti;
window.studenticonvittori = demoStudenti.filter(s => {
    const n = parseInt(s.room, 10);
    return !isNaN(n) && n >= 101 && n <= 221;
});
window.ORARI_PP         = demoPP;
window.ASSENTI_PERMESSO = demoAssenti;

// ─────────────────────────────────────────────────────────────
// 3. CARICAMENTO DA FIREBASE
// ─────────────────────────────────────────────────────────────
async function caricaDatiFirebase() {
    try {
        console.log('🔥 Connessione a Firebase...');

        // --- 3a. Studenti ---
        const studentiSnap = await get(ref(db, 'studenti'));
        if (studentiSnap.exists()) {
            const data = studentiSnap.val();
            // Firebase restituisce { "1": {...}, "282": {...} }
            const studentiArray = Object.values(data).map(s => ({
                id:       s.id,
                cognome:  (s.cognome  || "").trim(),
                nome:     (s.nome     || "").trim(),
                classe:   (s.classe   || "").trim(),
                room:     (s.room     || "-").toString().trim(),
                gruppo:   (s.gruppo   || "").trim(),
                percorso: (s.percorso || "").trim()
            }));

            if (studentiArray.length > 0) {
                window.tuttiStudenti = studentiArray;
                console.log(`   📚 Studenti: ${studentiArray.length}`);
            } else {
                console.warn('   ⚠️ Nodo "studenti" vuoto in Firebase → uso DEMO');
            }
        } else {
            console.warn('   ⚠️ Nodo "studenti" non trovato in Firebase → uso DEMO');
        }

        // --- 3b. Filtro convittori ---
        window.studenticonvittori = window.tuttiStudenti.filter(s => {
            const n = parseInt(s.room, 10);
            return !isNaN(n) && n >= 101 && n <= 221;
        });
        console.log(`   🏠 Convittori: ${window.studenticonvittori.length}`);

        // --- 3c. Permessi PP ---
        const ppSnap = await get(ref(db, 'permessi_pp'));
        if (ppSnap.exists()) {
            const ppData = ppSnap.val();
            if (ppData && Object.keys(ppData).length > 0) {
                window.ORARI_PP = ppData;
                console.log(`   🔑 Permessi PP: ${Object.keys(ppData).length}`);
            } else {
                console.warn('   ⚠️ Nodo "permessi_pp" vuoto → uso DEMO');
            }
        } else {
            console.warn('   ⚠️ Nodo "permessi_pp" non trovato → uso DEMO');
        }

        // --- 3d. Assenti permesso ---
        const assSnap = await get(ref(db, 'assenti_permesso'));
        if (assSnap.exists()) {
            const assData = assSnap.val();
            if (assData && Object.keys(assData).length > 0) {
                window.ASSENTI_PERMESSO = assData;
                console.log(`   🚫 Assenti permesso: ${Object.keys(assData).length} giorni`);
            }
        }

        console.log('✅ Firebase: caricamento completato con successo');
        return true;

    } catch (error) {
        console.error('❌ Errore caricamento Firebase:', error);
        console.warn('🔁 Fallback attivo: mantengo dati DEMO locali');
        // NON mostro alert: il fallback DEMO è già pronto da sopra
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
// 4. ESPOSIZIONE GLOBALE
// ─────────────────────────────────────────────────────────────
window.caricaDatiFirebase = caricaDatiFirebase;

console.log('🔧 data-loader.js pronto');