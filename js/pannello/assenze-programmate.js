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

// Cache interna per la ricerca nel select
let _studentiOrdinati = [];

/**
 * Apre/chiude la sotto-scheda "Aggiungi" e ruota l'icona.
 */
function toggleBoxAggiungi() {
    const box = document.getElementById("boxAggiungiAssenza");
    const btn = document.getElementById("btnApriAggiungi");
    if (!box || !btn) return;

    const isOpen = box.style.display !== "none";
    box.style.display = isOpen ? "none" : "block";
    btn.classList.toggle("aperto", !isOpen);
    btn.textContent = isOpen ? "➕ Aggiungi" : "✖ Chiudi";

    if (!isOpen) {
        // focus sulla ricerca all'apertura
        const input = document.getElementById("cercaStudente");
        if (input) setTimeout(() => input.focus(), 50);
    }
}

/**
 * Filtra le opzioni del <select> studenti in base al testo digitato.
 * Mantiene gli optgroup visibili solo se contengono almeno un match.
 */
function filtraSelectStudenti(query) {
    const sel = document.getElementById("selectStudente");
    if (!sel) return;

    const q = (query || "").trim().toLowerCase();

    // Se la ricerca è vuota → mostra la lista completa
    if (!q) {
        popolaSelectStudenti();
        return;
    }

    // Filtra l'array di appoggio
    const match = _studentiOrdinati.filter((s) => {
        const cognome = (s.cognome || "").toLowerCase();
        const nome    = (s.nome || "").toLowerCase();
        const classe  = (s.classe || "").toLowerCase();
        return cognome.includes(q) || nome.includes(q) || classe.includes(q);
    });

    // Raggruppa per classe
    const gruppi = {};
    match.forEach((s) => {
        if (!gruppi[s.classe]) gruppi[s.classe] = [];
        gruppi[s.classe].push(s);
    });

    let html = `<option value="">-- Seleziona Nome (${match.length}) --</option>`;
    Object.keys(gruppi).sort().forEach((classe) => {
        html += `<optgroup label="${classe}">`;
        gruppi[classe].forEach((s) => {
            html += `<option value="${s.cognome}">${s.cognome} ${s.nome}</option>`;
        });
        html += `</optgroup>`;
    });

    sel.innerHTML = html;

    // Se c'è un match esatto unico, selezionalo automaticamente
    if (match.length === 1) {
        sel.value = match[0].cognome;
    }
}
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

    // Validazione: se è stata scelta una classe, ignora lo studente
    // (e viceversa) per evitare inserimenti "doppi" ambigui.
    if (classeSel && cognomeSel) {
        const ok = confirm(
            `Hai selezionato sia uno studente (${cognomeSel}) sia una classe (${classeSel}).\n\n` +
            `Verrà applicata SOLO la classe. Continuare?`
        );
        if (!ok) return;
    }

    if (!dal || !al) return alert("Seleziona entrambe le date");

    // ── Controllo coerenza date ──
    if (dal > al) {
        return alert("La data 'dal' non può essere successiva alla data 'al'");
    }

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

    if (studentiDaAggiornare.length === 0) {
        return alert("Nessuno studente trovato per la selezione effettuata");
    }

    // ── Evita duplicati esatti (stesso cognome + stesso periodo) ──
    let aggiunti = 0;
    let duplicati = 0;

    studentiDaAggiornare.forEach((cognome) => {
        if (!assenzeProgrammate[cognome]) {
            assenzeProgrammate[cognome] = [];
        }

        const esisteGia = assenzeProgrammate[cognome].some(
            (p) => p.dal === dal && p.al === al
        );

        if (esisteGia) {
            duplicati++;
            return;
        }

        assenzeProgrammate[cognome].push({ dal, al });
        aggiunti++;
    });

    // Se non è stato aggiunto nulla, avvisa e non chiudere
    if (aggiunti === 0) {
        return alert(
            `Nessuna nuova assenza aggiunta: ${duplicati} period${duplicati === 1 ? 'o' : 'i'} ` +
            `già present${duplicati === 1 ? 'e' : 'i'}.`
        );
    }

    salvaAssenzeProgrammate();
    renderListaAssenze();
    ricaricaListaStudenti();

    // ── CHIUSURA SOTTO-SCHEDA + RESET RICERCA ──
    const box        = document.getElementById("boxAggiungiAssenza");
    const btn        = document.getElementById("btnApriAggiungi");
    const inputCerca = document.getElementById("cercaStudente");
    const selStud    = document.getElementById("selectStudente");
    const selClasse  = document.getElementById("selectClasse");

    if (inputCerca) inputCerca.value = "";
    if (selStud)    { selStud.value = ""; popolaSelectStudenti(); }
    if (selClasse)  selClasse.value = "";

    if (box) box.style.display = "none";
    if (btn) {
        btn.textContent = "Aggiungi";
        btn.classList.remove("aperto");
    }

    // Feedback opzionale
    console.log(`✅ Assenze aggiunte: ${aggiunti} student${aggiunti === 1 ? 'o' : 'i'}` +
                (duplicati ? ` (${duplicati} duplicat${duplicati === 1 ? 'o' : 'i'} ignorat${duplicati === 1 ? 'o' : 'i'})` : ""));
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
// AUTOCOMPLETAMENTO STUDENTI
// ─────────────────────────────────────────────────────────────

