/**
 * CAMPUS_HUB-SCRIPT.JS — Main applicativo
 * (versione con LATE DINNER per-studente)
 */
/* ─────────────────────────────────────────────────────────────
   COSTANTI GLOBALI
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

const COGNOMI_AUTO = window.COGNOMI_AUTO || [];

let cambiTurnoManuali = {};

/* ── Late dinner manuale (per-student, toggle dalle card) ──
   Esposto su window: lo legge dinner.js (stampa) e lo scrive
   il wrapper di persistenza in fondo a questo file. */
window.lateDinnerManuali = window.lateDinnerManuali || {};


/**
 * Ricarica la lista studenti (utile dopo cambio data)
 */
function ricaricaListaStudenti() {
    const lista = document.getElementById("listaStudenti");
    if (!lista) return;
    lista.innerHTML = "";
    const classeFilter = document.getElementById("classeFilter");
    if (classeFilter) classeFilter.value = "";

    const data = getDataCorrente();
    const studenti = [...studenticonvittori];

    // ── Ripristina LATE da localStorage PRIMA di renderizzare ──
    try {
        const raw = localStorage.getItem("datiConvitto");
        if (raw) {
            const mappa = JSON.parse(raw);
            Object.entries(mappa).forEach(([cognome, info]) => {
                if (info && typeof info.late !== "undefined") {
                    window.lateDinnerManuali[cognome.toUpperCase()] = !!info.late;
                }
            });
        }
    } catch (e) { /* ignore */ }

    // ── Ripristina preferenza ordinamento da localStorage ──
    ordineAlfabetico = localStorage.getItem("ordineAlfabetico") === "true";
    aggiornaBtnOrdineLista();

    // ── Ordinamento condizionale (per room o alfabetico) ──
    studenti.sort((a, b) => {
        if (ordineAlfabetico) {
            const c = (a.cognome || "").localeCompare(b.cognome || "", "it", { sensitivity: "base" });
            if (c !== 0) return c;
            return (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
        } else {
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

        const turno = turnoStudente(s.classe, s.cognome);
        const statoPP = analizzaPP(s.cognome, data.getDay());

        const turnoHtml = `<span class="st-turno t${turno}">🍽 ${turno === 1 ? '18:30' : '19:15'}</span>`;

        const ppBadge = (statoPP.assente || statoPP.dinnerNo)
            ? `<span class="pp-badge">🔒 ${statoPP.etichetta || 'PP'}</span>`
            : "";

        const isLate = !!window.lateDinnerManuali[(s.cognome || "").toUpperCase()];

        r.innerHTML = `
            <div class="st-header">
                <div>
                    <span class="room-badge">${s.room}</span>
                    <button class="btn-switch" onclick="toggleSwitchTurno(this)" title="Cambia turno" aria-label="Cambia turno cena per ${s.cognome}">⇄</button>
                    <button class="btn-late ${isLate ? 'active' : ''}"
                            onclick="toggleLateDinner(this)"
                            title="Attiva/disattiva late dinner"
                            aria-label="Late dinner per ${s.cognome}"
                            aria-pressed="${isLate ? 'true' : 'false'}">LATE</button>
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
            r.classList.add("pp-locked");
            r.dataset.dinnerno = "1";
        } else if (statoPP.dinnerNo) {
            r.classList.add("dinner-no");
            r.classList.add("pp-locked");
            r.dataset.dinnerno = "1";
        }

        // ── LATE dinner manuale: bordo sulla card ──
        if (isLate) {
            r.classList.add("late-dinner");
        }

        lista.appendChild(r);
    });

    caricaDatiLocale();
}

// --- 1. INIZIALIZZAZIONE ---
function init() {
    if (window.APP_MODE === 'offline' && window.APP_ORIGIN !== 'locale-reale') {
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

    popolaSelectClassiFiltro();

    mostraDataReset();

    // ── badge CENE all'avvio (dopo il restore dei late) ──
    if (typeof aggiornaBadgeCene === "function") aggiornaBadgeCene();
}

function haDirittoAlBus(s) {
    return window.haDirittoAlBusVariante(s, "standard");
}

function toggleSwitchTurno(btn) {
    const r = btn.closest(".student-row");
    const cognome = r.dataset.cognome;
    cambiTurnoManuali[cognome] = !cambiTurnoManuali[cognome];
    btn.classList.toggle("modificato");
    salvaDatiLocale();
}

/* ─────────────────────────────────────────────────────────────
   LATE DINNER — toggle per-studente
   ───────────────────────────────────────────────────────────── */
function toggleLateDinner(btn) {
    const r = btn.closest(".student-row");
    if (!r) return;
    const cognome = (r.dataset.cognome || "").toUpperCase();
    const attivo  = !window.lateDinnerManuali[cognome];

    window.lateDinnerManuali[cognome] = attivo;

    btn.classList.toggle("active", attivo);
    btn.setAttribute("aria-pressed", attivo ? "true" : "false");
    r.classList.toggle("late-dinner", attivo);

    // ── aggiorna il badge CENE ──
    if (typeof aggiornaBadgeCene === "function") aggiornaBadgeCene();

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
    const giorno = dataOggetto.getDay();
    const classiLabOggi = (typeof LAB_DINNER !== "undefined" && LAB_DINNER[giorno]) || [];
    if (!classiLabOggi.includes(classe)) return false;
    if ((classe === "5A" || classe === "5B") && giorno === 4) {
        const dataKey = dataOggetto.toLocaleDateString("it-IT");
        const gLab = CALENDARIO_GRUPPI_DINNER[dataKey];
        if (!gLab) return false;
        return (gLab === "gr1" && gruppo === "G1") || (gLab === "gr2" && gruppo === "G2");
    }
    return true;
}

function isPPNoDinnerOggi(cognome, giorno) {
    return ASSENTI_PERMESSO[giorno]?.includes(cognome.toUpperCase());
}

/* ─────────────────────────────────────────────────────────────
   PERSISTENZA STATO LATE
   Wrappa salvaDatiLocale per iniettare `late` nel localStorage
   subito dopo che persistenza.js ha scritto il resto.
   (Gira in entrambe le modalità: online e offline.)
   ───────────────────────────────────────────────────────────── */
(function patchaSalvataggioLate() {
    const patch = () => {
        const _orig = window.salvaDatiLocale;
        if (typeof _orig !== 'function' || _orig.__lateWrapped) return;

        const wrapped = function () {
            // 1. Fai scrivere a persistenza.js il resto dei dati
            _orig();

            // 2. Inietta il flag `late` per ogni cognome e riscrivi
            try {
                const raw = localStorage.getItem("datiConvitto");
                if (!raw) return;
                const dati = JSON.parse(raw);
                Object.keys(dati).forEach((cognome) => {
                    if (dati[cognome] && typeof dati[cognome] === "object") {
                        const lateKey = (cognome || "").toUpperCase();
                        dati[cognome].late = !!window.lateDinnerManuali?.[lateKey];
                    }
                });
                localStorage.setItem("datiConvitto", JSON.stringify(dati));
            } catch (e) { /* ignore */ }
        };
        wrapped.__lateWrapped = true;
        window.salvaDatiLocale = wrapped;
        console.log("🔗 Wrapper LATE attivo su salvaDatiLocale");
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        patch();
    } else {
        window.addEventListener("DOMContentLoaded", patch);
    }
})();

// init() viene chiamato da campus_hub.html DOPO il caricamento dei dati
