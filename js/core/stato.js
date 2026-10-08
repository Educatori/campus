/**
 * js/core/stato.js
 * ─────────────────────────────────────────────────────────────
 * Stato globale e funzioni di base:
 *   • ordineAlfabetico       → preferenza ordinamento lista
 *   • dataSimulata           → data virtuale (null = reale)
 *   • getDataCorrente()      → legge la data effettiva
 *   • simulaData()           → imposta una data virtuale
 *   • resetSimulazione()     → torna alla data reale
 *   • aggiornaDataHeader()   → scrive #todayDate
 *   • aggiornaSimBadge()     → mostra/nasconde il badge simulazione
 *   • updateClock()          → orologio in header
 *   • toggleOrdineLista()    → alterna room / A-Z
 *
 * Dipendenze esterne (chiamate a runtime):
 *   - ricaricaListaStudenti()   → campus_hub-script.js
 *   - aggiornaAltezzaOverlay()  → pannello/side-panel.js (o campus_hub-script.js)
 *
 * ⚠️ Questo file va caricato PRIMA di campus_hub-script.js
 *    perché definisce `let ordineAlfabetico` e `let dataSimulata`
 *    che il resto dell'app legge.
 * ─────────────────────────────────────────────────────────────
 */

// --- VARIABILE PER ORDINAMENTO LISTA ---
let ordineAlfabetico = false; // false = per room (default), true = per cognome

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

    aggiornaDataHeader();
    aggiornaSimBadge();
    ricaricaListaStudenti();
    aggiornaAltezzaOverlay();

    console.log(`📅 Data simulata: ${data.toLocaleDateString('it-IT')}`);
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
 * Aggiorna il badge di simulazione (#simBadge)
 */
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

/**
 * Scrive la data corrente in #todayDate
 */
function aggiornaDataHeader() {
    const dateEl = document.getElementById("todayDate");
    if (!dateEl) return;
    const d = getDataCorrente();
    dateEl.innerText = d.toLocaleDateString("it-IT", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}

/**
 * Aggiorna l'orologio in #digitalClock
 */
function updateClock() {
    const el = document.getElementById("digitalClock");
    if (el) el.innerText = new Date().toLocaleTimeString("it-IT");
}

/**
 * Alterna l'ordinamento della lista studenti tra "per room" e "alfabetico per cognome"
 */
function toggleOrdineLista() {
    ordineAlfabetico = !ordineAlfabetico;

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

    localStorage.setItem("ordineAlfabetico", ordineAlfabetico);

    ricaricaListaStudenti();
}