// Svuota la cache e la select quando si apre il pannello
function popolaSelectStudenti() {
    // Ora non c'è più una select, ma un input hidden + div suggerimenti.
    // La cache _studentiOrdinati serve solo per i suggerimenti.
    if (typeof studenticonvittori === "undefined") return;
    
    _studentiOrdinati = [...studenticonvittori].sort((a, b) => {
        const ca = (a.cognome || "").localeCompare(b.cognome || "", "it");
        if (ca !== 0) return ca;
        return (a.nome || "").localeCompare(b.nome || "", "it");
    });
}

// Funzione chiamata oninput sull'input "cercaStudente"
function suggerisciStudenti(query) {
    const listDiv = document.getElementById("listaSuggerimentiStudenti");
    const hiddenInput = document.getElementById("selectStudente");
    
    // Se scrive, resettiamo il valore selezionato in precedenza
    if (hiddenInput) hiddenInput.value = "";

    const q = (query || "").trim().toLowerCase();
    if (!q) {
        listDiv.style.display = "none";
        return;
    }

    const match = _studentiOrdinati.filter(s => {
        const cognome = (s.cognome || "").toLowerCase();
        const nome = (s.nome || "").toLowerCase();
        const classe = (s.classe || "").toLowerCase();
        return cognome.includes(q) || nome.includes(q) || classe.includes(q);
    });

    if (match.length === 0) {
        listDiv.innerHTML = `<div style="padding:8px; font-size:0.8rem; color:var(--text-muted);">Nessun risultato</div>`;
        listDiv.style.display = "block";
        return;
    }

    // Limita a max 50 risultati per non appesantire il DOM
    const html = match.slice(0, 50).map(s => {
        return `<div onclick="selezionaStudente('${s.cognome.replace(/'/g, "\\'")}')" 
                     style="padding:8px 12px; cursor:pointer; font-size:0.82rem; border-bottom:1px solid var(--border);"
                     onmouseover="this.style.background='var(--bg-3)'" 
                     onmouseout="this.style.background='transparent'">
                    <b>${s.cognome}</b> ${s.nome} <span style="color:var(--text-muted); font-size:0.75rem;">(${s.classe})</span>
                </div>`;
    }).join("");

    listDiv.innerHTML = html;
    listDiv.style.display = "block";
}

// Chiamata quando si clicca su un suggerimento
function selezionaStudente(cognome) {
    const input = document.getElementById("cercaStudente");
    const hiddenInput = document.getElementById("selectStudente");
    const listDiv = document.getElementById("listaSuggerimentiStudenti");
    
    // Trova lo studente per mostrare Nome Cognome
    const studente = studenticonvittori.find(s => s.cognome.toUpperCase() === cognome.toUpperCase());
    
    if (studente) {
        input.value = `${studente.cognome} ${studente.nome}`;
        hiddenInput.value = studente.cognome.toUpperCase(); // es. "ROSSI"
    }
    
    listDiv.style.display = "none";
    
    // Resetta la classe selezionata per evitare conflitti
    const selClasse = document.getElementById("selectClasse");
    if (selClasse) selClasse.value = "";
}

// Chiude la lista suggerimenti se clicco fuori
document.addEventListener('click', function(e) {
    const listDiv = document.getElementById("listaSuggerimentiStudenti");
    const input = document.getElementById("cercaStudente");
    if (listDiv && input && !input.contains(e.target) && !listDiv.contains(e.target)) {
        listDiv.style.display = "none";
    }
});
