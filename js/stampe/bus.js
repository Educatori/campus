/** 
 * js/stampe/bus.js
 * ─────────────────────────────────────────────────────────────
 * Stampe BUS — tre varianti:
 *   • generaPopUpStampaBus            (bus domattina)
 *   • generaPopUpStampaBusPomeriggio  (bus pomeriggio, appello settimanale)
 *   • generaPopUpStampaBusGenerico    (schema generico)
 *
 * Usa: window.BUS_HELPERS (dividiInColonne, intestazioneColonne, generaRiga)
 * ─────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────
// Helper: intestazione tabella + riga bus
// ─────────────────────────────────────────────────────────────
const BUS_LAYOUT_MATTINA = [
    { tipo: "classe", label: "Classe", classe: "h-class" },
    { tipo: "nome",   label: "Cognome", classe: "h-name" },
    { tipo: "room",   label: "Rm",     classe: "h-room" },
    { tipo: "check",  label: "Ce",     classe: "h-check" },
    { tipo: "standby",label: "Sb",     classe: "h-standby" },
    { tipo: "note",   label: "Note",   classe: "h-notes" }
];

const BUS_LAYOUT_POM = [
    { tipo: "classe", label: "Classe", classe: "h-class" },
    { tipo: "nome",   label: "Cognome", classe: "h-name" },
    { tipo: "day",    label: "LU",      classe: "h-day" },
    { tipo: "day",    label: "MA",      classe: "h-day" },
    { tipo: "day",    label: "ME",      classe: "h-day" },
    { tipo: "day",    label: "GI",      classe: "h-day" },
    { tipo: "note",   label: "Note",    classe: "h-notes" }
];

const BUS_LAYOUT_GEN = [
    { tipo: "room",   label: "Rm",     classe: "h-room" },
    { tipo: "nome",   label: "Cognome", classe: "h-name" },
    { tipo: "classe", label: "Classe",  classe: "h-class" },
    { tipo: "check",  label: "Ce",      classe: "h-check" },
    { tipo: "standby",label: "Sb",      classe: "h-standby" },
    { tipo: "note",   label: "Note",    classe: "h-notes" }
];

// ─────────────────────────────────────────────────────────────
// Helper: colori 5A/5B
// ─────────────────────────────────────────────────────────────
function _bgStyleQuinte(s) {
    if (s.classe === "5A" || s.classe === "5B") {
        if (s.gruppo === "G1") return "background-color: #eaf2f8;";
        if (s.gruppo === "G2") return "background-color: #fef9e7;";
    }
    return "";
}

// ─────────────────────────────────────────────────────────────
// 1. BUS MATTINA
// ─────────────────────────────────────────────────────────────
function generaPopUpStampaBus(ordinamento) {
    ordinamento = ordinamento || 'alfabetico';

    const oggi = new Date(
        (typeof getDataCorrente === 'function') ? getDataCorrente() : new Date()
    );
    const adesso = new Date();
    const dataOggi = adesso.toLocaleDateString("it-IT");
    const oraEsatta = adesso.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

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

    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        return window.haDirittoAlBusVariante(s, "mattina");
    });

    // ── Ordinamento ──
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

    // ── Righe ──
    const notaInTesta = window.NOTA_LABORATORI_BUS || "";

    const righeHtml = validi.map((s) => {
        let bgStyle = _bgStyleQuinte(s);
        if (s.classe === "4C") bgStyle = "border-left: 4px dashed #2c3e50;";

        const rigaElemento = document.querySelector(`.student-row[data-cognome="${s.cognome}"]`);
        let standBy = "";
        if (rigaElemento && typeof verificaStudenteStandBy === "function") {
            standBy = verificaStudenteStandBy(rigaElemento) ? "➖" : "";
        }

        const classeUpper = s.classe.toUpperCase();
        const cognomeUpper = s.cognome.toUpperCase();

        const noteCfg = window.NOTE_CLASSI || {};
        const notaClasse = (noteCfg.classi || {})[classeUpper] || "";
        const notaStudente = ((noteCfg.studenti || {})[classeUpper] || {})[cognomeUpper] || "";
        const notaGiorni = [notaClasse, notaStudente].filter(Boolean).join(" ");
        const haAuto = (window.COGNOMI_AUTO || []).includes(cognomeUpper);
        const notaCustom = [notaGiorni, haAuto ? "🚗" : ""].filter(Boolean).join(" ");

        const classeHtml = classeUpper === "4C" ? `<b>${s.classe}</b>` : s.classe;
        const gruppoHtml = s.gruppo
            ? (s.gruppo.toUpperCase() === "G2" ? ` • <b>${s.gruppo}</b>` : ` • ${s.gruppo}`)
            : "";

        return window.BUS_HELPERS.generaRiga(
            s,
            ["classe", "nome", "room", "check", "standby", "note"],
            { bgStyle, classeHtml, gruppoHtml, notaCustom, standBy }
        );
    });

    // ── Colonne: prime 2 = resto, 3ª = quinte + nota in testa ──
    const gruppoResto  = validi.filter(s => s.classe !== "5A" && s.classe !== "5B");
    const gruppoQuinte = validi.filter(s => s.classe === "5A" || s.classe === "5B");

    const righeResto  = righeHtml.slice(0, gruppoResto.length);
    const righeQuinte = righeHtml.slice(gruppoResto.length);

    const col12 = window.BUS_HELPERS.dividiInColonne(righeResto, 2);
    const colonneHtml = [col12[0], col12[1], righeQuinte.join("")];

    colonneHtml[2] += `
        <div class="bus-row nota-colonna" style="background:#f0f0f0; font-weight:bold; font-style:italic; justify-content:center;">
            <div class="b-cell" style="width:100%; text-align:center; justify-content:center;">
                ${notaInTesta}
            </div>
        </div>
    `;

    const totaleBus = validi.length;
    const presenti = validi.filter((s) => {
        const rigaElemento = document.querySelector(`.student-row[data-cognome="${s.cognome}"]`);
        if (!rigaElemento || typeof verificaStudenteStandBy !== "function") return true;
        return !verificaStudenteStandBy(rigaElemento);
    }).length;

    const titolo = ordinamento === 'perClasse' ? "BUS MATTINA — per classe" : "BUS MATTINA";

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html lang="it"><head><title>${titolo}</title><style>
            ${window.STAMPA_LAYOUT.cssBase({
                pageSize: "A4 landscape",
                pageMargin: "0.6cm 0.4cm 0.4cm 0.4cm"
            })}
            h2 { text-align: center; text-transform: uppercase; margin: 2px 0 6px 0; font-size: 1.1rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; font-weight: bold; margin-bottom: 8px; color: #111; text-transform: capitalize; }
            .toolbar-stampa { display: flex; justify-content: center; gap: 12px; margin-bottom: 10px; }
            .toolbar-stampa button { padding: 6px 26px; color: white; font-weight: bold; border-radius: 20px; border: none; cursor: pointer; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: filter 0.2s; }
            .toolbar-stampa button:hover { filter: brightness(1.1); }
            .btn-stampa { background: #27ae60; }
            .btn-per-classe { background: #7c3aed; }

            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }

            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; border: 1px solid #000; height: 18px; }

            .bus-row { display: flex; font-size: 0.68rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px; }

            .nota-colonna { font-size: 0.7rem; height: auto; min-height: 22px; border: 1px solid #000; border-bottom: 2px solid #000; }

            .b-cell, .h-cell { padding: 2px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; box-sizing: border-box; }

            .b-class, .h-class { width: 65px; font-size: 0.55rem; flex: 0 0 65px; }
            .b-class { border-right: 1px solid #ccc; }
            .h-class { border-right: 1px solid #555; }

            .b-name, .h-name { width: 120px; text-align: left; justify-content: flex-start; padding-left: 4px; flex: 0 0 120px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }

            .b-name.cognome-auto { justify-content: flex-end; text-align: right; padding-right: 4px; padding-left: 0; }

            .b-room, .h-room { width: 25px; font-size: 0.58rem; flex: 0 0 25px; }
            .b-room { border-right: 1px solid #ccc; font-weight: bold; background: #f5f5f5; }
            .h-room { border-right: 1px solid #555; }

            .b-check, .h-check { width: 22px; flex: 0 0 22px; }
            .b-check { border-right: 1px solid #ccc; }
            .h-check { border-right: 1px solid #555; }

            .b-standby, .h-standby { width: 25px; flex: 0 0 25px; border-right: 1px solid #ccc; }
            .h-standby { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 4px; }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            ${window.STAMPA_LAYOUT.intestazione({
                titolo,
                sottotitolo: `Trasporto di domani ${dataDomaniTestuale} — Presenti: <b>${presenti}</b> su <b>${totaleBus}</b> totali`
            })}

            <div class="toolbar-stampa no-print">
                <button class="btn-stampa" onclick="window.print()">•STAMPA</button>
                ${ordinamento === 'perClasse'
                    ? `<button class="btn-per-classe" onclick="window.opener.generaPopUpStampaBus('alfabetico'); window.close();">•ALFABETICO</button>`
                    : `<button class="btn-per-classe" onclick="window.opener.generaPopUpStampaBus('perClasse'); window.close();">•PER CLASSE</button>`
                }
            </div>

            <div class="grid-container">
                ${colonneHtml.map(htmlDest => `
                    <div class="colonna">
                        <div class="column-header">
                            ${window.BUS_HELPERS.intestazioneColonne(BUS_LAYOUT_MATTINA)}
                        </div>
                        ${htmlDest}
                    </div>
                `).join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
    popup.focus();
}

// ─────────────────────────────────────────────────────────────
// 2. BUS POMERIGGIO
// ─────────────────────────────────────────────────────────────
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

    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        return window.haDirittoAlBusVariante(s, "pomeriggio");
    });

    validi.sort((a, b) => {
        const compClasse = a.classe.localeCompare(b.classe, undefined, { numeric: true });
        if (compClasse !== 0) return compClasse;
        const gA = a.gruppo || "";
        const gB = b.gruppo || "";
        const compGruppo = gA.localeCompare(gB);
        if (compGruppo !== 0) return compGruppo;
        return a.cognome.localeCompare(b.cognome);
    });

    // ── Costruisci elementi con separatori ──
    const elementiFinali = [];
    let ultimaClasse = null;
    validi.forEach((studente) => {
        if (ultimaClasse !== null && studente.classe !== ultimaClasse) {
            elementiFinali.push({ type: "separator" });
        }
        elementiFinali.push({ type: "student", data: studente });
        ultimaClasse = studente.classe;
    });

    const elementiHtml = elementiFinali.map(el => {
        if (el.type === "separator") return `<div class="class-separator"></div>`;
        const s = el.data;
        const infoClasse = `${s.classe}${s.gruppo ? " • " + s.gruppo : ""}`;
        const bgStyle = _bgStyleQuinte(s);
        const haAuto = (window.COGNOMI_AUTO || []).includes(s.cognome.toUpperCase());
        const notaCustom = haAuto ? "🚗" : "";

        return window.BUS_HELPERS.generaRiga(
            s,
            ["classe", "nome", "day", "day", "day", "day", "note"],
            {
                bgStyle,
                classeHtml: `<b>${infoClasse}</b>`,
                notaCustom
            }
        );
    });

    // ── Distribuisci in 3 colonne ──
    const colonneHtml = window.BUS_HELPERS.dividiInColonne(elementiHtml, 3);

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html lang="it"><head><title>Bus Pomeriggio Appello Settimanale</title><style>
            ${window.STAMPA_LAYOUT.cssBase({
                pageSize: "A4 landscape",
                pageMargin: "0.4cm"
            })}
            h2 { text-align: center; text-transform: uppercase; margin: 5px 0 2px 0; font-size: 1.2rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; margin-bottom: 12px; color: #444; }
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }

            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.70rem; text-transform: uppercase; border: 1px solid #000; height: 22px; box-sizing: border-box; }
            .bus-row { display: flex; font-size: 0.72rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px !important; box-sizing: border-box; }
            .class-separator { height: 6px; background: #444; border: 1px solid #000; margin: 1px 0; page-break-inside: avoid; }

            .b-cell, .h-cell { padding: 2px 4px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; height: 100%; box-sizing: border-box; }

            .b-class, .h-class { width: 50px; font-size: 0.65rem; flex: 0 0 50px; }
            .b-class { border-right: 1px solid #ccc; background: #f5f5f5; }
            .h-class { border-right: 1px solid #555; }

            .b-name, .h-name { width: 120px; text-align: left; justify-content: flex-start; padding-left: 6px; flex: 0 0 120px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }

            .b-name.cognome-auto { justify-content: flex-end; text-align: right; padding-right: 6px; padding-left: 0; }

            .b-day, .h-day { width: 22px; font-size: 0.65rem; flex: 0 0 22px; }
            .b-day { border-right: 1px solid #ccc; }
            .h-day { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 6px; }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            ${window.STAMPA_LAYOUT.intestazione({
                titolo: "CONVITTORI PER CLASSE",
                sottotitolo: `${dataTestuale} — Elementi totali: <b>${elementiFinali.length}</b>`
            })}

            ${window.STAMPA_LAYOUT.bottoneStampa()}

            <div class="grid-container">
                ${colonneHtml.map(htmlDest => `
                    <div class="colonna">
                        <div class="column-header">
                            ${window.BUS_HELPERS.intestazioneColonne(BUS_LAYOUT_POM)}
                        </div>
                        ${htmlDest}
                    </div>
                `).join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}

// ─────────────────────────────────────────────────────────────
// 3. BUS GENERICO
// ─────────────────────────────────────────────────────────────
function generaPopUpStampaBusGenerico() {
    const oggi = new Date(
        (typeof getDataCorrente === 'function') ? getDataCorrente() : new Date()
    );
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    const validi = studenticonvittori.filter((s) => {
        if (!s.cognome) return false;
        return window.haDirittoAlBusVariante(s, "generico");
    });

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

    const righeHtml = listaFinale.map((s) => {
        const infoClasse = `${s.classe} ${s.percorso ? s.percorso : ""} ${s.gruppo ? "• " + s.gruppo : ""}`;
        const bgStyle = _bgStyleQuinte(s);
        return window.BUS_HELPERS.generaRiga(
            s,
            ["room", "nome", "classe", "check", "standby", "note"],
            { bgStyle, classeHtml: infoClasse }
        );
    });

    const colonneHtml = window.BUS_HELPERS.dividiInColonne(righeHtml, 3);

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html lang="it"><head><title>Appello Bus - Schema Generico</title><style>
            ${window.STAMPA_LAYOUT.cssBase({
                pageSize: "A4 landscape",
                pageMargin: "0.4cm"
            })}
            h2 { text-align: center; text-transform: uppercase; margin: 2px 0 0 0; font-size: 1.1rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; font-weight: bold; margin-bottom: 8px; color: #111; }
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }

            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; border: 1px solid #000; height: 18px; }

            .bus-row { display: flex; font-size: 0.68rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px; }

            .b-cell, .h-cell { padding: 2px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; box-sizing: border-box; }

            .b-room, .h-room { width: 25px; font-size: 0.58rem; flex: 0 0 25px; }
            .b-room { border-right: 1px solid #ccc; font-weight: bold; background: #f5f5f5; }
            .h-room { border-right: 1px solid #555; }

            .b-name, .h-name { width: 120px; text-align: left; justify-content: flex-start; padding-left: 4px; flex: 0 0 120px; }
            .b-name { border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }

            .b-name.cognome-auto { justify-content: flex-end; text-align: right; padding-right: 4px; padding-left: 0; }

            .b-class, .h-class { width: 65px; font-size: 0.55rem; flex: 0 0 65px; }
            .b-class { border-right: 1px solid #ccc; }
            .h-class { border-right: 1px solid #555; }

            .b-check, .h-check { width: 22px; flex: 0 0 22px; }
            .b-check { border-right: 1px solid #ccc; }
            .h-check { border-right: 1px solid #555; }

            .b-standby, .h-standby { width: 25px; flex: 0 0 25px; border-right: 1px solid #ccc; }
            .h-standby { border-right: 1px solid #555; }

            .b-notes, .h-notes { flex-grow: 1; text-align: left; justify-content: flex-start; padding-left: 4px; }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            ${window.STAMPA_LAYOUT.intestazione({
                titolo: "BUS CONVITTORI",
                sottotitolo: `Studenti tot: <b>${listaFinale.length}</b>`
            })}

            ${window.STAMPA_LAYOUT.bottoneStampa()}

            <div class="grid-container">
                ${colonneHtml.map(htmlDest => `
                    <div class="colonna">
                        <div class="column-header">
                            ${window.BUS_HELPERS.intestazioneColonne(BUS_LAYOUT_GEN)}
                        </div>
                        ${htmlDest}
                    </div>
                `).join("")}
            </div>
        </body></html>
    `);
    popup.document.close();
}
