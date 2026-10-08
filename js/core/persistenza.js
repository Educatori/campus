/**
 * js/core/persistenza.js
 * ─────────────────────────────────────────────────────────────
 * Salvataggio e caricamento dei dati giornalieri + timestamp reset.
 *
 *   • salvaDatiLocale()          → localStorage + Firebase (online)
 *   • caricaDatiLocale()         → riapplica stato alle card esistenti
 *   • renderDatiRemoti()         → applica dati da Firebase realtime
 *   • mostraDataReset()          → wrapper di aggiornaInfoReset
 *   • aggiornaInfoReset()        → scrive #info-reset
 *   • cancellaNote()             → svuota note condivise
 *
 * Dipendenze runtime (globali al momento della chiamata):
 *   - cambiTurnoManuali          → campus_hub-script.js (let)
 *   - getDataCorrente()          → core/stato.js
 *   - analizzaPP()               → core/pp.js
 *   - controllaDinnerAutomatico()→ core/pp.js
 *   - isAssenteProgrammato()     → campus_hub-script.js
 *   - ORARI_PP                   → data-loader.js (window)
 *   - window.salvaDatiFirebase   → data-loader.js
 *   - window.salvaNoteFirebase   → data-loader.js
 *
 * ⚠️ Caricare DOPO core/stato.js, core/turni.js, core/pp.js.
 * ─────────────────────────────────────────────────────────────
 */

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
        typeof window.salvaDatiFirebase === 'function') {
        window.salvaDatiFirebase()
            .catch(err => console.error('❌ Sync dati giornalieri fallita:', err));
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
        const assenteProgrammato = isAssenteProgrammato(cognome, dataCorrente);

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
        //   2. Assenza programmata    → SEMPRE assente
        //   3. Override utente
        //   4. Altrimenti presente
        // ════════════════════════════════════════════════════════
        let assenteFinale;

        if (statoPP.assente) {
            assenteFinale = true;
        } else if (assenteProgrammato) {
            assenteFinale = true;
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
        //   3. Assenza programmata      → sempre dinner-no
        //   4. Override utente
        //   5. Altrimenti presente
        // ════════════════════════════════════════════════════════
        let dinnerNoFinale;

        if (assenteFinale) {
            dinnerNoFinale = true;
        } else if (statoPP.dinnerNo) {
            dinnerNoFinale = true;
        } else if (assenteProgrammato) {
            dinnerNoFinale = true;
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
            ppIn  = ORARI_PP[cognome][giornoSettimana].in || "";
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
        const inU = r.querySelector(".in-u");
        const inI = r.querySelector(".in-i");

        if (inU) {
            const valoreRemoto = info.esce;
            if (valoreRemoto !== undefined && valoreRemoto !== "") {
                inU.value = valoreRemoto;
            } else {
                inU.value = ppOut;
            }
        }
        if (inI) {
            const valoreRemoto = info.entra;
            if (valoreRemoto !== undefined && valoreRemoto !== "") {
                inI.value = valoreRemoto;
            } else {
                inI.value = ppIn;
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

/*
 * Aggiorna il testo di #info-reset con entrambi i timestamp:
 *   - Ultimo reset condiviso (locale + Firebase)
 *   - Ultima modifica condivisa (da Firebase)
 */
function aggiornaInfoReset() {
    const el = document.getElementById("info-reset");
    if (!el) return;

    const dReset = localStorage.getItem("dataUltimoReset") || "MAI";
    const dModifica = localStorage.getItem("dataUltimaModifica") || "MAI";

    el.innerText = `Ultimo reset condiviso: ${dReset} | Ultima modifica condivisa: ${dModifica}`;
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