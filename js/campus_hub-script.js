/**
 * CAMPUS_HUB-SCRIPT.JS - Versione su Firebase 
 nota bene:
 // --- ROOMING list
function generaPopUpStampaRooming() {
    // 1. DATI EXTRA E VERIFICA DATABASE contiene le forestrie che potrebbero cambiare

 */

// --- VARIABILE PER ORDINAMENTO LISTA ---
let ordineAlfabetico = false; // false = per room (default), true = per cognome
/* ─────────────────────────────────────────────────────────────
   COSTANTI GLOBALI — parole chiave per dedurre stati dal PP
   ───────────────────────────────────────────────────────────── */
const PAROLE_ASSENZA = [
    "sosp", "sospeso", "sospensione",
    "gita", "viaggio", "vacanza",
    "assente", "assenza",
    "malattia", "casa", "famiglia",
    "ricovero", "ospedale",
    "stage", "alternanza"
];

const PAROLE_NO_RIENTRO = [
    "no", "non", "niente", "noreturn",
    "tardi", "ritardo", "ritardato",
    "dopo", "post"
];
/**
 * Alterna l'ordinamento della lista studenti tra "per room" e "alfabetico per cognome"
 */
function toggleOrdineLista() {
    ordineAlfabetico = !ordineAlfabetico;
    
    // Aggiorna l'aspetto del bottone
    const btn = document.getElementById("btnOrdineAlfabetico");
    if (btn) {
        if (ordineAlfabetico) {
            btn.style.background = "var(--accent)";
            btn.style.color = "white";
            btn.textContent = "🔤 A-Z ✓";
        } else {
            btn.style.background = "var(--surface)";
            btn.style.color = "var(--accent)";
            btn.textContent = "🔤 A-Z";
        }
    }
    
    // ← QUI: salva la preferenza PRIMA di ricaricare la lista
    localStorage.setItem("ordineAlfabetico", ordineAlfabetico);
    
    ricaricaListaStudenti();

}

let cambiTurnoManuali = {};
let assenzeProgrammate = {};

// --- VARIABILE PER DATA SIMULATA ---
let dataSimulata = null; // null = usa la data reale

/**
 * Restituisce la data corrente (reale o simulata)
 */
function getDataCorrente() {
    if (dataSimulata) {
        return new Date(dataSimulata);
    }
    return new Date();
}

/**
 * Simula una data specifica
 * @param {string} dataStr - Data in formato YYYY-MM-DD
 */
function simulaData(dataStr) {
    if (!dataStr) {
        resetSimulazione();
        return;
    }

    // Parsing LOCALE per evitare shift di fuso orario
    const [y, m, d] = dataStr.split('-').map(Number);
    const data = new Date(y, m - 1, d);

    if (isNaN(data.getTime())) {
        alert('Data non valida!');
        return;
    }

    dataSimulata = data;

    aggiornaDataHeader();   // solo data, niente più emoji inline
    aggiornaSimBadge();     // badge dedicato
    ricaricaListaStudenti();
    aggiornaAltezzaOverlay(); // ricalcola overlay se il pannello è aperto

    console.log(`📅 Data simulata: ${data.toLocaleDateString('it-IT')}`);
}
   
function aggiornaSimBadge() {
    const badge = document.getElementById('simBadge');
    if (!badge) return;
    if (dataSimulata) {
        badge.textContent = '🔮 MODALITÀ SIMULAZIONE — data virtuale: ' +
            dataSimulata.toLocaleDateString('it-IT', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
        badge.classList.add('visible');
    } else {
        badge.textContent = '';
        badge.classList.remove('visible');
    }
}

function aggiornaDataHeader() {
    const dateEl = document.getElementById("todayDate");
    if (!dateEl) return;
    const d = getDataCorrente();
    dateEl.innerText = d.toLocaleDateString("it-IT", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}



 /**
 * Popola il menu a tendina delle classi
 */
function popolaSelectClassiFiltro() {
    const sel = document.getElementById("classeFilter");
    if (!sel) {
        console.warn("⚠️ classeFilter non trovato nel DOM");
        return;
    }
    
    if (typeof studenticonvittori === "undefined" || !Array.isArray(studenticonvittori)) {
        console.warn("⚠️ studenticonvittori non è ancora caricato");
        return;
    }
    
    const classiUniche = [...new Set(
        studenticonvittori
            .map(s => s.classe)
            .filter(c => c && c.trim() !== "")
    )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    
    console.log("📋 Classi trovate per filtro:", classiUniche);
    
    sel.innerHTML = '<option value="">Tutte</option>' + 
        classiUniche.map(c => `<option value="${c}">${c}</option>`).join("");
}

/**
 * Filtra gli studenti per classe
 * @param {string} classe - La classe da filtrare (vuoto = tutte)
 */
function filtraPerClasse(classe) {
    // Resetta gli altri filtri quando si usa il filtro classe
    const roomInput = document.getElementById("roomInput");
    const searchInput = document.getElementById("search");
    
    if (roomInput) roomInput.value = "";
    if (searchInput) searchInput.value = "";
    
    document.querySelectorAll(".student-row").forEach((r) => {
        if (!classe) {
            r.style.display = "block";
        } else {
            r.style.display = r.dataset.classe === classe ? "block" : "none";
        }
    });
}
       
       
/**
 * Resetta la simulazione e torna alla data reale
 */
function resetSimulazione() {
    dataSimulata = null;

    const dateInput = document.getElementById("simulateDate");
    if (dateInput) dateInput.value = '';

    aggiornaDataHeader();
    aggiornaSimBadge();
    ricaricaListaStudenti();
    aggiornaAltezzaOverlay();

    console.log('📅 Data reale ripristinata');
}

/**
 * Ricarica la lista studenti (utile dopo cambio data)
 */
function ricaricaListaStudenti() {
    const lista = document.getElementById("listaStudenti");
    if (!lista) return;
    lista.innerHTML = "";
    // Reset filtro classe
    const classeFilter = document.getElementById("classeFilter");
    if (classeFilter) classeFilter.value = "";

    const data = getDataCorrente();
    const studenti = [...studenticonvittori];

    // ── Ripristina preferenza ordinamento da localStorage ──
    if (localStorage.getItem("ordineAlfabetico") === "true") {
        ordineAlfabetico = true;
        const btn = document.getElementById("btnOrdineAlfabetico");
        if (btn) {
            btn.style.background = "var(--accent)";
            btn.style.color = "white";
            btn.textContent = "🔤 A-Z ✓";
        }
    }

    // ── Ordinamento condizionale (per room o alfabetico) ──
    studenti.sort((a, b) => {
        if (ordineAlfabetico) {
            // Alfabetico per cognome
            const c = (a.cognome || "").localeCompare(b.cognome || "", "it", { sensitivity: "base" });
            if (c !== 0) return c;
            return (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
        } else {
            // Per room (default)
            return a.room.localeCompare(b.room, undefined, { numeric: true });
        }
    });

    studenti.forEach((s) => {
        const r = document.createElement("div");
        r.className = "student-row";

        const isLab = isStudenteInLabOggi(s.classe, s.gruppo, data);
        if (isLab) r.classList.add("highlight-lab");

        r.dataset.cognome = s.cognome;
        r.dataset.nomeCompleto = s.cognome + " " + s.nome;
        r.dataset.classe = s.classe;
        r.dataset.room = s.room;
        r.dataset.gruppo = s.gruppo || "";
        r.dataset.percorso = s.percorso || "";
        r.dataset.dinnerno = "0";

        // ── Calcola turno cena dello studente ──
        const turno = turnoStudente(s.classe, s.cognome);

        // ── Calcola stato PP (assente/dinner dedotti dalle parole-chiave) ──
        const statoPP = analizzaPP(s.cognome, data.getDay());

        // ── Badge turno cena (🍽 18:30 / 19:15) ──
        const turnoHtml = `<span class="st-turno t${turno}">🍽 ${turno === 1 ? '18:30' : '19:15'}</span>`;

        // ── Badge PP bloccato (🔒 SOSP / GITA / ecc.) ──
        const ppBadge = (statoPP.assente || statoPP.dinnerNo)
            ? `<span class="pp-badge">🔒 ${statoPP.etichetta || 'PP'}</span>`
            : "";

        r.innerHTML = `
            <div class="st-header">
                <div>
                    <span class="room-badge">${s.room}</span>
                    <button class="btn-switch" onclick="toggleSwitchTurno(this)" title="Cambia turno">⇄</button>
                    ${ppBadge}
                </div>
                ${turnoHtml}
            </div>
            <div class="st-name-line">
                <b>${s.cognome}</b> ${s.nome}
            </div>
            <div class="st-meta">
                ${s.classe}${s.percorso ? ' • ' + s.percorso : ''}${s.gruppo ? ' • ' + s.gruppo : ''}${isLab ? ' • <span class="lab-badge">LAB</span>' : ''}
            </div>
            <div class="inputs">
                <input type="text" placeholder="ESCE" class="in-u" onchange="this.value=normalizzaOrario(this.value); salvaDatiLocale();">
                <input type="text" placeholder="ENTRA" class="in-i" oninput="controllaDinnerAutomatico(this.closest('.student-row'))" onchange="this.value=normalizzaOrario(this.value); salvaDatiLocale();">
            </div>
            <div class="btns">
                <button class="btn-ass" onclick="toggleAssenza(this)">ASSENTE</button>
                <button class="btn-din" onclick="toggleDinnerNo(this)">NON CENA</button>
            </div>`;

        // ── Assenza programmata (dal side panel) ──
        if (isAssenteProgrammato(s.cognome, data)) {
            r.classList.add("assente");
            r.dataset.dinnerno = "1";
        }

        // ── Assenza/dinner dedotti dal PP ──
        if (statoPP.assente) {
            r.classList.add("assente");
            r.classList.add("dinner-no");
            r.classList.add("pp-locked");   // ← marca la card come bloccata da PP
            r.dataset.dinnerno = "1";
        } else if (statoPP.dinnerNo) {
            r.classList.add("dinner-no");
            r.classList.add("pp-locked");   // ← marca la card come bloccata da PP
            r.dataset.dinnerno = "1";
        }

        lista.appendChild(r);
    });

    caricaDatiLocale();
}

// --- 1. INIZIALIZZAZIONE ---
function init() {
    // In offline rileggi eventuali permessi importati via JSON
    if (window.APP_MODE === 'offline') {
        const ppLocali = localStorage.getItem("ORARI_PP");
        if (ppLocali) {
            try { window.ORARI_PP = JSON.parse(ppLocali); }
            catch (e) { console.warn("ORARI_PP locale non valido", e); }
        }
    }
    
    caricaAssenzeProgrammate();

aggiornaDataHeader();
aggiornaSimBadge();

    updateClock();
    let clockInterval = null;
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);

    ricaricaListaStudenti();
    
    // ← AGGIUNGI QUESTA RIGA
    popolaSelectClassiFiltro();
    
    mostraDataReset();
}

function haDirittoAlBus(s) {
    if (!s) return false;
    const classe = s.classe.toUpperCase();
    return !["2A", "2B", "4C"].includes(classe) && !classe.includes("P");
}

// --- 2. LOGICA TURNI ---
/**
 * Restituisce il turno cena effettivo dello studente, applicando in ordine:
 *   1. Turno base dalla classe (TURNI_DINNER)
 *   2. Override per classe (OVERRIDE_TURNI_DINNER_CLASSI)
 *   3. Override individuale (OVERRIDE_TURNI_DINNER)
 */
function turnoStudente(classe, cognome) {
    const oggi = getDataCorrente();
    const giornoSettimana = oggi.getDay();
    const cgn = (cognome || "").toUpperCase();

    // 1. Turno base dalla classe
    let turno = TURNI_DINNER[1].includes(classe) ? 1 : 2;

    // 2. Override per classe
    if (typeof OVERRIDE_TURNI_DINNER_CLASSI !== "undefined" &&
        OVERRIDE_TURNI_DINNER_CLASSI[classe] &&
        OVERRIDE_TURNI_DINNER_CLASSI[classe][giornoSettimana] !== undefined) {
        turno = OVERRIDE_TURNI_DINNER_CLASSI[classe][giornoSettimana];
    }

    // 3. Override individuale (ha precedenza)
    if (OVERRIDE_TURNI_DINNER[cgn] &&
        OVERRIDE_TURNI_DINNER[cgn][giornoSettimana] !== undefined) {
        turno = OVERRIDE_TURNI_DINNER[cgn][giornoSettimana];
    }

    return turno;
}

/**
 * Costruisce gli array di studenti per turno (con override applicati).
 * Ritorna { turno1: [...], turno2: [...] } di oggetti studente originali.
 */
function costruisciTurni() {
    const turno1 = [];
    const turno2 = [];

    if (typeof studenticonvittori === "undefined") return { turno1, turno2 };

    studenticonvittori.forEach((s) => {
        if (!s.cognome) return;
        const t = turnoStudente(s.classe, s.cognome);
        if (t === 1) turno1.push(s);
        else turno2.push(s);
    });

    return { turno1, turno2 };
}

function setTurno(turno) {
    document.querySelectorAll(".student-row").forEach((r) => {
        const classe = r.dataset.classe;
        const cognome = r.dataset.cognome;
        const turnoEffettivo = turnoStudente(classe, cognome);
        r.style.display = (turnoEffettivo === turno) ? "block" : "none";
    });
}

/**
 * Filtra e mostra solo gli studenti ASSENTI
 */
function filtraAssenti() {
    // Reset di eventuali filtri attivi
    const searchInput = document.getElementById("search");
    if (searchInput) searchInput.value = "";
    const roomInput = document.getElementById("roomInput");
    if (roomInput) roomInput.value = "";
    
    // Rimuovi evidenziazione dai tasti
    rimuoviEvidenziazioneTasti();
    
    // Evidenzia il tasto ASSENTI
    event.currentTarget.classList.add("tasto-attivo");
    
    let count = 0;
    document.querySelectorAll(".student-row").forEach((r) => {
        if (r.classList.contains("assente")) {
            r.style.display = "block";
            count++;
        } else {
            r.style.display = "none";
        }
    });
    
    // Feedback visivo se non ci sono assenti
    mostraFeedbackFiltro("ASSENTI", count);
}

/**
 * Filtra e mostra solo gli studenti con NON CENA attivo
 */
function filtraNoCena() {
    // Reset di eventuali filtri attivi
    const searchInput = document.getElementById("search");
    if (searchInput) searchInput.value = "";
    const roomInput = document.getElementById("roomInput");
    if (roomInput) roomInput.value = "";
    
    // Rimuovi evidenziazione dai tasti
    rimuoviEvidenziazioneTasti();
    
    // Evidenzia il tasto NO CENE
    event.currentTarget.classList.add("tasto-attivo");
    
    let count = 0;
    document.querySelectorAll(".student-row").forEach((r) => {
        const isNoCena = r.dataset.dinnerno === "1" || r.classList.contains("dinner-no");
        if (isNoCena) {
            r.style.display = "block";
            count++;
        } else {
            r.style.display = "none";
        }
    });
    
    // Feedback visivo se non ci sono no cena
    mostraFeedbackFiltro("NON CENA", count);
}

/**
 * Mostra un piccolo feedback con il numero di risultati
 */
function mostraFeedbackFiltro(tipo, count) {
    // Rimuovi feedback precedente
    const old = document.getElementById("filtroFeedback");
    if (old) old.remove();
    
    const feedback = document.createElement("div");
    feedback.id = "filtroFeedback";
    feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface);
        color: var(--text);
        padding: 10px 20px;
        border-radius: 30px;
        border: 1px solid var(--border-2);
        font-family: var(--font);
        font-size: 0.85rem;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    feedback.innerHTML = `🔍 <b>${tipo}</b>: ${count} student${count === 1 ? 'e' : 'i'}`;
    document.body.appendChild(feedback);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        if (feedback.parentNode) feedback.remove();
    }, 3000);
}

