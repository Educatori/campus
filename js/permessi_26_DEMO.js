// PERMESSI_26.JS
// Configurazione dei permessi e turni per l'anno scolastico 2026/2027

// LAB_PRANZO: classi che vanno in laboratorio a pranzo per giorno settimana (1=Lunedì, ...)
const LAB_PRANZO = {
    "1": ["3A", "5A", "5B"],
    "2": ["3B", "4A"],
    "3": ["1A", "4B"],
    "4": ["1B", "4C"]
};

// TURNI_DINNER: classi divise per turno cena
const TURNI_DINNER = {
    "1": ["1A", "1B", "1P", "2A", "2B", "2P", "3P"],
    "2": ["3A", "3B", "4A", "4B", "4C", "5A", "5B"]
};

// LAB_DINNER: classi che vanno in laboratorio a cena
const LAB_DINNER = {
    "1": ["2P"],
    "2": ["2A"],
    "3": ["2B"],
    "4": ["5A", "5B"]
};

// OVERRIDE_TURNI_DINNER_CLASSI: override del turno cena per un'intera classe
// Formato: "CLASSE": { "giornoSettimana": turno }
// Esempio: 1A e 1B il mercoledì (3) vanno al turno 2 invece che al turno 1
const OVERRIDE_TURNI_DINNER_CLASSI = {
    "1A": { 3: 2 },
    "1B": { 3: 2 }
};

// OVERRIDE_TURNI_DINNER: override individuali per turno cena
// Formato: "COGNOME": { "giornoSettimana": turno }
const OVERRIDE_TURNI_DINNER = {
    "GASPARE": { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1 }, // Sempre turno 2
    
}; 

// ORARI_PP: permessi permanenti per studente
// Formato: "COGNOME": { "giornoSettimana": { "out": "ora uscita", "in": "ora rientro" } }
const ORARI_PP = {
     
     "PAOLONI": { 1: { out: "8:30", in: "11:00" }, 2: { out: "16:00", in: "21:30" }, 3: { out: "15:00", in: "18:00" }, 4: { out: "16:00", in: "18:00" }},
    
    
};

// ASSENTI_PERMESSO: studenti che hanno permesso di non cenare
// Formato: "giornoSettimana": ["COGNOME1", "COGNOME2"]
const ASSENTI_PERMESSO = {
    1: [''], 
    2: [''], 
    3: [''], 
    4: [''], 
};

// CALENDARIO_GRUPPI_DINNER: calendario dei gruppi per i laboratori a cena
const CALENDARIO_GRUPPI_DINNER = {
    "10/09/2026": "gr1",     "17/09/2026": "gr2",     "24/09/2026": "gr1",     "01/10/2026": "gr2",     "08/10/2026": "gr1",     "15/10/2026": "gr2",     "22/10/2026": "gr1",     "29/10/2026": "gr2",     "05/11/2026": "gr1",     "12/11/2026": "gr2",     "19/11/2026": "gr1",     "26/11/2026": "gr2",     "03/12/2026": "gr1",     "10/12/2026": "gr2",     "17/12/2026": "gr1",     "07/01/2027": "gr2",     "14/01/2027": "gr1",     "21/01/2027": "gr2",     "28/01/2027": "gr1",     "04/02/2027": "gr2",     "18/02/2027": "gr2",     "25/02/2027": "gr1",     "04/03/2027": "gr2",     "11/03/2027": "gr1",     "18/03/2027": "gr2",     "01/04/2027": "gr2",     "08/04/2027": "gr1",     "15/04/2027": "gr2",     "22/04/2027": "gr1",     "29/04/2027": "gr2",     "06/05/2027": "gr1",     "13/05/2027": "gr2",     "20/05/2027": "gr1",     "27/05/2027": "gr2",     "03/06/2027": "gr1"
};

// ============================================================
// FUNZIONE DI SUPPORTO: calcolo del turno cena dinamico
// ============================================================
// Ordine di priorità:
//   1. Turno base dalla classe (TURNI_DINNER)
//   2. Override per classe (OVERRIDE_TURNI_DINNER_CLASSI)
//   3. Override individuale per cognome (OVERRIDE_TURNI_DINNER)
//
// Parametri:
//   - classe:  stringa, es. "1A"
//   - cognome: stringa, es. "ROSSI" (opzionale, può essere null)
//   - giorno:  numero 1-5 (1=Lunedì ... 5=Venerdì)
//
// Ritorna: numero del turno (1 o 2) oppure null se non trovato
function getTurnoDinamico(classe, cognome, giorno) {
    let turno = null;

    // 1. Turno base dalla classe
    for (const [t, classi] of Object.entries(TURNI_DINNER)) {
        if (classi.includes(classe)) {
            turno = parseInt(t);
            break;
        }
    }

    // 2. Override per classe
    if (OVERRIDE_TURNI_DINNER_CLASSI[classe] &&
        OVERRIDE_TURNI_DINNER_CLASSI[classe][giorno] !== undefined) {
        turno = OVERRIDE_TURNI_DINNER_CLASSI[classe][giorno];
    }

    // 3. Override individuale (ha precedenza su quello di classe)
    if (cognome &&
        OVERRIDE_TURNI_DINNER[cognome] &&
        OVERRIDE_TURNI_DINNER[cognome][giorno] !== undefined) {
        turno = OVERRIDE_TURNI_DINNER[cognome][giorno];
    }

    return turno;
}

// Esponi globalmente
if (typeof window !== 'undefined') {
    window.LAB_PRANZO = LAB_PRANZO;
    window.TURNI_DINNER = TURNI_DINNER;
    window.LAB_DINNER = LAB_DINNER;
    window.OVERRIDE_TURNI_DINNER_CLASSI = OVERRIDE_TURNI_DINNER_CLASSI;
    window.OVERRIDE_TURNI_DINNER = OVERRIDE_TURNI_DINNER;
    window.ORARI_PP = ORARI_PP;
    window.ASSENTI_PERMESSO = ASSENTI_PERMESSO;
    window.CALENDARIO_GRUPPI_DINNER = CALENDARIO_GRUPPI_DINNER;
    window.getTurnoDinamico = getTurnoDinamico;
}