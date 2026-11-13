/**
 * js/stampe/dinner.js
 * Stampa DINNER — include il blocco "Altri aggiunti in manuale" dalle card.
 */

function generaTestoClassiTurno(turno) {
    const giornoSettimana = getDataCorrente().getDay();
    const turni = window.TURNI_DINNER || {};
    const overrideClassi = window.OVERRIDE_TURNI_DINNER_CLASSI || {};

    const baseTurno = turni[turno] || [];
    const baseSet = new Set(baseTurno);

    const tutteLeClassi = new Set([
        ...(turni[1] || []),
        ...(turni[2] || [])
    ]);

    const classiDelTurno = [];
    tutteLeClassi.forEach(classe => {
        let turnoEffettivo = baseSet.has(classe) ? turno : (turno === 1 ? 2 : 1);
        const ov = overrideClassi[classe];
        if (ov && ov[giornoSettimana] !== undefined) {
            turnoEffettivo = ov[giornoSettimana];
        }
        if (turnoEffettivo === turno) classiDelTurno.push(classe);
    });

    const ordinate = [
        ...classiDelTurno.filter(c => baseSet.has(c)),
        ...classiDelTurno.filter(c => !baseSet.has(c))
    ];

    return ordinate.join(', ');
}

function generaPopUpStampaDinner() {
    let a1 = 0, p1 = 0, a2 = 0, p2 = 0;
    let n1 = [], n2 = [], switch1 = [], switch2 = [];

    const oggi = getDataCorrente();
    const giornoSett = oggi.getDay();
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const dataTestuale = document.getElementById("todayDate").innerText;

    function estraiNome(nomeCompleto, cognome) {
        if (!nomeCompleto) return "";
        const cognomeUpper = (cognome || "").toUpperCase();
        if (nomeCompleto.toUpperCase().startsWith(cognomeUpper)) {
            return nomeCompleto.substring(cognome.length).trim();
        }
        return nomeCompleto;
    }

    document.querySelectorAll(".student-row").forEach((r) => {
        const cognome = r.dataset.cognome || "";
        const nomeCompleto = r.dataset.nomeCompleto || "";
        const classe = r.dataset.classe || "";
        const nome = estraiNome(nomeCompleto, cognome);

        const turnoOriginale = TURNI_DINNER[1].includes(classe) ? 1 : 2;
        let turnoEffettivo = turnoStudente(classe, cognome);

        if (cambiTurnoManuali[cognome]) {
            turnoEffettivo = turnoEffettivo === 1 ? 2 : 1;
        }

        if (turnoEffettivo !== turnoOriginale) {
            const nota = turnoEffettivo === 1 ? "da 2° a 1°" : "da 1° a 2°";
            const obj = {
                cognome: cognome.toUpperCase(),
                nome: nome,
                classe: classe,
                nota: nota
            };
            if (turnoEffettivo === 1) switch1.push(obj);
            else switch2.push(obj);
        }

                const isLab = isStudenteInLabOggi(classe, r.dataset.gruppo, oggi);
        const isPPNoCena = isPPNoDinnerOggi(cognome, giornoSett);
        const escluso =
            isLab ||
            isPPNoCena ||
            r.classList.contains("assente") ||
            r.dataset.dinnerno === "1";

        // ─── Nota di esclusione: LAB ha precedenza, poi LATE ───
        // isLateDinnerStudente() filtra già PP-assenza, PP-no-rientro,
        // ASSENTI_PERMESSO e .assente; qui basta escludere solo isLab.
        let notaEsclusione = "";
        if (isLab) {
            notaEsclusione = "LAB";
        } else if (
            escluso &&
            typeof isLateDinnerStudente === "function" &&
            isLateDinnerStudente(cognome, classe, giornoSett, turnoEffettivo, r)
        ) {
            notaEsclusione = "LATE";
        }

        // ─── Orari PP del giorno (per mostrare out → in accanto agli esclusi) ───
        const ppOggi = (typeof ORARI_PP !== "undefined" && ORARI_PP[cognome.toUpperCase()])
            ? ORARI_PP[cognome.toUpperCase()][giornoSett]
            : null;
        const outPP = ppOggi ? normalizzaOrario(ppOggi.out || "") : "";
        const inPP  = ppOggi ? normalizzaOrario(ppOggi.in  || "") : "";
        const orarioLabel = (outPP.includes(":") || inPP.includes(":"))
            ? `${outPP || "—"} → ${inPP || "—"}`
            : "";

        if (turnoEffettivo === 1) {
            if (escluso) {
                a1++;
                n1.push({
                    cognome: cognome.toUpperCase(),
                    nome: nome,
                    classe: classe,
                    nota: notaEsclusione,
                    orario: orarioLabel
                });
            } else {
                p1++;
            }
        } else {
            if (escluso) {
                a2++;
                n2.push({
                    cognome: cognome.toUpperCase(),
                    nome: nome,
                    classe: classe,
                    nota: notaEsclusione,
                    orario: orarioLabel
                });
            } else {
                p2++;
            }
        }
    });

    const ordinaCognome = (a, b) =>
        a.cognome.localeCompare(b.cognome, "it", { sensitivity: "base" });

    n1.sort(ordinaCognome);
    n2.sort(ordinaCognome);
    switch1.sort(ordinaCognome);
    switch2.sort(ordinaCognome);

    function buildGrigliaNomi(lista, opzioni = {}) {
        const { mostraNota = false, mostraClasse = true, mostraOrario = false } = opzioni;

        if (!lista.length) {
            return `<div class="griglia-nomi"><div class="nome-item"><i>Nessuno</i></div></div>`;
        }

        const items = lista
            .map((o) => {
                const tagClasse = mostraClasse && o.classe
                    ? ` <span class="tag-classe">${o.classe}</span>`
                    : "";
                const notaClass = o.nota ? ` tag-${o.nota.toLowerCase()}` : "";
                const tagNota = mostraNota && o.nota
                    ? ` <span class="tag-nota${notaClass}">${o.nota}</span>`
                    : "";
                const tagOrario = mostraOrario && o.orario
                    ? ` <span class="tag-orario">${o.orario}</span>`
                    : "";
                return `<div class="nome-item"><b>${o.cognome}</b> ${o.nome}${tagClasse}${tagNota}${tagOrario}</div>`;
            })
            .join("");

        return `<div class="griglia-nomi">${items}</div>`;
    }

    // ─── TESTO PERMESSI LATE DINNER (ORARI_PP + Altri aggiunti in manuale) ───
    let notaGiornoCorrente =
        (typeof generaTestoLateDinner === "function" && generaTestoLateDinner(giornoSett))
        || "";

    // Aggiungi i LATE selezionati a mano dalle card
    // (lista in linea, separata da virgole)
    const lateManuali = Object.entries(window.lateDinnerManuali || {})
    .filter(([_, attivo]) => attivo === true)
    .map(([cognome]) => cognome.toUpperCase())
    .sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));

    if (lateManuali.length > 0) {
        const rigaLate = `Altri Aggiunti:\n${lateManuali.join(', ')}`;
        notaGiornoCorrente = notaGiornoCorrente.trim()
            ? notaGiornoCorrente.trim() + '\n' + rigaLate
            : rigaLate;
    }

    if (!notaGiornoCorrente) {
        notaGiornoCorrente = "NESSUN PERMESSO LATE DINNER OGGI";
    }

    const popup = window.open("", "_blank", "width=1000,height=900");
    popup.document.write(`
        <html lang="it"><head><title>Riepilogo Dinner - ${dataTestuale}</title><style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px 40px; position: relative; color: #222; }
            h2 { text-align: center; text-transform: uppercase; margin-top: 20px; margin-bottom: 6px; font-size: 1.6em; letter-spacing: 1px; }
            h3 { font-size: 1em; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .timestamp { position: absolute; top: 10px; right: 20px; font-size: 0.8em; color: #666; }
            .date { text-align: center; font-size: 1.15em; margin-bottom: 20px; color: #444; }
            .editable-notes {
                width: 100%; box-sizing: border-box;
                border: 1px dashed #ccc; font-size: 1em; font-weight: bold;
                text-align: center; text-transform: uppercase; padding: 10px;
                margin-bottom: 24px; font-family: inherit; resize: vertical;
            }
            .section {
                margin-bottom: 28px; border-left: 6px solid #333;
                padding-left: 18px; page-break-inside: avoid;
            }
            .section h3 { color: #2c3e50; }
            .stats-row {
                display: flex; gap: 24px; align-items: center;
                flex-wrap: wrap; margin-bottom: 12px;
            }
            .stats-row span {
                font-size: 0.95em; font-weight: 600;
                display: flex; align-items: center; gap: 6px;
            }
            .stats-row input {
                font-size: 1.3em; font-weight: bold; width: 65px;
                border: none; border-bottom: 2px solid #000;
                text-align: center; background: transparent;
                font-family: inherit; color: #000;
            }
            .label-sezione {
                font-size: 0.85em; font-weight: bold;
                text-transform: uppercase; color: #555;
                margin-bottom: 4px; letter-spacing: 0.5px;
            }
            .griglia-nomi {
                display: grid; grid-template-columns: repeat(2, 1fr);
                gap: 3px 20px; margin: 4px 0 14px 0;
                font-size: 0.85em; color: #333; line-height: 1.5;
            }
            .nome-item {
                padding: 2px 4px; border-bottom: 1px dotted #e0e0e0;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .nome-item b { color: #000; }
            .tag-classe {
                display: inline-block; background: #ecf0f1; color: #2c3e50;
                font-size: 0.75em; font-weight: bold; padding: 1px 6px;
                border-radius: 3px; text-transform: uppercase;
                vertical-align: middle; margin-left: 4px;
            }
            .tag-nota {
                display: inline-block; background: #fef9e7; color: #b7950b;
                font-size: 0.75em; font-weight: bold; padding: 1px 6px;
                border-radius: 3px; text-transform: uppercase;
                vertical-align: middle; margin-left: 4px;
                border: 1px solid #f7dc6f;
            }    
            .tag-late {
                background: #e8f4fd;
                color: #1f618d;
                border: 1px solid #aed6f1;
            }
            .tag-orario {
                display: inline-block; background: #eef2ff; color: #3730a3;
                font-size: 0.72em; font-weight: bold; padding: 1px 6px;
                border-radius: 3px; font-family: "SF Mono", Consolas, monospace;
                vertical-align: middle; margin-left: 4px;
                border: 1px solid #c7d2fe;
                letter-spacing: 0.02em;
            }
            .no-print { margin-top: 20px; display: flex; justify-content: center; }
            .no-print button {
                padding: 14px 50px; background: #27ae60; color: white;
                font-weight: bold; border-radius: 80px; border: none;
                cursor: pointer; font-size: 0.95em;
                font-family: inherit; letter-spacing: 1px;
                box-shadow: 0 4px 12px rgba(39,174,96,0.3);
            }
            .no-print button:hover { filter: brightness(1.08); }
            @media print {
                body { padding: 8px 12px; font-size: 0.9em; }
                .no-print { display: none; }
                .editable-notes { border: none; margin-bottom: 12px; padding: 6px; }
                .griglia-nomi {
                    grid-template-columns: repeat(3, 1fr);
                    font-size: 0.62em; gap: 0px 12px;
                    margin: 2px 0 8px 0; line-height: 1.2;
                }
                .nome-item { padding: 0; }
                .section {
                    page-break-inside: avoid;
                    margin-bottom: 14px; padding-left: 12px;
                    border-left-width: 4px;
                }
                h2 { font-size: 1.3em; margin: 8px 0 4px 0; }
                h3 { font-size: 0.9em; margin-bottom: 6px; }
                .date { font-size: 0.95em; margin-bottom: 12px; }
                .stats-row { gap: 16px; margin-bottom: 8px; }
                .stats-row span { font-size: 0.85em; }
                .stats-row input { font-size: 1.1em; width: 55px; }
                .label-sezione { font-size: 0.75em; margin-bottom: 2px; }
            }
            @page { size: A4 portrait; margin: 1cm; }
        </style></head><body>

            <div class="timestamp">aggiornamento ${dataOggi} ore ${oraEsatta}</div>
            <h2>Riepilogo Dinner</h2>
            <div class="date">${dataTestuale}</div>

            <div class="no-print">
                <button onclick="window.print()">• STAMPA</button>
            </div>

            <textarea class="editable-notes" rows="${Math.max(4, (notaGiornoCorrente.match(/\n/g) || []).length + 2)}">${notaGiornoCorrente}</textarea>

            <div class="section">
                <h3>1° turno — 18:30</h3>
                <div style="font-size:0.75em;color:#777;margin-bottom:8px;font-style:italic;">
                    CLASSI ${generaTestoClassiTurno(1)}
                </div>
                <div class="stats-row">
                    <span>Esclusi: <input type="number" value="${a1}"></span>
                    <span>Presenti: <input type="number" value="${p1}"></span>
                    <span>+ EDU: <input type="number" value="2"></span>
                </div>
             <div class="stats-row" style="font-size:0.85em; margin-top:-4px;">
                    ${n1.filter(o => o.nota === 'LAB').length > 0 ? `<span>LAB: <input type="number" value="${n1.filter(o => o.nota === 'LAB').length}" style="font-size:1.1em; width:55px;"></span>`
                        : ''}
                    ${n1.filter(o => o.nota === 'LATE').length > 0 ? `<span>LATE: <input type="number" value="${n1.filter(o => o.nota === 'LATE').length}" style="font-size:1.1em; width:55px;"></span>`
                        : ''}
                </div>
                <div class="label-sezione">Esclusi</div>
                ${buildGrigliaNomi(n1, { mostraNota: true, mostraClasse: true, mostraOrario: true })}
                <div class="label-sezione">Cambi Turno</div>
                ${buildGrigliaNomi(switch1, { mostraNota: true, mostraClasse: true })}
            </div>

            <div class="section">
                <h3>2° turno — 19:15</h3>
                <div style="font-size:0.75em;color:#777;margin-bottom:8px;font-style:italic;">
                    CLASSI ${generaTestoClassiTurno(2)}
                </div>
                <div class="stats-row">
                    <span>Esclusi: <input type="number" value="${a2}"></span>
                    <span>Presenti: <input type="number" value="${p2}"></span>
                    <span>+ EDU: <input type="number" value="2"></span>
                </div>
                <div class="stats-row" style="font-size:0.85em; margin-top:-4px;">
                    ${n2.filter(o => o.nota === 'LAB').length > 0   ? `<span>LAB: <input type="number" value="${n2.filter(o => o.nota === 'LAB').length}" style="font-size:1.1em; width:55px;"></span>`
                        : ''}
                    ${n2.filter(o => o.nota === 'LATE').length > 0    ? `<span>LATE: <input type="number" value="${n2.filter(o => o.nota === 'LATE').length}" style="font-size:1.1em; width:55px;"></span>`
                        : ''}
                </div>
                <div class="label-sezione">Esclusi</div>
                ${buildGrigliaNomi(n2, { mostraNota: true, mostraClasse: true, mostraOrario: true })}
                <div class="label-sezione">Cambi Turno</div>
                ${buildGrigliaNomi(switch2, { mostraNota: true, mostraClasse: true })}
            </div>

        </body></html>`);
    popup.document.close();
}