/**
 * Rimuove l'evidenziazione da tutti i tasti filtro
 */
function rimuoviEvidenziazioneTasti() {
    document.querySelectorAll(".tasto-attivo").forEach(el => {
        el.classList.remove("tasto-attivo");
    });
}



function toggleSwitchTurno(btn) {
    const r = btn.closest(".student-row");
    const cognome = r.dataset.cognome;
    cambiTurnoManuali[cognome] = !cambiTurnoManuali[cognome];
    btn.classList.toggle("modificato");
    salvaDatiLocale();
}

// --- 3. FILTRI ---
function applicaFiltri() {
    const s = document.getElementById("search").value.toLowerCase();
    const classeFilter = document.getElementById("classeFilter");
    
    // Reset filtro classe quando si cerca per testo
    if (classeFilter && s !== "") classeFilter.value = "";
    
    document.querySelectorAll(".student-row").forEach((r) => {
        const testo = (
            r.dataset.cognome +
            " " +
            r.dataset.nomeCompleto +
            " " +
            r.dataset.classe +
            " " +
            r.dataset.room +
            " " +
            r.dataset.gruppo +
            " " +
            r.dataset.percorso +
            " "
        ).toLowerCase();
        r.style.display = testo.includes(s) ? "block" : "none";
    });
}

function validaERicerca() {
    const rVal = document.getElementById("roomInput").value;
    const searchInput = document.getElementById("search");
    const classeFilter = document.getElementById("classeFilter");
    
     // Reset filtro classe quando si cerca per room
    if (classeFilter) classeFilter.value = "";
    
    if (rVal !== "") {
        searchInput.value = "";
        document.querySelectorAll(".student-row").forEach((card) => {
            card.style.display = card.dataset.room === rVal ? "block" : "none";
        });
    } else {
        applicaFiltri();
    }
}

function gestisciSaltoStanze(el) {
    let val = parseInt(el.value);
    let old = parseInt(el.oldValue) || 0;
    if (val > 125 && val < 201 && val > old) el.value = 201;
    else if (val > 125 && val < 201 && val < old) el.value = 125;
    el.oldValue = el.value;
}

// --- 4. LOGICA INPUT ---
function normalizzaOrario(valore) {
    valore = valore.trim().toLowerCase().replace(".", ":").replace(",", ":");
    if (/^\d{2}$/.test(valore)) valore += ":00";
    if (/^\d{4}$/.test(valore)) valore = valore.slice(0, 2) + ":" + valore.slice(2);
    return valore;
}

// ═══════════════════════════════════════════════════════════════
// analizzaPP() — Deduce stato assenza/dinner-no dai permessi PP
// ═══════════════════════════════════════════════════════════════
// Analizza i campi `out` e `in` del permesso permanente di uno
// studente per un dato giorno della settimana e determina se le
// parole-chiave indicano ASSENZA o solo NO-CENA.
//
// Regole:
//   PAROLE_ASSENZA    in out o in  →  { assente: true,  dinnerNo: true  }
//   PAROLE_NO_RIENTRO in in        →  { assente: false, dinnerNo: true  }
//   altrimenti                     →  { assente: false, dinnerNo: false }
//
// Il match è PER TOKEN ESATTO (split su spazi, virgole, punti, trattini)
// per evitare falsi positivi tipo "NORD" che contiene "no".
//
// @param {string} cognome  - cognome dello studente (case-insensitive)
// @param {number} giorno   - giorno settimana (0=Dom … 6=Sab)
// @returns {{assente:boolean, dinnerNo:boolean, etichetta:string}}
// ═══════════════════════════════════════════════════════════════
function analizzaPP(cognome, giorno) {
    const cgn = (cognome || "").toUpperCase();
    const pp = (typeof ORARI_PP !== "undefined" && ORARI_PP[cgn])
        ? ORARI_PP[cgn][giorno]
        : null;

    if (!pp) return { assente: false, dinnerNo: false, etichetta: "" };

    // Unisce out e in in un'unica stringa e tokenizza
    const testo = `${pp.out || ""} ${pp.in || ""}`.toLowerCase();
    const tokens = testo.split(/[\s,;/\-]+/).filter(Boolean);

    // 1. Parole di ASSENZA (in out o in)
    const parolaAssenza = tokens.find(t => PAROLE_ASSENZA.includes(t));
    if (parolaAssenza) {
        return {
            assente: true,
            dinnerNo: true,                 // assente ⇒ automaticamente non cena
            etichetta: parolaAssenza.toUpperCase()
        };
    }

    // 2. Parole di NO-RIENTRO (solo nel campo in)
    const tokensIn = (pp.in || "").toLowerCase()
        .split(/[\s,;/\-]+/).filter(Boolean);
    const parolaNoRientro = tokensIn.find(t => PAROLE_NO_RIENTRO.includes(t));
    if (parolaNoRientro) {
        return { assente: false, dinnerNo: true, etichetta: "" };
    }

    return { assente: false, dinnerNo: false, etichetta: "" };
}

// Espone analizzaPP globalmente (usata anche da data-loader.js)
window.analizzaPP = analizzaPP;

function controllaDinnerAutomatico(riga) {
    const classe  = riga.dataset.classe;
    const cognome = riga.dataset.cognome;
    const giornoSettimana = getDataCorrente().getDay();

    let entra = normalizzaOrario(riga.querySelector(".in-i").value);
    let esce  = normalizzaOrario(riga.querySelector(".in-u").value);

    const pp = ORARI_PP[cognome] && ORARI_PP[cognome][giornoSettimana]
        ? ORARI_PP[cognome][giornoSettimana]
        : null;

    let ppIn  = pp ? normalizzaOrario(pp.in  || "") : "";
    let ppOut = pp ? normalizzaOrario(pp.out || "") : "";

    // Turno effettivo → limite orario
    const turnoEffettivo = turnoStudente(classe, cognome);
    const limite = turnoEffettivo === 1 ? "18:30" : "19:15";

    const isTardi = (orario) =>
        orario.includes(":") && orario > limite;

    // Helper: tokenizza e cerca nelle liste globali
    const contieneParola = (str, lista) => {
        if (!str) return false;
        const tokens = str.toLowerCase()
            .split(/[\s,;/\-]+/).filter(Boolean);
        return tokens.some(t => lista.includes(t));
    };

    const isNoRientro = (str) => contieneParola(str, PAROLE_NO_RIENTRO);
    const isAssenza   = (str) => contieneParola(str, PAROLE_ASSENZA);

    // ── Se già assente (da PP o da click) ⇒ dinner-no ──
    if (riga.classList.contains("assente")) {
        riga.dataset.dinnerno = "1";
        riga.classList.add("dinner-no");
        return;
    }

    // ── Se out/in contengono parola di ASSENZA ⇒ dinner-no ──
    if (isAssenza(esce) || isAssenza(ppOut) ||
        isAssenza(entra) || isAssenza(ppIn)) {
        riga.dataset.dinnerno = "1";
        riga.classList.add("dinner-no");
        return;
    }

    // ── Logica originale: no-rientro o orario tardi ──
    if (
        isNoRientro(entra) || isNoRientro(ppIn) ||
        isTardi(entra)     || isTardi(ppIn)
    ) {
        riga.dataset.dinnerno = "1";
        riga.classList.add("dinner-no");
    } else {
        riga.dataset.dinnerno = "0";
        riga.classList.remove("dinner-no");
    }
}
/**
 * Mostra un popup informativo quando l'utente tenta di modificare
 * uno stato imposto da un Permesso Permanente (che è "legge").
 *
 * @param {string} cognome   - cognome dello studente
 * @param {string} etichetta - parola-chiave del PP (es. "SOSP", "GITA")
 * @param {string} motivo    - "assenza" | "non cena" | default generico
 */
