/**
 * js/core/filtri.js
 * ─────────────────────────────────────────────────────────────
 * Ricerca e filtri della lista studenti:
 *   • popolaSelectClassiFiltro()      → riempie il <select> delle classi
 *   • filtraPerClasse()               → filtro per classe
 *   • applicaFiltri()                 → ricerca testuale libera
 *   • validaERicerca()                → filtro per numero stanza
 *   • gestisciSaltoStanze()           → salta 126-200 nel campo stanza
 *   • filtraAssenti()                 → mostra solo assenti
 *   • filtraNoCena()                  → mostra solo non cena
 *   • mostraFeedbackFiltro()          → toast con conteggio risultati
 *   • rimuoviEvidenziazioneTasti()    → pulisce i tasti filtro attivi
 *
 * Dipendenze runtime:
 *   - studenticonvittori   → data-loader.js (window)
 *
 * ⚠️ Caricare DOPO core/stato.js.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Popola il menu a tendina delle classi (#classeFilter)
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
 * Ricerca testuale libera su tutti i campi della card
 */
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

/**
 * Filtro per numero di stanza (usato dal campo #roomInput)
 */
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

/**
 * Impedisce l'inserimento di numeri di stanza nella fascia 126-200.
 * Se l'utente sta salendo (val > old) salta a 201; se sta scendendo, a 125.
 */
function gestisciSaltoStanze(el) {
    let val = parseInt(el.value);
    let old = parseInt(el.oldValue) || 0;
    if (val > 125 && val < 201 && val > old) el.value = 201;
    else if (val > 125 && val < 201 && val < old) el.value = 125;
    el.oldValue = el.value;
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

    // Evidenzia il tasto ASSENTI (event disponibile negli onclick inline)
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add("tasto-attivo");
    }

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
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add("tasto-attivo");
    }

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