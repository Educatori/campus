// data-loader.js 
// ─────────────────────────────────────────────────────────────
// Carica i dati sensibili (studenti, permessi, assenze) da
// Firebase Realtime Database, con fallback ai DEMO locali.
// Salva automaticamente le modifiche giornaliere su Firebase.
// ─────────────────────────────────────────────────────────────

import { db, ref, get } from './firebase-campus_hub-config.js';

// ─────────────────────────────────────────────────────────────
// 0. BACKUP dei dati DEMO già caricati da studenti_26_DEMO.js
//    e permessi_26_DEMO.js (via <script> classici nell'HTML)
// ─────────────────────────────────────────────────────────────
const demoStudenti = Array.isArray(window.tuttiStudenti) ? window.tuttiStudenti.slice() : [];
const demoPP       = window.ORARI_PP ? { ...window.ORARI_PP } : {};
const demoAssenti  = window.ASSENTI_PERMESSO ? { ...window.ASSENTI_PERMESSO } : {};

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
    "GASPARD":    { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1 },
    "RONCO A":    { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    "CONSOL":     { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    "CASTELLANO": { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    "GHILARDINI": { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    "GORREX":     { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
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
// ─────────────────────────────────────────────────────────────
window.tuttiStudenti      = demoStudenti;
window.studenticonvittori = demoStudenti.filter(s => {
    const n = parseInt(s.room, 10);
    return !isNaN(n) && n >= 101 && n <= 221;
});
window.ORARI_PP         = demoPP;
window.ASSENTI_PERMESSO = demoAssenti;

// ─────────────────────────────────────────────────────────────
// 3. UTILITY — chiave data "DD-MM-YYYY" (formato usato nel DB)
// ─────────────────────────────────────────────────────────────
function dataKeyFirebase(data) {
    const d = data || new Date();
    const g = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const a = d.getFullYear();
    return `${g}-${m}-${a}`;   // es. "17-09-2026"
}

// ─────────────────────────────────────────────────────────────
// 4. CARICAMENTO DA FIREBASE
// ─────────────────────────────────────────────────────────────
async function caricaDatiFirebase() {
    try {
        console.log('🔥 Connessione a Firebase...');

        // --- 4a. Studenti ---
        const studentiSnap = await get(ref(db, 'studenti'));
        if (studentiSnap.exists()) {
            const data = studentiSnap.val();
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
                console.warn('   ⚠️ Nodo "studenti" vuoto → uso DEMO');
            }
        } else {
            console.warn('   ⚠️ Nodo "studenti" assente → uso DEMO');
        }

        // --- 4b. Filtro convittori ---
        window.studenticonvittori = window.tuttiStudenti.filter(s => {
            const n = parseInt(s.room, 10);
            return !isNaN(n) && n >= 101 && n <= 221;
        });
        console.log(`   🏠 Convittori: ${window.studenticonvittori.length}`);

        // --- 4c. Permessi PP ---
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
            console.warn('   ⚠️ Nodo "permessi_pp" assente → uso DEMO');
        }

        // --- 4d. Assenti permesso ---
        const assSnap = await get(ref(db, 'assenti_permesso'));
        if (assSnap.exists()) {
            const assData = assSnap.val();
            if (assData && Object.keys(assData).length > 0) {
                window.ASSENTI_PERMESSO = assData;
                console.log(`   🚫 Assenti permesso: ${Object.keys(assData).length} giorni`);
            }
        }

        // --- 4e. Dati giornalieri convitto (oggi) ---
        const chiaveOggi = dataKeyFirebase(new Date());
        const giornoSnap = await get(ref(db, `convitto/${chiaveOggi}`));
        if (giornoSnap.exists()) {
            const nodo = giornoSnap.val();
            const datiGiorno = nodo.dati || {};
            console.log(`   💾 Dati giornalieri (${chiaveOggi}): ${Object.keys(datiGiorno).length} studenti`);

            // Inietta in localStorage (stessa chiave usata da caricaDatiLocale)
            const datiLS = {};
            for (const [cognome, info] of Object.entries(datiGiorno)) {
                datiLS[cognome] = {
                    esce:     info.esce     ?? "",
                    entra:    info.entra    ?? "",
                    assente:  info.assente  ?? false,
                    dinnerno: info.dinnerno ?? "0",
                    switch:   info.switch   ?? false
                };
            }
            localStorage.setItem('datiConvitto', JSON.stringify(datiLS));

            if (nodo.lastUpdate) {
                const dt = new Date(nodo.lastUpdate).toLocaleString('it-IT');
                console.log(`   🕒 Ultimo aggiornamento: ${dt}`);
            }
        } else {
            console.log(`   ⚠️ Nessun dato per oggi (${chiaveOggi})`);
        }

        // --- 4f. Ultimo reset ---
        const resetSnap = await get(ref(db, 'convitto/ultimoReset'));
        if (resetSnap.exists()) {
            const dataReset = resetSnap.val();
            localStorage.setItem('dataUltimoReset', dataReset);
            console.log(`   ♻️ Ultimo reset: ${dataReset}`);
        }

        console.log('✅ Firebase: caricamento completato con successo');
        return true;

    } catch (error) {
        console.error('❌ Errore caricamento Firebase:', error);
        console.warn('🔁 Fallback attivo: mantengo dati DEMO locali');
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
// 5. SALVATAGGIO SU FIREBASE
// ─────────────────────────────────────────────────────────────
async function salvaDatiFirebase() {
    try {
        const chiave = dataKeyFirebase(new Date());

        // Raccogli i dati dal DOM (stessa logica di salvaDatiLocale)
        const dati = {};
        document.querySelectorAll('.student-row').forEach(r => {
            dati[r.dataset.cognome] = {
                esce:     r.querySelector('.in-u')?.value ?? "",
                entra:    r.querySelector('.in-i')?.value ?? "",
                assente:  r.classList.contains('assente'),
                dinnerno: r.dataset.dinnerno ?? "0",
                switch:   window.cambiTurnoManuali?.[r.dataset.cognome] ?? false
            };
        });

        // Import dinamico di set() per non appesantire il caricamento iniziale
        const { set } = await import(
            'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js'
        );

        await set(ref(db, `convitto/${chiave}/dati`), dati);
        await set(ref(db, `convitto/${chiave}/lastUpdate`), Date.now());

        console.log(`☁️ Salvato su Firebase: ${Object.keys(dati).length} studenti (${chiave})`);
        return true;

    } catch (error) {
        console.error('❌ Errore salvataggio Firebase:', error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
// 6. WRAPPER: replica i salvataggi locali su Firebase
//    Aspetta che campus_hub-script.js abbia definito salvaDatiLocale
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    const _salvaDatiLocaleOriginale = window.salvaDatiLocale;
    if (typeof _salvaDatiLocaleOriginale === 'function') {
        window.salvaDatiLocale = function () {
            _salvaDatiLocaleOriginale();
            window.salvaDatiFirebase();   // fire-and-forget
        };
        console.log('🔗 Wrapper salvataggio attivo (locale → Firebase)');
    } else {
        console.warn('⚠️ salvaDatiLocale non trovata: wrapper non attivato');
    }
});

// ─────────────────────────────────────────────────────────────
// 7. ESPOSIZIONE GLOBALE
// ─────────────────────────────────────────────────────────────
window.caricaDatiFirebase = caricaDatiFirebase;
window.salvaDatiFirebase  = salvaDatiFirebase;
window.dataKeyFirebase    = dataKeyFirebase;

console.log('🔧 data-loader.js pronto');

// ─────────────────────────────────────────────────────────────
// 8. NORMALIZZAZIONE ORARI_PP
//    Firebase converte oggetti con chiavi numeriche sequenziali
//    in array [null, {1}, {2}, {3}, {4}]. Li riconvertiamo in
//    oggetto { "1": {...}, "2": {...}, ... } per compatibilità.
// ─────────────────────────────────────────────────────────────
function normalizzaPP(ppData) {
    const risultato = {};
    for (const [cognome, orari] of Object.entries(ppData || {})) {
        if (Array.isArray(orari)) {
            const obj = {};
            orari.forEach((v, i) => {
                if (i > 0 && v && typeof v === 'object') {
                    obj[String(i)] = v;
                }
            });
            risultato[cognome] = obj;
        } else if (orari && typeof orari === 'object') {
            risultato[cognome] = orari;
        }
    }
    return risultato;
}

// Avvolgi caricaDatiFirebase per normalizzare dopo il caricamento
const _caricaDatiFirebaseOrig = window.caricaDatiFirebase;
window.caricaDatiFirebase = async function () {
    const ok = await _caricaDatiFirebaseOrig();
    if (ok && window.ORARI_PP) {
        window.ORARI_PP = normalizzaPP(window.ORARI_PP);
        console.log(`🧹 ORARI_PP normalizzato: ${Object.keys(window.ORARI_PP).length}`);
    }
    return ok;
};

// ─────────────────────────────────────────────────────────────
// 9. RE-RENDER pannello permessi dopo Firebase (fix timing)
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    setTimeout(() => {
        if (typeof window.popolaListaPermessi === 'function') {
            window.popolaListaPermessi();
            console.log('🔄 Pannello permessi ri-renderizzato');
        }
    }, 1000);
});
