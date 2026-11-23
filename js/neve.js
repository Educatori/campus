/* ============================================================
   neve.js — Fiocchi di neve decorativi (leggeri, GPU-friendly)
   Auto-contenuto: inietta il proprio CSS e i fiocchi.
   Rispetta prefers-reduced-motion. Nascosto in stampa.
   Adattivo: colore scuro su tema chiaro, bianco su tema scuro.
   Supporta:
     - <body class="light"> / <body class="dark">
     - window.NEVE_TEMA = 'chiaro' | 'scuro'  (prima dello script)
     - prefers-color-scheme come fallback
     - window.NEVE_FIOCCHI = N  (numero fiocchi, default 45)
   ============================================================ */
(function () {
    'use strict';

    if (window.__NEVE_ATTIVA) return;
    window.__NEVE_ATTIVA = true;

    // Accessibilità: rispetta la preferenza "meno animazioni"
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ── Configurazione ──
    const N = parseInt(window.NEVE_FIOCCHI, 10) || 45;
    const SIMBOLI = ['❄', '❅', '❆', '✻', '•'];

    // ── Rilevamento tema (priorità: NEVE_TEMA > classi body > sistema) ──
    function isTemaChiaro() {
        if (window.NEVE_TEMA === 'chiaro') return true;
        if (window.NEVE_TEMA === 'scuro')  return false;
        if (document.body.classList.contains('light')) return true;
        if (document.body.classList.contains('dark'))  return false;
        return window.matchMedia('(prefers-color-scheme: light)').matches;
    }

    // ── Palette fiocchi (colori più scuri e contrastati) ──
    function getPalette(chiaro) {
        if (chiaro) {
            return {
                // Tema chiaro: blu notte e teal scuro, ben visibili su bianco/azzurro
                principale: '#1e40af',   // blu notte (più scuro di #2563eb)
                variante:   '#0f766e',   // teal scuro (più scuro di #0d9488)
                shadow:     'rgba(15,23,42,0.45)',  // alone scuro, non bianco
                opacitaMin: 0.55,        // più opachi (prima 0.35)
                opacitaMax: 0.90         // più opachi (prima 0.75)
            };
        }
        return {
            // Tema scuro: bianco e azzurrino (già ben visibili, ma più opachi)
            principale: '#ffffff',
            variante:   '#bfdbfe',   // azzurro un po' più carico di #dbeafe
            shadow:     'rgba(191,219,254,0.70)',  // alone azzurro
            opacitaMin: 0.55,        // più opachi (prima 0.35)
            opacitaMax: 0.95         // più opachi (prima 0.85)
        };
    }

    function avvia() {
        if (document.getElementById('snowLayer')) return;

        const chiaro = isTemaChiaro();
        const P = getPalette(chiaro);

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
                font-family: serif;
                line-height: 1;
                will-change: transform;
                animation-name: snowFall;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
                text-shadow: 0 0 3px var(--snow-shadow);
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
            f.style.setProperty('--snow-shadow', P.shadow);
            f.style.setProperty('--drift', drift);
            f.style.animationDuration = dur;
            f.style.animationDelay    = delay;

            // Colore: 65% principale, 35% variante
            f.style.color = Math.random() < 0.35 ? P.variante : P.principale;

            // Opacità variabile ma più alta (0.55–0.90)
            f.style.opacity = (P.opacitaMin + Math.random() * (P.opacitaMax - P.opacitaMin)).toFixed(2);

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
