/**
 * js/pannello/side-panel.js
 * ─────────────────────────────────────────────────────────────
 * Side panel laterale (Gestione Permessi):
 *   • togglePanel()             → apre/chiude il pannello
 *   • isPanelOpen()             → stato del pannello
 *   • listener click esterno    → chiusura cliccando fuori
 *   • aggiornaAltezzaOverlay()  → calcola altezza dell'overlay sfocato
 *   • listener resize + DOMContentLoaded
 *   • popolaListaPermessi()     → contenuto sezione "Permessi Permanenti"
 *
 * Dipendenze runtime:
 *   - ORARI_PP                    → data-loader.js (window)
 *   - popolaSelectStudenti()      → pannello/assenze-programmate.js
 *   - popolaSelectClassi()        → pannello/assenze-programmate.js
 *   - renderListaAssenze()        → pannello/assenze-programmate.js
 *   - esportaPermessiJSON()       → reset/reset-permessi.js (o main)
 *   - importaPermessiJSON()       → reset/reset-permessi.js (o main)
 *
 * ⚠️ Caricare DOPO pannello/assenze-programmate.js.
 * ─────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────
// APERTURA / CHIUSURA
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// OVERLAY — Altezza dinamica
// ─────────────────────────────────────────────────────────────
/**
 * Calcola l'altezza dell'overlay semi-trasparente del pannello
 * in base all'altezza reale degli elementi che devono rimanere
 * visibili e cliccabili sotto di esso:
 *
 *   1. header                  → pulsante ❌ ESCI
 *   2. note-toolbar-container  → textarea note condivise
 *   3. info-reset              → "Ultimo reset condiviso: ..."
 *
 * Viene chiamata:
 *   - all'apertura del pannello (togglePanel)
 *   - al resize della finestra (se pannello aperto)
 *   - al DOMContentLoaded (con piccolo delay)
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
    // 4. Toolbar principale
    const toolbar = document.querySelector(".toolbar");
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

// ─────────────────────────────────────────────────────────────
// RICALCOLO AUTOMATICO
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// CONTENUTO SEZIONE "PERMESSI PERMANENTI"
// ─────────────────────────────────────────────────────────────
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