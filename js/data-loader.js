// data-loader.js
// ─────────────────────────────────────────────────────────────
// Carica i dati sensibili (studenti, permessi, assenze) da
// Firebase Realtime Database, con fallback ai dati locali.
// Salva automaticamente le modifiche giornaliere su Firebase.
// ─────────────────────────────────────────────────────────────

import { db, ref, get, set, onValue } from './firebase-campus_hub-config.js';

// ─────────────────────────────────────────────────────────────
// 0. BACKUP dei dati OFF
// ─────────────────────────────────────────────────────────────
const offlineStudenti = Array.isArray(window.tuttiStudenti) ? window.tuttiStudenti.slice() : [];
const offlinePP       = window.ORARI_PP ? { ...window.ORARI_PP } : {};
const offlineAssenti  = window.ASSENTI_PERMESSO ? { ...window.ASSENTI_PERMESSO } : {};

console.log(`📦 Backup OFFLINE: ${offlineStudenti.length} studenti, ${Object.keys(offlinePP).length} PP`);

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
    "GASPARD":    { 1: 2, 2: 2, 3: 2, 4: 2 },
    "RONCO A":    { 1: 1, 2: 1, 3: 1, 4: 1 },
    "CONSOL":     { 1: 1, 2: 1, 3: 1, 4: 1 },
    "CASTELLANO": { 1: 1, 2: 1, 3: 1, 4: 1 },
    "GHILARDINI": { 1: 1, 2: 1, 3: 1, 4: 1 },
    "GORREX":     { 1: 1, 2: 1, 3: 1, 4: 1 },
    "CASTROREALE":{ 1: 1, 2: 1, 3: 1, 4: 1 },
    "DUROUX":     { 1: 2, 2: 2, 3: 2, 4: 2 },
    
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
// 2. INIZIALIZZAZIONE con OFF
// ─────────────────────────────────────────────────────────────
window.tuttiStudenti      = offlineStudenti;
window.studenticonvittori = offlineStudenti.filter(s => {
    const n = parseInt(s.room, 10);
    return !isNaN(n) && n >= 101 && n <= 221;
});
window.ORARI_PP         = offlinePP;
window.ASSENTI_PERMESSO = offlineAssenti;

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
            console.warn('   ⚠️ Nodo "studenti" assente → uso OFF');
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

