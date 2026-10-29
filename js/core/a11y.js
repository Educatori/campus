/**
 * js/core/a11y.js
 * ─────────────────────────────────────────────────────────────
 * Accessibilità da tastiera per gli elementi "tasto" non nativi:
 *
 *   • Tutti i .day-box[onclick] che non sono già <button>
 *     ricevono role="button" e tabindex="0"
 *   • Enter e Space attivano il click (come un vero pulsante)
 *   • Il dropdown MODULI si apre con Enter/Space e si chiude con Esc
 *
 * Gli elementi <button> nativi sono ignorati (già accessibili).
 * Il file è idempotente: può essere richiamato più volte senza
 * duplicare attributi o listener.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    function rendiPulsante(el) {
        if (el.tagName === 'BUTTON') return;                    // già nativo
        if (el.getAttribute('role') === 'button') return;       // già processato

        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');

        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                el.click();
            }
        });
    }

    function gestisciDropdownModuli(el) {
        // Il toggle del dropdown: Enter/Space apre, Esc chiude
        if (el.classList.contains('dropdown-toggle')) {
            const wrapper = el.closest('.dropdown-moduli');
            if (!wrapper) return;

            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    wrapper.classList.toggle('open');
                }
                if (e.key === 'Escape') {
                    wrapper.classList.remove('open');
                }
            });

            // Chiude se il focus esce dal wrapper
            wrapper.addEventListener('focusout', (e) => {
                if (!wrapper.contains(e.relatedTarget)) {
                    wrapper.classList.remove('open');
                }
            });
        }
    }

    function applicaA11y() {
        document.querySelectorAll('.day-box[onclick]').forEach(el => {
            rendiPulsante(el);
            gestisciDropdownModuli(el);
        });
        
        document.querySelectorAll('.dropdown-content a').forEach(el => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.dataset.a11yKeyboard) {
        el.dataset.a11yKeyboard = '1';
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    }
});

        // Dropdown MODULI ha tabindex ma non onclick: processalo a parte
        document.querySelectorAll('.day-box.dropdown-toggle:not([onclick])').forEach(el => {
            if (el.getAttribute('role') !== 'button') {
                el.setAttribute('role', 'button');
            }
            gestisciDropdownModuli(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applicaA11y);
    } else {
        applicaA11y();
    }

    // Esposto per eventuali chiamate manuali dopo rendering dinamico
    window.applicaA11y = applicaA11y;
})();