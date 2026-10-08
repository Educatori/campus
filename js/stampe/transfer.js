/**
 * js/stampe/transfer.js
 * Stampa TRANSFER LUNCH.
 * Dipende da: tuttiStudenti, LAB_PRANZO (window).
 */
function generaPopUpStampaTransfer() {
    const oggi = getDataCorrente();
    const dataTestuale =
        document.getElementById("todayDate")?.innerText ||
        oggi.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    if (typeof tuttiStudenti === "undefined" || tuttiStudenti.length === 0) {
        console.error("Errore: tuttiStudenti non definito o vuoto.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    const giornoSettimana = oggi.getDay();
    const labConfig = typeof LAB_PRANZO !== "undefined" ? LAB_PRANZO : {};
    const classiInLabOggi = labConfig[giornoSettimana] || [];

    console.log(`📅 Transfer Lunch - Data: ${oggi.toLocaleDateString('it-IT')}, Giorno: ${giornoSettimana}`);
    console.log(`📋 Classi in laboratorio oggi:`, classiInLabOggi);

    const classi = {};
    const CLASSI_ESCLUSE = ["1P", "2P", "3P", "2A", "2B", "4C"];

    tuttiStudenti.forEach((s) => {
        if (!s.cognome || s.cognome.trim() === "") return;
        const nomeClasse = s.classe ? s.classe.toUpperCase().trim() : "SENZA CLASSE";
        if (CLASSI_ESCLUSE.includes(nomeClasse)) return;
        if (!classi[nomeClasse]) classi[nomeClasse] = [];
        classi[nomeClasse].push(s);
    });

    const elencoClassi = Object.keys(classi).sort();

    if (elencoClassi.length === 0) {
        alert("Nessuno studente disponibile per la stampa.");
        return;
    }

    elencoClassi.forEach((nomeClasse) => {
        classi[nomeClasse].sort((a, b) => a.cognome.localeCompare(b.cognome));
        classi[nomeClasse].forEach((s) => {
            s.haLabOggi = classiInLabOggi.includes(nomeClasse);
        });
    });

    const totaleElementi = elencoClassi.reduce((acc, c) => acc + classi[c].length, 0);
    const targetPerColonna = Math.ceil(totaleElementi / 3);

    const colonneHtml = ["", "", ""];
    let colonnaCorrenteIdx = 0;
    let elementiInColonnaCorrente = 0;

    elencoClassi.forEach((nomeClasse) => {
        const studentiClasse = classi[nomeClasse];
        const quantiStudenti = studentiClasse.length;

        if (
            elementiInColonnaCorrente > 0 &&
            elementiInColonnaCorrente + quantiStudenti / 1.5 > targetPerColonna &&
            colonnaCorrenteIdx < 2
        ) {
            colonnaCorrenteIdx++;
            elementiInColonnaCorrente = 0;
        }

        let classeTableHtml = `
            <div class="blocco-classe">
                <table>
                    <tbody>
        `;

        studentiClasse.forEach((s) => {
            const roomNum = parseInt(s.room, 10);
            const isConvittore = !isNaN(roomNum) && roomNum >= 101 && roomNum <= 221;
            let roomInfo = s.room && s.room !== "-" ? s.room : "-";

            const dettagliTag = [s.percorso ? s.percorso : "", s.gruppo ? "• " + s.gruppo : ""]
                .filter(Boolean)
                .join(" ");

            let bgStyle = s.haLabOggi ? "background-color: #fff2cc;" : "";
            let classeBadge = s.haLabOggi ? `<b>${nomeClasse}</b> <span class="lab-badge">(LAB)</span>` : `<b>${nomeClasse}</b>`;
            const esternoClass = !isConvittore ? "esterno" : "";

            classeTableHtml += `
                <tr class="${esternoClass}" style="${bgStyle}">
                    <td class="t-cell t-room">${roomInfo}</td>
                    <td class="t-cell t-name"><b>${s.cognome}</b>&nbsp;${s.nome || ""}</td>
                    <td class="t-cell t-class">${classeBadge}</td>
                    <td class="t-cell t-details">${dettagliTag}</td>
                </tr>
            `;
            elementiInColonnaCorrente++;
        });

        classeTableHtml += `
                    </tbody>
                </table>
            </div>
        `;

        colonneHtml[colonnaCorrenteIdx] += classeTableHtml;
    });

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Transfer Lunch Completo - ${dataOggi}</title><style>
            @page { size: A4 portrait; margin: 0.6cm 0.4cm 0.5cm 0.4cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h2 { text-align: center; text-transform: uppercase; margin: 0; font-size: 1.0rem; }
            .date-subtitle { text-align: center; font-size: 0.75rem; margin-bottom: 3px; color: #444; }
            .lab-info { font-size: 0.95rem; font-weight: bold; color: #b7950b; }
            .timestamp { position: absolute; top: 3px; right: 10px; font-size: 0.55rem; color: #777; }
            
            .grid-container { display: flex; gap: 6px; justify-content: space-between; align-items: flex-start; }
            .colonna { width: 33.1%; display: flex; flex-direction: column; }
            
            .fake-header { display: flex; background: #2c3e50; color: white; font-weight: bold; font-size: 0.52rem; text-transform: uppercase; height: 14px; box-sizing: border-box; border: 1.2px solid #000; margin-bottom: 2px; }
            .h-cell { padding: 2px 2px; text-align: left; display: flex; align-items: center; justify-content: center; height: 100%; box-sizing: border-box; border-right: 1px solid #000; }
            .h-cell:last-child { border-right: none; }
            
            .blocco-classe { page-break-inside: avoid !important; break-inside: avoid-page !important; margin-bottom: 4px; width: 100%; }
            
            table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.2px solid #000; }
            tr { height: 15px !important; box-sizing: border-box; }
            
            .t-cell { padding: 0px 2px; font-size: 0.54rem; border-right: 1px solid #000; border-bottom: 1px solid #ddd; text-align: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; height: 13px !important; line-height: 12px; box-sizing: border-box; }
            tr:last-child .t-cell { border-bottom: none; }
            .t-cell:last-child { border-right: none; }
            
            tr.esterno td.t-room { border-left: 2px dashed #7f8c8d; }
            
            .t-room, .h-room { width: 22px; text-align: center; }
            .t-room { font-weight: bold; background: #f5f5f5; }
            .t-name, .h-name { width: 105px; text-transform: uppercase; }
            .t-class, .h-class { width: 50px; text-align: center; }
            .t-details, .h-notes { flex-grow: 1; }
            .t-details { font-size: 0.50rem; color: #444; }
            
            .lab-badge { font-size: 0.44rem; color: #b7950b; font-weight: bold; }
            
            .no-print { text-align: center; margin-bottom: 4px; }
            @media print { 
                .no-print { display: none; }
            }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            <h2>TRANSFER LUNCH</h2>
            <div class="date-subtitle">
    <span class="lab-info">LAB [LUN 5A+3A BUS 19-31-47]; [MAR 4A+3B BUS 31-39-42]; <br> [MER 4B+1A BUS 34-43-41]; [GIO 4C+1B BUS 34-37-44]</span>
    — Studenti tot: <b>${totaleElementi}</b>
</div>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:4px 30px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    •STAMPA
                </button>
            </div>

            <div class="grid-container">
                ${colonneHtml
                    .map((htmlDest) => {
                        if (!htmlDest.trim()) return "";
                        return `
                    <div class="colonna">
                        <div class="fake-header">
                            <div class="h-cell h-room">Room</div>
                            <div class="h-cell h-name">Cognome e Nome</div>
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-notes">Note</div>
                        </div>
                        ${htmlDest}
                    </div>
                    `;
                    })
                    .join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}