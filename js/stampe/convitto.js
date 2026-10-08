/**
 * js/stampe/convitto.js
 * Stampa RIEPILOGO CONVITTO.
 * Dipende da: studenticonvittori, ORARI_PP (window),
 *             haDirittoAlBus, verificaStudenteStandBy (global).
 */
function generaPopUpStampaConvitto() {
    const dataStampa = document.getElementById("todayDate").innerText;
    const oraStampa = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const dataOggiStampa = new Date().toLocaleDateString("it-IT");
    const giornoSettimana = new Date().getDay();
    const camere = {};

    document.querySelectorAll(".student-row").forEach((r) => {
        const room = r.dataset.room || "---";
        const cognome = r.dataset.cognome;
        let ppOut = "", ppIn = "";

        if (ORARI_PP[cognome] && ORARI_PP[cognome][giornoSettimana]) {
            ppOut = ORARI_PP[cognome][giornoSettimana].out;
            ppIn  = ORARI_PP[cognome][giornoSettimana].in;
        }

        const sOriginale = studenticonvittori.find((st) => st.cognome === cognome);

        if (!camere[room]) camere[room] = [];
        camere[room].push({
            classe:   r.dataset.classe,
            percorso: r.dataset.percorso,
            cognome:  cognome,
            dinnerno: r.dataset.dinnerno,
            presente: !r.classList.contains("assente"),
            oraU:     r.querySelector(".in-u").value,
            oraI:     r.querySelector(".in-i").value,
            ppOut:    ppOut,
            ppIn:     ppIn,
            gruppo:   r.dataset.gruppo,
            bus:      haDirittoAlBus(sOriginale),
            isStandBy: verificaStudenteStandBy(r),
            isForesteria: false
        });
    });

    function righeForesteriaVuote() {
        const riga = () => ({
            classe:   "Foresteria",
            percorso: "",
            cognome:  "",
            gruppo:   "",
            dinnerno: "0",
            presente: true,
            oraU:     "",
            oraI:     "",
            ppOut:    "",
            ppIn:     "",
            bus:      false,
            isStandBy: false,
            isForesteria: true
        });
        return [riga(), riga(), riga()];
    }

    const CAMERA_FORESTERIA_M = "124";
    const CAMERA_FORESTERIA_F = "212";

    if (!camere[CAMERA_FORESTERIA_M]) {
        camere[CAMERA_FORESTERIA_M] = righeForesteriaVuote();
    }
    if (!camere[CAMERA_FORESTERIA_F]) {
        camere[CAMERA_FORESTERIA_F] = righeForesteriaVuote();
    }

    const camereOrdinate = Object.keys(camere).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );

    const camereSenzaForesteria = camereOrdinate.filter(
        r => r !== CAMERA_FORESTERIA_M && r !== CAMERA_FORESTERIA_F
    );

    const camereMaschili = camereSenzaForesteria.filter(r => r <= "125");
    camereMaschili.push(CAMERA_FORESTERIA_M);

    const camereFemminili = camereSenzaForesteria.filter(r => r > "125");
    camereFemminili.push(CAMERA_FORESTERIA_F);

    function generaRigheCamere(listaCamere) {
        return listaCamere
            .map((room) => {
                const occupanti = camere[room] || [];
                return occupanti
                    .map((s, idx) => {
                        const isLastRow = idx === occupanti.length - 1;
                        const bClass = isLastRow
                            ? 'class="border-bottom-bold"'
                            : 'class="border-dashed"';
                        const bClassGray = isLastRow
                            ? 'class="border-bottom-bold bg-gray"'
                            : 'class="border-dashed bg-gray"';
                        const bClassCognome = isLastRow
                            ? 'class="border-bottom-bold col-cognome"'
                            : 'class="border-dashed col-cognome"';

                        return `<tr>
                            ${idx === 0 ? `<td rowspan="${occupanti.length}" class="room-header border-bottom-bold">${room}</td>` : ""}
                            <td ${bClass}>${s.classe} ${s.percorso || ""}</td>
                            <td ${bClassCognome}><b>${s.cognome}</b> ${s.gruppo ? "(" + s.gruppo + ")" : ""}</td>
                            <td ${bClass}>${!s.isForesteria && s.presente ? "X" : ""}</td>
                            <td ${bClass}>${!s.isForesteria && !s.presente ? "X" : ""}</td>
                            <td ${bClassGray}>${s.oraU}</td>
                            <td ${bClass}>${s.oraI}</td>
                            <td ${bClassGray}><b>${s.ppOut}</b></td>
                            <td ${bClass}><b>${s.ppIn}</b></td>
                            <td ${bClassGray}>${s.dinnerno === "1" ? "X" : ""}</td>
                            <td ${bClass}></td>
                            <td ${bClassGray}></td>
                            <td ${bClassGray}>${s.isStandBy ? "➖" : ""}</td>
                            <td ${bClass}>${s.bus ? "⭕" : ""}</td>
                        </tr>`;
                    })
                    .join("");
            })
            .join("");
    }

    const popup = window.open("", "_blank", "width=1200,height=800");

    const hookTestataTabella = `<tr>
        <th>Room</th><th>Classe</th><th class="col-cognome">Cognome</th><th>Presente</th><th>Assente</th><th>Uscita</th><th>Ingresso</th><th>PP Uscita</th><th>PP Rientro</th><th>Dinner NO</th><th>Notte SI</th><th>Notte NO</th><th>Stand-by</th><th>7:30</th>
    </tr>`;

    popup.document.write(`
    <html><head><title>Riepilogo Convitto - ${dataStampa}</title><style>
        @page { size: A3 portrait; margin: 0.6cm 0.3cm 0.3cm 0.3cm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h2 { text-align: center; text-transform: uppercase; font-size: 1.1em; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 5px; }

        tr { height: 21px !important; }
        th, td {
            border: 1px solid #000;
            padding: 1px 2px;
            text-align: center;
            font-size: 0.65em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            height: 21px !important;
            box-sizing: border-box;
            line-height: 19px;
        }

        th { background: #f2f2f2; font-weight: bold; }
        .room-header { background: #eee; font-weight: bold; width: 45px; white-space: normal; line-height: 1.1; }
        .border-bottom-bold { border-bottom: 2.5px solid #000 !important; }
        .border-dashed { border-bottom: 1px dashed #999 !important; }
        .col-cognome { text-align: left !important; padding-left: 4px !important; width: 130px; text-transform: uppercase; }
        .bg-gray { background: #f9f9f9 !important; }
        .page-break { page-break-after: always; page-break-inside: avoid; }
        .footer-timestamp { text-align: right; font-size: 0.70em; margin-top: 5px; font-style: italic; color: #555; }
        .no-print { text-align: center; margin: 10px; }
        @media print { .no-print { display: none; } }
    </style></head><body>
        <div class="no-print"><button onclick="window.print()" style="padding:15px 50px; background:#27ae60; color:white; font-weight:bold; border-radius:80px; border:none; cursor:pointer;">•STAMPA</button></div>

        <h2>MASCHILE - piano 1° - ${dataStampa}</h2>
        <table>
            <thead>${hookTestataTabella}</thead>
            <tbody>${generaRigheCamere(camereMaschili)}</tbody>
        </table>

        <div class="page-break"></div>

        <h2>FEMMINILE - piano 2° - ${dataStampa}</h2>
        <table>
            <thead>${hookTestataTabella}</thead>
            <tbody>${generaRigheCamere(camereFemminili)}</tbody>
        </table>

        <div class="footer-timestamp">aggiornamento ${dataOggiStampa} ore ${oraStampa}</div>
    </body></html>`);
    popup.document.close();
}