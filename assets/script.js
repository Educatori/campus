/* Attività Campus — script.js */

// ⚠️ URL del tuo Web App Apps Script (con /exec finale)
const WEB_APP_URL = 'https://script.google.com/a/macros/mail.scuole.vda.it/s/AKfycbwNo1UEbUwKCm_uSpdzAmA_vPy-6aB8KcgizyS8d_jZ33IbHL5kV0wZ3myDhmVktRk6Ug/exec';

// ============ DATA + OROLOGIO ============
function startClock() {
    const clockEl = document.getElementById('digitalClock');
    const dateEl  = document.getElementById('todayDate');
    if (!clockEl && !dateEl) return;

    const tick = () => {
        const d = new Date();

        if (clockEl) {
            clockEl.textContent = d.toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        if (dateEl) {
            dateEl.textContent = d.toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    };

    tick();
    setInterval(tick, 1000);
}

// ============ STATISTICHE (attivicampus.html) ============
async function caricaStatistiche() {
    try {
        const response = await fetch(WEB_APP_URL + '?action=stats');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();

        // Per ogni attività ritornata dal Web App, aggiorna i contatori
        // Cerca gli elementi con id "<attività>-yes" e "<attività>-no"
        Object.keys(data).forEach(function(key) {
            // Salta updated_at e total_records
            if (key === 'updated_at' || key === 'total_records' || key === 'warning') return;
            if (typeof data[key] !== 'object') return;

            const yesEl = document.getElementById(key + '-yes');
            const noEl  = document.getElementById(key + '-no');
            if (yesEl) yesEl.textContent = data[key].yes ?? 0;
            if (noEl)  noEl.textContent  = data[key].no  ?? 0;
        });
    } catch (err) {
        console.warn('Statistiche non disponibili:', err.message);
    }
}

// ============ FORM ISCRIZIONE (subscribe.html) ============
function initForm() {
    const form = document.getElementById('subscriptionForm');
    if (!form) return;

    const messageElement = document.getElementById('message');

    function mostraMessaggio(testo, tipo) {
        messageElement.textContent = testo;
        messageElement.className = 'message ' + tipo;
        messageElement.style.display = 'block';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const activity = document.getElementById('activity').value;
        const participation = document.getElementById('participation').value;

        if (!email || !activity || !participation) {
            mostraMessaggio('Compila tutti i campi!', 'error');
            return;
        }

        try {
            // 1) Verifica email
            const checkUrl = WEB_APP_URL + '?action=check_email&email=' + encodeURIComponent(email);
            const checkRes = await fetch(checkUrl);
            const checkData = await checkRes.json();

            if (!checkData.isAuthorized) {
                mostraMessaggio('Email non autorizzata!', 'error');
                return;
            }

            // 2) Salva iscrizione (POST come form-urlencoded)
            const body = new URLSearchParams({
                action: 'save_subscription',
                email: email,
                activity: activity,
                participation: participation
            });

            const saveRes = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString()
            });
            const saveData = await saveRes.json();

            if (saveData.success) {
                mostraMessaggio('Iscrizione confermata!', 'success');
                form.reset();
                // Ricarica statistiche se presenti nella pagina
                if (document.getElementById('calcio-yes')) caricaStatistiche();
            } else {
                mostraMessaggio(saveData.error || 'Errore nel salvataggio.', 'error');
            }
        } catch (err) {
            mostraMessaggio("Errore durante l'iscrizione.", 'error');
            console.error(err);
        }
    });
}

// ============ BOOT ============
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    if (document.querySelector('.day-container')) caricaStatistiche();
    initForm();
});
