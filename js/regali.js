/* ============================================================
   regali.js — Pacchi dono e decorazioni festive che cadono
   Auto-contenuto: inietta il proprio CSS e gli elementi.
   Rispetta prefers-reduced-motion. Nascosto in stampa.
   Adattivo: colori vivaci su tema chiaro, brillanti su tema scuro.
   Supporta:
     - <body class="light"> / <body class="dark">
     - window.REGALI_TEMA = 'chiaro' | 'scuro'  (prima dello script)
     - prefers-color-scheme come fallback
     - window.REGALI_NUMERO = N  (numero elementi, default 45)
   ============================================================ */
(function () {
    'use strict';

    if (window.__REGALI_ATTIVA) return;
    window.__REGALI_ATTIVA = true;

    // Accessibilità: rispetta la preferenza "meno animazioni"
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ── Configurazione ──
    const N = parseInt(window.REGALI_NUMERO, 10) || 45;
    const SIMBOLI = ['🎁', '🎀', '🎈', '🎂', '🎉', '🎊', '🧸', '🍰', '⭐', '✨'];

    // ── Rilevamento tema (priorità: REGALI_TEMA > classi body > sistema) ──
    function isTemaChiaro() {
        if (window.REGALI_TEMA === 'chiaro') return true;
        if (window.REGALI_TEMA === 'scuro')  return false;
        if (document.body.classList.contains('light')) return true;
        if (document.body.classList.contains('dark'))  return false;
        return window.matchMedia('(prefers-color-scheme: light)').matches;
    }

    // ── Palette (emoji + alone) ──
    function getPalette(chiaro) {
        if (chiaro) {
            return {
                shadow:    'rgba(120, 20, 60, 0.35)',   // alone rosso scuro
                opacitaMin: 0.75,
                opacitaMax: 1.0
            };
        }
        return {
            shadow:    'rgba(255, 200, 230, 0.55)', // alone rosa chiaro
            opacitaMin: 0.75,
            opacitaMax: 1.0
        };
    }

    function avvia() {
        if (document.getElementById('regaliLayer')) return;

        const chiaro = isTemaChiaro();
        const P = getPalette(chiaro);

        // ── CSS iniettato ──
        const style = document.createElement('style');
        style.id = 'regaliStyles';
        style.textContent = `
            #regaliLayer {
                position: fixed;
                inset: 0;
                pointer-events: none;
                overflow: hidden;
                z-index: 900;
            }
            #regaliLayer .regalo {
                position: absolute;
                top: -15vh;
                line-height: 1;
                will-change: transform;
                animation-name: regaloCaduta;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
                filter: drop-shadow(0 0 4px var(--regalo-shadow));
                user-select: none;
            }
            @keyframes regaloCaduta {
                0%   { transform: translate3d(0, -15vh, 0) rotate(0deg); }
                100% { transform: translate3d(var(--drift, 30px), 115vh, 0) rotate(360deg); }
            }
            /* Rotazione delicata alternativa (per alcuni elementi) */
            #regaliLayer .regalo.oscilla {
                animation-name: regaloOscilla;
            }
            @keyframes regaloOscilla {
                0%   { transform: translate3d(0, -15vh, 0) rotate(-15deg); }
                50%  { transform: translate3d(var(--drift, 30px), 50vh, 0) rotate(15deg); }
                100% { transform: translate3d(0, 115vh, 0) rotate(-15deg); }
            }
            @media print { #regaliLayer { display: none !important; } }
        `;
        document.head.appendChild(style);

        // ── Layer + elementi ──
        const layer = document.createElement('div');
        layer.id = 'regaliLayer';
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);

        const frag = document.createDocumentFragment();
        for (let i = 0; i < N; i++) {
            const el = document.createElement('span');
            el.className = 'regalo';
            el.textContent = SIMBOLI[(Math.random() * SIMBOLI.length) | 0];

            // 30% degli elementi oscillano invece di ruotare
            if (Math.random() < 0.3) el.classList.add('oscilla');

            const size  = 16 + Math.random() * 22; // 16–38px
            const drift = (Math.random() * 160 - 80).toFixed(0) + 'px';
            const dur   = (6 + Math.random() * 12).toFixed(2) + 's';
            const delay = (-Math.random() * parseFloat(dur)).toFixed(2) + 's';

            el.style.left             = (Math.random() * 100).toFixed(2) + 'vw';
            el.style.fontSize         = size.toFixed(1) + 'px';
            el.style.setProperty('--regalo-shadow', P.shadow);
            el.style.setProperty('--drift', drift);
            el.style.animationDuration = dur;
            el.style.animationDelay    = delay;

            // Opacità variabile
            el.style.opacity = (P.opacitaMin + Math.random() * (P.opacitaMax - P.opacitaMin)).toFixed(2);

            frag.appendChild(el);
        }
        layer.appendChild(frag);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', avvia, { once: true });
    } else {
        avvia();
    }
})();