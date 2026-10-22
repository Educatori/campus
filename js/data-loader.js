// data-loader.js
// ─────────────────────────────────────────────────────────────
// Carica i dati sensibili (studenti, permessi, assenze) da
// Firebase Realtime Database, con fallback ai dati locali.
// Salva automaticamente le modifiche giornaliere su Firebase.
//
// ⚠️ La CONFIGURAZIONE STATICA (LAB_PRANZO, TURNI_DINNER, ecc.)
//    NON è più definita qui: è centralizzata in
//    offline/permessi_26_offline.js, che viene caricato prima di
//    questo modulo. In questo modo c'è una sola fonte di verità.
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
// 1. INIZIALIZZAZIONE con OFF (la configurazione statica è già su window)
// ─────────────────────────────────────────────────────────────
window.tuttiStudenti      = offlineStudenti;
window.studenticonvittori = offlineStudenti.filter(s => {
    const n = parseInt(s.room, 10);
    return !isNaN(n) && n >= 101 && n <= 221;
});
window.ORARI_PP         = offlinePP;
window.ASSENTI_PERMESSO = offlineAssenti;

// ─────────────────────────────────────────────────────────────
// 2. UTILITY
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
// 3. CARICAMENTO DA FIREBASE
// ─────────────────────────────────────────────────────────────
async function caricaDatiFirebase() {
    try {
        console.log('🔥 Connessione a Firebase...');

        // 3a. Studenti
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

        // 3b. Filtro convittori
        window.studenticonvittori = window.tuttiStudenti.filter(s => {
            const n = parseInt(s.room, 10);
            return !isNaN(n) && n >= 101 && n <= 221;
        });
        console.log(`   🏠 Convittori: ${window.studenticonvittori.length}`);

        // 3c. Permessi PP (con NORMALIZZAZIONE)
        const ppSnap = await get(ref(db, 'permessi_pp'));
        if (ppSnap.exists()) {
            const ppData = ppSnap.val();
            if (ppData && Object.keys(ppData).length > 0) {
                window.ORARI_PP = normalizzaPP(ppData);
                console.log(`   🔑 Permessi PP: ${Object.keys(window.ORARI_PP).length} (normalizzati)`);
            }
        }

        // 3d. Assenti permesso
        const assSnap = await get(ref(db, 'assenti_permesso'));
        if (assSnap.exists()) {
            const assData = assSnap.val();
            if (assData && Object.keys(assData).length > 0) {
                window.ASSENTI_PERMESSO = assData;
                console.log(`   🚫 Assenti permesso: ${Object.keys(assData).length} giorni`);
            }
        }

        // 3e. Dati giornalieri
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

        // 3f. Ultimo reset
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
// 4. SALVATAGGIO SU FIREBASE
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
// 4b. SALVATAGGIO NOTE (realtime)
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
// 5. WRAPPER salvataggio locale → Firebase
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
// 6. ESPOSIZIONE GLOBALE
// ─────────────────────────────────────────────────────────────
window.caricaDatiFirebase = caricaDatiFirebase;
window.salvaDatiFirebase  = salvaDatiFirebase;
window.dataKeyFirebase    = dataKeyFirebase;
window.normalizzaPP       = normalizzaPP;

console.log('🔧 data-loader.js pronto');

// ─────────────────────────────────────────────────────────────
// 7. NOTE CONDIVISE (realtime)
// ─────────────────────────────────────────────────────────────

let noteListenerAttivo = false;
let noteRemoteInCorso = false;

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

        if (document.activeElement === ta) {
            if (ta.value === testo) return;
            return;
        }

        noteRemoteInCorso = true;
        ta.value = testo;
        noteRemoteInCorso = false;
    });

    // 2) Salva su Firebase con debounce
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
            }, 600);
        });

        ta.addEventListener('blur', async () => {
            try { await set(noteRef, ta.value); } catch (e) {}
        });
    }

    console.log('📝 Note condivise attive (realtime)');
}

window.attivaNoteCondivise = attivaNoteCondivise;

// ─────────────────────────────────────────────────────────────
// 8.  ULTIMO RESET / ULTIMA MODIFICA — realtime condiviso
// ─────────────────────────────────────────────────────────────

let unsubUltimoReset = null;
let unsubUltimaMod  = null;

async function pubblicaUltimoReset(timestampStringa) {
    try {
        await set(ref(db, 'convitto/ultimoReset'), timestampStringa);
        localStorage.setItem('dataUltimoReset', timestampStringa);
        if (typeof window.aggiornaInfoReset === 'function') window.aggiornaInfoReset();
    } catch (e) {
        console.error('❌ Errore pubblicazione ultimo reset:', e);
    }
}
window.pubblicaUltimoReset = pubblicaUltimoReset;

function attivaUltimoAggiornamento() {
    if (unsubUltimoReset) { unsubUltimoReset(); unsubUltimoReset = null; }
    if (unsubUltimaMod)  { unsubUltimaMod();  unsubUltimaMod  = null; }

    unsubUltimoReset = onValue(ref(db, 'convitto/ultimoReset'), (snap) => {
        const val = snap.exists() ? snap.val() : 'MAI';
        localStorage.setItem('dataUltimoReset', val);
        if (typeof window.aggiornaInfoReset === 'function') window.aggiornaInfoReset();
    });

    const chiave = dataKeyFirebase(new Date());
    unsubUltimaMod = onValue(ref(db, `convitto/${chiave}/lastUpdate`), (snap) => {
        if (!snap.exists()) {
            localStorage.setItem('dataUltimaModifica', 'MAI');
        } else {
            const d = new Date(snap.val());
            localStorage.setItem('dataUltimaModifica',
                d.toLocaleString('it-IT', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }));
        }
        if (typeof window.aggiornaInfoReset === 'function') window.aggiornaInfoReset();
    });

    console.log('🔔 Listener ultimo reset / ultima modifica attivi');
}
window.attivaUltimoAggiornamento = attivaUltimoAggiornamento;

// ─────────────────────────────────────────────────────────────
// 9. EXPORT (sempre per ultimo!)
// ─────────────────────────────────────────────────────────────
export {
    caricaDatiFirebase,
    salvaDatiFirebase,
    salvaNoteFirebase,
    dataKeyFirebase,
    normalizzaPP,
    attivaNoteCondivise,
    attivaUltimoAggiornamento,
    pubblicaUltimoReset
};
