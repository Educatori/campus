/* ============================================================
   OVERRIDE TURNI CENA
   Gestione override individuali per il turno di cena.
   ────────────────────────────────────────────────────────────
   ⚠️  Le scritture avvengono SOLO su Firebase (nodo
       overrides_turni_dinner). In modalità offline o demo
       locale il salvataggio è bloccato: per aggiornare gli
       override in quel caso va modificato a mano
       offline/permessi_26_offline.js.
   ============================================================ */

/* ── Utility: verifica se le scritture Firebase sono disponibili ── */
function overrideOnlineDisponibile() {
    return navigator.onLine && typeof window.ref === 'function'
        && typeof window.update === 'function' && window.db;
}

/* ── Mostra/nasconde l'avviso "valido solo online" ── */
function aggiornaAvvisoOffline() {
    const avviso = document.getElementById('overrideAvvisoOffline');
    if (!avviso) return;

    if (overrideOnlineDisponibile()) {
        avviso.style.display = 'none';
    } else {
        avviso.style.display = 'flex';
    }
}

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
    // ── GUARD: blocca se offline o Firebase non disponibile ──
    if (!overrideOnlineDisponibile()) {
        alert(
            '📴 Operazione non disponibile offline.\n\n' +
            'Gli override vengono salvati solo su Firebase.\n' +
            'Per aggiornarli in modalità offline o demo locale,\n' +
            'modifica manualmente il file:\n' +
            'offline/permessi_26_offline.js'
        );
        return;
    }

    const cognome = document.getElementById('overrideStudenteSelezionato').value;
    const giorno  = document.getElementById('overrideGiorno').value;
    const turno   = Number(document.getElementById('overrideTurno').value);

    if (!cognome) {
        alert('Seleziona prima uno studente dalla lista.');
        return;
    }

    try {
        await window.update(window.ref(window.db, `overrides_turni_dinner/${cognome}`),
            { [giorno]: turno });

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
    // ── GUARD: blocca se offline o Firebase non disponibile ──
    if (!overrideOnlineDisponibile()) {
        alert(
            '📴 Operazione non disponibile offline.\n\n' +
            'Gli override vengono salvati solo su Firebase.\n' +
            'Per aggiornarli in modalità offline o demo locale,\n' +
            'modifica manualmente il file:\n' +
            'offline/permessi_26_offline.js'
        );
        return;
    }

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
    // ── GUARD: blocca se offline o Firebase non disponibile ──
    if (!overrideOnlineDisponibile()) {
        alert(
            '📴 Operazione non disponibile offline.\n\n' +
            'Gli override vengono salvati solo su Firebase.\n' +
            'Per aggiornarli in modalità offline o demo locale,\n' +
            'modifica manualmente il file:\n' +
            'offline/permessi_26_offline.js'
        );
        return;
    }

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

    // Aggiorna visibilità avviso
    aggiornaAvvisoOffline();

    // ── Aggiorna lo stato dei pulsanti in base alla disponibilità ──
    const disponibile = overrideOnlineDisponibile();
    const btnSalva   = document.querySelector('#boxOverrideTurni button[onclick*="salvaOverrideTurno"]');
    const btnRimuovi = document.querySelector('#boxOverrideTurni button[onclick*="rimuoviOverrideTurno"]');

    [btnSalva, btnRimuovi].forEach(btn => {
        if (!btn) return;
        if (!disponibile) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Non disponibile offline — modifica manualmente permessi_26_offline.js';
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.title = '';
        }
    });

    // ── Corpo della lista ──
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
        if (!giorni || typeof giorni !== 'object') return '';

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
                        ${!disponibile ? 'disabled' : ''}
                        style="background:var(--absent-dim);color:var(--absent);
                               border:none;border-radius:50%;width:24px;height:24px;
                               cursor:${disponibile ? 'pointer' : 'not-allowed'};
                               font-weight:bold;font-size:0.75rem;
                               opacity:${disponibile ? '1' : '0.5'};">
                    ✕
                </button>
            </div>`;
    }).join('');
}

/* ── Aggiorna pulsanti e avviso quando cambia la connessione ── */
window.addEventListener('online',  () => {
    aggiornaAvvisoOffline();
    renderListaOverrideAttivi();
});
window.addEventListener('offline', () => {
    aggiornaAvvisoOffline();
    renderListaOverrideAttivi();
});

/* ── Chiamata iniziale al caricamento ── */
document.addEventListener('DOMContentLoaded', () => {
    aggiornaAvvisoOffline();
});
