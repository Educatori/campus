/**
 * CAMPUS_HUB-SCRIPT.JS - Versione su Firebase
 */

let cambiTurnoManuali = {};
let assenzeProgrammate = {};

// --- VARIABILE PER DATA SIMULATA ---
let dataSimulata = null; // null = usa la data reale

/**
 * Restituisce la data corrente (reale o simulata)
 */
function getDataCorrente() {
    if (dataSimulata) {
        return new Date(dataSimulata);
    }
    return new Date();
}

/**
 * Simula una data specifica
 * @param {string} dataStr - Data in formato YYYY-MM-DD
 */
function simulaData(dataStr) {
    if (!dataStr) {
        resetSimulazione();
        return;
    }
    
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) {
        alert('Data non valida!');
        return;
    }
    
    dataSimulata = data;
    
    // Aggiorna il display della data
    const dateEl = document.getElementById("todayDate");
    if (dateEl) {
        dateEl.innerText = data.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        // Aggiungi indicatore di simulazione
        dateEl.innerHTML += ' <span style="color:var(--lab);font-weight:bold;font-size:0.7rem;">🔮 SIMULAZIONE</span>';
    }
    
    // Ricarica la lista con la data simulata
    ricaricaListaStudenti();
    
    console.log(`📅 Data simulata: ${data.toLocaleDateString('it-IT')} (giorno ${data.getDay()})`);
}
    
 /**
 * Popola il menu a tendina delle classi
 */
function popolaSelectClassiFiltro() {
    const sel = document.getElementById("classeFilter");
    if (!sel) {
        console.warn("⚠️ classeFilter non trovato nel DOM");
        return;
    }
    
    if (typeof studenticonvittori === "undefined" || !Array.isArray(studenticonvittori)) {
        console.warn("⚠️ studenticonvittori non è ancora caricato");
        return;
    }
    
    const classiUniche = [...new Set(
        studenticonvittori
            .map(s => s.classe)
            .filter(c => c && c.trim() !== "")
    )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    
    console.log("📋 Classi trovate per filtro:", classiUniche);
    
    sel.innerHTML = '<option value="">Tutte</option>' + 
        classiUniche.map(c => `<option value="${c}">${c}</option>`).join("");
}

/**
 * Filtra gli studenti per classe
 * @param {string} classe - La classe da filtrare (vuoto = tutte)
 */
function filtraPerClasse(classe) {
    // Resetta gli altri filtri quando si usa il filtro classe
    const roomInput = document.getElementById("roomInput");
    const searchInput = document.getElementById("search");
    
    if (roomInput) roomInput.value = "";
    if (searchInput) searchInput.value = "";
    
    document.querySelectorAll(".student-row").forEach((r) => {
        if (!classe) {
            r.style.display = "block";
        } else {
            r.style.display = r.dataset.classe === classe ? "block" : "none";
        }
    });
}
       
       
/**
 * Resetta la simulazione e torna alla data reale
 */
function resetSimulazione() {
    dataSimulata = null;
    
    // Aggiorna il campo date
    const dateInput = document.getElementById("simulateDate");
    if (dateInput) dateInput.value = '';
    
    // Ricarica la data reale
    const oggi = new Date();
    const dateEl = document.getElementById("todayDate");
    if (dateEl) {
        dateEl.innerText = oggi.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }
    
    // Ricarica la lista
    ricaricaListaStudenti();
    
    console.log('📅 Data reale ripristinata');
}

/**
 * Ricarica la lista studenti (utile dopo cambio data)
 */
function ricaricaListaStudenti() {
    const lista = document.getElementById("listaStudenti");
    if (!lista) return;
    lista.innerHTML = "";
    // Reset filtro classe
    const classeFilter = document.getElementById("classeFilter");
    if (classeFilter) classeFilter.value = "";
    
    const data = getDataCorrente();
    const studenti = [...studenticonvittori];
    
    studenti
        .sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true }))
        .forEach((s) => {
            const r = document.createElement("div");
            r.className = "student-row";

            const isLab = isStudenteInLabOggi(s.classe, s.gruppo, data);
            if (isLab) r.classList.add("highlight-lab");

            r.dataset.cognome = s.cognome;
            r.dataset.nomeCompleto = s.cognome + " " + s.nome;
            r.dataset.classe = s.classe;
            r.dataset.room = s.room;
            r.dataset.gruppo = s.gruppo || "";
            r.dataset.percorso = s.percorso || "";
            r.dataset.dinnerno = "0";

            r.innerHTML = `
            <div class="st-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="room-badge">room ${s.room}</span>
                    <button class="btn-switch" onclick="toggleSwitchTurno(this)">⇄</button>
                </div>
                <span style="font-size:0.75em; color:#666; font-weight:bold;">
                    ${s.classe} ${s.percorso ? "" + s.percorso + "" : ""} ${s.gruppo || ""} ${isLab ? '<span class="lab-badge">LAB</span>' : ""} 
                </span>
            </div>
            <b style="font-size:1.1em">${s.cognome}</b> ${s.nome}
            <div class="inputs">
                <input type="text" placeholder="ESCE" class="in-u" onchange="this.value=normalizzaOrario(this.value); salvaDatiLocale();">
                <input type="text" placeholder="ENTRA" class="in-i" oninput="controllaDinnerAutomatico(this.closest('.student-row'))" onchange="this.value=normalizzaOrario(this.value); salvaDatiLocale();">
            </div>
            <div class="btns">
                <button class="btn-ass" onclick="toggleAssenza(this)">ASSENTE</button>
                <button class="btn-din" onclick="toggleDinnerNo(this)">NON CENA</button>
            </div>`;

            if (isAssenteProgrammato(s.cognome, data)) {
                r.classList.add("assente");
                r.dataset.dinnerno = "1";
            }

            lista.appendChild(r);
        });

    caricaDatiLocale();
}

// --- 1. INIZIALIZZAZIONE ---
function init() {
    const d = getDataCorrente();
    caricaAssenzeProgrammate();

    const dateEl = document.getElementById("todayDate");
    if (dateEl) {
        dateEl.innerText = d.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        if (dataSimulata) {
            dateEl.innerHTML += ' <span style="color:var(--lab);font-weight:bold;font-size:0.7rem;">🔮 SIMULAZIONE</span>';
        }
    }

    updateClock();
    let clockInterval = null;
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);

    ricaricaListaStudenti();
    
    // ← AGGIUNGI QUESTA RIGA
    popolaSelectClassiFiltro();
    
    mostraDataReset();
}

