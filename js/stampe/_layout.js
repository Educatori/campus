/**
 * js/stampe/_layout.js
 * ─────────────────────────────────────────────────────────────
 * CSS e HTML condivisi da tutte le stampe.
 *
 * Espone:
 *   • window.STAMPA_LAYOUT.cssBase(opts)      → CSS comune
 *   • window.STAMPA_LAYOUT.intestazione(opts) → HTML titolo + sottotitolo
 *   • window.STAMPA_LAYOUT.bottoneStampa(opts)→ HTML bottone stampa
 *
 * ⚠️ Va caricato PRIMA degli altri file di stampa.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    /**
     * CSS comune a tutte le stampe.
     *
     * @param {Object} opts
     * @param {string} [opts.pageSize="A4 landscape"]  - es. "A4 portrait"
     * @param {string} [opts.pageMargin="0.4cm"]       - es. "0.6cm 0.4cm"
     * @param {string} [opts.fontFamily]               - override font-family
     * @param {boolean} [opts.printColorAdjust=true]   - abilita colori in stampa
     * @returns {string}
     */
    function cssBase(opts = {}) {
        const {
            pageSize = "A4 landscape",
            pageMargin = "0.4cm",
            fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            printColorAdjust = true
        } = opts;

        const colorAdjust = printColorAdjust
            ? "-webkit-print-color-adjust: exact; print-color-adjust: exact;"
            : "";

        return `
            @page { size: ${pageSize}; margin: ${pageMargin}; }
            body {
                font-family: ${fontFamily};
                margin: 0; padding: 5px;
                color: #000; line-height: 1.1;
                ${colorAdjust}
            }
            .timestamp {
                position: absolute; top: 5px; right: 10px;
                font-size: 0.6rem; color: #777;
            }
            .no-print {
                display: flex; justify-content: center; gap: 12px;
                margin-bottom: 10px;
            }
            .no-print button {
                padding: 6px 26px; color: white; font-weight: bold;
                border-radius: 20px; border: none; cursor: pointer;
                font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: filter 0.2s;
            }
            .no-print button:hover { filter: brightness(1.1); }
            .btn-stampa { background: #27ae60; }
            @media print {
                .no-print { display: none !important; }
            }
        `;
    }

    /**
     * HTML dell'intestazione (titolo + sottotitolo opzionale).
     *
     * @param {Object} opts
     * @param {string} opts.titolo         - testo del titolo (obbligatorio)
     * @param {string} [opts.sottotitolo]  - testo sotto il titolo
     * @param {string} [opts.titoloStyle]  - style inline per h2
     * @param {string} [opts.sottotitoloStyle]
     * @returns {string}
     */
    function intestazione(opts = {}) {
        const { titolo = "", sottotitolo = "", titoloStyle = "", sottotitoloStyle = "" } = opts;
        const h2 = titolo
            ? `<h2 style="text-align:center;text-transform:uppercase;margin:2px 0 6px 0;font-size:1.1rem;${titoloStyle}">${titolo}</h2>`
            : "";
        const sub = sottotitolo
            ? `<div class="date-subtitle" style="text-align:center;font-size:0.85rem;margin-bottom:8px;color:#444;${sottotitoloStyle}">${sottotitolo}</div>`
            : "";
        return h2 + sub;
    }

    /**
     * HTML del bottone stampa.
     *
     * @param {Object} opts
     * @param {string} [opts.testo="•STAMPA"]
     * @param {string} [opts.background="#27ae60"]
     * @returns {string}
     */
    function bottoneStampa(opts = {}) {
        const { testo = "•STAMPA", background = "#27ae60" } = opts;
        return `
            <div class="no-print">
                <button class="btn-stampa"
                        onclick="window.print()"
                        style="background:${background}">
                    ${testo}
                </button>
            </div>
        `;
    }

    window.STAMPA_LAYOUT = { cssBase, intestazione, bottoneStampa };
    console.log("🎨 STAMPA_LAYOUT pronto");
})();