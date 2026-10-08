/**
 * js/core/pp.js
 * ─────────────────────────────────────────────────────────────
 * Logica Permessi Permanenti + stato assenza/dinner:
 *   • analizzaPP()                     → deduce assente/dinnerNo da ORARI_PP
 *   • controllaDinnerAutomatico()      → applica dinner-no in base agli orari
 *   • mostraPopupPPBloccato()          → popup "imposto dal PP"
 *   • mostraPopupAssenzaProgrammata()  → popup "imposto da assenza programmata"
 *   • toggleAssenza()                  → click su ASSENTE
 *   • toggleDinnerNo()                 → click su NON CENA
 *   • verificaStudenteStandBy()        → usata dalle stampe bus/convitto
 *
 * Dipendenze runtime (globali al momento della chiamata):
 *   - PAROLE_ASSENZA, PAROLE_NO_RIENTRO  → campus_hub-script.js (const)
 *   - getDataCorrente()                  → core/stato.js
 *   - turnoStudente()                    → core/turni.js
 *   - normalizzaOrario()                 → campus_hub-script.js
 *   - isAssenteProgrammato()             → campus_hub-script.js
 *   - salvaDatiLocale()                  → campus_hub-script.js
 *   - ORARI_PP                           → data-loader.js (window)
 *
 * ⚠️ Caricare DOPO core/stato.js e core/turni.js.
 * ─────────────────────────────────────────────────────────────
 */

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

// ═══════════════════════════════════════════════════════════════
// controllaDinnerAutomatico() — Applica dinner-no in base a orari/PP
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// POPUP — Blocco da PP o da assenza programmata
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// TOGGLE — ASSENTE / NON CENA
// ═══════════════════════════════════════════════════════════════

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

    // ── BLOCCO ASSENZA PROGRAMMATA ──
    if (isAssenteProgrammato(cognome, getDataCorrente())) {
        mostraPopupAssenzaProgrammata(cognome);
        return;
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

    // ── BLOCCO ASSENZA PROGRAMMATA ──
    if (isAssenteProgrammato(cognome, getDataCorrente())) {
        mostraPopupAssenzaProgrammata(cognome);
        return;
    }

    r.dataset.dinnerno = r.dataset.dinnerno === "1" ? "0" : "1";
    r.classList.toggle("dinner-no");
    btn.classList.toggle("active-din");
    salvaDatiLocale();
}

// ═══════════════════════════════════════════════════════════════
// STAND-BY — Condivisa da tutte le stampe bus/convitto
// ═══════════════════════════════════════════════════════════════
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