// --- PRESENZE dinner
function generaPopUpStampaPresDin() {
    const oggi = getDataCorrente();
    const dataTestuale = document.getElementById("todayDate").innerText;
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    if (typeof studenticonvittori === "undefined") {
        console.error("Errore: studenticonvittori non definito.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    function parseClasse(classe) {
        if (!classe) return { num: 999, lettera: "Z" };
        const match = classe.toString().toUpperCase().match(/^(\d+)([A-Z]?)$/);
        if (match) return { num: parseInt(match[1]), lettera: match[2] || "A" };
        return { num: 999, lettera: "Z" };
    }

    function ordinaPerClasseECognome(a, b) {
        const classeA = parseClasse(a.classe);
        const classeB = parseClasse(b.classe);
        if (classeA.num !== classeB.num) return classeA.num - classeB.num;
        if (classeA.lettera !== classeB.lettera) return classeA.lettera.localeCompare(classeB.lettera);
        const cognomeA = (a.cognome || "").toUpperCase();
        const cognomeB = (b.cognome || "").toUpperCase();
        return cognomeA.localeCompare(cognomeB);
    }

    const { turno1, turno2 } = costruisciTurni();
    turno1.sort(ordinaPerClasseECognome);
    turno2.sort(ordinaPerClasseECognome);

    function buildTurnoHtml(studentiInTurno) {
        const numColonne = 3;
        const totali = studentiInTurno.length;
        const itemsPerColonna = Math.ceil(totali / numColonne);
        const colonneHtml = ["", "", ""];

        studentiInTurno.forEach((s, idx) => {
            const colIdx = Math.floor(idx / itemsPerColonna);
            let classeDisplay = (s.classe || "").toString().toUpperCase();
            colonneHtml[colIdx] += `
                <div class="d-row">
                    <div class="d-cell d-class"><b>${classeDisplay}</b></div>
                    <div class="d-cell d-name"><b>${s.cognome}</b>&nbsp${s.nome || ""}</div>
                    <div class="d-cell d-day"></div>
                    <div class="d-cell d-day"></div>
                    <div class="d-cell d-day"></div>
                    <div class="d-cell d-day"></div>
                </div>
            `;
        });

        return `
            <div class="grid-container">
                ${colonneHtml.map((htmlContenuto) => `
                    <div class="colonna">
                        <div class="column-header">
                            <div class="h-cell h-class">Classe</div>
                            <div class="h-cell h-name">Cognome e Nome</div>
                            <div class="h-cell h-day">LU</div>
                            <div class="h-cell h-day">MA</div>
                            <div class="h-cell h-day">ME</div>
                            <div class="h-cell h-day">GI</div>
                        </div>
                        ${htmlContenuto}
                    </div>
                `).join("")}
            </div>
        `;
    }

    const htmlTurno1 = buildTurnoHtml(turno1);
    const htmlTurno2 = buildTurnoHtml(turno2);

    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html lang="it"><head><title>Stampa Appello Cena - Due Turni</title><style>
            @page { size: A4 landscape; margin: 0.3cm; }
            html, body { max-height: 100%; overflow: hidden; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2px; color: #000; line-height: 1.0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .main-title { text-align: center; text-transform: uppercase; margin: 0; font-size: 1.0rem; font-weight: bold; }
            .date-subtitle { text-align: center; font-size: 0.75rem; margin-bottom: 3px; color: #444; }
            .timestamp { position: absolute; top: 3px; right: 10px; font-size: 0.55rem; color: #777; }
            .turno-section { margin-bottom: 6px; page-break-inside: avoid !important; break-inside: avoid; }
            .turno-title { background: #555; color: #fff; padding: 1px 6px; font-size: 0.72rem; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; border-radius: 2px; }
            .grid-container { display: flex; gap: 8px; justify-content: space-between; page-break-inside: avoid !important; }
            .colonna { width: 32.8%; display: flex; flex-direction: column; }
            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.55rem; text-transform: uppercase; border: 1px solid #000; height: 14px; }
            .d-row { display: flex; font-size: 0.56rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; height: 14px !important; box-sizing: border-box; }
            .d-cell, .h-cell { padding: 0px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; height: 100%; }
            .d-class, .h-class { width: 35px; font-size: 0.54rem; }
            .d-class { border-right: 1px solid #ccc; background: #f5f5f5; font-weight: bold; }
            .h-class { border-right: 1px solid #555; }
            .d-name, .h-name { flex-grow: 1; text-align: left; justify-content: flex-start; border-right: 1px solid #ccc; text-transform: uppercase; text-overflow: ellipsis; }
            .h-name { border-right: 1px solid #555; }
            .d-day, .h-day { width: 18px; font-size: 0.54rem; font-weight: bold; }
            .d-day { border-right: 1px solid #ccc; }
            .d-day:last-child { border-right: none; }
            .h-day { border-right: 1px solid #555; }
            .no-print { text-align: center; margin-bottom: 5px; }
            @media print { .no-print { display: none; } }
        </style></head><body>
            <div class="timestamp">Generato il ${dataOggi} alle ${oraEsatta}</div>
            <div class="main-title">REGISTRO PRESENZE DINNER</div>
            <div class="date-subtitle">${dataTestuale}</div>
            <div class="no-print">
                <button onclick="window.print()" style="padding:4px 30px; background: #27ae60; color:white; font-weight:bold; border-radius:20px; border:none; cursor:pointer; font-size:0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    •STAMPA
                </button>
            </div>
            <div class="turno-section">
                <div class="turno-title">1° Turno (Ore 18:30) — Tot: ${turno1.length}</div>
                ${htmlTurno1}
            </div>
            <div class="turno-section">
                <div class="turno-title">2° Turno (Ore 19:15) — Tot: ${turno2.length}</div>
                ${htmlTurno2}
            </div>
        </body></html>
    `);
    popup.document.close();
}
