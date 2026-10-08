/**
 * js/stampe/bus.js
 * ─────────────────────────────────────────────────────────────
 * Stampe BUS — tre varianti:
 *   • generaPopUpStampaBus            (bus domattina)
 *   • generaPopUpStampaBusPomeriggio  (bus pomeriggio, appello settimanale)
 *   • generaPopUpStampaBusGenerico    (schema generico)
 *
 * Dipendenze (globali al momento della chiamata):
 *   - studenticonvittori       → data-loader.js (window)
 *   - COGNOMI_AUTO             → campus_hub-script.js (const globale)
 *   - verificaStudenteStandBy  → campus_hub-script.js
 *   - document.getElementById("todayDate")
 *
 * Caricato con <script src="js/stampe/bus.js"></script>
 * DOPO campus_hub-script.js.
 * ─────────────────────────────────────────────────────────────
 */

// --- MATTINO BUS
function generaPopUpStampaBus(ordinamento) {
    // ordinamento: 'alfabetico' (default) | 'perClasse'
    ordinamento = ordinamento || 'alfabetico';

    const oggi = new Date();
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    // Data di domani (per il sottotitolo "Trasporto di domani  ...")
    const domani = new Date(oggi);
    domani.setDate(oggi.getDate() + 1);
    const dataDomaniTestuale = domani.toLocaleDateString("it-IT", {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // 1. FILTRO CLASSI ESCLUSE
    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        const classe = s.classe.toUpperCase();
        const escluse = ["2A", "2B"];
        return !escluse.includes(classe) && !classe.includes("P");
    });

    // 2. ORDINAMENTO
    if (ordinamento === 'perClasse') {
        validi.sort((a, b) => {
            const compClasse = a.classe.localeCompare(b.classe, undefined, { numeric: true });
            if (compClasse !== 0) return compClasse;
            return a.cognome.localeCompare(b.cognome);
        });
    } else {
        const classiInFondo = ["4C", "5A", "5B"];

        const resto = validi.filter((s) => !classiInFondo.includes(s.classe));
        const classe4C = validi.filter((s) => s.classe === "4C");
        const classe5A = validi.filter((s) => s.classe === "5A");
        const classe5B = validi.filter((s) => s.classe === "5B");

        resto.sort((a, b) => a.cognome.localeCompare(b.cognome));

        const ordinaPerGruppoECognome = (a, b) => {
            const gA = a.gruppo || "";
            const gB = b.gruppo || "";
            return (gA + a.cognome).localeCompare(gB + b.cognome);
        };

        classe4C.sort(ordinaPerGruppoECognome);
        classe5A.sort(ordinaPerGruppoECognome);
        classe5B.sort(ordinaPerGruppoECognome);

        validi.length = 0;
        validi.push(...resto, ...classe4C, ...classe5A, ...classe5B);
    }

    // 3. DISTRIBUZIONE IN 3 COLONNE
    const colonneHtml = ["", "", ""];

    // Testo della nota da mettere in fondo all'ultima colonna
    const notaInTesta = "LABORATORI <br> LUN 5A+3A 🍸 MAR 4A+3B <br> MER 4B+1A 🍹 GIO 4C+1B";

    // Funzione per generare una riga studente (con note automatiche)
    function generaRigaStudente(s) {
                let bgStyle = "";
        if (s.classe === "5A" || s.classe === "5B") {
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8; border-left: 4px solid #2c3e50;";
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7; border-left: 4px dotted #2c3e50;";
        } else if (s.classe === "4C") {
            bgStyle = "border-left: 4px dashed #2c3e50;";
        }

        // Lookup stand-by dal DOM
        const rigaElemento = document.querySelector(`.student-row[data-cognome="${s.cognome}"]`);
        let visualizzaStandBy = "";
        if (rigaElemento && typeof verificaStudenteStandBy === "function") {
            visualizzaStandBy = verificaStudenteStandBy(rigaElemento) ? "➖" : "";
        }

               // ── NOTE ──
        let notaCustom = "";
        const classeUpper = s.classe.toUpperCase();
        const cognomeUpper = s.cognome.toUpperCase();

        // 🚗 Auto PRIMA (se il cognome è nella lista)
        if (COGNOMI_AUTO.includes(cognomeUpper)) {
            notaCustom = "🚗";
        }

        // Poi "solo GIO" / "mai GIO" accodato dopo l'eventuale 🚗
        if (classeUpper === "4C") {
            notaCustom = notaCustom ? notaCustom + " solo GIO" : "solo GIO";
        } else if (classeUpper === "5B") {
            notaCustom = notaCustom ? notaCustom + " mai GIO" : "mai GIO";
        
       }

        // ── EVIDENZIA 4C e G2 in grassetto (solo classe/gruppo) ──
        const classeHtml  = classeUpper === "4C"
            ? `<b>${s.classe}</b>`
            : s.classe;

        const gruppoHtml = s.gruppo
            ? (s.gruppo.toUpperCase() === "G2"
                ? ` • <b>${s.gruppo}</b>`
                : ` • ${s.gruppo}`)
            : "";

        return `
            <div class="bus-row" style="${bgStyle}">
                <div class="b-cell b-class">${classeHtml}${gruppoHtml}</div>
                <div class="b-cell b-name"><b>${s.cognome}</b></div>
                <div class="b-cell b-room">${s.room || ""}</div>
                <div class="b-cell b-check"></div>
                <div class="b-cell b-standby" style="font-size: 0.9em;">${visualizzaStandBy}</div>
                <div class="b-cell b-notes">${notaCustom}</div>
            </div>
        `;
    }

    // ── DISTRIBUZIONE ──
    // Colonne 1-2: resto + 4C bilanciati
    // Colonna 3: SOLO 5A + 5B, con nota LAB in fondo
    const gruppoResto  = validi.filter(s => s.classe !== "5A" && s.classe !== "5B");
    const gruppoQuinte = validi.filter(s => s.classe === "5A" || s.classe === "5B");

    const itemsPerCol12 = Math.ceil(gruppoResto.length / 2);

    gruppoResto.forEach((s, idx) => {
        const col = Math.min(Math.floor(idx / itemsPerCol12), 1);
        colonneHtml[col] += generaRigaStudente(s);
    });

    // Terza colonna: prima le quinte, poi la nota LAB in fondo
    gruppoQuinte.forEach((s) => {
        colonneHtml[2] += generaRigaStudente(s);
    });

    colonneHtml[2] += `
        <div class="bus-row nota-colonna" style="background:#f0f0f0; font-weight:bold; font-style:italic; justify-content:center;">
            <div class="b-cell" style="width:100%; text-align:center; justify-content:center;">
                ${notaInTesta}
            </div>
        </div>
    `;

    // Calcolo presenti (senza stand-by) e totale bus
    const totaleBus = validi.length;
    const presenti = validi.filter((s) => {
        const rigaElemento = document.querySelector(`.student-row[data-cognome="${s.cognome}"]`);
        if (!rigaElemento || typeof verificaStudenteStandBy !== "function") return true;
        return !verificaStudenteStandBy(rigaElemento);
    }).length;

    // 4. POPUP
    const titolo = ordinamento === 'perClasse' ? "BUS MATTINA — per classe" : "BUS MATTINA";

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>${titolo}</title><style>
            @page { size: A4 landscape; margin: 0.6cm 0.4cm 0.4cm 0.4cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 5px; color: #000; line-height: 1.1; }
            h2 { text-align: center; text-transform: uppercase; margin: 2px 0 6px 0; font-size: 1.1rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; font-weight: bold; margin-bottom: 8px; color: #111; text-transform: capitalize; }
            .timestamp { position: absolute; top: 5px; right: 10px; font-size: 0.6rem; color: #777; }

            .toolbar-stampa { display: flex; justify-content: center; gap: 12px; margin-bottom: 10px; }

            .toolbar-stampa button {
                padding: 6px 26px;
                color: white;
                font-weight: bold;
                border-radius: 20px;
                border: none;
                cursor: pointer;
                font-size: 0.85rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: filter 0.2s;
            }
            .toolbar-stampa button:hover { filter: brightness(1.1); }
            .btn-stampa { background: #27ae60; }
            .btn-per-classe { background: #7c3aed; }

            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }

            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; border: 1px solid #000; height: 18px; }

            .bus-row { display: flex; font-size: 0.68rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px; }

            .nota-colonna {
                font-size: 0.7rem;
                height: auto;
                min-height: 22px;
                border: 1px solid #000;
                border-bottom: 2px solid #000;
            }

            .b-cell, .h-cell { padding: 2px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; }

            .b-class, .h-class { width: 65px; font-size: 0.55rem; }
            .b-class { border-right: 1px solid #ccc; }
            .h-class { border-right: 1px solid #555; }

            .b-name, .h-name { width: 105px; text-align: left; justify-content: flex-start; padding-left: 4px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }

            .b-room, .h-room { width: 25px; font-size: 0.58rem; }
            .b-room { border-right: 1px solid #ccc; font-weight: bold; background: #f5f5f5; }
            .h-room { border-right: 1px solid #555; }

            .b-check, .h-check { width: 22px; }
            .b-check { border-right: 1px solid #ccc; }
            .h-check { border-right: 1px solid #555; }

            .b-standby, .h-standby { width: 25px; border-right: 1px solid #ccc; }
            .h-standby { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 4px; }

            @media print {
                .no-print { display: none !important; }
            }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>

            <h2>${titolo}</h2>
            <div class="date-subtitle">Trasporto di domani ${dataDomaniTestuale} — Presenti: <b>${presenti}</b> su <b>${totaleBus}</b> totali</div>

            <div class="toolbar-stampa no-print">
                <button class="btn-stampa" onclick="window.print()">•STAMPA</button>
                ${ordinamento === 'perClasse'
                    ? `<button class="btn-per-classe" onclick="generaPopUpStampaBus('alfabetico'); window.close();">•ALFABETICO</button>`
                    : `<button class="btn-per-classe" onclick="generaPopUpStampaBus('perClasse'); window.close();">•PER CLASSE</button>`
                }
            </div>

            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlDest) => `
                    <div class="colonna">
                        <div class="column-header">
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-name">Cognome</div>
                            <div class="h-cell h-room">Room</div>
                            <div class="h-cell h-check">Pres</div>
                            <div class="h-cell h-standby">StBy</div>
                            <div class="h-cell h-notes">Note</div>
                        </div>
                        ${htmlDest}
                    </div>
                `
                    )
                    .join("")}
            </div>
        </body></html>
    `);
    popup.document.close(); 

    // 👇 Rende disponibile generaPopUpStampaBus DENTRO il popup,
    //    così l'onclick dei pulsanti non dipende da window.opener
    //    (che spesso è null per policy del browser o se il popup
    //    è stato aperto da un iframe / con noopener).
    popup.generaPopUpStampaBus = generaPopUpStampaBus;
    popup.focus();
}

// --- POMERIGGIO BUS
function generaPopUpStampaBusPomeriggio() {

    const oggi = new Date();
    const dataTestuale = document.getElementById("todayDate").innerText;
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // 1. FILTRO: esclude 2A, 2B e classi con "P" e cognome vuoto
    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        const classe = s.classe.toUpperCase();
        const escluse = ["2A", "2B", "4C"];
        return !escluse.includes(classe) && !classe.includes("P");
    });

    // 2. ORDINAMENTO NATURALE: Classe -> Gruppo -> Cognome
    validi.sort((a, b) => {
        const compClasse = a.classe.localeCompare(b.classe, undefined, { numeric: true });
        if (compClasse !== 0) return compClasse;

        const gA = a.gruppo || "";
        const gB = b.gruppo || "";
        const compGruppo = gA.localeCompare(gB);
        if (compGruppo !== 0) return compGruppo;

        return a.cognome.localeCompare(b.cognome);
    });

    // 3. COSTRUZIONE LISTA MISTA CON SEPARATORI
    const elementiFinali = [];
    let ultimaClasse = null;

    validi.forEach((studente) => {
        if (ultimaClasse !== null && studente.classe !== ultimaClasse) {
            elementiFinali.push({ type: "separator" });
        }
        elementiFinali.push({ type: "student", data: studente });
        ultimaClasse = studente.classe;
    });

    // 4. DISTRIBUZIONE BILANCIATA NELLE 3 COLONNE
    const totaleElementi = elementiFinali.length;
    const itemsPerColonna = Math.ceil(totaleElementi / 3);
    const colonneHtml = ["", "", ""];

    elementiFinali.forEach((elemento, idx) => {
        const colonnaIdx = Math.floor(idx / itemsPerColonna);

        if (elemento.type === "separator") {
            colonneHtml[colonnaIdx] += `<div class="class-separator"></div>`;
            return;
        }

        const s = elemento.data;
        const infoClasse = `${s.classe}${s.gruppo ? " • " + s.gruppo : ""}`;

        // Gestione sfondi colorati tenui per i gruppi 5A e 5B
        let bgStyle = "";
        if (s.classe === "5A") {
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;";
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;";
        } else if (s.classe === "5B") {
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;";
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;";
        }

        // 🚗 Nota auto se il cognome è nella lista
        const cognomeUpper = s.cognome.toUpperCase();
        const notaCustom = COGNOMI_AUTO.includes(cognomeUpper) ? "🚗" : "";

        colonneHtml[colonnaIdx] += `
            <div class="bus-row" style="${bgStyle}">
                <div class="b-cell b-class"><b>${infoClasse}</b></div>
                <div class="b-cell b-name"><b>${s.cognome}</b></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-notes">${notaCustom}</div>
            </div>
        `;
    });

    // 5. GENERAZIONE POP-UP
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Bus Pomeriggio Appello Settimanale</title><style>
            @page { size: A4 landscape; margin: 0.4cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 5px; color: #000; line-height: 1.1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h2 { text-align: center; text-transform: uppercase; margin: 5px 0 2px 0; font-size: 1.2rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; margin-bottom: 12px; color: #444; }
            .timestamp { position: absolute; top: 5px; right: 10px; font-size: 0.65rem; color: #777; }
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }

            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.70rem; text-transform: uppercase; border: 1px solid #000; height: 22px; box-sizing: border-box; }
            .bus-row { display: flex; font-size: 0.72rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px !important; box-sizing: border-box; }
            .class-separator { height: 6px; background: #444; border: 1px solid #000; margin: 1px 0; page-break-inside: avoid; }

            .b-cell, .h-cell { padding: 2px 4px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; height: 100%; box-sizing: border-box; }

            .b-class, .h-class { width: 50px; font-size: 0.65rem; }
            .b-class { border-right: 1px solid #ccc; background: #f5f5f5; }
            .h-class { border-right: 1px solid #555; }

            .b-name, .h-name { width: 115px; text-align: left; justify-content: flex-start; padding-left: 6px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }

            .b-day, .h-day { width: 22px; font-size: 0.65rem; }
            .b-day { border-right: 1px solid #ccc; }
            .h-day { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 6px; }

            .no-print { text-align: center; margin-bottom: 12px; }
            @media print { .no-print { display: none; } }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            <h2>CONVITTORI PER CLASSE</h2>
            <div class="date-subtitle">${dataTestuale} — Elementi totali: <b>${totaleElementi}</b></div>

            <div class="no-print">
                <button onclick="window.print()" style="padding:6px 30px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    •STAMPA
                </button>
            </div>

            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlDest) => `
                    <div class="colonna">
                        <div class="column-header">
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-name">Cognome</div>
                            <div class="h-cell h-day">LU</div>
                            <div class="h-cell h-day">MA</div>
                            <div class="h-cell h-day">ME</div>
                            <div class="h-cell h-day">GI</div>
                            <div class="h-cell h-notes">Note</div>
                        </div>
                        ${htmlDest}
                    </div>
                `
                    )
                    .join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}

//-- bus generico
function generaPopUpStampaBusGenerico() {
    const oggi = new Date();
    const dataTestuale = document.getElementById("todayDate").innerText;
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // 1. FILTRO CLASSI ESCLUSE
    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        const classe = s.classe.toUpperCase();
        const escluse = ["2A", "2B", "4C"];
        return !escluse.includes(classe) && !classe.includes("P");
    });

    // 2. SEPARAZIONE E ORDINAMENTO
// 5A e 5B vanno in fondo, ordinate per gruppo (G1/G2) + cognome
const resto = validi.filter((s) => s.classe !== "5A" && s.classe !== "5B");
const classe5A = validi.filter((s) => s.classe === "5A");
const classe5B = validi.filter((s) => s.classe === "5B");

resto.sort((a, b) => a.cognome.localeCompare(b.cognome));

const ordinaPerGruppoECognome = (a, b) => {
    const gA = a.gruppo || "";
    const gB = b.gruppo || "";
    return (gA + a.cognome).localeCompare(gB + b.cognome);
};
classe5A.sort(ordinaPerGruppoECognome);
classe5B.sort(ordinaPerGruppoECognome);

const listaFinale = [...resto, ...classe5A, ...classe5B];

    // 3. RIPARTIZIONE IN 3 COLONNE BILANCIATE
    const itemsPerCol = Math.ceil(listaFinale.length / 3);
    const colonneHtml = ["", "", ""];

    listaFinale.forEach((s, index) => {
        const colIndex = Math.floor(index / itemsPerCol);
        const infoClasse = `${s.classe} ${s.percorso ? s.percorso : ""} ${s.gruppo ? "• " + s.gruppo : ""}`;

        let bgStyle = "";
if (s.classe === "5A") {
    if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;"; // lilla tenue
    if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;"; // giallo tenue
} else if (s.classe === "5B") {
    if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;"; // lilla tenue 
    if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;"; // giallo tenue
}

        colonneHtml[colIndex] += `
            <div class="bus-row" style="${bgStyle}">
                <div class="b-cell b-room">${s.room || ""}</div>
                <div class="b-cell b-name"><b>${s.cognome}</b></div>
                <div class="b-cell b-class">${infoClasse}</div>
                <div class="b-cell b-check"></div>
                <div class="b-cell b-standby"></div> 
                <div class="b-cell b-notes"></div>
            </div>
        `;
    });
    
    

    // 4. GENERAZIONE INTERFACCIA COMPATTA A4 LANDSCAPE
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Appello Bus - Schema Generico</title><style>
            @page { size: A4 landscape; margin: 0.4cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 5px; color: #000; line-height: 1.1; }
            h2 { text-align: center; text-transform: uppercase; margin: 2px 0 0 0; font-size: 1.1rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; font-weight: bold; margin-bottom: 8px; color: #111; }
            .timestamp { position: absolute; top: 5px; right: 10px; font-size: 0.6rem; color: #777; }
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }
            
            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; border: 1px solid #000; height: 18px; }
            
            /* Righe alzate a 22px per occupare meglio lo spazio sul foglio */
            .bus-row { display: flex; font-size: 0.68rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px; }
            
            .b-cell, .h-cell { padding: 2px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; }
            
            .b-room, .h-room { width: 25px; font-size: 0.58rem; }
            .b-room { border-right: 1px solid #ccc; font-weight: bold; background: #f5f5f5; }
            .h-room { border-right: 1px solid #555; }
            
            .b-name, .h-name { width: 105px; text-align: left; justify-content: flex-start; padding-left: 4px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }
            
            .b-class, .h-class { width: 65px; font-size: 0.55rem; }
            .b-class { border-right: 1px solid #ccc; }
            .h-class { border-right: 1px solid #555; }
            
            .b-check, .h-check { width: 22px; }
            .b-check { border-right: 1px solid #ccc; }
            .h-check { border-right: 1px solid #555; }
            
            .b-standby, .h-standby { width: 25px; border-right: 1px solid #ccc; }
            .h-standby { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 4px; }
            
            .no-print { text-align: center; margin-bottom: 8px; }
            
            /* Gestione nascondi in stampa per pulsanti e sottotitolo dati */
            @media print { .no-print { display: none !important; } }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            
            
            
            
            
            
            
            <h2>BUS CONVITTORI</h2>
            
            <div class="date-subtitle no-print"> — Studenti tot: <b>${listaFinale.length}</b></div>
            
            <div class="no-print">
                <button onclick="window.print()" style="padding:6px 30px; background:#27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    •STAMPA
                </button>
            </div>

            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlDest) => `
                    <div class="colonna">
                        <div class="column-header">
                            <div class="h-cell h-room">Room</div>
                            <div class="h-cell h-name">Cognome</div>
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-check">Pres</div>
                            <div class="h-cell h-standby">StBy</div>
                            <div class="h-cell h-notes">Note</div>
                        </div>
                        ${htmlDest}
                    </div>
                `
                    )
                    .join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}