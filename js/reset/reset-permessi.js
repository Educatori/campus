/**
 * js/reset/reset-permessi.js
 * ─────────────────────────────────────────────────────────────
 * Reset giornaliero e gestione Import/Export Permessi Permanenti:
 *   • resetDati()             → reset condiviso (soloManuali)
 *   • esportaPermessiJSON()   → scarica ORARI_PP come JSON
 *   • importaPermessiJSON()   → carica e fonde un JSON in ORARI_PP
 *
 * Dipendenze runtime:
 *   - cambiTurnoManuali                  → campus_hub-script.js (let globale)
 *   - ricaricaListaStudenti()            → campus_hub-script.js
 *   - mostraDataReset()                  → core/persistenza.js
 *   - rimuoviEvidenziazioneTasti()       → core/filtri.js
 *   - popolaListaPermessi()              → pannello/side-panel.js
 *   - ORARI_PP                           → data-loader.js (window)
 *   - window.salvaDatiFirebase           → data-loader.js
 *   - window.pubblicaUltimoReset         → data-loader.js
 *   - window.salvaPermessiFirebase       → campus_hub.html (modulo Firebase)
 *
 * ⚠️ Caricare DOPO tutti gli altri moduli, PRIMA o DOPO il main
 *    è indifferente (le funzioni sono chiamate solo da onclick).
 * ─────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════
// RESET GIORNALIERO CONDIVISO
// ═══════════════════════════════════════════════════════════════
function resetDati(tipo) {
    if (tipo === 'soloManuali') {
        // ═══════════════════════════════════════════════════════════
        // PRIMA CONFERMA — riepilogo di cosa verrà cancellato
        // ═══════════════════════════════════════════════════════════
        const msgPrima =
            "🗑️ RESET GIORNALIERO CONDIVISO\n\n" +
            "Verranno cancellate le modifiche di OGGI per TUTTI i terminali:\n" +
            "  • Stato ASSENTE\n" +
            "  • Stato NON CENA\n" +
            "  • Orari ESCE / ENTRA\n" +
            "  • Switch turno\n\n" +
            "NON verranno toccati:\n" +
            "  • Permessi permanenti (PP)\n" +
            "  • Programmazione assenze\n" +
            "  • Assenti permesso\n\n" +
            "Vuoi procedere?";

        if (!confirm(msgPrima)) return;

        // ═══════════════════════════════════════════════════════════
        // SECONDA CONFERMA — digitare "RESET" per confermare
        // ═══════════════════════════════════════════════════════════
        const msgSeconda =
            "⚠️ CONFERMA FINALE ⚠️\n\n" +
            "Questa azione è IRREVERSIBILE e riguarderà TUTTI i terminali connessi.\n\n" +
            "Per confermare, digita la parola:\n\n" +
            "         RESET\n\n" +
            "(tutto maiuscolo, senza spazi)";

        const conferma = prompt(msgSeconda);

        if (conferma === null) {
            console.log("Reset annullato (prompt annullato)");
            return;
        }

        if (conferma.trim() !== "RESET") {
            alert("❌ Reset annullato.\nIl testo digitato non corrisponde a \"RESET\".");
            console.log("Reset annullato (testo errato):", conferma);
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // RESET LOCALE
        // ═══════════════════════════════════════════════════════════
        console.log("🗑️ Reset confermato, avvio procedura...");

        if (typeof rimuoviEvidenziazioneTasti === "function") rimuoviEvidenziazioneTasti();

        // Reset filtri di ricerca
        const searchInput = document.getElementById("search");
        if (searchInput) searchInput.value = "";
        const roomInput = document.getElementById("roomInput");
        if (roomInput) roomInput.value = "";
        const classeFilter = document.getElementById("classeFilter");
        if (classeFilter) classeFilter.value = "";

        // Pulisci dati manuali da localStorage
        localStorage.removeItem("datiConvitto");

        // Resetta i cambi turno manuali (variabile globale del main)
        cambiTurnoManuali = {};

        // ── Timestamp reset (locale + Firebase) ──
        const adesso = new Date().toLocaleString("it-IT", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
        localStorage.setItem("dataUltimoReset", adesso);

        // Ricostruisci le card (riapplica automaticamente PP + assenze programmate)
        ricaricaListaStudenti();
        mostraDataReset();

        // ═══════════════════════════════════════════════════════════
        // RESET CONDIVISO SU FIREBASE (solo se online)
        // ═══════════════════════════════════════════════════════════
        if (window.APP_MODE === 'online' &&
            typeof window.salvaDatiFirebase === 'function') {

            window.salvaDatiFirebase()
                .then(async () => {
                    if (typeof window.pubblicaUltimoReset === 'function') {
                        await window.pubblicaUltimoReset(adesso);
                    }
                    console.log('☁️ Reset condiviso pubblicato su Firebase');
                    alert("✅ Reset completato e pubblicato su tutti i terminali.\n\nLe assenze programmate e i permessi permanenti sono stati mantenuti.");
                })
                .catch((err) => {
                    console.error('❌ Errore reset condiviso:', err);
                    alert("⚠️ Reset locale completato, ma errore nella pubblicazione condivisa:\n" + err.message);
                });
        } else {
            alert("✅ Reset completato (modalità locale).\n\nLe assenze programmate e i permessi permanenti sono stati mantenuti.");
        }
    }
    else if (tipo === 'completo') {
        // ═══════════════════════════════════════════════════════════
        // RESET COMPLETO — tasto rimosso, codice inutilizzato
        // conservato come documentazione
        // ═══════════════════════════════════════════════════════════
        const msgPrimaCompleto =
            "⚠️ RESET COMPLETO ⚠️\n\n" +
            "Verranno cancellati TUTTI i dati locali:\n" +
            "  • Modifiche giornaliere (assente, no cena, orari, switch)\n" +
            "  • Programmazione assenze\n" +
            "  • Timestamp di reset\n\n" +
            "Vuoi procedere?";

        if (!confirm(msgPrimaCompleto)) return;

        const confermaCompleto = prompt(
            "⚠️ CONFERMA FINALE ⚠️\n\n" +
            "Digita la parola:\n\n" +
            "         RESET\n\n" +
            "(tutto maiuscolo)"
        );

        if (confermaCompleto === null) return;
        if (confermaCompleto.trim() !== "RESET") {
            alert("❌ Reset annullato.\nIl testo digitato non corrisponde a \"RESET\".");
            return;
        }

        localStorage.removeItem("datiConvitto");
        localStorage.removeItem("assenzeProgrammate");
        localStorage.setItem("dataUltimoReset", new Date().toLocaleString("it-IT", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        }));
        cambiTurnoManuali = {};
        assenzeProgrammate = {};
        location.reload();
    }
}

// ═══════════════════════════════════════════════════════════════
// IMPORT / EXPORT PERMESSI PERMANENTI (ORARI_PP)
// ═══════════════════════════════════════════════════════════════

/**
 * Esporta ORARI_PP in un file JSON scaricabile
 */
