/**
 * js/core/turni.js
 * ─────────────────────────────────────────────────────────────
 * Logica dei turni cena:
 *   • turnoStudente()    → turno effettivo (base + override classe + individuale)
 *   • costruisciTurni()  → { turno1: [...], turno2: [...] }
 *   • setTurno()         → filtro visivo 1° / 2°
 *
 * Dipendenze (globali al momento della chiamata):
 *   - getDataCorrente()              → core/stato.js
 *   - studenticonvittori             → data-loader.js (window)
 *   - TURNI_DINNER                   → data-loader.js (window)
 *   - OVERRIDE_TURNI_DINNER_CLASSI   → data-loader.js (window)
 *   - OVERRIDE_TURNI_DINNER          → data-loader.js (window)
 *
 * Usato da:
 *   - campus_hub-script.js (ricaricaListaStudenti, setTurno dai tasti filtro)
 *   - stampe/dinner.js (generaPopUpStampaDinner, generaPopUpStampaPresDin)
 *   - stampe/convitto.js? No, quello non lo usa
 *   - core/pp.js (controllaDinnerAutomatico)
 *
 * ⚠️ Caricare DOPO core/stato.js (usa getDataCorrente).
 * ─────────────────────────────────────────────────────────────
 */

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