function haDirittoAlBus(s) {
    if (!s) return false;
    const classe = s.classe.toUpperCase();
    return !["2A", "2B", "4C"].includes(classe) && !classe.includes("P");
}

// --- 2. LOGICA TURNI ---
/**
 * Restituisce il turno cena effettivo dello studente, applicando in ordine:
 *   1. Turno base dalla classe (TURNI_DINNER)
 *   2. Override per classe (OVERRIDE_TURNI_DINNER_CLASSI)
 *   3. Override individuale (OVERRIDE_TURNI_DINNER)
 */
function turnoStudente(classe, cognome) {
    const oggi = getDataCorrente();
    const giornoSettimana = oggi.getDay();
    const cgn = (cognome || "").toUpperCase();

    // 1. Turno base dalla classe
    let turno = TURNI_DINNER[1].includes(classe) ? 1 : 2;

    // 2. Override per classe
    if (typeof OVERRIDE_TURNI_DINNER_CLASSI !== "undefined" &&
        OVERRIDE_TURNI_DINNER_CLASSI[classe] &&
        OVERRIDE_TURNI_DINNER_CLASSI[classe][giornoSettimana] !== undefined) {
        turno = OVERRIDE_TURNI_DINNER_CLASSI[classe][giornoSettimana];
    }

    // 3. Override individuale (ha precedenza)
    if (OVERRIDE_TURNI_DINNER[cgn] &&
        OVERRIDE_TURNI_DINNER[cgn][giornoSettimana] !== undefined) {
        turno = OVERRIDE_TURNI_DINNER[cgn][giornoSettimana];
    }

    return turno;
}

/**
 * Costruisce gli array di studenti per turno (con override applicati).
 * Ritorna { turno1: [...], turno2: [...] } di oggetti studente originali.
 */
function costruisciTurni() {
    const turno1 = [];
    const turno2 = [];

    if (typeof studenticonvittori === "undefined") return { turno1, turno2 };

    studenticonvittori.forEach((s) => {
        if (!s.cognome) return;
        const t = turnoStudente(s.classe, s.cognome);
        if (t === 1) turno1.push(s);
        else turno2.push(s);
    });

    return { turno1, turno2 };
}

function setTurno(turno) {
    document.querySelectorAll(".student-row").forEach((r) => {
        const classe = r.dataset.classe;
        const cognome = r.dataset.cognome;
        const turnoEffettivo = turnoStudente(classe, cognome);
        r.style.display = (turnoEffettivo === turno) ? "block" : "none";
    });
}

function toggleSwitchTurno(btn) {
    const r = btn.closest(".student-row");
    const cognome = r.dataset.cognome;
    cambiTurnoManuali[cognome] = !cambiTurnoManuali[cognome];
    btn.classList.toggle("modificato");
    salvaDatiLocale();
}

// --- 3. FILTRI ---
function applicaFiltri() {
    const s = document.getElementById("search").value.toLowerCase();
    const classeFilter = document.getElementById("classeFilter");
    
    // Reset filtro classe quando si cerca per testo
    if (classeFilter && s !== "") classeFilter.value = "";
    
    document.querySelectorAll(".student-row").forEach((r) => {
        const testo = (
            r.dataset.cognome +
            " " +
            r.dataset.nomeCompleto +
            " " +
            r.dataset.classe +
            " " +
            r.dataset.room +
            " " +
            r.dataset.gruppo +
            " " +
            r.dataset.percorso +
            " "
        ).toLowerCase();
        r.style.display = testo.includes(s) ? "block" : "none";
    });
}

function validaERicerca() {
    const rVal = document.getElementById("roomInput").value;
    const searchInput = document.getElementById("search");
    const classeFilter = document.getElementById("classeFilter");
    
     // Reset filtro classe quando si cerca per room
    if (classeFilter) classeFilter.value = "";
    
    if (rVal !== "") {
        searchInput.value = "";
        document.querySelectorAll(".student-row").forEach((card) => {
            card.style.display = card.dataset.room === rVal ? "block" : "none";
        });
    } else {
        applicaFiltri();
    }
}

function gestisciSaltoStanze(el) {
    let val = parseInt(el.value);
    let old = parseInt(el.oldValue) || 0;
    if (val > 125 && val < 201 && val > old) el.value = 201;
    else if (val > 125 && val < 201 && val < old) el.value = 125;
    el.oldValue = el.value;
}

// --- 4. LOGICA INPUT ---
function normalizzaOrario(valore) {
    valore = valore.trim().toLowerCase().replace(".", ":").replace(",", ":");
    if (/^\d{2}$/.test(valore)) valore += ":00";
    if (/^\d{4}$/.test(valore)) valore = valore.slice(0, 2) + ":" + valore.slice(2);
    return valore;
}

function controllaDinnerAutomatico(riga) {
    const classe = riga.dataset.classe;
    const cognome = riga.dataset.cognome;
    const giornoSettimana = getDataCorrente().getDay();
    let entra = normalizzaOrario(riga.querySelector(".in-i").value);
    let ppIn =
        ORARI_PP[cognome] && ORARI_PP[cognome][giornoSettimana] ? normalizzaOrario(ORARI_PP[cognome][giornoSettimana].in) : "";

    // Il limite dipende dal turno EFFETTIVO (override inclusi)
    const turnoEffettivo = turnoStudente(classe, cognome);
    const limite = turnoEffettivo === 1 ? "18:30" : "19:15";
    const paroleNo = ["n", "no", "non", "nor", "no r", "no rientro", "x"];

    const isTardi = (orario) => orario.includes(":") && orario > limite;
    const isNoRientro = (orario) => paroleNo.includes(orario);

    if (
        riga.classList.contains("assente") ||
        isNoRientro(entra) ||
        isNoRientro(ppIn) ||
        isTardi(entra) ||
        isTardi(ppIn)
    ) {
        riga.dataset.dinnerno = "1";
        riga.classList.add("dinner-no");
    } else {
        riga.dataset.dinnerno = "0";
        riga.classList.remove("dinner-no");
    }
}

function toggleAssenza(btn) {
    const r = btn.closest(".student-row");
    r.classList.toggle("assente");
    btn.classList.toggle("active-ass");
    controllaDinnerAutomatico(r);
    salvaDatiLocale();
}