// La Promise globale parte solo se qualcuno la invoca esplicitamente,
// altrimenti si crea un doppione di fetch al primo import.
// window.firebasePronto = caricaDatiFirebase();

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
       
        // Scrittura dati studenti
        await set(ref(db, `convitto/${chiave}/dati`), dati);

        // Scrittura timestamp di ultima modifica (condiviso tra tutti i terminali)
        const timestamp = Date.now();
        await set(ref(db, `convitto/${chiave}/lastUpdate`), timestamp);

        console.log(`☁️ Salvato: ${Object.keys(dati).length} studenti (${chiave})`);
        return true;
    } catch (error) {
        console.error('❌ Errore salvataggio:', error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
// 5a. DEBOUNCE salvataggio Firebase
// ─────────────────────────────────────────────────────────────
let salvaDebounceTimer = null;

function salvaDatiFirebaseDebounced() {
    clearTimeout(salvaDebounceTimer);
    salvaDebounceTimer = setTimeout(() => {
        if (typeof salvaDatiFirebase === 'function') {
            salvaDatiFirebase();
        }
    }, 1000); // 1000ms di debounce
}

window.salvaDatiFirebaseDebounced = salvaDatiFirebaseDebounced;

// ─────────────────────────────────────────────────────────────
// 5b. SALVATAGGIO NOTE (realtime)
// ─────────────────────────────────────────────────────────────
async function salvaNoteFirebase(testo) {
    try {
        await set(ref(db, 'convitto/note'), testo ?? "");
    } catch (e) {
        console.error('❌ Errore salvataggio note:', e);
    }
}
window.salvaNoteFirebase = salvaNoteFirebase;

// ─────────────────────────────────────────────────────────────
// 6. WRAPPER salvataggio locale → Firebase (con debounce)
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    const _orig = window.salvaDatiLocale;
    if (typeof _orig === 'function') {
        window.salvaDatiLocale = function () {
            _orig();
            window.salvaDatiFirebaseDebounced();
        };
        console.log('🔗 Wrapper salvataggio attivo (con debounce)');
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
window.normalizzaPP       = normalizzaPP;

console.log('🔧 data-loader.js pronto');

// ─────────────────────────────────────────────────────────────
// 8. NOTE CONDIVISE (realtime)
// ─────────────────────────────────────────────────────────────

// ⚠️ in cima al file importa: onValue, set

let noteListenerAttivo = false;
let noteRemoteInCorso = false; // evita loop: remoto → input → salva

/**
 * Attiva il listener realtime sulle note.
 * Va chiamata DOPO che l'utente è autorizzato e l'app è visibile.
 */
function attivaNoteCondivise() {
    if (noteListenerAttivo) return;
    noteListenerAttivo = true;

    const noteRef = ref(db, 'convitto/note');

    // 1) Ascolta i cambiamenti remoti
    onValue(noteRef, (snap) => {
        const testo = snap.exists() ? (snap.val() || "") : "";
        const ta = document.getElementById('dailyNotes');
        if (!ta) return;

        // Non sovrascrivere mentre l'utente sta scrivendo (se ha il focus)
        // ma aggiorna comunque se il testo è diverso e non sta editando
        if (document.activeElement === ta) {
            // Salva la posizione del cursore solo se proprio devi aggiornare
            if (ta.value === testo) return;
            // Se l'utente sta scrivendo, salta l'aggiornamento remoto
            // per non disturbare (verrà riallineato al blur)
            return;
        }

        noteRemoteInCorso = true;
        ta.value = testo;
        noteRemoteInCorso = false;
    });

    // 2) Salva su Firebase con debounce quando l'utente scrive
    const ta = document.getElementById('dailyNotes');
    if (ta) {
        let debounceTimer = null;

        ta.addEventListener('input', () => {
            if (noteRemoteInCorso) return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    await set(noteRef, ta.value);
                    console.log('☁️ Note salvate su Firebase');
                } catch (e) {
                    console.error('❌ Errore salvataggio note:', e);
                }
            }, 600); // 600ms di debounce
        });

        // Al blur, forza l'allineamento finale
        ta.addEventListener('blur', async () => {
            try { await set(noteRef, ta.value); } catch (e) {}
        });
    }

    console.log('📝 Note condivise attive (realtime)');
}

window.attivaNoteCondivise = attivaNoteCondivise;

/// ─────────────────────────────────────────────────────────────
// 8b. SYNC DATI GIORNALIERI (realtime)
// ─────────────────────────────────────────────────────────────

let syncDatiListenerAttivo = false;
let syncRemotoInCorso = false;   // evita loop: remoto → DOM → salva → Firebase
let syncChiaveAttuale = null;

/**
 * Attiva il listener realtime sui dati giornalieri.
 * Va chiamata DOPO che l'utente è autorizzato e l'app è visibile.
 *
 * Quando un altro terminale scrive su `convitto/{chiaveOggi}/dati`,
 * Firebase notifica questo client → aggiorna le card → non riscrive
 * su Firebase (il flag syncRemotoInCorso lo impedisce).
 */
