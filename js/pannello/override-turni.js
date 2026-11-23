/* ============================================================
   OVERRIDE TURNI CENA
   Gestione override individuali per il turno di cena.
   ============================================================ */

/* ── Autocomplete studente ── */
function suggerisciStudentiOverride(query) {
    const lista  = document.getElementById('overrideListaSuggerimenti');
    const hidden = document.getElementById('overrideStudenteSelezionato');
    if (!lista || !hidden) return;

    if (!query || query.length < 2) {
        lista.style.display = 'none';
        hidden.value = '';
        return;
    }

    const studenti = window.studenticonvittori || window.tuttiStudenti || [];
    const q = query.toUpperCase();
    const matches = studenti
        .filter(s => s.cognome && s.cognome.toUpperCase().includes(q))
        .slice(0, 8);

    if (matches.length === 0) {
        lista.style.display = 'none';
        return;
    }

    lista.innerHTML = matches.map(s =>
        `<div onclick="selezionaStudenteOverride('${s.cognome}')"
              style="padding:8px 12px; cursor:pointer; border-bottom:1px solid var(--border);"
              onmouseover="this.style.background='var(--surface-2)'"
              onmouseout="this.style.background='transparent'">
            ${s.cognome} ${s.nome || ''}
            <span style="color:var(--text-muted);font-size:0.75rem;">(${s.classe})</span>
        </div>`
    ).join('');
    lista.style.display = 'block';
}

function selezionaStudenteOverride(cognome) {
    document.getElementById('overrideCercaStudente').value = cognome;
    document.getElementById('overrideStudenteSelezionato').value = cognome;
    document.getElementById('overrideListaSuggerimenti').style.display = 'none';
}

/* ── Salva override ── */
async function salvaOverrideTurno() {
    const cognome = document.getElementById('overrideStudenteSelezionato').value;
    const giorno  = document.getElementById('overrideGiorno').value;
    const turno   = Number(document.getElementById('overrideTurno').value);

    if (!cognome) {
        alert('Seleziona prima uno studente dalla lista.');
        return;
    }

    try {
        // Scrive solo il giorno specifico, preservando gli altri giorni
        await window.update(window.ref(window.db, `overrides_turni_dinner/${cognome}`),
            { [giorno]: turno });

        // Aggiorna la copia locale
        if (!window.OVERRIDE_TURNI_DINNER) window.OVERRIDE_TURNI_DINNER = {};
        if (!window.OVERRIDE_TURNI_DINNER[cognome]) window.OVERRIDE_TURNI_DINNER[cognome] = {};
        window.OVERRIDE_TURNI_DINNER[cognome][giorno] = turno;

        alert(`✅ Override salvato: ${cognome} → giorno ${giorno}, turno ${turno}`);
        renderListaOverrideAttivi();
        if (typeof renderLista === 'function') renderLista();
        else if (typeof applicaFiltri === 'function') applicaFiltri();
    } catch (err) {
        console.error('Errore salvataggio override:', err);
        alert('❌ Errore nel salvataggio. Controlla la console.');
    }
}

/* ── Rimuovi override (un giorno specifico) ── */
async function rimuoviOverrideTurno() {
    const cognome = document.getElementById('overrideStudenteSelezionato').value;
    const giorno  = document.getElementById('overrideGiorno').value;

    if (!cognome) {
        alert('Seleziona prima uno studente.');
        return;
    }

    if (!confirm(`Rimuovere l'override per ${cognome} (giorno ${giorno})?`)) return;

    try {
        await window.update(window.ref(window.db),
            { [`overrides_turni_dinner/${cognome}/${giorno}`]: null });

        if (window.OVERRIDE_TURNI_DINNER?.[cognome]) {
            delete window.OVERRIDE_TURNI_DINNER[cognome][giorno];
            if (Object.keys(window.OVERRIDE_TURNI_DINNER[cognome]).length === 0) {
                delete window.OVERRIDE_TURNI_DINNER[cognome];
            }
        }

        alert(`✅ Override rimosso per ${cognome} (giorno ${giorno})`);
        renderListaOverrideAttivi();
        if (typeof renderLista === 'function') renderLista();
        else if (typeof applicaFiltri === 'function') applicaFiltri();
    } catch (err) {
        console.error('Errore rimozione override:', err);
        alert('❌ Errore nella rimozione.');
    }
}

/* ── Rimuovi tutti gli override di uno studente ── */
async function rimuoviTuttiOverride(cognome) {
    if (!confirm(`Rimuovere TUTTI gli override di ${cognome}?`)) return;
    try {
        await window.update(window.ref(window.db),
            { [`overrides_turni_dinner/${cognome}`]: null });

        if (window.OVERRIDE_TURNI_DINNER) delete window.OVERRIDE_TURNI_DINNER[cognome];

        renderListaOverrideAttivi();
        if (typeof renderLista === 'function') renderLista();
        else if (typeof applicaFiltri === 'function') applicaFiltri();
    } catch (err) {
        console.error('Errore rimozione override:', err);
        alert('❌ Errore nella rimozione.');
    }
}

/* ── Lista override attivi ── */
function renderListaOverrideAttivi() {
    const container = document.getElementById('listaOverrideAttivi');
    if (!container) return;

    const override = window.OVERRIDE_TURNI_DINNER || {};
    const cognomi = Object.keys(override).sort();

    if (cognomi.length === 0) {
        container.innerHTML = `
            <div style="padding:14px;text-align:center;color:var(--text-muted);
                        font-style:italic;font-size:0.78rem;">
                Nessun override attivo
            </div>`;
        return;
    }

    const giorniNome = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Gio' };

    container.innerHTML = cognomi.map(cognome => {
        const giorni = override[cognome];
        const dettagli = Object.entries(giorni)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([g, t]) => `${giorniNome[g] || g}: T${t}`)
            .join(' · ');

        return `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:8px 12px;border-bottom:1px solid var(--border);
                        font-size:0.8rem;">
                <div>
                    <b>${cognome}</b>
                    <div style="font-size:0.7rem;color:var(--text-muted);font-family:var(--font-mono);">
                        ${dettagli}
                    </div>
                </div>
                <button onclick="rimuoviTuttiOverride('${cognome}')"
                        title="Rimuovi tutti gli override di ${cognome}"
                        style="background:var(--absent-dim);color:var(--absent);
                               border:none;border-radius:50%;width:24px;height:24px;
                               cursor:pointer;font-weight:bold;font-size:0.75rem;">
                    ✕
                </button>
            </div>`;
    }).join('');
}