function mostraPopupPPBloccato(cognome, etichetta, motivo) {
    // Rimuovi eventuale popup precedente
    const old = document.getElementById("ppBlockedPopup");
    if (old) old.remove();

    const dettaglio = motivo
        ? `Lo stato di <b>${motivo}</b> è imposto dal PP <code>${etichetta}</code>.`
        : `Lo stato è imposto dal PP <code>${etichetta}</code>.`;

    const popup = document.createElement("div");
    popup.id = "ppBlockedPopup";
    popup.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface);
        color: var(--text);
        padding: 14px 22px;
        border-radius: 12px;
        border: 2px solid var(--absent, #dc2626);
        font-family: var(--font);
        font-size: 0.88rem;
        z-index: 3000;
        box-shadow: 0 6px 24px rgba(0,0,0,0.25);
        max-width: 420px;
        text-align: center;
        animation: ppFadeIn 0.2s ease;
    `;
    popup.innerHTML = `
        <div style="font-size:1.4em;margin-bottom:4px;">🔒</div>
        <div style="font-weight:700;margin-bottom:6px;">
            Permesso Permanente attivo
        </div>
        <div style="font-size:0.82em;color:var(--text-2);line-height:1.4;">
            <b>${cognome}</b> — ${dettaglio}<br>
            Non è possibile modificarlo manualmente.<br>
            Per sbloccarlo, modifica il PP nel database.
        </div>
    `;
    document.body.appendChild(popup);

    // Rimozione automatica dopo 3.5 secondi
    setTimeout(() => {
        if (popup.parentNode) popup.remove();
    }, 3500);
}

/**
 * Popup quando si tenta di modificare uno stato imposto da
 * un'assenza programmata nel side panel.
 */
function mostraPopupAssenzaProgrammata(cognome) {
    const old = document.getElementById("ppBlockedPopup");
    if (old) old.remove();

    const popup = document.createElement("div");
    popup.id = "ppBlockedPopup";
    popup.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface);
        color: var(--text);
        padding: 14px 22px;
        border-radius: 12px;
        border: 2px solid var(--lab, #d97706);
        font-family: var(--font);
        font-size: 0.88rem;
        z-index: 3000;
        box-shadow: 0 6px 24px rgba(0,0,0,0.25);
        max-width: 420px;
        text-align: center;
        animation: ppFadeIn 0.2s ease;
    `;
    popup.innerHTML = `
        <div style="font-size:1.4em;margin-bottom:4px;">📅</div>
        <div style="font-weight:700;margin-bottom:6px;">
            Assenza programmata attiva
        </div>
        <div style="font-size:0.82em;color:var(--text-2);line-height:1.4;">
            <b>${cognome}</b> è assente per il periodo programmato.<br>
            Non è possibile modificarlo manualmente.<br>
            Per sbloccarlo, rimuovi l'assenza dal pannello laterale.
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
        if (popup.parentNode) popup.remove();
    }, 3500);
}

function toggleAssenza(btn) {
    const r = btn.closest(".student-row");
    const cognome = r.dataset.cognome;
    const giornoSettimana = getDataCorrente().getDay();

    // ── BLOCCO PP ──
    const statoPP = analizzaPP(cognome, giornoSettimana);
    if (statoPP.assente) {
        mostraPopupPPBloccato(cognome, statoPP.etichetta || "PP");
        return;
    }

    // ── BLOCCO ASSENZA PROGRAMMATA ──                          ← NUOVO
    if (isAssenteProgrammato(cognome, getDataCorrente())) {     // ← NUOVO
        mostraPopupAssenzaProgrammata(cognome);                 // ← NUOVO
        return;                                                 // ← NUOVO
    }

    r.classList.toggle("assente");
    btn.classList.toggle("active-ass");
    controllaDinnerAutomatico(r);
    salvaDatiLocale();
}

function toggleDinnerNo(btn) {
    const r = btn.closest(".student-row");
    const cognome = r.dataset.cognome;
    const giornoSettimana = getDataCorrente().getDay();

    // ── BLOCCO PP ──
    const statoPP = analizzaPP(cognome, giornoSettimana);
    if (statoPP.assente || statoPP.dinnerNo) {
        const motivo = statoPP.assente
            ? `assenza (${statoPP.etichetta || "PP"})`
            : "non cena";
        mostraPopupPPBloccato(cognome, statoPP.etichetta || "PP", motivo);
        return;
    }

    // ── BLOCCO ASSENZA PROGRAMMATA ──                          ← NUOVO
    if (isAssenteProgrammato(cognome, getDataCorrente())) {     // ← NUOVO
        mostraPopupAssenzaProgrammata(cognome);                 // ← NUOVO
        return;                                                 // ← NUOVO
    }

    r.dataset.dinnerno = r.dataset.dinnerno === "1" ? "0" : "1";
    r.classList.toggle("dinner-no");
    btn.classList.toggle("active-din");
    salvaDatiLocale();
}

// --- 5. STAMPE ---

// --- DINNER riepilogo
function generaPopUpStampaDinner() {
    // ─── CONTATORI ───
    let a1 = 0, p1 = 0, a2 = 0, p2 = 0;

    // ─── ARRAY DI OGGETTI (non più stringhe) ───
    // Ogni elemento: { cognome, nome, classe, nota }
    let n1 = [], n2 = [], switch1 = [], switch2 = [];

    const oggi = getDataCorrente();
    const giornoSett = oggi.getDay();
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const dataTestuale = document.getElementById("todayDate").innerText;

    // ─── HELPER: estrae il solo nome dal nomeCompleto ───
    // nomeCompleto è "COGNOME Nome", quindi rimuoviamo il cognome iniziale
    function estraiNome(nomeCompleto, cognome) {
        if (!nomeCompleto) return "";
        const cognomeUpper = (cognome || "").toUpperCase();
        if (nomeCompleto.toUpperCase().startsWith(cognomeUpper)) {
            return nomeCompleto.substring(cognome.length).trim();
        }
        return nomeCompleto;
    }

    // ─── RACCOLTA DATI DAL DOM ───
    document.querySelectorAll(".student-row").forEach((r) => {
        const cognome = r.dataset.cognome || "";
        const nomeCompleto = r.dataset.nomeCompleto || "";
        const classe = r.dataset.classe || "";
        const nome = estraiNome(nomeCompleto, cognome);

        // Turno originale (senza override)
        const turnoOriginale = TURNI_DINNER[1].includes(classe) ? 1 : 2;
        // Turno effettivo (con override classe + individuali)
        let turnoEffettivo = turnoStudente(classe, cognome);

        // Applica il cambio turno manuale
        if (cambiTurnoManuali[cognome]) {
            turnoEffettivo = turnoEffettivo === 1 ? 2 : 1;
        }

        // ─── Registra il cambio turno (se diverso dall'originale) ───
        if (turnoEffettivo !== turnoOriginale) {
            const nota = turnoEffettivo === 1 ? "da 2° a 1°" : "da 1° a 2°";
            const obj = {
                cognome: cognome.toUpperCase(),
                nome: nome,
                classe: classe,
                nota: nota
            };
            if (turnoEffettivo === 1) switch1.push(obj);
            else switch2.push(obj);
        }

        // ─── Verifica esclusione dal dinner ───
        const isLab = isStudenteInLabOggi(classe, r.dataset.gruppo, oggi);
        const isPPNoCena = isPPNoDinnerOggi(cognome, giornoSett);
        const escluso =
            isLab ||
            isPPNoCena ||
            r.classList.contains("assente") ||
            r.dataset.dinnerno === "1";

        // ─── Assegna al turno corretto ───
        if (turnoEffettivo === 1) {
            if (escluso) {
                a1++;
                n1.push({
                    cognome: cognome.toUpperCase(),
                    nome: nome,
                    classe: classe,
                    nota: isLab ? "LAB" : ""
                });
            } else {
                p1++;
            }
        } else {
            if (escluso) {
                a2++;
                n2.push({
                    cognome: cognome.toUpperCase(),
                    nome: nome,
                    classe: classe,
                    nota: isLab ? "LAB" : ""
                });
            } else {
                p2++;
            }
        }
    });

    // ─── ORDINAMENTO ALFABETICO PER COGNOME ───
    const ordinaCognome = (a, b) =>
        a.cognome.localeCompare(b.cognome, "it", { sensitivity: "base" });

    n1.sort(ordinaCognome);
    n2.sort(ordinaCognome);
    switch1.sort(ordinaCognome);
    switch2.sort(ordinaCognome);

    // ─── HELPER: genera l'HTML di una griglia di nomi a 2 colonne ───
    function buildGrigliaNomi(lista, opzioni = {}) {
        const { mostraNota = false, mostraClasse = true } = opzioni;

        if (!lista.length) {
            return `<div class="griglia-nomi"><div class="nome-item"><i>Nessuno</i></div></div>`;
        }

        const items = lista
            .map((o) => {
                const tagClasse = mostraClasse && o.classe
                    ? ` <span class="tag-classe">${o.classe}</span>`
                    : "";
                const tagNota = mostraNota && o.nota
                    ? ` <span class="tag-nota">${o.nota}</span>`
                    : "";
                return `<div class="nome-item"><b>${o.cognome}</b> ${o.nome}${tagClasse}${tagNota}</div>`;
            })
            .join("");

        return `<div class="griglia-nomi">${items}</div>`;
    }

    // ─── TESTO PERMESSI DEL GIORNO ───
    const testiPermessi = {
        1: "LAB 2IeFP - PERMESSI DINNER ORE 20:30 DELL'AQUILA, CHIADÒ, MENALDINO",
        2: "LAB 2A - PERMESSI DINNER ORE 20:30 DELL'AQUILA, PAONESSA, CHIADÒ, GIOVANNELLI P",
        3: "LAB 2B - PERMESSI DINNER ORE 20:30 DELL'AQUILA, CHIADÒ, GIOVANNELLI P, MENALDINO",
        4: "LAB 5A/5B - PERMESSI DINNER ORE 20:30 DELL'AQUILA, CHIADÒ, GIOVANNELLI P, MENALDINO"
    };
    const notaGiornoCorrente = testiPermessi[giornoSett] || "";

    // ─── GENERAZIONE POPUP ───
    const popup = window.open("", "_blank", "width=1000,height=900");
    popup.document.write(`
        <html><head><title>Riepilogo Dinner - ${dataTestuale}</title><style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px 40px; position: relative; color: #222; }
            h2 { text-align: center; text-transform: uppercase; margin-top: 20px; margin-bottom: 6px; font-size: 1.6em; letter-spacing: 1px; }
            h3 { font-size: 1em; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .timestamp { position: absolute; top: 10px; right: 20px; font-size: 0.8em; color: #666; }
            .date { text-align: center; font-size: 1.15em; margin-bottom: 20px; color: #444; }
            
            .editable-notes { 
                width: 100%; 
                box-sizing: border-box;
                border: 1px dashed #ccc; 
                font-size: 1em; 
                font-weight: bold; 
                text-align: center; 
                text-transform: uppercase; 
                padding: 10px; 
                margin-bottom: 24px;
                font-family: inherit;
                resize: vertical;
            }
            
            .section { 
                margin-bottom: 28px; 
                border-left: 6px solid #333; 
                padding-left: 18px; 
                page-break-inside: avoid;
            }
            .section h3 { color: #2c3e50; }
            
            .stats-row { 
                display: flex; 
                gap: 24px; 
                align-items: center; 
                flex-wrap: wrap; 
                margin-bottom: 12px;
            }
            .stats-row span {
                font-size: 0.95em;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .stats-row input { 
                font-size: 1.3em; 
                font-weight: bold; 
                width: 65px; 
                border: none; 
                border-bottom: 2px solid #000; 
                text-align: center; 
                background: transparent; 
                font-family: inherit;
                color: #000;
            }
            
            .label-sezione {
                font-size: 0.85em;
                font-weight: bold;
                text-transform: uppercase;
                color: #555;
                margin-bottom: 4px;
                letter-spacing: 0.5px;
            }
            
            /* ── GRIGLIA NOMI A 2 COLONNE ── */
            .griglia-nomi {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 3px 20px;
                margin: 4px 0 14px 0;
                font-size: 0.85em;
                color: #333;
                line-height: 1.5;
            }
            .nome-item {
                padding: 2px 4px;
                border-bottom: 1px dotted #e0e0e0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .nome-item b { color: #000; }
            
            /* ── TAG ── */
            .tag-classe {
                display: inline-block;
                background: #ecf0f1;
                color: #2c3e50;
                font-size: 0.75em;
                font-weight: bold;
                padding: 1px 6px;
                border-radius: 3px;
                text-transform: uppercase;
                vertical-align: middle;
                margin-left: 4px;
            }
            .tag-nota {
                display: inline-block;
                background: #fef9e7;
                color: #b7950b;
                font-size: 0.75em;
                font-weight: bold;
                padding: 1px 6px;
                border-radius: 3px;
                text-transform: uppercase;
                vertical-align: middle;
                margin-left: 4px;
                border: 1px solid #f7dc6f;
            }
            
            .no-print { margin-top: 20px; display: flex; justify-content: center; }
            .no-print button {
                padding: 14px 50px; 
                background: #27ae60; 
                color: white; 
                font-weight: bold; 
                border-radius: 80px; 
                border: none; 
                cursor: pointer; 
                font-size: 0.95em;
                font-family: inherit;
                letter-spacing: 1px;
                box-shadow: 0 4px 12px rgba(39,174,96,0.3);
            }
            .no-print button:hover { filter: brightness(1.08); }
            
            /* ── STAMPA ── */
            /* ── STAMPA ── */
@media print {
    body { padding: 8px 12px; font-size: 0.9em; }
    .no-print { display: none; }
    .editable-notes { border: none; margin-bottom: 12px; padding: 6px; }
    
    /* Griglia più compatta in stampa: 3 colonne + font ridotto */
    .griglia-nomi { 
        grid-template-columns: repeat(3, 1fr); 
        font-size: 0.62em; 
        gap: 0px 12px;
        margin: 2px 0 8px 0;
        line-height: 1.2;
    }
    .nome-item { padding: 0; }
    
    .section { 
        page-break-inside: avoid;
        margin-bottom: 14px;
        padding-left: 12px;
        border-left-width: 4px;
    }
    
    h2 { font-size: 1.3em; margin: 8px 0 4px 0; }
    h3 { font-size: 0.9em; margin-bottom: 6px; }
    .date { font-size: 0.95em; margin-bottom: 12px; }
    .stats-row { gap: 16px; margin-bottom: 8px; }
    .stats-row span { font-size: 0.85em; }
    .stats-row input { font-size: 1.1em; width: 55px; }
    .label-sezione { font-size: 0.75em; margin-bottom: 2px; }
}
            @page { size: A4 portrait; margin: 1cm; }
        </style></head><body>
        
            <div class="timestamp">aggiornamento ${dataOggi} ore ${oraEsatta}</div>
            <h2>Riepilogo Dinner</h2>
            <div class="date">${dataTestuale}</div>
            
            <div class="no-print">
                <button onclick="window.print()">• STAMPA</button>
            </div>
            
            <textarea class="editable-notes" rows="2">${notaGiornoCorrente}</textarea>
            
            <!-- ═══════════ TURNO 1 ═══════════ -->
            <div class="section">
                <h3>1° turno — 18:30</h3>
                <div style="font-size:0.75em;color:#777;margin-bottom:8px;font-style:italic;">
                    CLASSI 1A, 1B, 1P, 2A, 2B, 2FP, 3FP [mercoledì escluse 1A, 1B]
                </div>
                
                <div class="stats-row">
                    <span>Assenti: <input type="number" value="${a1}"></span>
                    <span>Presenti: <input type="number" value="${p1}"></span>
                    <span>+ EDU: <input type="number" value="2"></span>
                </div>
                
                <div class="label-sezione">Esclusi</div>
                ${buildGrigliaNomi(n1, { mostraNota: true, mostraClasse: true })}
                
                <div class="label-sezione">Cambi Turno</div>
                ${buildGrigliaNomi(switch1, { mostraNota: true, mostraClasse: true })}
            </div>
            
            <!-- ═══════════ TURNO 2 ═══════════ -->
            <div class="section">
                <h3>2° turno — 19:15</h3>
                <div style="font-size:0.75em;color:#777;margin-bottom:8px;font-style:italic;">
                    CLASSI 3A, 3B, 4A, 4B, 4C, 5A, 5B [mercoledì comprese 1A, 1B]
                </div>
                
                <div class="stats-row">
                    <span>Assenti: <input type="number" value="${a2}"></span>
                    <span>Presenti: <input type="number" value="${p2}"></span>
                    <span>+ EDU: <input type="number" value="2"></span>
                </div>
                
                <div class="label-sezione">Esclusi</div>
                ${buildGrigliaNomi(n2, { mostraNota: true, mostraClasse: true })}
                
                <div class="label-sezione">Cambi Turno</div>
                ${buildGrigliaNomi(switch2, { mostraNota: true, mostraClasse: true })}
            </div>
            
        </body></html>`);
    popup.document.close();
}

// --- PRESENZE dinner
function generaPopUpStampaPresDin() {
    const oggi = getDataCorrente();
    const dataTestuale = document.getElementById("todayDate").innerText;
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // --- FUNZIONI DI SUPPORTO ORIGINALI (INNER) ---
    function parseClasse(classe) {
        if (!classe) return { num: 999, lettera: "Z" };
        const match = classe
            .toString()
            .toUpperCase()
            .match(/^(\d+)([A-Z]?)$/);
        if (match) {
            return { num: parseInt(match[1]), lettera: match[2] || "A" };
        }
        return { num: 999, lettera: "Z" };
    }

    function ordinaPerClasseECognome(a, b) {
        const classeA = parseClasse(a.classe);
        const classeB = parseClasse(b.classe);
        if (classeA.num !== classeB.num) return classeA.num - classeB.num;
        if (classeA.lettera !== classeB.lettera) return classeA.lettera.localeCompare(classeB.lettera);
        const cognomeA = (a.cognome || "").toUpperCase();
        const cognomeB = (b.cognome || "").toUpperCase();
        return cognomeA.localeCompare(cognomeB);
    }

    // --- 1. SUDDIVISIONE TURNI (con override) ---
    const { turno1, turno2 } = costruisciTurni();

    // --- 2. ORDINAMENTO ---
    turno1.sort(ordinaPerClasseECognome);
    turno2.sort(ordinaPerClasseECognome);

    // --- 3. GENERAZIONE HTML PER UN TURNO ---
    function buildTurnoHtml(studentiInTurno) {
        const numColonne = 3;
        const totali = studentiInTurno.length;
        const itemsPerColonna = Math.ceil(totali / numColonne);
        const colonneHtml = ["", "", ""];

        studentiInTurno.forEach((s, idx) => {
            const colIdx = Math.floor(idx / itemsPerColonna);
            let classeDisplay = (s.classe || "").toString().toUpperCase();

            colonneHtml[colIdx] += `
                <div class="d-row">
                    <div class="d-cell d-class"><b>${classeDisplay}</b></div>
                    <div class="d-cell d-name"><b>${s.cognome}</b>&nbsp${s.nome || ""}</div>
                    <div class="d-cell d-day"></div>
                    <div class="d-cell d-day"></div>
                    <div class="d-cell d-day"></div>
                    <div class="d-cell d-day"></div>
                </div>
            `;
        });

        // Crea le 3 colonne affiancate con header allineati
        return `
            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlContenuto) => `
                    <div class="colonna">
                        <div class="column-header">
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-name">Cognome e Nome</div>
                            <div class="h-cell h-day">LU</div>
                            <div class="h-cell h-day">MA</div>
                            <div class="h-cell h-day">ME</div>
                            <div class="h-cell h-day">GI</div>
                        </div>
                        ${htmlContenuto}
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    const htmlTurno1 = buildTurnoHtml(turno1);
    const htmlTurno2 = buildTurnoHtml(turno2);

    // --- 4. GENERAZIONE INTERFACCIA E POP-UP ---
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Stampa Appello Cena - Due Turni</title><style>
            @page { size: A4 landscape; margin: 0.3cm; }
            html, body { max-height: 100%; overflow: hidden; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2px; color: #000; line-height: 1.0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .main-title { text-align: center; text-transform: uppercase; margin: 0; font-size: 1.0rem; font-weight: bold; }
            .date-subtitle { text-align: center; font-size: 0.75rem; margin-bottom: 3px; color: #444; }
            .timestamp { position: absolute; top: 3px; right: 10px; font-size: 0.55rem; color: #777; }
            
            /* Impedisce drasticamente l'interruzione di pagina tra e dentro i turni */
            .turno-section { margin-bottom: 6px; page-break-inside: avoid !important; break-inside: avoid; }
            .turno-title { background: #555; color: #fff; padding: 1px 6px; font-size: 0.72rem; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; border-radius: 2px; }
            
            .grid-container { display: flex; gap: 8px; justify-content: space-between; page-break-inside: avoid !important; }
            .colonna { width: 32.8%; display: flex; flex-direction: column; }
            
            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.55rem; text-transform: uppercase; border: 1px solid #000; height: 14px; }
            .d-row { display: flex; font-size: 0.56rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; height: 14px !important; box-sizing: border-box; }
            
            .d-cell, .h-cell { padding: 0px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; height: 100%; }
            
            /* Spaziature fisse e allineate al millimetro */
            .d-class, .h-class { width: 35px; font-size: 0.54rem; }
            .d-class { border-right: 1px solid #ccc; background: #f5f5f5; font-weight: bold; }
            .h-class { border-right: 1px solid #555; }
            
            .d-name, .h-name { flex-grow: 1; text-align: left; justify-content: flex-start; border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }
            
            .d-day, .h-day { width: 18px; font-size: 0.54rem; font-weight: bold; }
            .d-day { border-right: 1px solid #ccc; }
            .d-day:last-child { border-right: none; }
            .h-day { border-right: 1px solid #555; }
            
            .no-print { text-align: center; margin-bottom: 5px; }
            @media print { .no-print { display: none; } }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            <div class="main-title">REGISTRO PRESENZE DINNER</div>
            <div class="date-subtitle">${dataTestuale}</div>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:4px 30px; background: #27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    •STAMPA
                </button>
            </div>

            <div class="turno-section">
                <div class="turno-title">1° Turno (Ore 18:30) — Tot: ${turno1.length}</div>
                ${htmlTurno1}
            </div>

            <div class="turno-section">
                <div class="turno-title">2° Turno (Ore 19:15) — Tot: ${turno2.length}</div>
                ${htmlTurno2}
            </div>
        </body></html>
    `);
    popup.document.close();
}
// --- TRANSFER
function generaPopUpStampaTransfer() {
    const oggi = getDataCorrente();
    const dataTestuale =
        document.getElementById("todayDate")?.innerText ||
        oggi.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    // 1. VERIFICA DATABASE - USA tuttiStudenti (TUTTI GLI STUDENTI)
    if (typeof tuttiStudenti === "undefined" || tuttiStudenti.length === 0) {
        console.error("Errore: tuttiStudenti non definito o vuoto.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // 2. LOGICA DEI TURNI LABORATORIO PRANZO
    const giornoSettimana = oggi.getDay();
    const labConfig = typeof LAB_PRANZO !== "undefined" ? LAB_PRANZO : {};
    const classiInLabOggi = labConfig[giornoSettimana] || [];

    console.log(`📅 Transfer Lunch - Data: ${oggi.toLocaleDateString('it-IT')}, Giorno: ${giornoSettimana}`);
    console.log(`📋 Classi in laboratorio oggi:`, classiInLabOggi);

        // Raggruppiamo TUTTI gli studenti per classe (escluse le classi non interessate)
    const classi = {};
    const CLASSI_ESCLUSE = ["1P", "2P", "3P", "2A", "2B", "4C"];

    tuttiStudenti.forEach((s) => {
        if (!s.cognome || s.cognome.trim() === "") return;
        const nomeClasse = s.classe ? s.classe.toUpperCase().trim() : "SENZA CLASSE";

        // Escludi le classi non convittorie / non interessate al transfer
        if (CLASSI_ESCLUSE.includes(nomeClasse)) return;

        if (!classi[nomeClasse]) classi[nomeClasse] = [];
        classi[nomeClasse].push(s);
    });

    const elencoClassi = Object.keys(classi).sort();

    if (elencoClassi.length === 0) {
        alert("Nessuno studente disponibile per la stampa.");
        return;
    }

    // Ordiniamo gli studenti dentro le classi e calcoliamo il flag del laboratorio
    elencoClassi.forEach((nomeClasse) => {
        classi[nomeClasse].sort((a, b) => a.cognome.localeCompare(b.cognome));
        classi[nomeClasse].forEach((s) => {
            s.haLabOggi = classiInLabOggi.includes(nomeClasse);
        });
    });

    // 3. RIPARTIZIONE BILANCIATA NELLE COLONNE
    // totaleElementi = studenti effettivamente inclusi (dopo il filtro classi)
    const totaleElementi = elencoClassi.reduce((acc, c) => acc + classi[c].length, 0);
    const targetPerColonna = Math.ceil(totaleElementi / 3);

    const colonneHtml = ["", "", ""];
    let colonnaCorrenteIdx = 0;
    let elementiInColonnaCorrente = 0;

    elencoClassi.forEach((nomeClasse) => {
        const studentiClasse = classi[nomeClasse];
        const quantiStudenti = studentiClasse.length;

        if (
            elementiInColonnaCorrente > 0 &&
            elementiInColonnaCorrente + quantiStudenti / 1.5 > targetPerColonna &&
            colonnaCorrenteIdx < 2
        ) {
            colonnaCorrenteIdx++;
            elementiInColonnaCorrente = 0;
        }

        let classeTableHtml = `
            <div class="blocco-classe">
                <table>
                    <tbody>
        `;

        studentiClasse.forEach((s) => {
            const roomNum = parseInt(s.room, 10);
            const isConvittore = !isNaN(roomNum) && roomNum >= 101 && roomNum <= 221;
            let roomInfo = s.room && s.room !== "-" ? s.room : "-";

            const dettagliTag = [s.percorso ? s.percorso : "", s.gruppo ? "• " + s.gruppo : ""]
                .filter(Boolean)
                .join(" ");

            // SFONDO COLORATO PER LABORATORIO
            let bgStyle = s.haLabOggi ? "background-color: #fff2cc;" : "";
            let classeBadge = s.haLabOggi ? `<b>${nomeClasse}</b> <span class="lab-badge">(LAB)</span>` : `<b>${nomeClasse}</b>`;
            const esternoClass = !isConvittore ? "esterno" : "";

            classeTableHtml += `
                <tr class="${esternoClass}" style="${bgStyle}">
                    <td class="t-cell t-room">${roomInfo}</td>
                    <td class="t-cell t-name"><b>${s.cognome}</b>&nbsp;${s.nome || ""}</td>
                    <td class="t-cell t-class">${classeBadge}</td>
                    <td class="t-cell t-details">${dettagliTag}</td>
                </tr>
            `;
            elementiInColonnaCorrente++;
        });

        classeTableHtml += `
                    </tbody>
                </table>
            </div>
        `;

        colonneHtml[colonnaCorrenteIdx] += classeTableHtml;
    });

    // 4. GENERAZIONE POP-UP E INTERFACCIA DI STAMPA
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Transfer Lunch Completo - ${dataOggi}</title><style>
            @page { size: A4 portrait; margin: 0.6cm 0.25cm 0.25cm 0.25cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h2 { text-align: center; text-transform: uppercase; margin: 0; font-size: 1.0rem; }
            .date-subtitle { text-align: center; font-size: 0.75rem; margin-bottom: 3px; color: #444; }
            .lab-info { font-size: 0.95rem; font-weight: bold; color: #b7950b; }
            .timestamp { position: absolute; top: 3px; right: 10px; font-size: 0.55rem; color: #777; }
            
            .grid-container { display: flex; gap: 6px; justify-content: space-between; align-items: flex-start; }
            .colonna { width: 33.1%; display: flex; flex-direction: column; }
            
            .fake-header { display: flex; background: #2c3e50; color: white; font-weight: bold; font-size: 0.52rem; text-transform: uppercase; height: 14px; box-sizing: border-box; border: 1.2px solid #000; margin-bottom: 2px; }
            .h-cell { padding: 2px 2px; text-align: left; display: flex; align-items: center; justify-content: center; height: 100%; box-sizing: border-box; border-right: 1px solid #000; }
            .h-cell:last-child { border-right: none; }
            
            .blocco-classe { page-break-inside: avoid !important; break-inside: avoid-page !important; margin-bottom: 4px; width: 100%; }
            
            table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.2px solid #000; }
            tr { height: 15px !important; box-sizing: border-box; }
            
            .t-cell { padding: 0px 2px; font-size: 0.54rem; border-right: 1px solid #000; border-bottom: 1px solid #ddd; text-align: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; height: 13px !important; line-height: 12px; box-sizing: border-box; }
            tr:last-child .t-cell { border-bottom: none; }
            .t-cell:last-child { border-right: none; }
            
            tr.esterno td.t-room { border-left: 2px dashed #7f8c8d; }
            
            .t-room, .h-room { width: 22px; text-align: center; }
            .t-room { font-weight: bold; background: #f5f5f5; }
            .t-name, .h-name { width: 105px; text-transform: uppercase; }
            .t-class, .h-class { width: 50px; text-align: center; }
            .t-details, .h-notes { flex-grow: 1; }
            .t-details { font-size: 0.50rem; color: #444; }
            
            .lab-badge { font-size: 0.44rem; color: #b7950b; font-weight: bold; }
            
            .no-print { text-align: center; margin-bottom: 4px; }
            @media print { 
                .no-print { display: none; }
            }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            <h2>TRANSFER LUNCH</h2>
            <div class="date-subtitle">
    <span class="lab-info">LAB [LUN 5A+3A BUS 19-31-47]; [MAR 4A+3B BUS 31-39-42]; <br> [MER 4B+1A BUS 34-43-41]; [GIO 4C+1B BUS 34-37-44]</span>
    — Studenti tot: <b>${totaleElementi}</b>
</div>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:4px 30px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    •STAMPA
                </button>
            </div>

            <div class="grid-container">
                ${colonneHtml
                    .map((htmlDest) => {
                        if (!htmlDest.trim()) return "";
                        return `
                    <div class="colonna">
                        <div class="fake-header">
                            <div class="h-cell h-room">Room</div>
                            <div class="h-cell h-name">Cognome e Nome</div>
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-notes">Note</div>
                        </div>
                        ${htmlDest}
                    </div>
                    `;
                    })
                    .join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}

// --- POMERIGGIO BUS
function generaPopUpStampaBusPomeriggio() {
    // 🚗 Cognomi che ricevono il simbolo auto nelle note
    const COGNOMI_AUTO = [
        "RASO", "NICOLASI", "DANNA", "CONTA",
        "CHIADÒ CAPONET", "MENALDINO", "COMIOTTO", "DI TRIA"
    ];

    const oggi = new Date();
    const dataTestuale = document.getElementById("todayDate").innerText;
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // 1. FILTRO: esclude 2A, 2B e classi con "P" e cognome vuoto
    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        const classe = s.classe.toUpperCase();
        const escluse = ["2A", "2B", "4C"];
        return !escluse.includes(classe) && !classe.includes("P");
    });

    // 2. ORDINAMENTO NATURALE: Classe -> Gruppo -> Cognome
    validi.sort((a, b) => {
        const compClasse = a.classe.localeCompare(b.classe, undefined, { numeric: true });
        if (compClasse !== 0) return compClasse;

        const gA = a.gruppo || "";
        const gB = b.gruppo || "";
        const compGruppo = gA.localeCompare(gB);
        if (compGruppo !== 0) return compGruppo;

        return a.cognome.localeCompare(b.cognome);
    });

    // 3. COSTRUZIONE LISTA MISTA CON SEPARATORI
    const elementiFinali = [];
    let ultimaClasse = null;

    validi.forEach((studente) => {
        if (ultimaClasse !== null && studente.classe !== ultimaClasse) {
            elementiFinali.push({ type: "separator" });
        }
        elementiFinali.push({ type: "student", data: studente });
        ultimaClasse = studente.classe;
    });

    // 4. DISTRIBUZIONE BILANCIATA NELLE 3 COLONNE
    const totaleElementi = elementiFinali.length;
    const itemsPerColonna = Math.ceil(totaleElementi / 3);
    const colonneHtml = ["", "", ""];

    elementiFinali.forEach((elemento, idx) => {
        const colonnaIdx = Math.floor(idx / itemsPerColonna);

        if (elemento.type === "separator") {
            colonneHtml[colonnaIdx] += `<div class="class-separator"></div>`;
            return;
        }

        const s = elemento.data;
        const infoClasse = `${s.classe}${s.gruppo ? " • " + s.gruppo : ""}`;

        // Gestione sfondi colorati tenui per i gruppi 5A e 5B
        let bgStyle = "";
        if (s.classe === "5A") {
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;";
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;";
        } else if (s.classe === "5B") {
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;";
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;";
        }

        // 🚗 Nota auto se il cognome è nella lista
        const cognomeUpper = s.cognome.toUpperCase();
        const notaCustom = COGNOMI_AUTO.includes(cognomeUpper) ? "🚗" : "";

        colonneHtml[colonnaIdx] += `
            <div class="bus-row" style="${bgStyle}">
                <div class="b-cell b-class"><b>${infoClasse}</b></div>
                <div class="b-cell b-name"><b>${s.cognome}</b></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-notes">${notaCustom}</div>
            </div>
        `;
    });

    // 5. GENERAZIONE POP-UP
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Bus Pomeriggio Appello Settimanale</title><style>
            @page { size: A4 landscape; margin: 0.4cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 5px; color: #000; line-height: 1.1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h2 { text-align: center; text-transform: uppercase; margin: 5px 0 2px 0; font-size: 1.2rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; margin-bottom: 12px; color: #444; }
            .timestamp { position: absolute; top: 5px; right: 10px; font-size: 0.65rem; color: #777; }
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }

            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.70rem; text-transform: uppercase; border: 1px solid #000; height: 22px; box-sizing: border-box; }
            .bus-row { display: flex; font-size: 0.72rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px !important; box-sizing: border-box; }
            .class-separator { height: 6px; background: #444; border: 1px solid #000; margin: 1px 0; page-break-inside: avoid; }

            .b-cell, .h-cell { padding: 2px 4px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; height: 100%; box-sizing: border-box; }

            .b-class, .h-class { width: 50px; font-size: 0.65rem; }
            .b-class { border-right: 1px solid #ccc; background: #f5f5f5; }
            .h-class { border-right: 1px solid #555; }

            .b-name, .h-name { width: 115px; text-align: left; justify-content: flex-start; padding-left: 6px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }

            .b-day, .h-day { width: 22px; font-size: 0.65rem; }
            .b-day { border-right: 1px solid #ccc; }
            .h-day { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 6px; }

            .no-print { text-align: center; margin-bottom: 12px; }
            @media print { .no-print { display: none; } }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            <h2>CONVITTORI PER CLASSE</h2>
            <div class="date-subtitle">${dataTestuale} — Elementi totali: <b>${totaleElementi}</b></div>

            <div class="no-print">
                <button onclick="window.print()" style="padding:6px 30px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    •STAMPA
                </button>
            </div>

            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlDest) => `
                    <div class="colonna">
                        <div class="column-header">
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-name">Cognome</div>
                            <div class="h-cell h-day">LU</div>
                            <div class="h-cell h-day">MA</div>
                            <div class="h-cell h-day">ME</div>
                            <div class="h-cell h-day">GI</div>
                            <div class="h-cell h-notes">Note</div>
                        </div>
                        ${htmlDest}
                    </div>
                `
                    )
                    .join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}

// --- USCITA
function generaPopUpStampaUscite() {
    // 1. VERIFICA DATABASE
    if (typeof studenticonvittori === "undefined") {
        alert("Errore: database studenticonvittori non trovato!");
        return;
    }

    // 2. FILTRO E ORDINAMENTO
    const listaConvittori = studenticonvittori
        .filter((s) => s && s.cognome && s.room && s.room !== "-")
        .sort((a, b) => a.cognome.localeCompare(b.cognome));

    if (listaConvittori.length === 0) {
        alert("Nessun convittore con camera assegnata trovato.");
        return;
    }

    // 3. RIPARTIZIONE BILANCIATA NELLE 2 COLONNE
    const totaleElementi = listaConvittori.length;
    const itemsPerCol = Math.ceil(totaleElementi / 2);

    const colonneHtml = ["", ""];

    listaConvittori.forEach((s, index) => {
        const colIndex = Math.floor(index / itemsPerCol);
        const infoClasse = [s.classe, s.percorso, s.gruppo].filter(Boolean).join(" ") || "-";

        colonneHtml[colIndex] += `
            <tr>
                <td class="t-cell t-room">${s.room}</td>
                <td class="t-cell t-class">${infoClasse}</td>
                <td class="t-cell t-name"><b>${s.cognome}</b>&nbsp;${s.nome || ""}</td>
                <td class="t-cell t-sign"></td>
                <td class="t-cell t-sign"></td>
            </tr>
        `;
    });

    // Layout della tabella a due colonne
    function generaLayoutContenuto() {
        return `
            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlDest) => `
                    <div class="colonna">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 25px;">Room</th>
                                    <th style="width: 55px;">Classe</th>
                                    <th style="width: 140px;">Cognome e Nome</th>
                                    <th>Uscita</th>
                                    <th>Rientro</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${htmlDest}
                            </tbody>
                        </table>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    // 4. GENERAZIONE POP-UP E INTERFACCIA
    const oggi = new Date();
    const dataOggi = oggi.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Registro Uscite Convittori - ${oggi.toLocaleDateString("it-IT")}</title><style>
            @page { size: A4 portrait; margin: 0.6cm 0.3cm 0.3cm 0.3cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.1; }
            
            .page-block { page-break-after: always; position: relative; }
            .page-block:last-child { page-break-after: avoid; }
            
            /* Strutture titoli visibili a schermo ma nascoste in stampa */
            .no-print-header { text-align: center; margin-top: 5px; }
            h2 { text-transform: uppercase; margin: 2px 0; font-size: 1.1rem; letter-spacing: 1px; }
            .date-subtitle { font-size: 0.8rem; margin-bottom: 5px; color: #333; font-weight: bold; text-transform: uppercase; }
            .side-indicator { position: absolute; top: 2px; right: 5px; font-size: 0.6rem; font-weight: bold; background: #ddd; padding: 1px 4px; border-radius: 3px; text-transform: uppercase; }
            
            /* Layout a 2 colonne speculari */
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 49.3%; display: flex; flex-direction: column; }
            
            /* Tabelle ultraleggere e compatte */
            table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #000; }
            th { background: #34495e; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; padding: 3px 2px; border: 1px solid #000; text-align: center; }
            
            /* Celle ad altezza minima compressa per stare nel foglio singolo */
            .t-cell { padding: 1px 3px; font-size: 0.62rem; border-right: 1px solid #000; border-bottom: 1px solid #000; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; height: 14px; }
            .t-cell:last-child { border-right: none; }
            
            /* Specifiche colonne */
            .t-room { width: 25px; text-align: center; font-weight: bold; background: #f9f9f9; }
            .t-class { width: 55px; font-size: 0.58rem; text-align: center; color: #222; }
            .t-name { width: 140px; text-transform: uppercase; text-align: left; }
            .t-sign { background: #fff; }
            
            .no-print { text-align: center; margin: 10px 0; }
            
            /* Logica di rimozione elementi per la stampa */
            @media print { 
                .no-print, .no-print-header, .side-indicator { display: none !important; }
                .page-block { min-height: auto; }
            }
        </style></head><body>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:8px 35px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                    •STAMPA
                </button>
            </div>

            <div class="page-block">
                <div class="side-indicator">Fronte</div>
                <h2>ORA LIBERA 17/18 - data: </h2>
                <div class="no-print-header">
                    
                    <div class="date-subtitle">${dataOggi}</div>
                </div>
                ${generaLayoutContenuto()}
            </div>

            <div class="page-block">
                <div class="side-indicator">Retro</div>
                <h2>ORA LIBERA 17/18 - data: </h2>
                <div class="no-print-header">
                    
                    <div class="date-subtitle">${dataOggi}</div>
                </div>
                ${generaLayoutContenuto()}
            </div>

        </body></html>
    `);
    popup.document.close();
}
// --- ROOMING list
function generaPopUpStampaRooming() {
    // 1. DATI EXTRA E VERIFICA DATABASE
    const extra = [
        { cognome: "EDUCATORI", nome: "", classe: "", gruppo: "", room: "112", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_1", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_2", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_3", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_4", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_5", gruppo: "", room: "212", percorso: "" },        
        { cognome: "", nome: "", classe: "Foresteria_6", gruppo: "", room: "212", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_7", gruppo: "", room: "212", percorso: "" }
    ];

    let listaDalDatabase = [];
    if (typeof studenticonvittori !== "undefined") {
        listaDalDatabase = listaDalDatabase.concat(studenticonvittori);
    } else {
        console.warn("Attenzione: variabile 'studenticonvittori' non trovata.");
    }

    const tuttiIPartecipanti = [...extra, ...listaDalDatabase];
    const stanze = {};

    // 2. RAGGRUPPAMENTO PER STANZA
    tuttiIPartecipanti.forEach((s) => {
        if (!s.room || s.room === "-") return;
        if (!stanze[s.room]) stanze[s.room] = [];
        stanze[s.room].push(s);
    });

    const numeriStanze = Object.keys(stanze).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    // Dividiamo le stanze per piano (Piano 1: 100-199 / Piano 2: >= 200)
    const stanzePiano1 = [];
    const stanzePiano2 = [];

    numeriStanze.forEach((num) => {
        const r = parseInt(num, 10);
        stanze[num].sort((a, b) => (a.cognome || "").localeCompare(b.cognome || ""));

        if (r >= 100 && r < 200) {
            stanzePiano1.push(num);
        } else if (r >= 200) {
            stanzePiano2.push(num);
        }
    });

    // Funzione interna per generare i box HTML delle stanze
    function generaBoxStanze(listaStanzeDelPiano) {
        return listaStanzeDelPiano
            .map((num) => {
                const occupanti = stanze[num];
                return `
                <div class="room-box">
                    <div class="room-header">STANZA ${num}</div>
                    <table class="room-table">
                        <tbody>
                            ${occupanti
                                .map((s) => {
                                    const infoGruppo = s.gruppo ? ` • ${s.gruppo}` : "";
                                    const infoPercorso = s.percorso ? `<span class="percorso-tag">${s.percorso}</span> ` : "";
                                    const nomeDisplay =
                                        !s.cognome && s.classe === "Foresteria" ? "<i>Libero / Foresteria</i>"
                                            : `<b>${s.cognome}</b> ${s.nome || ""}`;
                                    const dettagliDisplay = s.classe ? `${infoPercorso}${s.classe}${infoGruppo}` : "";

                                    return `
                                    <tr>
                                        <td class="cell-name">${nomeDisplay}</td>
                                        <td class="cell-details">${dettagliDisplay}</td>
                                    </tr>
                                `;
                                })
                                .join("")}
                        </tbody>
                    </table>
                </div>
            `;
            })
            .join("");
    }

    // 3. GENERAZIONE POP-UP E INTERFACCIA
    const oggi = new Date();
    const dataOggi = oggi.toLocaleDateString("it-IT");

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Rooming List Verticale - ${dataOggi}</title><style>
            @page { size: A4 portrait; margin: 0.3cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.1; }
            
            .page-block { position: relative; }
            
            .no-print-header { text-align: center; margin-bottom: 4px; }
            h2 { text-transform: uppercase; margin: 0; font-size: 1.1rem; letter-spacing: 1px; display: inline-block; }
            
            .section-title { font-size: 0.72rem; font-weight: bold; text-transform: uppercase; color: #2c3e50; margin: 5px 0 3px 0; background: #ecf0f1; padding: 2px 5px; border: 1px solid #000; width: 100%; box-sizing: border-box; }
            
            /* Griglia a 3 colonne bilanciata per il foglio verticale */
            .rooms-grid { display: grid; grid-template-columns: repeat(3, 31.8%); gap: 0px; justify-content: space-between; width: 100%; }
            
            /* Struttura Box Stanza super compatta */
            .room-box { border: 1.2px solid #000; background: #fff; page-break-inside: avoid; display: flex; flex-direction: column; margin-bottom: 2px; }
            .room-header { background: #34495e; color: #fff; font-weight: bold; font-size: 0.58rem; text-align: center; padding: 1px 0; border-bottom: 1.2px solid #000; letter-spacing: 0.5px; }
            
            /* Tabelle interne precise a linee continue */
            .room-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .room-table td { padding: 2px 3px; font-size: 0.55rem; border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; height: 12px; }
            .room-table tr:last-child td { border-bottom: none; }
            .room-table td:last-child { border-right: none; }
            
            .cell-name { width: 52%; text-transform: uppercase; text-align: left; }
            .cell-details { width: 48%; text-align: right; color: #555; font-size: 0.5rem; }
            
            .percorso-tag { font-weight: bold; color: #ba1313; font-size: 0.48rem; }
            
            .no-print { text-align: center; margin: 8px 0; }
            @media print { 
                .no-print { display: none; }
                .section-title { background: #ddd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        </style></head><body>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:8px 35px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                    •STAMPA
                </button>
            </div>

            <div class="page-block">
                <div class="no-print-header">
                    <h2>ROOMING LIST — stampata il ${dataOggi}</h2>
                </div>
                
                <div class="section-title">Piano 1 - Maschile</div>
                <div class="rooms-grid">
                    ${generaBoxStanze(stanzePiano1)}
                </div>
                
                <div class="section-title">Piano 2 - Femminile</div>
                <div class="rooms-grid">
                    ${generaBoxStanze(stanzePiano2)}
                </div>
            </div>

        </body></html>
    `);
    popup.document.close();
}

// funzione stand-by
// Funzione condivisa per evitare ripetizioni e disallineamenti di dati
function verificaStudenteStandBy(r) {
    const cognome = r.dataset.cognome;
    const giornoSettimana = getDataCorrente().getDay();   // ← usa data simulata

    // 1. Stato assente visivo
    if (r.classList.contains("assente")) return true;

    // 2. Deduci dal PP (coerente con analizzaPP)
    const statoPP = analizzaPP(cognome, giornoSettimana);
    if (statoPP.assente || statoPP.dinnerNo) return true;

    // 3. Controlla il campo ingresso
    const inputIngresso = r.querySelector(".in-i");
    const val = inputIngresso ? inputIngresso.value.trim().toLowerCase() : "";
    const tokens = val.split(/[\s,;/\-]+/).filter(Boolean);
    return tokens.some(t => PAROLE_NO_RIENTRO.includes(t));
}

// --- CONVITTO riepilogo
function generaPopUpStampaConvitto() {
    const dataStampa = document.getElementById("todayDate").innerText;
    const oraStampa = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const dataOggiStampa = new Date().toLocaleDateString("it-IT");
    const giornoSettimana = new Date().getDay();
    const camere = {};

    // ─────────────────────────────────────────────────────────────
    // 1. RACCOLTA DATI DAL DOM
    // ─────────────────────────────────────────────────────────────
    document.querySelectorAll(".student-row").forEach((r) => {
        const room = r.dataset.room || "---";
        const cognome = r.dataset.cognome;
        let ppOut = "", ppIn = "";

        if (ORARI_PP[cognome] && ORARI_PP[cognome][giornoSettimana]) {
            ppOut = ORARI_PP[cognome][giornoSettimana].out;
            ppIn  = ORARI_PP[cognome][giornoSettimana].in;
        }

        const sOriginale = studenticonvittori.find((st) => st.cognome === cognome);

        if (!camere[room]) camere[room] = [];
        camere[room].push({
            classe:   r.dataset.classe,
            percorso: r.dataset.percorso,
            cognome:  cognome,
            dinnerno: r.dataset.dinnerno,
            presente: !r.classList.contains("assente"),
            oraU:     r.querySelector(".in-u").value,
            oraI:     r.querySelector(".in-i").value,
            ppOut:    ppOut,
            ppIn:     ppIn,
            gruppo:   r.dataset.gruppo,
            bus:      haDirittoAlBus(sOriginale),
            isStandBy: verificaStudenteStandBy(r),
            isForesteria: false   // studenti reali → mai Foresteria
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. INIEZIONE CAMERE FORESTERIA (se non presenti nel DOM)
    // ─────────────────────────────────────────────────────────────
    function righeForesteriaVuote() {
        const riga = () => ({
            classe:   "Foresteria",
            percorso: "",
            cognome:  "",
            gruppo:   "",
            dinnerno: "0",
            presente: true,
            oraU:     "",
            oraI:     "",
            ppOut:    "",
            ppIn:     "",
            bus:      false,
            isStandBy: false,
            isForesteria: true   // ← righe placeholder: niente X in Presente/Assente
        });
        return [riga(), riga(), riga()];
    }

    const CAMERA_FORESTERIA_M = "124";
    const CAMERA_FORESTERIA_F = "212";

    if (!camere[CAMERA_FORESTERIA_M]) {
        camere[CAMERA_FORESTERIA_M] = righeForesteriaVuote();
    }
    if (!camere[CAMERA_FORESTERIA_F]) {
        camere[CAMERA_FORESTERIA_F] = righeForesteriaVuote();
    }

    // ─────────────────────────────────────────────────────────────
    // 3. ORDINAMENTO E SUDDIVISIONE PER PIANO
    //    - Piano maschile:  camere ≤ 125 + Foresteria 124 in fondo
    //    - Piano femminile: camere > 125 + Foresteria 212 in fondo
    // ─────────────────────────────────────────────────────────────
    const camereOrdinate = Object.keys(camere).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );

    const camereSenzaForesteria = camereOrdinate.filter(
        r => r !== CAMERA_FORESTERIA_M && r !== CAMERA_FORESTERIA_F
    );

    const camereMaschili = camereSenzaForesteria.filter(r => r <= "125");
    camereMaschili.push(CAMERA_FORESTERIA_M);

    const camereFemminili = camereSenzaForesteria.filter(r => r > "125");
    camereFemminili.push(CAMERA_FORESTERIA_F);

    // ─────────────────────────────────────────────────────────────
    // 4. HELPER: genera le righe HTML di una lista di camere
    // ─────────────────────────────────────────────────────────────
    function generaRigheCamere(listaCamere) {
        return listaCamere
            .map((room) => {
                const occupanti = camere[room] || [];
                return occupanti
                    .map((s, idx) => {
                        const isLastRow = idx === occupanti.length - 1;
                        const bClass = isLastRow
                            ? 'class="border-bottom-bold"'
                            : 'class="border-dashed"';
                        const bClassGray = isLastRow
                            ? 'class="border-bottom-bold bg-gray"'
                            : 'class="border-dashed bg-gray"';
                        const bClassCognome = isLastRow
                            ? 'class="border-bottom-bold col-cognome"'
                            : 'class="border-dashed col-cognome"';

                        return `<tr>
                            ${idx === 0 ? `<td rowspan="${occupanti.length}" class="room-header border-bottom-bold">${room}</td>` : ""}
                            <td ${bClass}>${s.classe} ${s.percorso || ""}</td>
                            <td ${bClassCognome}><b>${s.cognome}</b> ${s.gruppo ? "(" + s.gruppo + ")" : ""}</td>
                            <td ${bClass}>${!s.isForesteria && s.presente ? "X" : ""}</td>
                            <td ${bClass}>${!s.isForesteria && !s.presente ? "X" : ""}</td>
                            <td ${bClassGray}>${s.oraU}</td>
                            <td ${bClass}>${s.oraI}</td>
                            <td ${bClassGray}><b>${s.ppOut}</b></td>
                            <td ${bClass}><b>${s.ppIn}</b></td>
                            <td ${bClassGray}>${s.dinnerno === "1" ? "X" : ""}</td>
                            <td ${bClass}></td>
                            <td ${bClassGray}></td>
                            <td ${bClassGray}>${s.isStandBy ? "➖" : ""}</td>
                            <td ${bClass}>${s.bus ? "⭕" : ""}</td>
                        </tr>`;
                    })
                    .join("");
            })
            .join("");
    }

    // ─────────────────────────────────────────────────────────────
    // 5. GENERAZIONE POP-UP
    // ─────────────────────────────────────────────────────────────
    const popup = window.open("", "_blank", "width=1200,height=800");

    const hookTestataTabella = `<tr>
        <th>Room</th><th>Classe</th><th class="col-cognome">Cognome</th><th>Presente</th><th>Assente</th><th>Uscita</th><th>Ingresso</th><th>PP Uscita</th><th>PP Rientro</th><th>Dinner NO</th><th>Notte SI</th><th>Notte NO</th><th>Stand-by</th><th>7:30</th>
    </tr>`;

    popup.document.write(`
    <html><head><title>Riepilogo Convitto - ${dataStampa}</title><style>
        @page { size: A3 portrait; margin: 0.6cm 0.3cm 0.3cm 0.3cm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h2 { text-align: center; text-transform: uppercase; font-size: 1.1em; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 5px; }

        tr { height: 21px !important; }
        th, td {
            border: 1px solid #000;
            padding: 1px 2px;
            text-align: center;
            font-size: 0.65em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            height: 21px !important;
            box-sizing: border-box;
            line-height: 19px;
        }

        th { background: #f2f2f2; font-weight: bold; }
        .room-header { background: #eee; font-weight: bold; width: 45px; white-space: normal; line-height: 1.1; }
        .border-bottom-bold { border-bottom: 2.5px solid #000 !important; }
        .border-dashed { border-bottom: 1px dashed #999 !important; }
        .col-cognome { text-align: left !important; padding-left: 4px !important; width: 130px; text-transform: uppercase; }
        .bg-gray { background: #f9f9f9 !important; }
        .page-break { page-break-after: always; page-break-inside: avoid; }
        .footer-timestamp { text-align: right; font-size: 0.70em; margin-top: 5px; font-style: italic; color: #555; }
        .no-print { text-align: center; margin: 10px; }
        @media print { .no-print { display: none; } }
    </style></head><body>
        <div class="no-print"><button onclick="window.print()" style="padding:15px 50px; background:#27ae60; color:white; font-weight:bold; border-radius:80px; border:none; cursor:pointer;">•STAMPA</button></div>

        <h2>MASCHILE - piano 1° - ${dataStampa}</h2>
        <table>
            <thead>${hookTestataTabella}</thead>
            <tbody>${generaRigheCamere(camereMaschili)}</tbody>
        </table>

        <div class="page-break"></div>

        <h2>FEMMINILE - piano 2° - ${dataStampa}</h2>
        <table>
            <thead>${hookTestataTabella}</thead>
            <tbody>${generaRigheCamere(camereFemminili)}</tbody>
        </table>

        <div class="footer-timestamp">aggiornamento ${dataOggiStampa} ore ${oraStampa}</div>
    </body></html>`);
    popup.document.close();
}

// --- MATTINO BUS
function generaPopUpStampaBus(ordinamento) {
    // ordinamento: 'alfabetico' (default) | 'perClasse'
    ordinamento = ordinamento || 'alfabetico';

    // 🚗 Cognomi che ricevono il simbolo auto nelle note
    const COGNOMI_AUTO = [
        "RASO", "NICOLASI", "DANNA", "CONTA",
        "CHIADÒ CAPONET", "MENALDINO", "COMIOTTO", "DI TRIA"
    ];

    const oggi = new Date();
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    // Data di domani (per il sottotitolo "Trasporto del ...")
    const domani = new Date(oggi);
    domani.setDate(oggi.getDate() + 1);
    const dataDomaniTestuale = domani.toLocaleDateString("it-IT", {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // 1. FILTRO CLASSI ESCLUSE
    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        const classe = s.classe.toUpperCase();
        const escluse = ["2A", "2B"];
        return !escluse.includes(classe) && !classe.includes("P");
    });

    // 2. ORDINAMENTO
    if (ordinamento === 'perClasse') {
        validi.sort((a, b) => {
            const compClasse = a.classe.localeCompare(b.classe, undefined, { numeric: true });
            if (compClasse !== 0) return compClasse;
            return a.cognome.localeCompare(b.cognome);
        });
    } else {
        const classiInFondo = ["4C", "5A", "5B"];

        const resto = validi.filter((s) => !classiInFondo.includes(s.classe));
        const classe4C = validi.filter((s) => s.classe === "4C");
        const classe5A = validi.filter((s) => s.classe === "5A");
        const classe5B = validi.filter((s) => s.classe === "5B");

        resto.sort((a, b) => a.cognome.localeCompare(b.cognome));

        const ordinaPerGruppoECognome = (a, b) => {
            const gA = a.gruppo || "";
            const gB = b.gruppo || "";
            return (gA + a.cognome).localeCompare(gB + b.cognome);
        };

        classe4C.sort(ordinaPerGruppoECognome);
        classe5A.sort(ordinaPerGruppoECognome);
        classe5B.sort(ordinaPerGruppoECognome);

        validi.length = 0;
        validi.push(...resto, ...classe4C, ...classe5A, ...classe5B);
    }

    // 3. DISTRIBUZIONE IN 3 COLONNE
    const colonneHtml = ["", "", ""];

    // Testo della nota da mettere in cima alla prima colonna
    const notaInTesta = "LABORATORI <br> LUN 5A+3A 🍸 MAR 4A+3B <br> MER 4B+1A 🍹 GIO 4C+1B";

    // Funzione per generare una riga studente (con note automatiche)
    function generaRigaStudente(s) {
        let bgStyle = "";
        if (s.classe === "5A" || s.classe === "5B") {
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8; border-left: 4px solid #2c3e50;";
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7; border-left: 4px dashed #2c3e50;";
        }

        // Lookup stand-by dal DOM
        const rigaElemento = document.querySelector(`.student-row[data-cognome="${s.cognome}"]`);
        let visualizzaStandBy = "";
        if (rigaElemento && typeof verificaStudenteStandBy === "function") {
            visualizzaStandBy = verificaStudenteStandBy(rigaElemento) ? "➖" : "";
        }

        // ── NOTE ──
        let notaCustom = "";
        const classeUpper = s.classe.toUpperCase();
        const cognomeUpper = s.cognome.toUpperCase();

        if (classeUpper === "4C") {
            notaCustom = "solo GIO";
        } else if (classeUpper === "5B") {
            notaCustom = "mai GIO";
        }

        // 🚗 Aggiungi auto se il cognome è nella lista
        if (COGNOMI_AUTO.includes(cognomeUpper)) {
            notaCustom = notaCustom ? notaCustom + " 🚗" : "🚗";
        }

        return `
            <div class="bus-row" style="${bgStyle}">
                <div class="b-cell b-class">${s.classe}${s.gruppo ? " • " + s.gruppo : ""}</div>
                <div class="b-cell b-name"><b>${s.cognome}</b></div>
                <div class="b-cell b-room">${s.room || ""}</div>
                <div class="b-cell b-check"></div>
                <div class="b-cell b-standby" style="font-size: 0.9em;">${visualizzaStandBy}</div>
                <div class="b-cell b-notes">${notaCustom}</div>
            </div>
        `;
    }

      // ── DISTRIBUZIONE ──
    // Colonne 1-2: resto + 4C bilanciati
    // Colonna 3: SOLO 5A + 5B, con nota LAB in fondo
    const gruppoResto  = validi.filter(s => s.classe !== "5A" && s.classe !== "5B");
    const gruppoQuinte = validi.filter(s => s.classe === "5A" || s.classe === "5B");

    const itemsPerCol12 = Math.ceil(gruppoResto.length / 2);

    gruppoResto.forEach((s, idx) => {
        const col = Math.min(Math.floor(idx / itemsPerCol12), 1);
        colonneHtml[col] += generaRigaStudente(s);
    });

    // Terza colonna: prima le quinte, poi la nota LAB in fondo
    gruppoQuinte.forEach((s) => {
        colonneHtml[2] += generaRigaStudente(s);
    });

    colonneHtml[2] += `
        <div class="bus-row nota-colonna" style="background:#f0f0f0; font-weight:bold; font-style:italic; justify-content:center;">
            <div class="b-cell" style="width:100%; text-align:center; justify-content:center;">
                ${notaInTesta}
            </div>
        </div>
    `;

    // Calcolo presenti (senza stand-by) e totale bus
    const totaleBus = validi.length;
    const presenti = validi.filter((s) => {
        const rigaElemento = document.querySelector(`.student-row[data-cognome="${s.cognome}"]`);
        if (!rigaElemento || typeof verificaStudenteStandBy !== "function") return true;
        return !verificaStudenteStandBy(rigaElemento);
    }).length;
    // 4. POPUP
    const titolo = ordinamento === 'perClasse' ? "BUS DOMATTINA — per classe" : "BUS DOMATTINA - alfabetico";

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>${titolo}</title><style>
            @page { size: A4 landscape; margin: 0.6cm 0.4cm 0.4cm 0.4cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 5px; color: #000; line-height: 1.1; }
            h2 { text-align: center; text-transform: uppercase; margin: 2px 0 6px 0; font-size: 1.1rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; font-weight: bold; margin-bottom: 8px; color: #111; text-transform: capitalize; }
            .timestamp { position: absolute; top: 5px; right: 10px; font-size: 0.6rem; color: #777; }

            .toolbar-stampa { display: flex; justify-content: center; gap: 12px; margin-bottom: 10px; }

            .toolbar-stampa button {
                padding: 6px 26px;
                color: white;
                font-weight: bold;
                border-radius: 20px;
                border: none;
                cursor: pointer;
                font-size: 0.85rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: filter 0.2s;
            }
            .toolbar-stampa button:hover { filter: brightness(1.1); }
            .btn-stampa { background: #27ae60; }
            .btn-per-classe { background: #7c3aed; }

            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }

            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; border: 1px solid #000; height: 18px; }

            .bus-row { display: flex; font-size: 0.68rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px; }

            .nota-colonna {
                font-size: 0.7rem;
                height: auto;
                min-height: 22px;
                border: 1px solid #000;
                border-bottom: 2px solid #000;
            }

            .b-cell, .h-cell { padding: 2px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; }

            .b-class, .h-class { width: 65px; font-size: 0.55rem; }
            .b-class { border-right: 1px solid #ccc; }
            .h-class { border-right: 1px solid #555; }

            .b-name, .h-name { width: 105px; text-align: left; justify-content: flex-start; padding-left: 4px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }

            .b-room, .h-room { width: 25px; font-size: 0.58rem; }
            .b-room { border-right: 1px solid #ccc; font-weight: bold; background: #f5f5f5; }
            .h-room { border-right: 1px solid #555; }

            .b-check, .h-check { width: 22px; }
            .b-check { border-right: 1px solid #ccc; }
            .h-check { border-right: 1px solid #555; }

            .b-standby, .h-standby { width: 25px; border-right: 1px solid #ccc; }
            .h-standby { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 4px; }

            @media print {
                .no-print { display: none !important; }
            }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>

            <h2>${titolo}</h2>
            <div class="date-subtitle">Trasporto del ${dataDomaniTestuale} — Presenti: <b>${presenti}</b> su <b>${totaleBus}</b> totali</div>

            <div class="toolbar-stampa no-print">
                <button class="btn-stampa" onclick="window.print()">•STAMPA</button>
            </div>

            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlDest) => `
                    <div class="colonna">
                        <div class="column-header">
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-name">Cognome</div>
                            <div class="h-cell h-room">Room</div>
                            <div class="h-cell h-check">Pres</div>
                            <div class="h-cell h-standby">StBy</div>
                            <div class="h-cell h-notes">Note</div>
                        </div>
                        ${htmlDest}
                    </div>
                `
                    )
                    .join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}

//-- bus generico
function generaPopUpStampaBusGenerico() {
    const oggi = new Date();
    const dataTestuale = document.getElementById("todayDate").innerText;
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // 1. FILTRO CLASSI ESCLUSE
    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        const classe = s.classe.toUpperCase();
        const escluse = ["2A", "2B", "4C"];
        return !escluse.includes(classe) && !classe.includes("P");
    });

    // 2. SEPARAZIONE E ORDINAMENTO
// 5A e 5B vanno in fondo, ordinate per gruppo (G1/G2) + cognome
const resto = validi.filter((s) => s.classe !== "5A" && s.classe !== "5B");
const classe5A = validi.filter((s) => s.classe === "5A");
const classe5B = validi.filter((s) => s.classe === "5B");

resto.sort((a, b) => a.cognome.localeCompare(b.cognome));

const ordinaPerGruppoECognome = (a, b) => {
    const gA = a.gruppo || "";
    const gB = b.gruppo || "";
    return (gA + a.cognome).localeCompare(gB + b.cognome);
};
classe5A.sort(ordinaPerGruppoECognome);
classe5B.sort(ordinaPerGruppoECognome);

const listaFinale = [...resto, ...classe5A, ...classe5B];

    // 3. RIPARTIZIONE IN 3 COLONNE BILANCIATE
    const itemsPerCol = Math.ceil(listaFinale.length / 3);
    const colonneHtml = ["", "", ""];

    listaFinale.forEach((s, index) => {
        const colIndex = Math.floor(index / itemsPerCol);
        const infoClasse = `${s.classe} ${s.percorso ? s.percorso : ""} ${s.gruppo ? "• " + s.gruppo : ""}`;

        let bgStyle = "";
if (s.classe === "5A") {
    if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;"; // lilla tenue
    if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;"; // giallo tenue
} else if (s.classe === "5B") {
    if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;"; // lilla tenue 
    if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;"; // giallo tenue
}

        colonneHtml[colIndex] += `
            <div class="bus-row" style="${bgStyle}">
                <div class="b-cell b-room">${s.room || ""}</div>
                <div class="b-cell b-name"><b>${s.cognome}</b></div>
                <div class="b-cell b-class">${infoClasse}</div>
                <div class="b-cell b-check"></div>
                <div class="b-cell b-standby"></div> 
                <div class="b-cell b-notes"></div>
            </div>
        `;
    });
    
    

    // 4. GENERAZIONE INTERFACCIA COMPATTA A4 LANDSCAPE
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Appello Bus - Schema Generico</title><style>
            @page { size: A4 landscape; margin: 0.4cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 5px; color: #000; line-height: 1.1; }
            h2 { text-align: center; text-transform: uppercase; margin: 2px 0 0 0; font-size: 1.1rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; font-weight: bold; margin-bottom: 8px; color: #111; }
            .timestamp { position: absolute; top: 5px; right: 10px; font-size: 0.6rem; color: #777; }
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }
            
            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; border: 1px solid #000; height: 18px; }
            
            /* Righe alzate a 22px per occupare meglio lo spazio sul foglio */
            .bus-row { display: flex; font-size: 0.68rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px; }
            
            .b-cell, .h-cell { padding: 2px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; }
            
            .b-room, .h-room { width: 25px; font-size: 0.58rem; }
            .b-room { border-right: 1px solid #ccc; font-weight: bold; background: #f5f5f5; }
            .h-room { border-right: 1px solid #555; }
            
            .b-name, .h-name { width: 105px; text-align: left; justify-content: flex-start; padding-left: 4px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }
            
            .b-class, .h-class { width: 65px; font-size: 0.55rem; }
            .b-class { border-right: 1px solid #ccc; }
            .h-class { border-right: 1px solid #555; }
            
            .b-check, .h-check { width: 22px; }
            .b-check { border-right: 1px solid #ccc; }
            .h-check { border-right: 1px solid #555; }
            
            .b-standby, .h-standby { width: 25px; border-right: 1px solid #ccc; }
            .h-standby { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 4px; }
            
            .no-print { text-align: center; margin-bottom: 8px; }
            
            /* Gestione nascondi in stampa per pulsanti e sottotitolo dati */
            @media print { .no-print { display: none !important; } }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            
            
            
            
            
            
            
            <h2>BUS CONVITTORI</h2>
            
            <div class="date-subtitle no-print"> — Studenti tot: <b>${listaFinale.length}</b></div>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:6px 30px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    •STAMPA
                </button>
            </div>

            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlDest) => `
                    <div class="colonna">
                        <div class="column-header">
                            <div class="h-cell h-room">Room</div>
                            <div class="h-cell h-name">Cognome</div>
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-check">Pres</div>
                            <div class="h-cell h-standby">StBy</div>
                            <div class="h-cell h-notes">Note</div>
                        </div>
                        ${htmlDest}
                    </div>
                `
                    )
                    .join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}



// -- fine tasti stampa

// --- 6. GESTIONE ASSENZE PROGRAMMATE ---
function salvaAssenzeProgrammate() {
    localStorage.setItem("assenzeProgrammate", JSON.stringify(assenzeProgrammate));
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

/* ─────────────────────────────────────────────────────────────
   HELPER: data locale in formato YYYY-MM-DD (immune ai fusi)
   ───────────────────────────────────────────────────────────── */
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
    ricaricaListaStudenti();   // ← NUOVO: applica subito il nuovo stato
}

function renderListaAssenze() {
    const container = document.getElementById("listaAssenze");
    if (!container) return;

    container.innerHTML = Object.entries(assenzeProgrammate)
        .map(([cognome, periodi]) => {
            return `
            <div style="margin-bottom:10px;">
                <b>${cognome}</b>
                ${periodi
                    .map(
                        (p, i) => `
                    <div style="font-size:0.8em;">
                        ${p.dal} → ${p.al}
                        <button onclick="rimuoviAssenza('${cognome}', ${i})">❌</button>
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
    ricaricaListaStudenti();   // ← NUOVO: rimuove subito lo stato assente
}

// --- 7. PERMESSI E UTILITY ---
function popolaListaPermessi() {
    const container = document.getElementById("listaPermessiContent");
    if (!container) return;

    const giorniSettimana = ["", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"];
    const studentiPP = Object.keys(ORARI_PP || {}).sort();

    // ─────────────────────────────────────────────────────────────
    // BLOCCO IMPORT/EXPORT — sempre visibile in cima alla sezione
    // ─────────────────────────────────────────────────────────────
    const bloccoImportExport = `
        <div style="display:flex; gap:8px; margin:10px 0 15px 0; padding:10px; background:#f8f9fa; border-radius:6px; border:1px solid #ddd;">
            <button onclick="esportaPermessiJSON()" 
                    style="flex:1; padding:8px 6px; background:#3498db; color:white; font-weight:bold; border:none; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                📤 Esporta
            </button>
            
            <label style="flex:1; padding:8px 6px; background:#27ae60; color:white; font-weight:bold; border-radius:6px; cursor:pointer; font-size:0.8rem; text-align:center; display:flex; align-items:center; justify-content:center; gap:4px;">
                📥 Importa
                <input type="file" accept=".json,application/json" 
                       onchange="importaPermessiJSON(event)" 
                       style="display:none;">
            </label>
        </div>
    `;

    // Se non ci sono permessi, mostra comunque il blocco import/export
    if (studentiPP.length === 0) {
        container.innerHTML = bloccoImportExport + "<p style='font-size:0.85em; color:#666;'><i>Nessun orario PP registrato.</i></p>";
        return;
    }

    const listaHtml = studentiPP
        .map((cognome) => {
            const orari = ORARI_PP[cognome];
            if (!orari) return "";

            // ── NORMALIZZAZIONE ──
            // Firebase converte { "1": {...}, "2": {...} } in [null, {...}, {...}]
            // Dobbiamo gestire entrambi i formati.
            let dettagli = "";

            if (Array.isArray(orari)) {
                // Array: itera da indice 1 in poi (indice 0 è sempre null/vuoto)
                dettagli = orari
                    .map((v, i) => {
                        if (i === 0 || !v || typeof v !== "object") return "";
                        const giornoNome = giorniSettimana[i] || `G${i}`;
                        const out = v.out || "-";
                        const inn = v.in || "-";
                        return `<div style="font-size:0.8em; margin-left:10px;">
                            <b style="color:var(--pp)">${giornoNome.substring(0, 2)}:</b>
                            ${out} &gt; ${inn}
                        </div>`;
                    })
                    .join("");
            } else if (typeof orari === "object") {
                // Oggetto: comportamento originale, ma ordinato numericamente
                dettagli = Object.keys(orari)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((g) => {
                        const giornoNome = giorniSettimana[Number(g)] || `G${g}`;
                        const o = orari[g] || {};
                        const out = o.out || "-";
                        const inn = o.in || "-";
                        return `<div style="font-size:0.8em; margin-left:10px;">
                            <b style="color:var(--pp)">${giornoNome.substring(0, 2)}:</b>
                            ${out} &gt; ${inn}
                        </div>`;
                    })
                    .join("");
            }

            return `<div style="margin-bottom:12px; border-bottom:1px solid #eee;">
                <b>${cognome}</b>${dettagli}
            </div>`;
        })
        .join("");

    // Blocco import/export + lista permessi
    container.innerHTML = bloccoImportExport + listaHtml;
}

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

/**
 * ─────────────────────────────────────────────────────────────
 * SIDE PANEL — Gestione Permessi Permanenti
 * ─────────────────────────────────────────────────────────────
 * Apre/chiude il pannello laterale e, all'apertura, calcola
 * dinamicamente l'altezza dell'overlay semi-trasparente in modo
 * che copra esattamente gli elementi superiori (header, note,
 * toolbar, griglia tasti) lasciandoli visibili e CLICCABILI
 * grazie a pointer-events:none impostato nell'HTML.
 * ─────────────────────────────────────────────────────────────
 */
/**
 * ─────────────────────────────────────────────────────────────
 * SIDE PANEL — Apertura / chiusura
 * ─────────────────────────────────────────────────────────────
 */
function togglePanel() {
    const panel = document.getElementById('sidePanel');
    if (!panel) return;

    const isOpening = !panel.classList.contains('open');
    panel.classList.toggle('open');

    // All'apertura, popola i contenuti e ricalcola l'overlay
    if (isOpening) {
        if (typeof popolaListaPermessi  === "function") popolaListaPermessi();
        if (typeof popolaSelectStudenti === "function") popolaSelectStudenti();
        if (typeof renderListaAssenze   === "function") renderListaAssenze();
        if (typeof popolaSelectClassi   === "function") popolaSelectClassi();
        aggiornaAltezzaOverlay();
    }
}

// Helper opzionale per verificare lo stato del pannello da qualsiasi punto del codice
function isPanelOpen() {
    const panel = document.getElementById('sidePanel');
    return panel ? panel.classList.contains('open') : false;
}

// Chiusura cliccando fuori dal pannello
document.addEventListener('click', (e) => {
    const panel = document.getElementById('sidePanel');
    if (!panel || !panel.classList.contains('open')) return;
    if (panel.contains(e.target)) return;
    if (e.target.closest('[onclick*="togglePanel"]')) return;
    panel.classList.remove('open');
});


/**
 * ─────────────────────────────────────────────────────────────
 * Calcola l'altezza dell'overlay semi-trasparente del pannello
 * in base all'altezza reale degli elementi che devono rimanere
 * visibili e cliccabili sotto di esso:
 *
 *   1. header                  → pulsante ❌ ESCI
 *   2. note-toolbar-container  → textarea note condivise
 *   3. info-reset              → "Ultimo aggiornamento: ..."
 *   4. toolbar                 → MODULI, P•PP, ricerca, ROOM, CLASSE, DATA, Reset
 *   5. griglia tasti           → CONVITTO, DINNER, DOMATTINA, 1°, 2°, ASSENTI, CENE, GLOBALE
 *
 * Viene chiamata:
 *   - all'apertura del pannello (togglePanel)
 *   - al resize della finestra (se pannello aperto)
 *   - al DOMContentLoaded (con piccolo delay)
 * ─────────────────────────────────────────────────────────────
 */
function aggiornaAltezzaOverlay() {
    const overlay = document.getElementById("sidePanelOverlay");
    if (!overlay) return;

    let h = 0;

    // 1. Header (con logo, clock, ESCI)
    const header = document.querySelector("header");
    if (header) h += header.offsetHeight;

    // 2. Note condivise
    const note = document.querySelector(".note-toolbar-container");
    if (note) h += note.offsetHeight;

    // 3. Info reset
    const infoReset = document.getElementById("info-reset");
    if (infoReset) h += infoReset.offsetHeight;

    /* rimossi per diminuire la zona smerigliata
     *  
    // 4. Toolbar principale    const toolbar = document.querySelector(".toolbar");
    if (toolbar) h += toolbar.offsetHeight;

    // 5. Griglia tasti (div subito dopo la toolbar)
    if (toolbar && toolbar.nextElementSibling) {
        h += toolbar.nextElementSibling.offsetHeight;
    }  
    *
    */

    // Margine di sicurezza per evitare che l'overlay tagli
    // parte dell'ultimo elemento visibile
    h += 70;

    // Applica l'altezza calcolata
    overlay.style.flex = `0 0 ${h}px`;

    console.log(`🔲 Overlay permessi: ${h}px (header+note+reset+toolbar+tasti)`);
}


/* ─────────────────────────────────────────────────────────────
   RICALCOLO AUTOMATICO
   ───────────────────────────────────────────────────────────── */

// Ricalcola al resize della finestra (solo se il pannello è aperto)
window.addEventListener("resize", () => {
    const panel = document.getElementById("sidePanel");
    if (panel && panel.style.right === "0px") {
        aggiornaAltezzaOverlay();
    }
});

// Ricalcola al caricamento iniziale (con delay per lasciar
// renderizzare header, toolbar e griglia tasti)
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        aggiornaAltezzaOverlay();
    }, 150);
});



function isStudenteInLabOggi(classe, gruppo, dataOggetto) {
    const giorno = dataOggetto.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mer, 4=Gio, 5=Ven, 6=Sab

    // Classi in laboratorio dinner per giorno (da permessi_26.js)
    const classiLabOggi = (typeof LAB_DINNER !== "undefined" && LAB_DINNER[giorno]) || [];

    // Se la classe non è in laboratorio oggi, esce subito
    if (!classiLabOggi.includes(classe)) return false;

    // Per 5A e 5B il giovedì il laboratorio è a gruppi alterni (G1/G2)
    // Il calendario CALENDARIO_GRUPPI_DINNER (in permessi_26.js) dice
    // quale gruppo tocca quella settimana: "gr1" → G1, "gr2" → G2
    if ((classe === "5A" || classe === "5B") && giorno === 4) {
        const dataKey = dataOggetto.toLocaleDateString("it-IT");
        const gLab = CALENDARIO_GRUPPI_DINNER[dataKey];
        if (!gLab) return false; // nessun gruppo in lab quella settimana (es. vacanza)
        return (gLab === "gr1" && gruppo === "G1") || (gLab === "gr2" && gruppo === "G2");
    }

    // Per tutte le altre classi (2P, 2A, 2B) il laboratorio è per tutta la classe
    return true;
}

function isPPNoDinnerOggi(cognome, giorno) {
    return ASSENTI_PERMESSO[giorno]?.includes(cognome.toUpperCase());
}

function updateClock() {
    document.getElementById("digitalClock").innerText = new Date().toLocaleTimeString("it-IT");
}

function salvaDatiLocale() {
    const dati = {};
    document.querySelectorAll(".student-row").forEach((r) => {
        dati[r.dataset.cognome] = {
            esce: r.querySelector(".in-u").value,
            entra: r.querySelector(".in-i").value,
            assente: r.classList.contains("assente"),
            dinnerno: r.dataset.dinnerno,
            switch: cambiTurnoManuali[r.dataset.cognome] || false
        };
    });
    localStorage.setItem("datiConvitto", JSON.stringify(dati));

    // ─── Sync su Firebase (solo in modalità online) ───
    if (window.APP_MODE === 'online' &&
        typeof window.salvaDatiFirebaseDebounced === 'function') {
        window.salvaDatiFirebaseDebounced();
    }
}

function caricaDatiLocale() {
    const dati = JSON.parse(localStorage.getItem("datiConvitto") || "{}");
    const giornoSettimana = getDataCorrente().getDay();
    const dataCorrente = getDataCorrente();

    document.querySelectorAll(".student-row").forEach((r) => {
        const cognome = r.dataset.cognome;
        const cgn = cognome.toUpperCase();
        const d = dati[cognome];

        // ── Analizza il PP per dedurre assenza / no-cena ──
        const statoPP = analizzaPP(cgn, giornoSettimana);

        // ── Assenza programmata dal side panel ──
        const assenteProgrammato = isAssenteProgrammato(cognome, dataCorrente);  // ← NUOVO

        // ── Recupera gli orari PP ──
        let ppOut = "";
        let ppIn = "";
        if (ORARI_PP[cgn] && ORARI_PP[cgn][giornoSettimana]) {
            ppOut = ORARI_PP[cgn][giornoSettimana].out || "";
            ppIn  = ORARI_PP[cgn][giornoSettimana].in  || "";
        }

        // ── Applica i valori agli input ──
        r.querySelector(".in-u").value =
            d && d.esce  !== undefined ? d.esce  : ppOut;
        r.querySelector(".in-i").value =
            d && d.entra !== undefined ? d.entra : ppIn;

        // ════════════════════════════════════════════════════════
        // LOGICA ASSENZA
        // Precedenza:
        //   1. PP dice assente        → SEMPRE assente
        //   2. Assenza programmata    → SEMPRE assente        ← NUOVO
        //   3. Override utente
        //   4. Altrimenti presente
        // ════════════════════════════════════════════════════════
        let assenteFinale;

        if (statoPP.assente) {
            assenteFinale = true;
        } else if (assenteProgrammato) {                        // ← NUOVO
            assenteFinale = true;                               // ← NUOVO
        } else if (d && d.assente !== undefined) {
            assenteFinale = d.assente === true;
        } else {
            assenteFinale = false;
        }

        r.classList.toggle("assente", assenteFinale);
        const btnAss = r.querySelector(".btn-ass");
        if (btnAss) btnAss.classList.toggle("active-ass", assenteFinale);

        // ════════════════════════════════════════════════════════
        // LOGICA DINNER-NO
        // Precedenza:
        //   1. assente → sempre dinner-no
        //   2. PP dice dinner-no        → SEMPRE dinner-no
        //   3. Assenza programmata      → sempre dinner-no      ← NUOVO
        //   4. Override utente
        //   5. Altrimenti presente
        // ════════════════════════════════════════════════════════
        let dinnerNoFinale;

        if (assenteFinale) {
            dinnerNoFinale = true;
        } else if (statoPP.dinnerNo) {
            dinnerNoFinale = true;
        } else if (assenteProgrammato) {                        // ← NUOVO
            dinnerNoFinale = true;                              // ← NUOVO
        } else if (d && d.dinnerno !== undefined) {
            dinnerNoFinale = d.dinnerno === "1";
        } else {
            dinnerNoFinale = false;
        }

        r.dataset.dinnerno = dinnerNoFinale ? "1" : "0";
        r.classList.toggle("dinner-no", dinnerNoFinale);
        const btnDin = r.querySelector(".btn-din");
        if (btnDin) btnDin.classList.toggle("active-din", dinnerNoFinale);

        // ── Switch turno ──
        if (d && d.switch) {
            cambiTurnoManuali[cognome] = true;
        }
        if (cambiTurnoManuali[cognome]) {
            const btnSwitch = r.querySelector(".btn-switch");
            if (btnSwitch) btnSwitch.classList.add("modificato");
        }

        // ── Ricalcola dinner automatico (orari tardi, ecc.) ──
        controllaDinnerAutomatico(r);
    });
}

/**
 * Applica i dati remoti (provenienti da Firebase) alle card ESISTENTI.
 * 
 * Caso speciale: se `datiGiorno` contiene studenti ma TUTTI hanno stato
 * "vuoto" (nessun assente, nessun dinner-no, orari = PP), significa che
 * è stato fatto un reset condiviso → pulisce tutte le card.
 */
function renderDatiRemoti(datiGiorno) {
    const giornoSettimana = getDataCorrente().getDay();

    document.querySelectorAll(".student-row").forEach((r) => {
        const cognome = r.dataset.cognome;
        const d = datiGiorno[cognome];

        // Salta se l'utente sta editando i campi di questa riga
        const inputAttivo = document.activeElement;
        const staEditandoQuestaRiga = inputAttivo && r.contains(inputAttivo);
        if (staEditandoQuestaRiga) return;

        // Se lo studente non è nei dati remoti, lo trattiamo come "vuoto"
        // (è il caso del reset: Firebase ha il nodo dati senza questo cognome)
        const info = d || {
            esce: "",
            entra: "",
            assente: false,
            dinnerno: "0",
            switch: false
        };

        // ─── Recupera gli orari PP del giorno per questo studente ───
        let ppOut = "";
        let ppIn = "";
        if (ORARI_PP[cognome] && ORARI_PP[cognome][giornoSettimana]) {
            ppOut = ORARI_PP[cognome][giornoSettimana].out || "";
            ppIn = ORARI_PP[cognome][giornoSettimana].in || "";
        }

        // ─── Applica stato ASSENTE ───
        const oraAssente = info.assente === true;
        r.classList.toggle("assente", oraAssente);
        const btnAss = r.querySelector(".btn-ass");
        if (btnAss) btnAss.classList.toggle("active-ass", oraAssente);

        // ─── Applica stato DINNER NO ───
        const oraDinnerNo = info.dinnerno === "1";
        r.dataset.dinnerno = oraDinnerNo ? "1" : "0";
        r.classList.toggle("dinner-no", oraDinnerNo);
        const btnDin = r.querySelector(".btn-din");
        if (btnDin) btnDin.classList.toggle("active-din", oraDinnerNo);

        // ─── Applica orari (esce / entra) ───
        // Se il dato remoto ha un valore esplicito, usa quello.
        // Se è vuoto, torna al valore del PP (o vuoto se non c'è).
        const inU = r.querySelector(".in-u");
        const inI = r.querySelector(".in-i");

        if (inU) {
            const valoreRemoto = info.esce;
            if (valoreRemoto !== undefined && valoreRemoto !== "") {
                inU.value = valoreRemoto;
            } else {
                inU.value = ppOut;  // reset → torna al PP
            }
        }
        if (inI) {
            const valoreRemoto = info.entra;
            if (valoreRemoto !== undefined && valoreRemoto !== "") {
                inI.value = valoreRemoto;
            } else {
                inI.value = ppIn;   // reset → torna al PP
            }
        }

        // ─── Applica switch turno ───
        const oraSwitch = info.switch === true;
        cambiTurnoManuali[cognome] = oraSwitch;
        const btnSwitch = r.querySelector(".btn-switch");
        if (btnSwitch) btnSwitch.classList.toggle("modificato", oraSwitch);
    });

    // ─── Riapplica il PP: se il PP dice assente/dinner, vince sempre ───
    document.querySelectorAll(".student-row").forEach((r) => {
        const cognome = r.dataset.cognome;
        const statoPP = analizzaPP(cognome, giornoSettimana);

        if (statoPP.assente) {
            r.classList.add("assente");
            r.dataset.dinnerno = "1";
            r.classList.add("dinner-no");
            const btnA = r.querySelector(".btn-ass");
            if (btnA) btnA.classList.add("active-ass");
            const btnD = r.querySelector(".btn-din");
            if (btnD) btnD.classList.add("active-din");
        } else if (statoPP.dinnerNo) {
            r.dataset.dinnerno = "1";
            r.classList.add("dinner-no");
            const btnD = r.querySelector(".btn-din");
            if (btnD) btnD.classList.add("active-din");
        }
    });

    // Ricalcola dinner automatico per tutte le righe
    document.querySelectorAll(".student-row").forEach((r) => {
        controllaDinnerAutomatico(r);
    });

    console.log(`✅ Dati remoti applicati (${Object.keys(datiGiorno || {}).length} studenti)`);
}

window.renderDatiRemoti = renderDatiRemoti;

function mostraDataReset() {
    aggiornaInfoReset();
}

/**
 * Aggiorna il testo di #info-reset con entrambi i timestamp:
 *   - Ultimo reset manuale (locale, salvato su localStorage)
 *   - Ultima modifica condivisa (da Firebase, salvata su localStorage)
 */
function aggiornaInfoReset() {
    const el = document.getElementById("info-reset");
    if (!el) return;

    const dReset = localStorage.getItem("dataUltimoReset") || "MAI";
    const dModifica = localStorage.getItem("dataUltimaModifica") || "MAI";

    el.innerText = `Ultimo reset locale: ${dReset} | Ultima modifica online: ${dModifica}`;
}

window.aggiornaInfoReset = aggiornaInfoReset;

function cancellaNote() {
    if (confirm("Vuoi cancellare definitivamente tutte le note per TUTTI gli utenti?")) {
        const noteInput = document.getElementById("dailyNotes");
        if (noteInput) {
            noteInput.value = "";
            // Scrivi su Firebase → tutti gli utenti connessi lo vedranno
            if (typeof window.salvaNoteFirebase === 'function') {
                window.salvaNoteFirebase("");
            }
        }
    }
}


// --- FUNZIONI DI RESET ---
function resetDati(tipo) {
    if (tipo === 'soloManuali') {
        // ═══════════════════════════════════════════════════════════
        // PRIMA CONFERMA — riepilogo di cosa verrà cancellato
        // ═══════════════════════════════════════════════════════════
        const msgPrima =
            "🗑️ RESET GIORNALIERO CONDIVISO\n\n" +
            "Verranno cancellate le modifiche di OGGI per TUTTI i terminali:\n" +
            "  • Stato ASSENTE\n" +
            "  • Stato NON CENA\n" +
            "  • Orari ESCE / ENTRA\n" +
            "  • Switch turno\n\n" +
            "NON verranno toccati:\n" +
            "  • Permessi permanenti (PP)\n" +
            "  • Programmazione assenze\n" +
            "  • Assenti permesso\n\n" +
            "Vuoi procedere?";

        if (!confirm(msgPrima)) return;

        // ═══════════════════════════════════════════════════════════
        // SECONDA CONFERMA — digitare "RESET" per confermare
        // ═══════════════════════════════════════════════════════════
        const msgSeconda =
            "⚠️ CONFERMA FINALE ⚠️\n\n" +
            "Questa azione è IRREVERSIBILE e riguarderà TUTTI i terminali connessi.\n\n" +
            "Per confermare, digita la parola:\n\n" +
            "         RESET\n\n" +
            "(tutto maiuscolo, senza spazi)";

        const conferma = prompt(msgSeconda);

        if (conferma === null) {
            // Utente ha premuto "Annulla" nel prompt
            console.log("Reset annullato (prompt annullato)");
            return;
        }

        if (conferma.trim() !== "RESET") {
            alert("❌ Reset annullato.\nIl testo digitato non corrisponde a \"RESET\".");
            console.log("Reset annullato (testo errato):", conferma);
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // RESET LOCALE
        // ═══════════════════════════════════════════════════════════
        console.log("🗑️ Reset confermato, avvio procedura...");

        rimuoviEvidenziazioneTasti();

        // Reset filtri di ricerca
        const searchInput = document.getElementById("search");
        if (searchInput) searchInput.value = "";
        const roomInput = document.getElementById("roomInput");
        if (roomInput) roomInput.value = "";
        const classeFilter = document.getElementById("classeFilter");
        if (classeFilter) classeFilter.value = "";

        // Pulisci dati manuali da localStorage
        localStorage.removeItem("datiConvitto");

        // Resetta i cambi turno manuali
        cambiTurnoManuali = {};

        // Timestamp reset (locale)
        localStorage.setItem("dataUltimoReset", new Date().toLocaleString("it-IT", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        }));

        // Ricostruisci le card (riapplica automaticamente PP + assenze programmate)
        ricaricaListaStudenti();
        mostraDataReset();

        // ═══════════════════════════════════════════════════════════
        // RESET CONDIVISO SU FIREBASE (solo se online)
        // ═══════════════════════════════════════════════════════════
        if (window.APP_MODE === 'online' &&
            typeof window.salvaDatiFirebase === 'function') {

            // Chiamata diretta (senza debounce) per evitare
            // che modifiche successive si mescolino al reset.
            window.salvaDatiFirebase()
                .then(() => {
                    console.log('☁️ Reset condiviso pubblicato su Firebase');
                    alert("✅ Reset completato e pubblicato su tutti i terminali.\n\nLe assenze programmate e i permessi permanenti sono stati mantenuti.");
                })
                .catch((err) => {
                    console.error('❌ Errore reset condiviso:', err);
                    alert("⚠️ Reset locale completato, ma errore nella pubblicazione condivisa:\n" + err.message);
                });
        } else {
            // Modalità offline
            alert("✅ Reset completato (modalità locale).\n\nLe assenze programmate e i permessi permanenti sono stati mantenuti.");
        }
    }
    else if (tipo === 'completo') {
        // ═══════════════════════════════════════════════════════════
        // RESET COMPLETO (cancella tutto) — doppia conferma anche qui
        // ═══════════════════════════════════════════════════════════
        const msgPrimaCompleto =
            "⚠️ RESET COMPLETO ⚠️\n\n" +
            "Verranno cancellati TUTTI i dati locali:\n" +
            "  • Modifiche giornaliere (assente, no cena, orari, switch)\n" +
            "  • Programmazione assenze\n" +
            "  • Timestamp di reset\n\n" +
            "Vuoi procedere?";

        if (!confirm(msgPrimaCompleto)) return;

        const confermaCompleto = prompt(
            "⚠️ CONFERMA FINALE ⚠️\n\n" +
            "Digita la parola:\n\n" +
            "         RESET\n\n" +
            "(tutto maiuscolo)"
        );

        if (confermaCompleto === null) return;
        if (confermaCompleto.trim() !== "RESET") {
            alert("❌ Reset annullato.\nIl testo digitato non corrisponde a \"RESET\".");
            return;
        }

        localStorage.removeItem("datiConvitto");
        localStorage.removeItem("assenzeProgrammate");
        localStorage.setItem("dataUltimoReset", new Date().toLocaleString("it-IT", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        }));
        cambiTurnoManuali = {};
        assenzeProgrammate = {};
        location.reload();
    }
}

// ─────────────────────────────────────────────────────────────
// IMPORT / EXPORT PERMESSI PERMANENTI (ORARI_PP)
// ─────────────────────────────────────────────────────────────

/**
 * Esporta ORARI_PP in un file JSON scaricabile
 */
function esportaPermessiJSON() {
    if (typeof ORARI_PP === "undefined" || !ORARI_PP) {
        alert("⚠️ Nessun permesso da esportare");
        return;
    }

    const numPermessi = Object.keys(ORARI_PP).length;
    if (numPermessi === 0) {
        alert("⚠️ Non ci sono permessi da esportare");
        return;
    }

    const dataFile = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(ORARI_PP, null, 2)], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `permessi_${dataFile}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`📤 Esportati ${numPermessi} permessi`);
}

/**
 * Importa un file JSON e fa il merge con ORARI_PP esistente.
 * Salva su Firebase se la funzione è disponibile.
 */
async function importaPermessiJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input per permettere di ricaricare lo stesso file
    event.target.value = "";

    try {
        const text = await file.text();
        let nuoviPermessi;

        try {
            nuoviPermessi = JSON.parse(text);
        } catch (e) {
            alert("❌ Il file non è un JSON valido:\n" + e.message);
            return;
        }

        // Validazione struttura
        if (typeof nuoviPermessi !== "object" || Array.isArray(nuoviPermessi)) {
            alert("❌ Formato non valido: atteso un oggetto { COGNOME: { giorno: {out, in} } }");
            return;
        }

        const numNuovi = Object.keys(nuoviPermessi).length;
        const numEsistenti = (typeof ORARI_PP !== "undefined" && ORARI_PP)
            ? Object.keys(ORARI_PP).length
            : 0;

        const conferma = confirm(
            `📥 Importazione permessi\n\n` +
            `File: ${file.name}\n` +
            `Permessi nel file: ${numNuovi}\n` +
            `Permessi attuali: ${numEsistenti}\n\n` +
            `I permessi con lo stesso cognome verranno SOVRASCRITTI.\n` +
            `Procedere?`
        );

        if (!conferma) {
            console.log("Importazione annullata dall'utente");
            return;
        }

        // Merge: i nuovi sovrascrivono gli esistenti per cognome
        if (typeof ORARI_PP === "undefined" || !ORARI_PP) {
            window.ORARI_PP = {};
        }

        Object.keys(nuoviPermessi).forEach(cognome => {
            ORARI_PP[cognome.toUpperCase()] = nuoviPermessi[cognome];
        });

        // Salvataggio su Firebase
        if (typeof window.salvaPermessiFirebase === "function") {
            try {
                await window.salvaPermessiFirebase(ORARI_PP);
                console.log("✅ Permessi salvati su Firebase");
            } catch (err) {
                console.error("❌ Errore salvataggio Firebase:", err);
                alert("⚠️ Permessi aggiornati in memoria ma errore nel salvataggio Firebase:\n" + err.message);
                return;
            }
        } else {
            // Fallback: salva in localStorage
            localStorage.setItem("ORARI_PP", JSON.stringify(ORARI_PP));
            console.warn("⚠️ salvaPermessiFirebase non disponibile, salvato in localStorage");
        }

        // Aggiorna la lista nella tendina
        popolaListaPermessi();

        // Ricarica le righe studenti per applicare i nuovi PP (out/in)
        ricaricaListaStudenti();

        alert(`✅ Importati ${numNuovi} permessi con successo!`);
        console.log("📥 Import completato:", nuoviPermessi);

    } catch (err) {
        console.error("❌ Errore importazione:", err);
        alert("❌ Errore durante l'importazione:\n" + err.message);
    }
}



// --- CARICAMENTO INIZIALE ---
// init() viene chiamato da campus_hub.html DOPO il caricamento dei dati da Firebase
