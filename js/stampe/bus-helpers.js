/** 
 * js/stampe/bus-helpers.js
 * ─────────────────────────────────────────────────────────────
 * Helper condivisi dalle 3 stampe BUS.
 *
 * Espone:
 *   • window.BUS_HELPERS.dividiInColonne(items, n)       → array di n stringhe
 *   • window.BUS_HELPERS.intestazioneColonne(colonne)    → HTML header
 *   • window.BUS_HELPERS.generaRiga(s, layout, opts)     → HTML riga
 *
 * ⚠️ Va caricato DOPO _layout.js e PRIMA di bus.js.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    /**
     * Divide un array in N colonne bilanciate.
     * Ritorna un array di N stringhe (vuote se non ci sono abbastanza item).
     *
     * @param {Array} items
     * @param {number} n
     * @returns {string[]}
     */
    function dividiInColonne(items, n) {
        const colonne = Array.from({ length: n }, () => "");
        const perColonna = Math.ceil(items.length / n);
        items.forEach((item, idx) => {
            const col = Math.min(Math.floor(idx / perColonna), n - 1);
            colonne[col] += item;   // item è già HTML
        });
        return colonne;
    }

    /**
     * Genera l'header HTML di una tabella a colonne.
     *
     * @param {Array<{label:string, classe:string}>} colonne
     * @returns {string}
     */
    function intestazioneColonne(colonne) {
        return colonne.map(c =>
            `<div class="h-cell ${c.classe}">${c.label}</div>`
        ).join("");
    }

    /**
     * Genera l'HTML di una riga studente per il bus.
     *
     * @param {Object} s      - studente (cognome, nome, classe, room, gruppo, percorso)
     * @param {string[]} layout - ordine delle celle, es. ['classe','nome','room','check','standby','note']
     * @param {Object} opts
     * @param {string} [opts.bgStyle=""]         - style inline per la riga
     * @param {string} [opts.classeHtml]         - override HTML per la cella classe
     * @param {string} [opts.gruppoHtml=""]      - HTML da appendere alla cella classe
     * @param {string} [opts.notaCustom=""]      - testo note (già composto)
     * @param {string} [opts.standBy=""]         - "➖" se in stand-by, "" altrimenti
     * @returns {string}
     */
    function generaRiga(s, layout, opts = {}) {
        const {
            bgStyle = "",
            classeHtml = s.classe,
            gruppoHtml = "",
            notaCustom = "",
            standBy = ""
        } = opts;

        const haAuto = (window.COGNOMI_AUTO || []).includes((s.cognome || "").toUpperCase());

        const celle = layout.map(tipo => {
            switch (tipo) {
                case "classe":
                    return `<div class="b-cell b-class">${classeHtml}${gruppoHtml}</div>`;
                case "nome":
                    return `<div class="b-cell b-name${haAuto ? ' cognome-auto' : ''}"><b>${s.cognome}</b></div>`;
                case "room":
                    return `<div class="b-cell b-room">${s.room || ""}</div>`;
                case "check":
                    return `<div class="b-cell b-check"></div>`;
                case "standby":
                    return `<div class="b-cell b-standby" style="font-size:0.9em;">${standBy}</div>`;
                case "note":
                    return `<div class="b-cell b-notes">${notaCustom}</div>`;
                case "day":
                    return `<div class="b-cell b-day"></div>`;
                default:
                    return `<div class="b-cell">${tipo}</div>`;
            }
        }).join("");

        return `<div class="bus-row" style="${bgStyle}">${celle}</div>`;
    }

    window.BUS_HELPERS = { dividiInColonne, intestazioneColonne, generaRiga };
    console.log("🚌 BUS_HELPERS pronto");
})();