function attivaSyncDatiGiornalieri() {
    if (syncDatiListenerAttivo) return;
    syncDatiListenerAttivo = true;

    const chiave = dataKeyFirebase(new Date());
    syncChiaveAttuale = chiave;

    console.log(`🔄 Sync dati giornalieri attiva su convitto/${chiave}/dati`);

    const datiRef = ref(db, `convitto/${chiave}/dati`);

    onValue(datiRef, (snap) => {
        // ─── Cambio giorno a mezzanotte: riattiva su nuova chiave ───
        const chiaveNuova = dataKeyFirebase(new Date());
        if (chiaveNuova !== syncChiaveAttuale) {
            console.log(`🌙 Cambio giorno rilevato: ${syncChiaveAttuale} → ${chiaveNuova}`);
            // Ricarica i dati per il nuovo giorno
            syncChiaveAttuale = chiaveNuova;
            syncDatiListenerAttivo = false;
            attivaSyncDatiGiornalieri();
            return;
        }

        if (!snap.exists()) {
            console.log('ℹ️ Nessun dato remoto per oggi');
            return;
        }

        const datiGiorno = snap.val() || {};
        console.log(`⬇️ Sync remota: ${Object.keys(datiGiorno).length} studenti`);

        // ─── Evita loop: se stiamo scrivendo noi, salta ───
        if (syncRemotoInCorso) return;

        // ─── Confronta con i dati locali per evitare re-render inutili ───
        const datiLocaliStr = localStorage.getItem('datiConvitto') || '{}';
        let datiLocali;
        try { datiLocali = JSON.parse(datiLocaliStr); } catch { datiLocali = {}; }

        const diversi = JSON.stringify(datiLocali) !== JSON.stringify(datiGiorno);
        if (!diversi) return;

        // ─── Aggiorna localStorage con i dati remoti ───
        localStorage.setItem('datiConvitto', JSON.stringify(datiGiorno));

        // ─── Applica i dati alle card visibili ───
        syncRemotoInCorso = true;
        try {
            if (typeof window.renderDatiRemoti === 'function') {
                window.renderDatiRemoti(datiGiorno);
            } else if (typeof caricaDatiLocale === 'function') {
                caricaDatiLocale();
            }
        } finally {
            syncRemotoInCorso = false;
        }
    });
}

window.attivaSyncDatiGiornalieri = attivaSyncDatiGiornalieri;


// ─────────────────────────────────────────────────────────────
// 8c. SYNC ULTIMO AGGIORNAMENTO (realtime)
// ─────────────────────────────────────────────────────────────
// Ascolta il nodo `convitto/{chiaveOggi}/lastUpdate` per mostrare
// in tempo reale a TUTTI i terminali l'ultima modifica fatta.
// ─────────────────────────────────────────────────────────────

let lastUpdateListenerAttivo = false;

function attivaUltimoAggiornamento() {
    if (lastUpdateListenerAttivo) return;
    lastUpdateListenerAttivo = true;

    const chiave = dataKeyFirebase(new Date());
    const lastUpdateRef = ref(db, `convitto/${chiave}/lastUpdate`);

    console.log(`🕒 Sync ultimo aggiornamento attiva su convitto/${chiave}/lastUpdate`);

    onValue(lastUpdateRef, (snap) => {
        if (!snap.exists()) return;

        const timestamp = snap.val();
        if (!timestamp) return;

        // Formatta data e ora
        const d = new Date(timestamp);
        const dataOra = d.toLocaleString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        // Aggiorna localStorage (per persistenza tra reload)
        localStorage.setItem("dataUltimaModifica", dataOra);

        // Aggiorna il display se la funzione esiste
        if (typeof window.aggiornaInfoReset === 'function') {
            window.aggiornaInfoReset();
        } else {
            // Fallback: aggiorna direttamente il testo
            const el = document.getElementById("info-reset");
            if (el) {
                const dReset = localStorage.getItem("dataUltimoReset") || "MAI";
                el.innerText = `Ultimo reset locale: ${dReset} | Ultima modifica online: ${dataOra}`;
            }
        }

        console.log(`🕒 Ultimo aggiornamento: ${dataOra}`);
    });
}

window.attivaUltimoAggiornamento = attivaUltimoAggiornamento;

// ─────────────────────────────────────────────────────────────
// 9. EXPORT per import() dinamico (campus_hub.html)
// ─────────────────────────────────────────────────────────────
export {
    caricaDatiFirebase,
    salvaDatiFirebase,
    salvaNoteFirebase,
    dataKeyFirebase,
    normalizzaPP,
    attivaNoteCondivise,
    attivaSyncDatiGiornalieri,   
    attivaUltimoAggiornamento    
};
