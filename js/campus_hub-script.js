/**
 * CAMPUS_HUB-SCRIPT.JS — Main applicativo
 * ─────────────────────────────────────────────────────────────
 * Questo file contiene SOLO il core dell'app:
 *
 *   • Costanti globali
 *       PAROLE_ASSENZA, PAROLE_NO_RIENTRO, COGNOMI_AUTO
 *
 *   • Stato globale residuo
 *       cambiTurnoManuali
 *
 *   • Rendering lista studenti
 *       ricaricaListaStudenti()
 *
 *   • Bootstrap
 *       init()
 *
 *   • Utility
 *       normalizzaOrario(), haDirittoAlBus(), toggleSwitchTurno()
 *
 *   • Logica laboratorio
 *       isStudenteInLabOggi(), isPPNoDinnerOggi()
 *
 * ─────────────────────────────────────────────────────────────
 * MODULI ESTRATTI (caricati separatamente in campus_hub.html)
 * ─────────────────────────────────────────────────────────────
 *
 *   js/core/stato.js
 *     ordineAlfabetico, dataSimulata, getDataCorrente, simulaData,
 *     resetSimulazione, aggiornaSimBadge, aggiornaDataHeader,
 *     updateClock, toggleOrdineLista
 *
 *   js/core/turni.js
 *     turnoStudente, costruisciTurni, setTurno
 *
 *   js/core/pp.js
 *     analizzaPP (window), controllaDinnerAutomatico,
 *     mostraPopupPPBloccato, mostraPopupAssenzaProgrammata,
 *     toggleAssenza, toggleDinnerNo, verificaStudenteStandBy
 *
 *   js/core/filtri.js
 *     popolaSelectClassiFiltro, filtraPerClasse, filtraAssenti,
 *     filtraNoCena, mostraFeedbackFiltro, rimuoviEvidenziazioneTasti,
 *     applicaFiltri, validaERicerca, gestisciSaltoStanze
 *
 *   js/core/persistenza.js
 *     salvaDatiLocale, caricaDatiLocale, renderDatiRemoti,
 *     mostraDataReset, aggiornaInfoReset, cancellaNote
 *
 *   js/pannello/assenze-programmate.js
 *     assenzeProgrammate, salvaAssenzeProgrammate,
 *     caricaAssenzeProgrammate, setAssenzeProgrammateFromRemote,
 *     ymdLocale, isAssenteProgrammato, aggiungiAssenza,
 *     renderListaAssenze, rimuoviAssenza, popolaSelectStudenti,
 *     popolaSelectClassi
 *
 *   js/pannello/side-panel.js
 *     togglePanel, isPanelOpen, listener click esterno,
 *     aggiornaAltezzaOverlay, listener resize/DOMContentLoaded,
 *     popolaListaPermessi
 *
 *   js/reset/reset-permessi.js
 *     resetDati, esportaPermessiJSON, importaPermessiJSON
 *
 *   js/stampe/dinner.js         → generaPopUpStampaDinner, generaPopUpStampaPresDin
 *   js/stampe/bus.js            → generaPopUpStampaBus, BusPomeriggio, BusGenerico
 *   js/stampe/transfer.js       → generaPopUpStampaTransfer
 *   js/stampe/uscite-rooming.js → generaPopUpStampaUscite, generaPopUpStampaRooming
 *   js/stampe/ritardi.js        → generaPopUpStampaSchedaRitardi
 *   js/stampe/convitto.js       → generaPopUpStampaConvitto
 *
 * ─────────────────────────────────────────────────────────────
 * ORDINE DI CARICAMENTO (campus_hub.html)
 * ─────────────────────────────────────────────────────────────
 *
 *   1.  offline/studenti_26_offline.js
 *   2.  offline/permessi_26_offline.js
 *   3.  js/core/stato.js
 *   4.  js/core/turni.js
 *   5.  js/core/pp.js
 *   6.  js/core/filtri.js
 *   7.  js/core/persistenza.js
 *   8.  js/pannello/assenze-programmate.js
 *   9.  js/pannello/side-panel.js
 *   10. js/campus_hub-script.js          ← questo file
 *   11. js/stampe/dinner.js
 *   12. js/stampe/bus.js
 *   13. js/stampe/transfer.js
 *   14. js/stampe/uscite-rooming.js
 *   15. js/stampe/ritardi.js
 *   16. js/stampe/convitto.js
 *   17. js/reset/reset-permessi.js
 *
 * ⚠️ I file core/* devono precedere questo file perché dichiarano
 *    variabili `let` (ordineAlfabetico, dataSimulata) che qui vengono
 *    lette al primo DOMContentLoaded.
 *
 * ⚠️ I file js/stampe/* e js/reset/* possono venire dopo perché
 *    espongono solo funzioni chiamate da onclick.
 */
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
/* ─────────────────────────────────────────────────────────────
   COGNOMI CON AUTO (🚗) — lista UNICA condivisa da tutte le
   stampe che mostrano il simbolo auto:
     • generaPopUpStampaBus           (Bus Domattina)
     • generaPopUpStampaBusPomeriggio (Bus Pomeriggio)
     • generaPopUpStampaSchedaRitardi (Ritardi Mattino)
   Aggiungi qui un cognome → appare in tutte le stampe.
   ───────────────────────────────────────────────────────────── */
const COGNOMI_AUTO = [
    "RASO", "NICOLASI", "DANNA", "CONTA",
    "CHIADÒ CAPONET", "MENALDINO", "COMIOTTO", "DI TRIA"
];



let cambiTurnoManuali = {};


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


function toggleSwitchTurno(btn) {
    const r = btn.closest(".student-row");
    const cognome = r.dataset.cognome;
    cambiTurnoManuali[cognome] = !cambiTurnoManuali[cognome];
    btn.classList.toggle("modificato");
    salvaDatiLocale();
}


// --- 4. LOGICA INPUT ---
function normalizzaOrario(valore) {
    valore = valore.trim().toLowerCase().replace(".", ":").replace(",", ":");
    if (/^\d{2}$/.test(valore)) valore += ":00";
    if (/^\d{4}$/.test(valore)) valore = valore.slice(0, 2) + ":" + valore.slice(2);
    return valore;
}




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


// --- CARICAMENTO INIZIALE ---
// init() viene chiamato da campus_hub.html DOPO il caricamento dei dati da Firebase
