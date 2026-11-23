/* ============================================================
   neve.js — Fiocchi di neve decorativi (leggeri, GPU-friendly)
   Auto-contenuto: inietta il proprio CSS e i fiocchi.
   Rispetta prefers-reduced-motion. Nascosto in stampa.
   ============================================================ */
(function () {
    'use strict';

    if (window.__NEVE_ATTIVA) return;   // evita doppia inclusione
    window.__NEVE_ATTIVA = true;

    // Accessibilità: se l'utente preferisce meno animazioni, esci
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Personalizzabile: window.NEVE_FIOCCHI = 80;  prima dello script
    const N = parseInt(window.NEVE_FIOCCHI, 10) || 45;
    const SIMBOLI = ['❄', '❅', '❆', '✻', '•'];

    function avvia() {
        if (document.getElementById('snowLayer')) return;

        // ── CSS iniettato ──
        const style = document.createElement('style');
        style.id = 'snowStyles';
        style.textContent = `
            #snowLayer {
                position: fixed;
                inset: 0;
                pointer-events: none;
                overflow: hidden;
                /* Sopra il contenuto, sotto side-panel (1000) e login (99999) */
                z-index: 900;
            }
            #snowLayer .snowflake {
                position: absolute;
                top: -15vh;
                color: #ffffff;
                opacity: .85;
                font-family: serif;
                line-height: 1;
                will-change: transform;
                animation-name: snowFall;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
                text-shadow: 0 0 2px rgba(255,255,255,.6);
                user-select: none;
            }
            @keyframes snowFall {
                0%   { transform: translate3d(0, -15vh, 0) rotate(0deg); }
                100% { transform: translate3d(var(--drift, 30px), 115vh, 0) rotate(360deg); }
            }
            @media print { #snowLayer { display: none !important; } }
        `;
        document.head.appendChild(style);

        // ── Layer + fiocchi ──
        const layer = document.createElement('div');
        layer.id = 'snowLayer';
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);

        const frag = document.createDocumentFragment();
        for (let i = 0; i < N; i++) {
            const f = document.createElement('span');
            f.className = 'snowflake';
            f.textContent = SIMBOLI[(Math.random() * SIMBOLI.length) | 0];

            const size  = 8 + Math.random() * 16;
            const drift = (Math.random() * 160 - 80).toFixed(0) + 'px';
            const dur   = (6 + Math.random() * 12).toFixed(2) + 's';
            const delay = (-Math.random() * parseFloat(dur)).toFixed(2) + 's';

            f.style.left             = (Math.random() * 100).toFixed(2) + 'vw';
            f.style.fontSize         = size.toFixed(1) + 'px';
            f.style.opacity          = (0.35 + Math.random() * 0.5).toFixed(2);
            f.style.setProperty('--drift', drift);
            f.style.animationDuration = dur;
            f.style.animationDelay    = delay;

            if (Math.random() < 0.35) f.style.color = '#dbeafe'; // azzurrino

            frag.appendChild(f);
        }
        layer.appendChild(frag);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', avvia, { once: true });
    } else {
        avvia();
    }
})();