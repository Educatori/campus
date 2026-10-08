/**
 * js/stampe/uscite-rooming.js
 * Stampe: generaPopUpStampaUscite, generaPopUpStampaRooming.
 * Dipende da: studenticonvittori (window).
 */

// --- USCITA
function generaPopUpStampaUscite() {
    if (typeof studenticonvittori === "undefined") {
        alert("Errore: database studenticonvittori non trovato!");
        return;
    }

    const listaConvittori = studenticonvittori
        .filter((s) => s && s.cognome && s.room && s.room !== "-")
        .sort((a, b) => a.cognome.localeCompare(b.cognome));

    if (listaConvittori.length === 0) {
        alert("Nessun convittore con camera assegnata trovato.");
        return;
    }

    const totaleElementi = listaConvittori.length;
    const itemsPerCol = Math.ceil(totaleElementi / 2);

    const colonneHtml = ["", ""];

    listaConvittori.forEach((s, index) => {
        const colIndex = Math.floor(index / itemsPerCol);
        const infoClasse = [s.classe, s.percorso, s.gruppo].filter(Boolean).join(" ") || "-";

        colonneHtml[colIndex] += `
            <tr>
                <td class="t-cell t-room">${s.room}</td>
                <td class="t-cell t-class">${infoClasse}</td>
                <td class="t-cell t-name"><b>${s.cognome}</b>&nbsp;${s.nome || ""}</td>
                <td class="t-cell t-sign"></td>
                <td class="t-cell t-sign"></td>
            </tr>
        `;
    });

    function generaLayoutContenuto() {
        return `
            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlDest) => `
                    <div class="colonna">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 25px;">Room</th>
                                    <th style="width: 55px;">Classe</th>
                                    <th style="width: 140px;">Cognome e Nome</th>
                                    <th>Uscita</th>
                                    <th>Rientro</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${htmlDest}
                            </tbody>
                        </table>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    const oggi = new Date();
    const dataOggi = oggi.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Registro Uscite Convittori - ${oggi.toLocaleDateString("it-IT")}</title><style>
            @page { size: A4 portrait; margin: 0.6cm 0.6cm 0.3cm 0.6cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.1; }
            
            .page-block { page-break-after: always; position: relative; }
            .page-block:last-child { page-break-after: avoid; }
            
            .no-print-header { text-align: center; margin-top: 5px; }
            h2 { text-transform: uppercase; margin: 2px 0; font-size: 1.1rem; letter-spacing: 1px; }
            .date-subtitle { font-size: 0.8rem; margin-bottom: 5px; color: #333; font-weight: bold; text-transform: uppercase; }
            .side-indicator { position: absolute; top: 2px; right: 5px; font-size: 0.6rem; font-weight: bold; background: #ddd; padding: 1px 4px; border-radius: 3px; text-transform: uppercase; }
            
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 49.3%; display: flex; flex-direction: column; }
            
            table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #000; }
            th { background: #34495e; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; padding: 3px 2px; border: 1px solid #000; text-align: center; }
            
            .t-cell { padding: 1px 3px; font-size: 0.62rem; border-right: 1px solid #000; border-bottom: 1px solid #000; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; height: 14px; }
            .t-cell:last-child { border-right: none; }
            
            .t-room { width: 25px; text-align: center; font-weight: bold; background: #f9f9f9; }
            .t-class { width: 55px; font-size: 0.58rem; text-align: center; color: #222; }
            .t-name { width: 140px; text-transform: uppercase; text-align: left; }
            .t-sign { background: #fff; }
            
            .no-print { text-align: center; margin: 10px 0; }
            
            @media print { 
                .no-print, .no-print-header, .side-indicator { display: none !important; }
                .page-block { min-height: auto; }
            }
        </style></head><body>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:8px 35px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                    •STAMPA
                </button>
            </div>

            <div class="page-block">
                <div class="side-indicator">Fronte</div>
                <h2>ORA LIBERA 17/18 - data: </h2>
                <div class="no-print-header">
                    <div class="date-subtitle">${dataOggi}</div>
                </div>
                ${generaLayoutContenuto()}
            </div>

            <div class="page-block">
                <div class="side-indicator">Retro</div>
                <h2>ORA LIBERA 17/18 - data: </h2>
                <div class="no-print-header">
                    <div class="date-subtitle">${dataOggi}</div>
                </div>
                ${generaLayoutContenuto()}
            </div>

        </body></html>
    `);
    popup.document.close();
}

// --- ROOMING list
function generaPopUpStampaRooming() {
    const extra = [
        { cognome: "EDUCATORI", nome: "", classe: "", gruppo: "", room: "112", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_1", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_2", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_3", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_4", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_5", gruppo: "", room: "212", percorso: "" },        
        { cognome: "", nome: "", classe: "Foresteria_6", gruppo: "", room: "212", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria_7", gruppo: "", room: "212", percorso: "" }
    ];

    let listaDalDatabase = [];
    if (typeof studenticonvittori !== "undefined") {
        listaDalDatabase = listaDalDatabase.concat(studenticonvittori);
    } else {
        console.warn("Attenzione: variabile 'studenticonvittori' non trovata.");
    }

    const tuttiIPartecipanti = [...extra, ...listaDalDatabase];
    const stanze = {};

    tuttiIPartecipanti.forEach((s) => {
        if (!s.room || s.room === "-") return;
        if (!stanze[s.room]) stanze[s.room] = [];
        stanze[s.room].push(s);
    });

    const numeriStanze = Object.keys(stanze).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    const stanzePiano1 = [];
    const stanzePiano2 = [];

    numeriStanze.forEach((num) => {
        const r = parseInt(num, 10);
        stanze[num].sort((a, b) => (a.cognome || "").localeCompare(b.cognome || ""));

        if (r >= 100 && r < 200) {
            stanzePiano1.push(num);
        } else if (r >= 200) {
            stanzePiano2.push(num);
        }
    });

    function generaBoxStanze(listaStanzeDelPiano) {
        return listaStanzeDelPiano
            .map((num) => {
                const occupanti = stanze[num];
                return `
                <div class="room-box">
                    <div class="room-header">STANZA ${num}</div>
                    <table class="room-table">
                        <tbody>
                            ${occupanti
                                .map((s) => {
                                    const infoGruppo = s.gruppo ? ` • ${s.gruppo}` : "";
                                    const infoPercorso = s.percorso ? `<span class="percorso-tag">${s.percorso}</span> ` : "";
                                    const nomeDisplay =
                                        !s.cognome && s.classe === "Foresteria" ? "<i>Libero / Foresteria</i>"
                                            : `<b>${s.cognome}</b> ${s.nome || ""}`;
                                    const dettagliDisplay = s.classe ? `${infoPercorso}${s.classe}${infoGruppo}` : "";

                                    return `
                                    <tr>
                                        <td class="cell-name">${nomeDisplay}</td>
                                        <td class="cell-details">${dettagliDisplay}</td>
                                    </tr>
                                `;
                                })
                                .join("")}
                        </tbody>
                    </table>
                </div>
            `;
            })
            .join("");
    }

    const oggi = new Date();
    const dataOggi = oggi.toLocaleDateString("it-IT");

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Rooming List Verticale - ${dataOggi}</title><style>
            @page { size: A4 portrait; margin: 0.3cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.1; }
            
            .page-block { position: relative; }
            
            .no-print-header { text-align: center; margin-bottom: 4px; }
            h2 { text-transform: uppercase; margin: 0; font-size: 1.1rem; letter-spacing: 1px; display: inline-block; }
            
            .section-title { font-size: 0.72rem; font-weight: bold; text-transform: uppercase; color: #2c3e50; margin: 5px 0 3px 0; background: #ecf0f1; padding: 2px 5px; border: 1px solid #000; width: 100%; box-sizing: border-box; }
            
            .rooms-grid { display: grid; grid-template-columns: repeat(3, 31.8%); gap: 0px; justify-content: space-between; width: 100%; }
            
            .room-box { border: 1.2px solid #000; background: #fff; page-break-inside: avoid; display: flex; flex-direction: column; margin-bottom: 2px; }
            .room-header { background: #34495e; color: #fff; font-weight: bold; font-size: 0.58rem; text-align: center; padding: 1px 0; border-bottom: 1.2px solid #000; letter-spacing: 0.5px; }
            
            .room-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .room-table td { padding: 2px 3px; font-size: 0.55rem; border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; height: 12px; }
            .room-table tr:last-child td { border-bottom: none; }
            .room-table td:last-child { border-right: none; }
            
            .cell-name { width: 52%; text-transform: uppercase; text-align: left; }
            .cell-details { width: 48%; text-align: right; color: #555; font-size: 0.5rem; }
            
            .percorso-tag { font-weight: bold; color: #ba1313; font-size: 0.48rem; }
            
            .no-print { text-align: center; margin: 8px 0; }
            @media print { 
                .no-print { display: none; }
                .section-title { background: #ddd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        </style></head><body>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:8px 35px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                    •STAMPA
                </button>
            </div>

            <div class="page-block">
                <div class="no-print-header">
                    <h2>ROOMING LIST — stampata il ${dataOggi}</h2>
                </div>
                
                <div class="section-title">Piano 1 - Maschile</div>
                <div class="rooms-grid">
                    ${generaBoxStanze(stanzePiano1)}
                </div>
                
                <div class="section-title">Piano 2 - Femminile</div>
                <div class="rooms-grid">
                    ${generaBoxStanze(stanzePiano2)}
                </div>
            </div>

        </body></html>
    `);
    popup.document.close();
}