function toggleDinnerNo(btn) {
    const r = btn.closest(".student-row");
    r.dataset.dinnerno = r.dataset.dinnerno === "1" ? "0" : "1";
    r.classList.toggle("dinner-no");
    btn.classList.toggle("active-din");
    salvaDatiLocale();
}

// --- 5. STAMPE ---

// --- DINNER riepilogo
function generaPopUpStampaDinner() {
    let a1 = 0,
        p1 = 0,
        a2 = 0,
        p2 = 0,
        n1 = [],
        n2 = [],
        switch1 = [],
        switch2 = [];
    const oggi = getDataCorrente();
    const giornoSett = oggi.getDay();
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const dataTestuale = document.getElementById("todayDate").innerText;

    document.querySelectorAll(".student-row").forEach((r) => {
        const cognome = r.dataset.cognome;
        const nomeCompleto = r.dataset.nomeCompleto;
        let turnoOriginale = TURNI_DINNER[1].includes(r.dataset.classe) ? 1 : 2;
        let turnoEffettivo = turnoStudente(r.dataset.classe, cognome);

        if (cambiTurnoManuali[cognome]) turnoEffettivo = turnoEffettivo === 1 ? 2 : 1;

        if (turnoEffettivo !== turnoOriginale) {
            const nota = turnoEffettivo === 1 ? " (da 2° a 1°)" : " (da 1° a 2°)";
            if (turnoEffettivo === 1) switch1.push(nomeCompleto + nota);
            else switch2.push(nomeCompleto + nota);
        }

        const isLab = isStudenteInLabOggi(r.dataset.classe, r.dataset.gruppo, oggi);
        const isPPNoCena = isPPNoDinnerOggi(cognome, giornoSett);
        const escluso = isLab || isPPNoCena || r.classList.contains("assente") || r.dataset.dinnerno === "1";

        if (turnoEffettivo === 1) {
            if (escluso) {
                a1++;
                n1.push(nomeCompleto + (isLab ? " (LAB)" : ""));
            } else p1++;
        } else {
            if (escluso) {
                a2++;
                n2.push(nomeCompleto + (isLab ? " (LAB)" : ""));
            } else p2++;
        }
    });

    const testiPermessi = {
        1: "LAB 2IeFP - PERMESSI: DINNER ORE 20:30 DELL'AQUILA ",
        2: "LAB 2A - PERMESSI: DINNER ORE 20:30 DELL'AQUILA, ORE 20:30 PAONESSA ",
        3: "LAB 2B - PERMESSI: DINNER ORE 20:30 DELL'AQUILA ",
        4: "LAB 5A/5B - PERMESSI: DINNER ORE 20:30 DELL'AQUILA "
    };
    const notaGiornoCorrente = testiPermessi[giornoSett] || "";

    const popup = window.open("", "_blank", "width=900,height=800");
    popup.document.write(`
        <html><head><title>Riepilogo Dinner - ${dataTestuale}</title><style>
            body { font-family: sans-serif; padding: 40px; position: relative; }
            h2 { text-align: center; text-transform: uppercase; margin-top: 20px; }
            .timestamp { position: absolute; top: 10px; right: 20px; font-size: 0.8em; color: #666; }
            .date { text-align: center; font-size: 1.2em; margin-bottom: 20px;}
            .editable-notes { width: 100%; border: 1px dashed #ccc; font-size: 1.1em; font-weight: bold; text-align: center; text-transform: uppercase; padding: 10px; margin-bottom: 20px;}
            .section { margin-bottom: 30px; border-left: 6px solid #333; padding-left: 20px; }
            .stats-row { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
            input { font-size: 1.5em; font-weight: bold; width: 60px; border: none; border-bottom: 2px solid #000; text-align: center; background: transparent; }
            .nomi, .cambi { font-size: 0.85em; color: #444; font-style: italic; margin-top: 10px; line-height: 1.4; }
            .no-print { margin-top: 30px; display: flex; justify-content: center; }
            @media print { .no-print { display: none; } .editable-notes { border: none; } }
        </style></head><body>
            <div class="timestamp">aggiornamento ${dataOggi} ore ${oraEsatta}</div>
            <h2>Riepilogo Dinner</h2>
            <div class="date">${dataTestuale}</div>
            <div class="no-print"><button onclick="window.print()" style="padding:15px 50px; background:#27ae60; color:white; font-weight:bold; border-radius:80px; border:none; cursor:pointer; font-size:0.9em;">•STAMPA</button></div>
            <textarea class="editable-notes" rows="2">${notaGiornoCorrente}</textarea>
            <div class="section">
                <h3>1° DINNER ore 18:30</h3>
                <div class="stats-row">
                    <span>Assenti: <input type="number" value="${a1}"></span>
                    <span>Presenti: <input type="number" value="${p1}"></span>
                    <span>+ EDU: <input type="number" value="2"></span>
                </div>
                <div class="nomi"><b>Esclusi:</b> ${n1.length ? n1.join(", ") : "Nessuno"}</div>
                <div class="cambi"><b>Cambi Turno:</b> ${switch1.length ? switch1.join(", ") : "Nessuno"}</div>
            </div>
            <div class="section">
                <h3>2° DINNER ore 19:15</h3>
                <div class="stats-row">
                    <span>Assenti: <input type="number" value="${a2}"></span>
                    <span>Presenti: <input type="number" value="${p2}"></span>
                    <span>+ EDU: <input type="number" value="2"></span>
                </div>
                <div class="nomi"><b>Esclusi:</b> ${n2.length ? n2.join(", ") : "Nessuno"}</div>
                <div class="cambi"><b>Cambi Turno:</b> ${switch2.length ? switch2.join(", ") : "Nessuno"}</div>
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

    // --- FUNZIONI DI SUPPORTO ORIGINALI (INNER) ---
    function parseClasse(classe) {
        if (!classe) return { num: 999, lettera: "Z" };
        const match = classe
            .toString()
            .toUpperCase()
            .match(/^(\d+)([A-Z]?)$/);
        if (match) {
            return { num: parseInt(match[1]), lettera: match[2] || "A" };
        }
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

    // --- 1. SUDDIVISIONE TURNI (con override) ---
    const { turno1, turno2 } = costruisciTurni();

    // --- 2. ORDINAMENTO ---
    turno1.sort(ordinaPerClasseECognome);
    turno2.sort(ordinaPerClasseECognome);

    // --- 3. GENERAZIONE HTML PER UN TURNO ---
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

        // Crea le 3 colonne affiancate con header allineati
        return `
            <div class="grid-container">
                ${colonneHtml
                    .map(
                        (htmlContenuto) => `
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
                `
                    )
                    .join("")}
            </div>
        `;
    }

    const htmlTurno1 = buildTurnoHtml(turno1);
    const htmlTurno2 = buildTurnoHtml(turno2);

    // --- 4. GENERAZIONE INTERFACCIA E POP-UP ---
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Stampa Appello Cena - Due Turni</title><style>
            @page { size: A4 landscape; margin: 0.3cm; }
            html, body { max-height: 100%; overflow: hidden; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2px; color: #000; line-height: 1.0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .main-title { text-align: center; text-transform: uppercase; margin: 0; font-size: 1.0rem; font-weight: bold; }
            .date-subtitle { text-align: center; font-size: 0.75rem; margin-bottom: 3px; color: #444; }
            .timestamp { position: absolute; top: 3px; right: 10px; font-size: 0.55rem; color: #777; }
            
            /* Impedisce drasticamente l'interruzione di pagina tra e dentro i turni */
            .turno-section { margin-bottom: 6px; page-break-inside: avoid !important; break-inside: avoid; }
            .turno-title { background: #555; color: #fff; padding: 1px 6px; font-size: 0.72rem; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; border-radius: 2px; }
            
            .grid-container { display: flex; gap: 8px; justify-content: space-between; page-break-inside: avoid !important; }
            .colonna { width: 32.8%; display: flex; flex-direction: column; }
            
            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.55rem; text-transform: uppercase; border: 1px solid #000; height: 14px; }
            .d-row { display: flex; font-size: 0.56rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; height: 14px !important; box-sizing: border-box; }
            
            .d-cell, .h-cell { padding: 0px 2px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; height: 100%; }
            
            /* Spaziature fisse e allineate al millimetro */
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
// --- TRANSFER
function generaPopUpStampaTransfer() {
    const oggi = getDataCorrente();
    const dataTestuale =
        document.getElementById("todayDate")?.innerText ||
        oggi.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    // 1. VERIFICA DATABASE - USA tuttiStudenti (TUTTI GLI STUDENTI)
    if (typeof tuttiStudenti === "undefined" || tuttiStudenti.length === 0) {
        console.error("Errore: tuttiStudenti non definito o vuoto.");
        alert("Errore: database studenti non caricato.");
        return;
    }

    // 2. LOGICA DEI TURNI LABORATORIO PRANZO
    const giornoSettimana = oggi.getDay();
    const labConfig = typeof LAB_PRANZO !== "undefined" ? LAB_PRANZO : {};
    const classiInLabOggi = labConfig[giornoSettimana] || [];

    console.log(`📅 Transfer Lunch - Data: ${oggi.toLocaleDateString('it-IT')}, Giorno: ${giornoSettimana}`);
    console.log(`📋 Classi in laboratorio oggi:`, classiInLabOggi);

        // Raggruppiamo TUTTI gli studenti per classe (escluse le classi non interessate)
    const classi = {};
    const CLASSI_ESCLUSE = ["1P", "2P", "3P", "2A", "2B", "4C"];

    tuttiStudenti.forEach((s) => {
        if (!s.cognome || s.cognome.trim() === "") return;
        const nomeClasse = s.classe ? s.classe.toUpperCase().trim() : "SENZA CLASSE";

        // Escludi le classi non convittorie / non interessate al transfer
        if (CLASSI_ESCLUSE.includes(nomeClasse)) return;

        if (!classi[nomeClasse]) classi[nomeClasse] = [];
        classi[nomeClasse].push(s);
    });

    const elencoClassi = Object.keys(classi).sort();

    if (elencoClassi.length === 0) {
        alert("Nessuno studente disponibile per la stampa.");
        return;
    }

    // Ordiniamo gli studenti dentro le classi e calcoliamo il flag del laboratorio
    elencoClassi.forEach((nomeClasse) => {
        classi[nomeClasse].sort((a, b) => a.cognome.localeCompare(b.cognome));
        classi[nomeClasse].forEach((s) => {
            s.haLabOggi = classiInLabOggi.includes(nomeClasse);
        });
    });

    // 3. RIPARTIZIONE BILANCIATA NELLE COLONNE
    // totaleElementi = studenti effettivamente inclusi (dopo il filtro classi)
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

            // SFONDO COLORATO PER LABORATORIO
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

    // 4. GENERAZIONE POP-UP E INTERFACCIA DI STAMPA
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Transfer Lunch Completo - ${dataOggi}</title><style>
            @page { size: A4 portrait; margin: 0.6cm 0.25cm 0.25cm 0.25cm; }
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
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;"; // lilla tenue
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;"; // giallo tenue
        } else if (s.classe === "5B") {
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8;"; // lilla tenue
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7;"; // giallo tenue
        }

        colonneHtml[colonnaIdx] += `
            <div class="bus-row" style="${bgStyle}">
                <div class="b-cell b-class"><b>${infoClasse}</b></div>
                <div class="b-cell b-name"><b>${s.cognome}</b></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-day"></div>
                <div class="b-cell b-notes"></div>
            </div>
        `;
    });

    // 5. GENERAZIONE POP-UP
    const popup = window.open("", "_blank", "width=1200,height=800");
    popup.document.write(`
        <html><head><title>Appello Bus Pomeriggio Settimanale</title><style>
            @page { size: A4 landscape; margin: 0.4cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 5px; color: #000; line-height: 1.1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h2 { text-align: center; text-transform: uppercase; margin: 5px 0 2px 0; font-size: 1.2rem; }
            .date-subtitle { text-align: center; font-size: 0.85rem; margin-bottom: 12px; color: #444; }
            .timestamp { position: absolute; top: 5px; right: 10px; font-size: 0.65rem; color: #777; }
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 32.5%; display: flex; flex-direction: column; }
            
            /* Struttura Header e Riga con altezze aumentate a 22px */
            .column-header { display: flex; background: #333; color: white; font-weight: bold; font-size: 0.70rem; text-transform: uppercase; border: 1px solid #000; height: 22px; box-sizing: border-box; }
            .bus-row { display: flex; font-size: 0.72rem; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; align-items: stretch; page-break-inside: avoid; height: 22px !important; box-sizing: border-box; }
            .class-separator { height: 6px; background: #444; border: 1px solid #000; margin: 1px 0; page-break-inside: avoid; }
            
            .b-cell, .h-cell { padding: 2px 4px; text-align: center; display: flex; align-items: center; justify-content: center; overflow: hidden; white-space: nowrap; height: 100%; box-sizing: border-box; }
            
            /* Larghezze FISSE e IDENTICHE per colonne e intestazioni */
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
            <h2>BUS CONVITTORI CLASSE</h2>
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
// --- USCITA
function generaPopUpStampaUscite() {
    // 1. VERIFICA DATABASE
    if (typeof studenticonvittori === "undefined") {
        alert("Errore: database studenticonvittori non trovato!");
        return;
    }

    // 2. FILTRO E ORDINAMENTO
    const listaConvittori = studenticonvittori
        .filter((s) => s && s.cognome && s.room && s.room !== "-")
        .sort((a, b) => a.cognome.localeCompare(b.cognome));

    if (listaConvittori.length === 0) {
        alert("Nessun convittore con camera assegnata trovato.");
        return;
    }

    // 3. RIPARTIZIONE BILANCIATA NELLE 2 COLONNE
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

    // Layout della tabella a due colonne
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

    // 4. GENERAZIONE POP-UP E INTERFACCIA
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
            @page { size: A4 portrait; margin: 0.6cm 0.3cm 0.3cm 0.3cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.1; }
            
            .page-block { page-break-after: always; position: relative; }
            .page-block:last-child { page-break-after: avoid; }
            
            /* Strutture titoli visibili a schermo ma nascoste in stampa */
            .no-print-header { text-align: center; margin-top: 5px; }
            h2 { text-transform: uppercase; margin: 2px 0; font-size: 1.1rem; letter-spacing: 1px; }
            .date-subtitle { font-size: 0.8rem; margin-bottom: 5px; color: #333; font-weight: bold; text-transform: uppercase; }
            .side-indicator { position: absolute; top: 2px; right: 5px; font-size: 0.6rem; font-weight: bold; background: #ddd; padding: 1px 4px; border-radius: 3px; text-transform: uppercase; }
            
            /* Layout a 2 colonne speculari */
            .grid-container { display: flex; gap: 10px; justify-content: space-between; }
            .colonna { width: 49.3%; display: flex; flex-direction: column; }
            
            /* Tabelle ultraleggere e compatte */
            table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #000; }
            th { background: #34495e; color: white; font-weight: bold; font-size: 0.6rem; text-transform: uppercase; padding: 3px 2px; border: 1px solid #000; text-align: center; }
            
            /* Celle ad altezza minima compressa per stare nel foglio singolo */
            .t-cell { padding: 1px 3px; font-size: 0.62rem; border-right: 1px solid #000; border-bottom: 1px solid #000; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; height: 14px; }
            .t-cell:last-child { border-right: none; }
            
            /* Specifiche colonne */
            .t-room { width: 25px; text-align: center; font-weight: bold; background: #f9f9f9; }
            .t-class { width: 55px; font-size: 0.58rem; text-align: center; color: #222; }
            .t-name { width: 140px; text-transform: uppercase; text-align: left; }
            .t-sign { background: #fff; }
            
            .no-print { text-align: center; margin: 10px 0; }
            
            /* Logica di rimozione elementi per la stampa */
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
    // 1. DATI EXTRA E VERIFICA DATABASE
    const extra = [
        { cognome: "EDUCATORI", nome: "", classe: "", gruppo: "", room: "112", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria", gruppo: "", room: "124", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria", gruppo: "", room: "125", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria", gruppo: "", room: "213", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria", gruppo: "", room: "216", percorso: "" },
        { cognome: "", nome: "", classe: "Foresteria", gruppo: "", room: "220", percorso: "" }
    ];

    let listaDalDatabase = [];
    if (typeof studenticonvittori !== "undefined") {
        listaDalDatabase = listaDalDatabase.concat(studenticonvittori);
    } else {
        console.warn("Attenzione: variabile 'studenticonvittori' non trovata.");
    }

    const tuttiIPartecipanti = [...extra, ...listaDalDatabase];
    const stanze = {};

    // 2. RAGGRUPPAMENTO PER STANZA
    tuttiIPartecipanti.forEach((s) => {
        if (!s.room || s.room === "-") return;
        if (!stanze[s.room]) stanze[s.room] = [];
        stanze[s.room].push(s);
    });

    const numeriStanze = Object.keys(stanze).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    // Dividiamo le stanze per piano (Piano 1: 100-199 / Piano 2: >= 200)
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

    // Funzione interna per generare i box HTML delle stanze
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

    // 3. GENERAZIONE POP-UP E INTERFACCIA
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
            
            /* Griglia a 3 colonne bilanciata per il foglio verticale */
            .rooms-grid { display: grid; grid-template-columns: repeat(3, 31.8%); gap: 0px; justify-content: space-between; width: 100%; }
            
            /* Struttura Box Stanza super compatta */
            .room-box { border: 1.2px solid #000; background: #fff; page-break-inside: avoid; display: flex; flex-direction: column; margin-bottom: 2px; }
            .room-header { background: #34495e; color: #fff; font-weight: bold; font-size: 0.58rem; text-align: center; padding: 1px 0; border-bottom: 1.2px solid #000; letter-spacing: 0.5px; }
            
            /* Tabelle interne precise a linee continue */
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
// funzione stand-by
// Funzione condivisa per evitare ripetizioni e disallineamenti di dati
function verificaStudenteStandBy(r) {
    const paroleNo = ["n", "no", "non", "nor", "no rientro", "x"];
    const giornoSettimana = new Date().getDay();
    const cognome = r.dataset.cognome;
    
    // 1. Condizione Assente
    const condAssente = r.classList.contains("assente"); 
    
    // 2. Condizione Ingresso NO
    const inputIngresso = r.querySelector(".in-i");
    const ingressoNormalizzato = inputIngresso ? inputIngresso.value.trim().toLowerCase() : "";
    const condIngressoNo = paroleNo.includes(ingressoNormalizzato);
    
    // 3. Condizione Permesso Rientro NO
    let ppIn = "";
    if (typeof ORARI_PP !== "undefined" && ORARI_PP[cognome] && ORARI_PP[cognome][giornoSettimana]) {
        ppIn = ORARI_PP[cognome][giornoSettimana].in;
    }
    const condPpNo = ppIn.trim().toLowerCase().includes("no rientro");

    return condAssente || condIngressoNo || condPpNo;
}
// --- CONVITTO riepilogo
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
            ppIn = ORARI_PP[cognome][giornoSettimana].in;
        }

        const sOriginale = studenticonvittori.find((st) => st.cognome === cognome);

        if (!camere[room]) camere[room] = [];
        camere[room].push({
            classe: r.dataset.classe,
            percorso: r.dataset.percorso,
            cognome: cognome,
            dinnerno: r.dataset.dinnerno,
            presente: !r.classList.contains("assente"),
            oraU: r.querySelector(".in-u").value,
            oraI: r.querySelector(".in-i").value,
            ppOut: ppOut,
            ppIn: ppIn,
            gruppo: r.dataset.gruppo,
            bus: haDirittoAlBus(sOriginale),
            // Sfruttiamo la nuova funzione condivisa:
            isStandBy: verificaStudenteStandBy(r) 
        });
    });

    const camereOrdinate = Object.keys(camere).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
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
        
        /* Forziamo un'altezza fissa e ridotta sia sulle righe che sulle celle */
        tr { height: 21px !important; }
th, td { 
    border: 1px solid #000; 
    padding: 1px 2px; 
    text-align: center; 
    font-size: 0.65em;      /* leggermente più grande */
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    height: 21px !important; 
    box-sizing: border-box; 
    line-height: 19px;      /* ~2px in meno dell'altezza */
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
            <tbody>
                ${camereOrdinate
                    .map((room) => {
                        let html = "";
                        html += camere[room]
                            .map((s, idx) => {
                                const isLastRow = idx === camere[room].length - 1;
                                // Applichiamo in modo pulito le classi senza duplicare l'attributo class
                                const bClass = isLastRow ? 'class="border-bottom-bold"' : 'class="border-dashed"';
                                const bClassGray = isLastRow ? 'class="border-bottom-bold bg-gray"' : 'class="border-dashed bg-gray"';
                                const bClassCognome = isLastRow ? 'class="border-bottom-bold col-cognome"' : 'class="border-dashed col-cognome"';
                                
                                return `<tr>
                                    ${idx === 0 ? `<td rowspan="${camere[room].length}" class="room-header border-bottom-bold">${room}</td>` : ""}
                                    <td ${bClass}>${s.classe} ${s.percorso || ""}</td>
                                    <td ${bClassCognome}><b>${s.cognome}</b> ${s.gruppo ? "(" + s.gruppo + ")" : ""}</td>
                                    <td ${bClass}>${s.presente ? "X" : ""}</td>
                                    <td ${bClass}>${!s.presente ? "X" : ""}</td>
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
                        
                        if (room === "125") {
                            html += `</tbody></table><div class="page-break"></div><h2>FEMMINILE - piano 2° - ${dataStampa}</h2><table><thead>${hookTestataTabella}</thead><tbody>`;
                        }
                        return html;
                    })
                    .join("")}
            </tbody>
        </table>
        <div class="footer-timestamp">aggiornamento ${dataOggiStampa} ore ${oraStampa}</div>
    </body></html>`);
popup.document.close();
}
// --- MATTINO BUS
function generaPopUpStampaBus(ordinamento) {
    // ordinamento: 'alfabetico' (default) | 'perClasse'
    ordinamento = ordinamento || 'alfabetico';

    const oggi = new Date();
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const oraEsatta = oggi.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    
    // Data di domani (per il sottotitolo "Trasporto del ...")
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

    // 1. FILTRO CLASSI ESCLUSE (Aggiunta la 4C)
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
        // alfabetico per cognome (con 5A/5B in fondo, come da logica originale)
       const classiInFondo = ["5A", "5B", "4C"];

const resto = validi.filter((s) => !classiInFondo.includes(s.classe));
const classe5A = validi.filter((s) => s.classe === "5A");
const classe5B = validi.filter((s) => s.classe === "5B");
const classe4C = validi.filter((s) => s.classe === "4C");

resto.sort((a, b) => a.cognome.localeCompare(b.cognome));

const ordinaPerGruppoECognome = (a, b) => {
    const gA = a.gruppo || "";
    const gB = b.gruppo || "";
    return (gA + a.cognome).localeCompare(gB + b.cognome);
};
classe5A.sort(ordinaPerGruppoECognome);
classe5B.sort(ordinaPerGruppoECognome);
classe4C.sort(ordinaPerGruppoECognome);

validi.length = 0;
validi.push(...resto, ...classe5A, ...classe5B, ...classe4C);
    }

    // 3. DISTRIBUZIONE IN 3 COLONNE
    const totaleElementi = validi.length;
    const itemsPerColonna = Math.ceil(totaleElementi / 3);
    const colonneHtml = ["", "", ""];

    function generaRigaStudente(s) {
        let bgStyle = "";
        if (s.classe === "5A" || s.classe === "5B") {
            if (s.gruppo === "G1") bgStyle = "background-color: #eaf2f8; border-left: 4px solid #2c3e50;"; // lilla tenue
            if (s.gruppo === "G2") bgStyle = "background-color: #fef9e7; border-left: 4px dashed #2c3e50;"; // giallo tenue
        }

        // Lookup stand-by dal DOM
        const rigaElemento = document.querySelector(`.student-row[data-cognome="${s.cognome}"]`);
        let visualizzaStandBy = "";
        if (rigaElemento && typeof verificaStudenteStandBy === "function") {
            visualizzaStandBy = verificaStudenteStandBy(rigaElemento) ? "➖" : "";
        }

        // Gestione Note per 4C e 5B
        let notaCustom = "";
        const classeUpper = s.classe.toUpperCase();
        if (classeUpper === "4C") {
            notaCustom = "solo GIO";
        } else if (classeUpper === "5B") {
            notaCustom = "GIO NO";
        }

        return `
            <div class="bus-row" style="${bgStyle}">
                <div class="b-cell b-class">${s.classe}${s.gruppo ? " • " + s.gruppo : ""}</div>
                <div class="b-cell b-name"><b>${s.cognome}</b></div>
                <div class="b-cell b-room">${s.room || ""}</div>
                <div class="b-cell b-check"></div>
                <div class="b-cell b-standby" style="font-size: 0.9em;">${visualizzaStandBy}</div>
                <div class="b-cell b-notes">${notaCustom}</div>
            </div>
        `;
    }

    validi.forEach((s, idx) => {
        const colonnaIdx = Math.floor(idx / itemsPerColonna);
        colonneHtml[colonnaIdx] += generaRigaStudente(s);
    });

    // Calcolo presenti (senza stand-by) e totale bus
    const totaleBus = validi.length;
    const presenti = validi.filter((s) => {
        const rigaElemento = document.querySelector(`.student-row[data-cognome="${s.cognome}"]`);
        if (!rigaElemento || typeof verificaStudenteStandBy !== "function") return true;
        return !verificaStudenteStandBy(rigaElemento);
    }).length;

    
    // 4. POPUP
    const titolo = ordinamento === 'perClasse'
        ? "BUS DOMATTINA — per classe"
        : "BUS DOMATTINA - alfabetico";

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
           <div class="date-subtitle">Trasporto del ${dataDomaniTestuale} — Presenti: <b>${presenti}</b> su <b>${totaleBus}</b> totali</div>

    <div class="toolbar-stampa no-print">

                <button class="btn-stampa" onclick="window.print()">•STAMPA</button>
                <button class="btn-per-classe" onclick="window.opener.generaPopUpStampaBus('${ordinamento === 'perClasse' ? 'alfabetico' : 'perClasse'}'); window.close();">
                    ⇄ CAMBIA ORDINE
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
            
            
            
            
            
            
            
            <h2>BUS CONVITTORI ALFABETICO</h2>
            
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



// -- fine tasti stampa

// --- 6. GESTIONE ASSENZE PROGRAMMATE ---
function salvaAssenzeProgrammate() {
    localStorage.setItem("assenzeProgrammate", JSON.stringify(assenzeProgrammate));
}

function caricaAssenzeProgrammate() {
    const saved = localStorage.getItem("assenzeProgrammate");
    assenzeProgrammate = saved ? JSON.parse(saved) : {};
}

function isAssenteProgrammato(cognome, data) {
    const lista = assenzeProgrammate[cognome.toUpperCase()];
    if (!lista) return false;

    const oggi = new Date(data.toISOString().split("T")[0]);

    return lista.some((periodo) => {
        const dal = new Date(periodo.dal);
        const al = new Date(periodo.al);
        return oggi >= dal && oggi <= al;
    });
}

function aggiungiAssenza() {
    const cognomeSel = document.getElementById("selectStudente").value;
    const classeSel = document.getElementById("selectClasse").value;
    const dal = document.getElementById("dataDal").value;
    const al = document.getElementById("dataAl").value;

    if (!dal || !al) return alert("Seleziona entrambe le date");

    let studentiDaAggiornare = [];

    if (classeSel) {
        studentiDaAggiornare = studenticonvittori
            .filter((s) => s.classe === classeSel)
            .map((s) => s.cognome.toUpperCase());
    } else if (cognomeSel) {
        studentiDaAggiornare = [cognomeSel.toUpperCase()];
    } else {
        return alert("Seleziona uno studente o una classe");
    }

    studentiDaAggiornare.forEach((cognome) => {
        if (!assenzeProgrammate[cognome]) {
            assenzeProgrammate[cognome] = [];
        }
        assenzeProgrammate[cognome].push({ dal, al });
    });

    salvaAssenzeProgrammate();
    renderListaAssenze();
}

function renderListaAssenze() {
    const container = document.getElementById("listaAssenze");
    if (!container) return;

    container.innerHTML = Object.entries(assenzeProgrammate)
        .map(([cognome, periodi]) => {
            return `
            <div style="margin-bottom:10px;">
                <b>${cognome}</b>
                ${periodi
                    .map(
                        (p, i) => `
                    <div style="font-size:0.8em;">
                        ${p.dal} → ${p.al}
                        <button onclick="rimuoviAssenza('${cognome}', ${i})">❌</button>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
        })
        .join("");
}

function rimuoviAssenza(cognome, index) {
    assenzeProgrammate[cognome].splice(index, 1);
    if (assenzeProgrammate[cognome].length === 0) {
        delete assenzeProgrammate[cognome];
    }
    salvaAssenzeProgrammate();
    renderListaAssenze();
}

// --- 7. PERMESSI E UTILITY ---
function popolaListaPermessi() {
    const container = document.getElementById("listaPermessiContent");
    if (!container) return;

    const giorniSettimana = ["", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì"];
    const studentiPP = Object.keys(ORARI_PP || {}).sort();

    if (studentiPP.length === 0) {
        container.innerHTML = "<p>Nessun orario PP.</p>";
        return;
    }

    container.innerHTML = studentiPP
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
}

function popolaSelectStudenti() {
    const sel = document.getElementById("selectStudente");
    if (!sel) return;

    const gruppi = {};
    studenticonvittori.forEach((s) => {
        if (!gruppi[s.classe]) gruppi[s.classe] = [];
        gruppi[s.classe].push(s);
    });

    let html = `<option value="">-- Seleziona Nome --</option>`;
    Object.keys(gruppi)
        .sort()
        .forEach((classe) => {
            html += `<optgroup label="${classe}">`;
            gruppi[classe].forEach((s) => {
                html += `<option value="${s.cognome}">${s.cognome} ${s.nome}</option>`;
            });
            html += `</optgroup>`;
        });
    sel.innerHTML = html;
}

function popolaSelectClassi() {
    const sel = document.getElementById("selectClasse");
    if (!sel) return;
    const classiUniche = [...new Set(studenticonvittori.map((s) => s.classe))].sort();
    sel.innerHTML =
        `<option value="">-- Seleziona Classe --</option>` +
        classiUniche.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function togglePanel() {
    const panel = document.getElementById("sidePanel");
    if (panel.style.right === "0px") {
        panel.style.right = "-350px";
    } else {
        popolaListaPermessi();
        popolaSelectStudenti();
        renderListaAssenze();
        popolaSelectClassi();
        panel.style.right = "0px";
    }
}

function isStudenteInLabOggi(classe, gruppo, dataOggetto) {
    const giorno = dataOggetto.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mer, 4=Gio, 5=Ven, 6=Sab

    // Classi in laboratorio dinner per giorno (da permessi_26.js)
    const classiLabOggi = (typeof LAB_DINNER !== "undefined" && LAB_DINNER[giorno]) || [];

    // Se la classe non è in laboratorio oggi, esce subito
    if (!classiLabOggi.includes(classe)) return false;

    // Per 5A e 5B il giovedì il laboratorio è a gruppi alterni (G1/G2)
    // Il calendario CALENDARIO_GRUPPI_DINNER (in permessi_26.js) dice
    // quale gruppo tocca quella settimana: "gr1" → G1, "gr2" → G2
    if ((classe === "5A" || classe === "5B") && giorno === 4) {
        const dataKey = dataOggetto.toLocaleDateString("it-IT");
        const gLab = CALENDARIO_GRUPPI_DINNER[dataKey];
        if (!gLab) return false; // nessun gruppo in lab quella settimana (es. vacanza)
        return (gLab === "gr1" && gruppo === "G1") || (gLab === "gr2" && gruppo === "G2");
    }

    // Per tutte le altre classi (2P, 2A, 2B) il laboratorio è per tutta la classe
    return true;
}

function isPPNoDinnerOggi(cognome, giorno) {
    return ASSENTI_PERMESSO[giorno]?.includes(cognome.toUpperCase());
}

function updateClock() {
    document.getElementById("digitalClock").innerText = new Date().toLocaleTimeString("it-IT");
}

function salvaDatiLocale() {
    const dati = {};
    document.querySelectorAll(".student-row").forEach((r) => {
        dati[r.dataset.cognome] = {
            esce: r.querySelector(".in-u").value,
            entra: r.querySelector(".in-i").value,
            assente: r.classList.contains("assente"),
            dinnerno: r.dataset.dinnerno,
            switch: cambiTurnoManuali[r.dataset.cognome] || false
        };
    });
    localStorage.setItem("datiConvitto", JSON.stringify(dati));
}

function caricaDatiLocale() {
    const dati = JSON.parse(localStorage.getItem("datiConvitto") || "{}");
    const giornoSettimana = new Date().getDay();

    document.querySelectorAll(".student-row").forEach((r) => {
        const cognome = r.dataset.cognome;
        const cgn = cognome.toUpperCase();
        const d = dati[cognome];

        let ppOut = "";
        let ppIn = "";
        if (ORARI_PP[cgn] && ORARI_PP[cgn][giornoSettimana]) {
            ppOut = ORARI_PP[cgn][giornoSettimana].out || "";
            ppIn = ORARI_PP[cgn][giornoSettimana].in || "";
        }

        r.querySelector(".in-u").value = d && d.esce !== undefined ? d.esce : ppOut;
        r.querySelector(".in-i").value = d && d.entra !== undefined ? d.entra : ppIn;

        if (d) {
            if (d.assente) {
                r.classList.add("assente");
                const btnAss = r.querySelector(".btn-ass");
                if (btnAss) btnAss.classList.add("active-ass");
            } else {
                r.classList.remove("assente");
                const btnAss = r.querySelector(".btn-ass");
                if (btnAss) btnAss.classList.remove("active-ass");
            }

            if (d.dinnerno === "1") {
                r.classList.add("dinner-no");
                const btnDin = r.querySelector(".btn-din");
                if (btnDin) btnDin.classList.add("active-din");
                r.dataset.dinnerno = "1";
            } else {
                r.classList.remove("dinner-no");
                const btnDin = r.querySelector(".btn-din");
                if (btnDin) btnDin.classList.remove("active-din");
                r.dataset.dinnerno = "0";
            }

            if (d.switch) {
                cambiTurnoManuali[cognome] = true;
            }
        }

        if (cambiTurnoManuali[cognome]) {
            const btnSwitch = r.querySelector(".btn-switch");
            if (btnSwitch) btnSwitch.classList.add("modificato");
        }

        controllaDinnerAutomatico(r);
    });
}

function mostraDataReset() {
    const dReset = localStorage.getItem("dataUltimoReset");
    if (dReset) document.getElementById("info-reset").innerText = `Ultimo aggiornamento: ${dReset}`;
}

function cancellaNote() {
    if (confirm("Vuoi cancellare definitivamente tutte le note?")) {
        const noteInput = document.getElementById("dailyNotes");
        if (noteInput) {
            noteInput.value = "";
            localStorage.setItem("note_convitto", "");
        }
    }
}

// --- FUNZIONI DI RESET (da implementare se necessarie) ---
function resetDati(tipo) {
    if (tipo === 'soloManuali') {
        if (confirm("Resettare solo le modifiche manuali di oggi?")) {
            // Resetta solo i campi manuali, non le assenze programmate
            document.querySelectorAll(".student-row").forEach((r) => {
                // Rimuovi override manuali ma mantieni dati PP
                const cognome = r.dataset.cognome;
                const d = JSON.parse(localStorage.getItem("datiConvitto") || "{}");
                if (d[cognome]) {
                    delete d[cognome];
                }
                localStorage.setItem("datiConvitto", JSON.stringify(d));
                r.querySelector(".in-u").value = "";
                r.querySelector(".in-i").value = "";
                r.classList.remove("assente");
                r.classList.remove("dinner-no");
                r.dataset.dinnerno = "0";
                const btnAss = r.querySelector(".btn-ass");
                if (btnAss) btnAss.classList.remove("active-ass");
                const btnDin = r.querySelector(".btn-din");
                if (btnDin) btnDin.classList.remove("active-din");
                // Rimuovi switch manuali
                if (cambiTurnoManuali[cognome]) {
                    delete cambiTurnoManuali[cognome];
                    const btnSwitch = r.querySelector(".btn-switch");
                    if (btnSwitch) btnSwitch.classList.remove("modificato");
                }
                controllaDinnerAutomatico(r);
            });
            localStorage.setItem("dataUltimoReset", new Date().toLocaleString());
            mostraDataReset();
            alert("Reset manuale completato.");
        }
    } else if (tipo === 'completo') {
        if (confirm("⚠️ RESET COMPLETO: cancellare TUTTI i dati locali?")) {
            localStorage.removeItem("datiConvitto");
            localStorage.removeItem("assenzeProgrammate");
            localStorage.setItem("dataUltimoReset", new Date().toLocaleString());
            cambiTurnoManuali = {};
            assenzeProgrammate = {};
            location.reload();
        }
    }
} 

// --- CARICAMENTO INIZIALE ---
// init() viene chiamato da campus_hub.html DOPO il caricamento dei dati da Firebase
