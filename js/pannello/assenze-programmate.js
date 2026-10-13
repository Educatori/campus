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
    ricaricaListaStudenti();

    
    const box = document.getElementById("boxAggiungiAssenza");
    if (box) box.open = false;
}

function renderListaAssenze() {
    const container = document.getElementById("listaAssenze");
    if (!container) return;

    // ── Data di oggi in formato YYYY-MM-DD (immune ai fusi) ──
    const oggiYmd = ymdLocale(new Date());

    // ── Filtra: mostra solo periodi ancora attivi o futuri (al >= oggi) ──
    // NB: conserviamo l'indice originale (__idx) così rimuoviAssenza()
    //     agisce sulla posizione corretta nell'array di origine.
    const entries = Object.entries(assenzeProgrammate)
        .map(([cognome, periodi]) => {
            const validi = (periodi || [])
                .map((p, idx) => ({ dal: p.dal, al: p.al, __idx: idx }))
                .filter((p) => p.al >= oggiYmd);
            return [cognome, validi];
        })
        .filter(([, validi]) => validi.length > 0);

    // ── Stato vuoto ──
    if (entries.length === 0) {
        container.innerHTML = `
            <p style="font-size:0.82em;color:#666;font-style:italic;
                      text-align:center;padding:8px 0;">
                Nessuna assenza programmata attiva.
            </p>`;
        return;
    }

    // ── Render ──
    container.innerHTML = entries
        .map(([cognome, validi]) => {
            const cognomeJs = cognome.replace(/'/g, "\\'");
            return `
            <div style="margin-bottom:10px;">
                <b>${cognome}</b>
                ${validi
                    .map((p) => `
                    <div style="font-size:0.8em;">
                        ${p.dal} → ${p.al}
                        <button onclick="rimuoviAssenza('${cognomeJs}', ${p.__idx})">❌</button>
                    </div>
                `)
                    .join("")}
            </div>
        `;
        })
        .join("");
}

/**
 * Rimuove DEFINITIVAMENTE da assenzeProgrammate tutti i periodi
 * già terminati (al < oggi). Se un cognome resta senza periodi
 * attivi, viene eliminato del tutto.
 *
 * Propaga la modifica su localStorage + Firebase tramite
 * salvaAssenzeProgrammate() e ridisegna UI + card studenti.
 */
function pulisciAssenzeScadute() {
    const oggiYmd = ymdLocale(new Date());

    // ── 1. Conta cosa verrà rimosso (per il messaggio di conferma) ──
    let periodiRimossi = 0;
    let cognomiSvuotati = 0;

    Object.values(assenzeProgrammate).forEach((periodi) => {
        (periodi || []).forEach((p) => {
            if (p.al < oggiYmd) periodiRimossi++;
        });
    });

    if (periodiRimossi === 0) {
        alert("✅ Nessun periodo scaduto da rimuovere.");
        return;
    }

    // ── 2. Conferma esplicita (operazione irreversibile) ──
    const ok = confirm(
        `Verranno rimossi definitivamente ${periodiRimossi} period${periodiRimossi === 1 ? 'o' : 'i'} ` +
        `già terminat${periodiRimossi === 1 ? 'o' : 'i'}.\n\n` +
        `L'operazione è sincronizzata su Firebase e non è reversibile.\n\n` +
        `Procedere?`
    );
    if (!ok) return;

    // ── 3. Potatura ──
    Object.keys(assenzeProgrammate).forEach((cognome) => {
        const filtrati = (assenzeProgrammate[cognome] || [])
            .filter((p) => p.al >= oggiYmd);

        if (filtrati.length === 0) {
            delete assenzeProgrammate[cognome];
            cognomiSvuotati++;
        } else {
            assenzeProgrammate[cognome] = filtrati;
        }
    });

    // ── 4. Persistenza (localStorage + Firebase) + refresh UI ──
    salvaAssenzeProgrammate();
    renderListaAssenze();
    if (typeof ricaricaListaStudenti === "function") ricaricaListaStudenti();

    console.log(`🧹 Pulizia assenze: ${periodiRimossi} periodi rimossi, ` +
                `${cognomiSvuotati} cognomi eliminati.`);
}

function rimuoviAssenza(cognome, index) {
    assenzeProgrammate[cognome].splice(index, 1);
    if (assenzeProgrammate[cognome].length === 0) {
        delete assenzeProgrammate[cognome];
    }
   salvaAssenzeProgrammate();
    renderListaAssenze();
    ricaricaListaStudenti();
    // (la ❌ non chiude nulla, solo il box aggiungi si chiude)
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
