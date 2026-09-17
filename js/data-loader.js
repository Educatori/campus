// data-loader.js
// ─────────────────────────────────────────────────────────────
// Carica i dati sensibili (studenti, permessi, assenze) da
// Firebase Realtime Database, con fallback ai DEMO locali.
// Salva automaticamente le modifiche giornaliere su Firebase.
// ─────────────────────────────────────────────────────────────

import { db, ref, get } from './firebase-campus_hub-config.js';

// ─────────────────────────────────────────────────────────────
// 0. BACKUP dei dati DEMO
// ─────────────────────────────────────────────────────────────
const demoStudenti = Array.isArray(window.tuttiStudenti) ? window.tuttiStudenti.slice() : [];
const demoPP       = window.ORARI_PP ? { ...window.ORARI_PP } : {};
const demoAssenti  = window.ASSENTI_PERMESSO ? { ...window.ASSENTI_PERMESSO } : {};

console.log(`📦 Backup DEMO: ${demoStudenti.length} studenti, ${Object.keys(demoPP).length} PP`);

// ─────────────────────────────────────────────────────────────
// 1. CONFIGURAZIONE LOCALE
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
// 2. INIZIALIZZAZIONE con DEMO
// ─────────────────────────────────────────────────────────────
window.tuttiStudenti      = demoStudenti;
window.studenticonvittori = demoStudenti.filter(s => {
    const n = parseInt(s.room, 10);
    return !isNaN(n) && n >= 101 && n <= 221;
});
window.ORARI_PP         = demoPP;
window.ASSENTI_PERMESSO = demoAssenti;

// ─────────────────────────────────────────────────────────────
// 3. UTILITY
// ─────────────────────────────────────────────────────────────
function dataKeyFirebase(data) {
    const d = data || new Date();
    const g = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const a = d.getFullYear();
    return `${g}-${m}-${a}`;
}

/**
 * Normalizza i permessi PP da Firebase.
 * Firebase trasforma {"1":{...},"2":{...}} in [null,{...},{...}].
 * Questo li riconverte in oggetto.
 */
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

// ─────────────────────────────────────────────────────────────
// 4. CARICAMENTO DA FIREBASE
// ─────────────────────────────────────────────────────────────
async function caricaDatiFirebase() {
    try {
        console.log('🔥 Connessione a Firebase...');

        // 4a. Studenti
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
            }
        } else {
            console.warn('   ⚠️ Nodo "studenti" assente → uso DEMO');
        }

        // 4b. Filtro convittori
        window.studenticonvittori = window.tuttiStudenti.filter(s => {
            const n = parseInt(s.room, 10);
            return !isNaN(n) && n >= 101 && n <= 221;
        });
        console.log(`   🏠 Convittori: ${window.studenticonvittori.length}`);

        // 4c. Permessi PP (con NORMALIZZAZIONE)
        const ppSnap = await get(ref(db, 'permessi_pp'));
        if (ppSnap.exists()) {
            const ppData = ppSnap.val();
            if (ppData && Object.keys(ppData).length > 0) {
                window.ORARI_PP = normalizzaPP(ppData);
                console.log(`   🔑 Permessi PP: ${Object.keys(window.ORARI_PP).length} (normalizzati)`);
            }
        }

        // 4d. Assenti permesso
        const assSnap = await get(ref(db, 'assenti_permesso'));
        if (assSnap.exists()) {
            const assData = assSnap.val();
            if (assData && Object.keys(assData).length > 0) {
                window.ASSENTI_PERMESSO = assData;
                console.log(`   🚫 Assenti permesso: ${Object.keys(assData).length} giorni`);
            }
        }

        // 4e. Dati giornalieri
        const chiaveOggi = dataKeyFirebase(new Date());
        const giornoSnap = await get(ref(db, `convitto/${chiaveOggi}`));
        if (giornoSnap.exists()) {
            const nodo = giornoSnap.val();
            const datiGiorno = nodo.dati || {};
            console.log(`   💾 Dati giornalieri (${chiaveOggi}): ${Object.keys(datiGiorno).length} studenti`);

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
        }

        // 4f. Ultimo reset
        const resetSnap = await get(ref(db, 'convitto/ultimoReset'));
        if (resetSnap.exists()) {
            localStorage.setItem('dataUltimoReset', resetSnap.val());
        }

        console.log('✅ Firebase: caricamento completato');
        return true;

    } catch (error) {
        console.error('❌ Errore caricamento Firebase:', error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
// 5. SALVATAGGIO SU FIREBASE
// ─────────────────────────────────────────────────────────────
async function salvaDatiFirebase() {
    try {
        const chiave = dataKeyFirebase(new Date());
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
        const { set } = await import(
            'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js'
        );
        await set(ref(db, `convitto/${chiave}/dati`), dati);
        await set(ref(db, `convitto/${chiave}/lastUpdate`), Date.now());
        console.log(`☁️ Salvato: ${Object.keys(dati).length} studenti (${chiave})`);
        return true;
    } catch (error) {
        console.error('❌ Errore salvataggio:', error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
// 6. WRAPPER salvataggio locale → Firebase
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    const _orig = window.salvaDatiLocale;
    if (typeof _orig === 'function') {
        window.salvaDatiLocale = function () {
            _orig();
            window.salvaDatiFirebase();
        };
        console.log('🔗 Wrapper salvataggio attivo');
    }
});

// ─────────────────────────────────────────────────────────────
// 7. RE-RENDER FORZATO del pannello permessi dopo Firebase
//    Questo è IL FIX per il pannello che mostra PAOLONI.
//    Aspetta che caricaDatiFirebase sia terminato e forza il render.
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', async () => {
    // Aspetta che Firebase abbia finito (polling fino a 5 secondi)
    const maxAttesa = 5000;
    const inizio = Date.now();
    while (Date.now() - inizio < maxAttesa) {
        // Condizione: ORARI_PP contiene BUZZI (cognome Firebase) invece di PAOLONI (DEMO)
        if (window.ORARI_PP && window.ORARI_PP["BUZZI"]) {
            break;
        }
        await new Promise(r => setTimeout(r, 100));
    }

    // Ora Firebase ha finito → forza re-render di tutti i pannelli
    console.log('🔄 Forzo re-render pannelli dopo Firebase');

    if (typeof window.popolaListaPermessi === 'function') {
        window.popolaListaPermessi();
        console.log('   ✅ Permessi ri-renderizzati');
    }
    if (typeof window.popolaSelectStudenti === 'function') {
        window.popolaSelectStudenti();
    }
    if (typeof window.popolaSelectClassi === 'function') {
        window.popolaSelectClassi();
    }
    if (typeof window.renderListaAssenze === 'function') {
        window.renderListaAssenze();
    }
});

// ─────────────────────────────────────────────────────────────
// 8. ESPOSIZIONE GLOBALE
// ─────────────────────────────────────────────────────────────
window.caricaDatiFirebase = caricaDatiFirebase;
window.salvaDatiFirebase  = salvaDatiFirebase;
window.dataKeyFirebase    = dataKeyFirebase;
window.normalizzaPP       = normalizzaPP;

console.log('🔧 data-loader.js pronto');