function esportaPermessiJSON() {
    if (typeof ORARI_PP === "undefined" || !ORARI_PP) {
        alert("⚠️ Nessun permesso da esportare");
        return;
    }

    const numPermessi = Object.keys(ORARI_PP).length;
    if (numPermessi === 0) {
        alert("⚠️ Non ci sono permessi da esportare");
        return;
    }

    const dataFile = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(ORARI_PP, null, 2)], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `permessi_${dataFile}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`📤 Esportati ${numPermessi} permessi`);
}

/**
 * Importa un file JSON e fa il merge con ORARI_PP esistente.
 * Salva su Firebase se la funzione è disponibile.
 */
async function importaPermessiJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input per permettere di ricaricare lo stesso file
    event.target.value = "";

    try {
        const text = await file.text();
        let nuoviPermessi;

        try {
            nuoviPermessi = JSON.parse(text);
        } catch (e) {
            alert("❌ Il file non è un JSON valido:\n" + e.message);
            return;
        }

        // Validazione struttura
        if (typeof nuoviPermessi !== "object" || Array.isArray(nuoviPermessi)) {
            alert("❌ Formato non valido: atteso un oggetto { COGNOME: { giorno: {out, in} } }");
            return;
        }

        const numNuovi = Object.keys(nuoviPermessi).length;
        const numEsistenti = (typeof ORARI_PP !== "undefined" && ORARI_PP)
            ? Object.keys(ORARI_PP).length
            : 0;

        const conferma = confirm(
            `📥 Importazione permessi\n\n` +
            `File: ${file.name}\n` +
            `Permessi nel file: ${numNuovi}\n` +
            `Permessi attuali: ${numEsistenti}\n\n` +
            `I permessi con lo stesso cognome verranno SOVRASCRITTI.\n` +
            `Procedere?`
        );

        if (!conferma) {
            console.log("Importazione annullata dall'utente");
            return;
        }

        // Merge: i nuovi sovrascrivono gli esistenti per cognome
        if (typeof ORARI_PP === "undefined" || !ORARI_PP) {
            window.ORARI_PP = {};
        }

        Object.keys(nuoviPermessi).forEach(cognome => {
            ORARI_PP[cognome.toUpperCase()] = nuoviPermessi[cognome];
        });

        // Salvataggio su Firebase
        if (typeof window.salvaPermessiFirebase === "function") {
            try {
                await window.salvaPermessiFirebase(ORARI_PP);
                console.log("✅ Permessi salvati su Firebase");
            } catch (err) {
                console.error("❌ Errore salvataggio Firebase:", err);
                alert("⚠️ Permessi aggiornati in memoria ma errore nel salvataggio Firebase:\n" + err.message);
                return;
            }
        } else {
            // Fallback: salva in localStorage
            localStorage.setItem("ORARI_PP", JSON.stringify(ORARI_PP));
            console.warn("⚠️ salvaPermessiFirebase non disponibile, salvato in localStorage");
        }

        // Aggiorna la lista nella tendina
        if (typeof popolaListaPermessi === "function") popolaListaPermessi();

        // Ricarica le righe studenti per applicare i nuovi PP (out/in)
        ricaricaListaStudenti();

        alert(`✅ Importati ${numNuovi} permessi con successo!`);
        console.log("📥 Import completato:", nuoviPermessi);

    } catch (err) {
        console.error("❌ Errore importazione:", err);
        alert("❌ Errore durante l'importazione:\n" + err.message);
    }
}