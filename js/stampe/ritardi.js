/**
 * js/stampe/ritardi.js
 * Stampa scheda RITARDI MATTINO.
 * Dipende da: studenticonvittori (window), COGNOMI_AUTO (global).
 */
    function generaPopUpStampaSchedaRitardi() {
    const oggi = getDataCorrente();                 // ← data simulata
    const oggiReale = new Date();                   // ← solo per il timestamp di generazione
    const dataOggi = oggiReale.toLocaleDateString("it-IT");
    const oraEsatta = oggiReale.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const meseCorrente = oggi.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
    const meseCapitalizzato = meseCorrente.charAt(0).toUpperCase() + meseCorrente.slice(1);

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        const classe = s.classe.toUpperCase();
        const escluse = ["2A", "2B"];
        return !escluse.includes(classe) && !classe.includes("P");
    });

    validi.sort((a, b) => a.cognome.localeCompare(b.cognome, "it", { sensitivity: "base" }));

    const anno = oggi.getFullYear();
    const mese = oggi.getMonth();
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();

    const LETTERE_GIORNI = ["D", "L", "M", "M", "G", "V", "S"];
    const GIORNI_ATTIVI = [2, 3, 4, 5];

    const giorniDaMostrare = [];
    for (let g = 1; g <= giorniNelMese; g++) {
        const dataGiorno = new Date(anno, mese, g);
        if (GIORNI_ATTIVI.includes(dataGiorno.getDay())) {
            giorniDaMostrare.push({
                numero: g,
                lettera: LETTERE_GIORNI[dataGiorno.getDay()]
            });
        }
    }

    const NUM_CASELLE = giorniDaMostrare.length;

    let headerLettere = "";
    let headerNumeri = "";
    giorniDaMostrare.forEach(({ numero, lettera }) => {
        headerLettere += `<th class="h-day-letter">${lettera}</th>`;
        headerNumeri  += `<th class="h-day-num">${numero}</th>`;
    });

    const righeStudenti = validi.map((s) => {
        const cognomeUpper = s.cognome.toUpperCase();
        const classeUpper = (s.classe || "").toUpperCase();

        let notaCustom = "";
        if (COGNOMI_AUTO.includes(cognomeUpper)) {
            notaCustom = "🚗";
        }
        if (classeUpper === "4C") {
            notaCustom = notaCustom ? notaCustom + " solo GIO" : "solo GIO";
        } else if (classeUpper === "5B") {
            notaCustom = notaCustom ? notaCustom + " mai GIO" : "mai GIO";
        }

        const classeHtml = classeUpper === "4C"
            ? `<b>${s.classe}</b>`
            : (s.classe || "");

        let celleGiorni = "";
        for (let i = 0; i < NUM_CASELLE; i++) {
            celleGiorni += `<td class="t-day"></td>`;
        }

        return `
            <tr>
                <td class="t-cell t-class">${classeHtml}</td>
                <td class="t-cell t-name"><b>${s.cognome}</b></td>
                <td class="t-cell t-room">${s.room || ""}</td>
                <td class="t-cell t-notes">${notaCustom}</td>
                ${celleGiorni}
            </tr>
        `;
    }).join("");

    const popup = window.open("", "_blank", "width=1200,height=900");
    popup.document.write(`
        <html><head><title>Ritardi Mattino - ${meseCapitalizzato}</title><style>
            @page { size: A4 portrait; margin: 0.3cm 0.4cm 0.3cm 0.4cm; }
            html { height: 100%; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 0; padding: 0;
                color: #000; line-height: 1.05;
                height: 100%;
                display: flex;
                flex-direction: column;
                -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            .header-block { flex: 0 0 auto; position: relative; }
            .table-wrap   { flex: 1 1 auto; min-height: 0; display: flex; }
            .footer-block { flex: 0 0 auto; }

            h2 {
                text-align: center; text-transform: uppercase;
                margin: 1px 0 0 0; font-size: 0.9rem; letter-spacing: 1px;
            }
            .date-subtitle {
                text-align: center; font-size: 0.68rem;
                margin-bottom: 2px; color: #444;
                text-transform: capitalize; font-style: italic;
            }
            .timestamp {
                position: absolute; top: 1px; right: 6px;
                font-size: 0.5rem; color: #777;
            }
            table {
                width: 100%; height: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                border: 1px solid #000;
            }
            thead th {
                background: #333; color: #fff;
                font-weight: bold; font-size: 0.5rem;
                text-transform: uppercase; padding: 1px 1px;
                border: 1px solid #000; text-align: center;
            }
            .h-class { width: 38px; }
            .h-name  { width: 105px; text-align: left; padding-left: 3px; }
            .h-room  { width: 30px; }
            .h-notes { width: 65px; text-align: left; padding-left: 3px; }
            .h-day-letter { font-size: 0.52rem; background: #555; color: #fff; padding: 1px 0; }
            .h-day-num { font-size: 0.45rem; background: #777; color: #fff; padding: 0; }
            tbody tr { height: auto; }
            .t-cell {
                padding: 0 2px; font-size: 0.55rem;
                border-right: 1px solid #000;
                border-bottom: 1px solid #000;
                overflow: hidden; white-space: nowrap;
                text-overflow: ellipsis;
                vertical-align: middle;
                line-height: 1.05;
            }
            .t-cell:last-child { border-right: none; }
            .t-class { text-align: center; font-weight: bold; background: #f5f5f5; }
            .t-name  { text-transform: uppercase; text-align: left; padding-left: 3px; font-size: 0.58rem; }
            .t-room  { text-align: center; font-weight: bold; background: #fafafa; }
            .t-notes { font-size: 0.5rem; color: #444; text-align: left; padding-left: 3px; }
            .t-day {
                border-right: 1px solid #000;
                border-bottom: 1px solid #000;
                background: #fff;
                padding: 0;
                vertical-align: middle;
            }
            .t-day:last-child { border-right: none; }
            .footer-block {
                text-align: right; font-size: 0.5rem;
                margin-top: 1px; font-style: italic; color: #555;
            }
            .no-print { text-align: center; margin: 3px 0; }
            @media print {
                .no-print { display: none !important; }
                body { padding: 0; }
                .timestamp { display: none !important; }
                .t-cell { padding: 0 2px !important; }
                .h-day-letter { padding: 0 !important; }
                .h-day-num    { padding: 0 !important; }
            }
        </style></head><body>

            <div class="header-block">
                <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
                <h2>Ritardi Mattino</h2>
                <div class="date-subtitle">Trasporto del mese di ${meseCapitalizzato}</div>
                <div class="no-print">
                    <button onclick="window.print()" style="padding:4px 24px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.8rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        •STAMPA
                    </button>
                </div>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th class="h-class" rowspan="2">Classe</th>
                            <th class="h-name"  rowspan="2">Cognome</th>
                            <th class="h-room"  rowspan="2">Room</th>
                            <th class="h-notes" rowspan="2">Note</th>
                            ${headerLettere}
                        </tr>
                        <tr>
                            ${headerNumeri}
                        </tr>
                    </thead>
                    <tbody>
                        ${righeStudenti}
                    </tbody>
                </table>
            </div>

            <div class="footer-block">
                Totale studenti: ${validi.length} — Giorni: ${NUM_CASELLE} (Mar-Ven) di ${giorniNelMese}
            </div>

        </body></html>
    `);
    popup.document.close();
    popup.focus();
}