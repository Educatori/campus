/**
 * js/pannello/assenze-programmate.js
 * ─────────────────────────────────────────────────────────────
 * Gestione assenze programmate (side panel):
 *   • assenzeProgrammate                      → stato globale
 *   • salvaAssenzeProgrammate()               → localStorage + Firebase
 *   • caricaAssenzeProgrammate()              → legge da localStorage
 *   • window.setAssenzeProgrammateFromRemote  → aggiorna da onValue()
 *   • ymdLocale()                             → date YYYY-MM-DD immune ai fusi
 *   • isAssenteProgrammato()                  → check periodo
 *   • aggiungiAssenza()                       → aggiunge periodo
 *   • renderListaAssenze()                    → lista nel side panel
 *   • rimuoviAssenza()                        → rimuove periodo
 *   • popolaSelectStudenti()                  → <select> studenti
 *   • popolaSelectClassi()                    → <select> classi
 *
 * Dipendenze runtime:
 *   - studenticonvittori                         → data-loader.js
 *   - ricaricaListaStudenti()                    → campus_hub-script.js
 *   - window.APP_MODE, window.salvaAssenzeProgrammateFirebase
 *
 * ⚠️ Caricare DOPO core/persistenza.js e PRIMA di campus_hub-script.js.
 * ─────────────────────────────────────────────────────────────
 */

// Stato globale delle assenze programmate
let assenzeProgrammate = {};

// ─────────────────────────────────────────────────────────────
// SALVA / CARICA
// ─────────────────────────────────────────────────────────────
function salvaAssenzeProgrammate() {
    // 1. Backup locale (sempre, anche offline)
    localStorage.setItem("assenzeProgrammate", JSON.stringify(assenzeProgrammate));

    // 2. Sync su Firebase (solo in modalità online)
    if (window.APP_MODE === 'online' &&
        typeof window.salvaAssenzeProgrammateFirebase === 'function') {
        window.salvaAssenzeProgrammateFirebase(assenzeProgrammate)
            .catch((err) => console.error('❌ Sync assenze programmate fallita:', err));
    }
}

function caricaAssenzeProgrammate() {
    const saved = localStorage.getItem("assenzeProgrammate");
    assenzeProgrammate = saved ? JSON.parse(saved) : {};
}

/**
 * Riceve i dati remoti di assenze programmate da Firebase
 * e li applica all'interfaccia. Chiamata da onValue().
 */
window.setAssenzeProgrammateFromRemote = function(val) {
    assenzeProgrammate = val || {};

    // Aggiorna la cache locale così sopravvive a reload offline
    localStorage.setItem("assenzeProgrammate", JSON.stringify(assenzeProgrammate));

    // Ridisegna pannello + card
    if (typeof renderListaAssenze === "function") renderListaAssenze();
    if (typeof ricaricaListaStudenti === "function") ricaricaListaStudenti();

    console.log(`☁️ Assenze programmate sincronizzate (${Object.keys(assenzeProgrammate).length} studenti)`);
};

// ─────────────────────────────────────────────────────────────
// HELPER DATA (immune ai fusi orari)
// ─────────────────────────────────────────────────────────────
function ymdLocale(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const g = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${g}`;
}

/**
 * Verifica se uno studente è assente programmato per la data indicata.
 * Confronto lessicografico su stringhe YYYY-MM-DD (equivalente a
 * confronto date, ma immune agli shift di fuso orario).
 */
function isAssenteProgrammato(cognome, data) {
    const lista = assenzeProgrammate[cognome.toUpperCase()];
    if (!lista) return false;

    const oggiYmd = ymdLocale(data);

    return lista.some((periodo) => {
        return oggiYmd >= periodo.dal && oggiYmd <= periodo.al;
    });
}

// ─────────────────────────────────────────────────────────────
// AGGIUNGI / RIMUOVI
// ─────────────────────────────────────────────────────────────
function aggiungiAssenza() {
    const cognomeSel = document.getElementById("selectStudente").value;
    const classeSel  = document.getElementById("selectClasse").value;
    const dal        = document.getElementById("dataDal").value;
    const al         = document.getElementById("dataAl").value;

    if (!dal || !al) return alert("Seleziona entrambe le date");

    let studentiDaAggiornare = [];

    if (classeSel) {
        studentiDaAggiornare = studenticonvittori
            .filter((s) => s.classe === classeSel)
            .map((s) => s.cognome.toUpperCase());
    } else if (cognomeSel) {
        studentiDaAggiornare = [cognomeSel.toUpperCase()];
    } else {
        return alert("Seleziona uno studente o una classe");
    }

    studentiDaAggiornare.forEach((cognome) => {
        if (!assenzeProgrammate[cognome]) {
            assenzeProgrammate[cognome] = [];
        }
        assenzeProgrammate[cognome].push({ dal, al });
    });

    salvaAssenzeProgrammate();
    renderListaAssenze();
    ricaricaListaStudenti();   // applica subito il nuovo stato
}

function renderListaAssenze() {
    const container = document.getElementById("listaAssenze");
    if (!container) return;

    container.innerHTML = Object.entries(assenzeProgrammate)
        .map(([cognome, periodi]) => {
            // Escapa l'apostrofo per l'uso dentro onclick="...('...')"
            const cognomeJs = cognome.replace(/'/g, "\\'");
            return `
            <div style="margin-bottom:10px;">
                <b>${cognome}</b>
                ${periodi
                    .map(
                        (p, i) => `
                    <div style="font-size:0.8em;">
                        ${p.dal} → ${p.al}
                        <button onclick="rimuoviAssenza('${cognomeJs}', ${i})">❌</button>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
        })
        .join("");
}

function rimuoviAssenza(cognome, index) {
    assenzeProgrammate[cognome].splice(index, 1);
    if (assenzeProgrammate[cognome].length === 0) {
        delete assenzeProgrammate[cognome];
    }
    salvaAssenzeProgrammate();
    renderListaAssenze();
    ricaricaListaStudenti();   // rimuove subito lo stato assente
}

// ─────────────────────────────────────────────────────────────
// POPOLA <select> DEL SIDE PANEL
// ─────────────────────────────────────────────────────────────
function popolaSelectStudenti() {
    const sel = document.getElementById("selectStudente");
    if (!sel) return;

    const gruppi = {};
    studenticonvittori.forEach((s) => {
        if (!gruppi[s.classe]) gruppi[s.classe] = [];
        gruppi[s.classe].push(s);
    });

    let html = `<option value="">-- Seleziona Nome --</option>`;
    Object.keys(gruppi)
        .sort()
        .forEach((classe) => {
            html += `<optgroup label="${classe}">`;
            gruppi[classe].forEach((s) => {
                html += `<option value="${s.cognome}">${s.cognome} ${s.nome}</option>`;
            });
            html += `</optgroup>`;
        });
    sel.innerHTML = html;
}

function popolaSelectClassi() {
    const sel = document.getElementById("selectClasse");
    if (!sel) return;
    const classiUniche = [...new Set(studenticonvittori.map((s) => s.classe))].sort();
    sel.innerHTML =
        `<option value="">-- Seleziona Classe --</option>` +
        classiUniche.map((c) => `<option value="${c}">${c}</option>`).join("");
}
