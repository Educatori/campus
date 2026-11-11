// data-loader.js
// ─────────────────────────────────────────────────────────────
// Carica i dati sensibili (studenti, permessi, assenze) da
// Firebase Realtime Database, con fallback ai dati locali.
// Salva automaticamente le modifiche giornaliere su Firebase.
//
// 📌 CONFIGURAZIONE STATICA (PAROLE_*, LAB_PRANZO, TURNI_DINNER,
//    LAB_DINNER, OVERRIDE_TURNI_DINNER_CLASSI, CALENDARIO_GRUPPI_DINNER)
//    Vive in js/core/config-static.js, caricato SEMPRE (online e offline).
//    NON va duplicata qui.
//
// ⚠️ OVERRIDE_TURNI_DINNER (cognomi → turno) NON è più qui:
//    arriva da offline/permessi_26_offline.js (offline) o da Firebase
//    (§3c-bis, online). Qui resta solo un fallback vuoto.
// ─────────────────────────────────────────────────────────────

import { db, ref, get, set, onValue } from './firebase-campus_hub-config.js';

// ─────────────────────────────────────────────────────────────
// 0a. FALLBACK MINIMI
//     Solo per i dati che possono mancare in ENTRAMBE le fonti
//     (offline e Firebase). La configurazione statica NON va qui.
// ─────────────────────────────────────────────────────────────
window.OVERRIDE_TURNI_DINNER = window.OVERRIDE_TURNI_DINNER || {};

// ─────────────────────────────────────────────────────────────
// 0b. BACKUP dei dati OFF
// ─────────────────────────────────────────────────────────────
const offlineStudenti = Array.isArray(window.tuttiStudenti) ? window.tuttiStudenti.slice() : [];

const offlinePP      = window.ORARI_PP || {};
const offlineAssenti = window.ASSENTI_PERMESSO || {};

console.log(`📦 Backup OFFLINE: ${offlineStudenti.length} studenti, ${Object.keys(offlinePP).length} PP`);


// ─────────────────────────────────────────────────────────────
// 1. INIZIALIZZAZIONE con OFF (se presente)
// ─────────────────────────────────────────────────────────────
window.tuttiStudenti      = offlineStudenti;
window.studenticonvittori = window.filtraConvittori(offlineStudenti);
// ORARI_PP e ASSENTI_PERMESSO: già su window dall'offline file.
// NON riassegnare: window.ORARI_PP === ORARI_PP bare (stessa reference).

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

    // 3b. Filtro convittori (funzione condivisa)
        window.studenticonvittori = window.filtraConvittori(window.tuttiStudenti);
        console.log(`   🏠 Convittori: ${window.studenticonvittori.length}`);

    // 3c. Permessi PP (con NORMALIZZAZIONE)
        const ppSnap = await get(ref(db, 'permessi_pp'));
        if (ppSnap.exists()) {
            const ppData = ppSnap.val();
            if (ppData && Object.keys(ppData).length > 0) {
                const normalizzati = normalizzaPP(ppData);
                
                // MUTIAMO l'oggetto esistente invece di riassegnarlo.
                // In questo modo tutti i file (come side-panel.js) 
                // che puntano a window.ORARI_PP vedranno i nuovi dati.
                if (window.ORARI_PP && typeof window.ORARI_PP === 'object') {
                    Object.keys(window.ORARI_PP).forEach(k => delete window.ORARI_PP[k]);
                    Object.assign(window.ORARI_PP, normalizzati);
                } else {
                    window.ORARI_PP = normalizzati;
                }
                
                console.log(`   🔑 Permessi PP: ${Object.keys(window.ORARI_PP).length} (normalizzati)`);
            }
        }

    // 3c-bis. Override turni dinner (cognomi → turno per giorno)
    // Mutazione IN-PLACE: OVERRIDE_TURNI_DINNER è usato bare da turni.js,
    // quindi deve restare la stessa reference del const del file offline.
        const ovSnap = await get(ref(db, 'overrides_turni_dinner'));
        if (ovSnap.exists()) {
            const ovData = ovSnap.val();
            if (ovData && Object.keys(ovData).length > 0) {
                if (window.OVERRIDE_TURNI_DINNER && typeof window.OVERRIDE_TURNI_DINNER === 'object') {
                    Object.keys(window.OVERRIDE_TURNI_DINNER).forEach(k => delete window.OVERRIDE_TURNI_DINNER[k]);
                    Object.assign(window.OVERRIDE_TURNI_DINNER, ovData);
                } else {
                    window.OVERRIDE_TURNI_DINNER = ovData;
                }
                console.log(`   🍽 Override turni: ${Object.keys(window.OVERRIDE_TURNI_DINNER).length} studenti`);
            }
        } else {
            console.warn('   ⚠️ Nodo "overrides_turni_dinner" assente → override individuali disattivati');
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
        let datiLS = {};
        if (giornoSnap.exists()) {
            const nodo = giornoSnap.val();
            const datiGiorno = nodo.dati || {};
            console.log(`   💾 Dati giornalieri (${chiaveOggi}): ${Object.keys(datiGiorno).length} studenti`);

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

    // 3e-bis. SNAPSHOT DATATO DELLO STATO DEL GIORNO
    // Serve a far ripartire campus_hub.html da qui se manca la rete
    // dopo le 11:00 (i dati del sito esterno sono già "congelati").
        try {
            const snapshot = {
                data:            chiaveOggi,
                orariPP:         window.ORARI_PP || {},
                assentiPermesso: window.ASSENTI_PERMESSO || {},
                overrideTurni:   window.OVERRIDE_TURNI_DINNER || {},
                studenti:        window.tuttiStudenti || [],
                datiGiorno:      datiLS
            };
            localStorage.setItem('snapshotGiorno', JSON.stringify(snapshot));
            console.log(`💾 Snapshot salvato per ${chiaveOggi}`);
        } catch (e) {
            console.warn('⚠️ Impossibile salvare snapshot:', e);
        }

    // 3f. Ultimo reset
        const resetSnap = await get(ref(db, 'convitto/ultimoReset'));
        if (resetSnap.exists()) {
            localStorage.setItem('dataUltimoReset', resetSnap.val());
        }

        // Forza il ridisegno della Side Panel con i dati appena scaricati da Firebase
        if (typeof window.popolaListaPermessi === 'function') {
            window.popolaListaPermessi();
            console.log("🔄 Side Panel aggiornata con i permessi da Firebase");
        }

        // Forza il ridisegno della lista con i 121 studenti appena scaricati.
        setTimeout(() => {
            if (typeof window.ricaricaListaStudenti === 'function') {
                window.ricaricaListaStudenti();
                console.log("🔄 Lista studenti forzata al ridisegno con successo!");
            }
        }, 500);

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
