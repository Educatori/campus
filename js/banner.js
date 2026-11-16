/**
 * js/banner.js
 * ─────────────────────────────────────────────────────────────
 * Disegna #modeBanner in base a window.APP_ORIGIN.
 * Caricare DOPO js/ambiente.js (che definisce APP_ORIGIN).
 * ─────────────────────────────────────────────────────────────
 */

(function disegnaBanner() {
    const b = document.getElementById('modeBanner');
    if (!b) return;

    const cfg = {
        'locale-reale':   { bg:'#dcfce7', bd:'#16a34a', fg:'#14532d', txt:'📁 LOCALE' },
        'github-demo':    { bg:'#fef3c7', bd:'#d97706', fg:'#78350f', txt:'🎭 DUMMY' },
        'localhost-demo': { bg:'#e0e7ff', bd:'#4f46e5', fg:'#1e1b4b', txt:'🛠️ SVILUPPO' },
        'firebase':       { bg:'#dbeafe', bd:'#2563eb', fg:'#1e3a8a', txt:'☁️ FIREBASE' }
    };
    const c = cfg[window.APP_ORIGIN] || cfg['firebase'];
    b.style.background        = c.bg;
    b.style.borderBottomColor = c.bd;
    b.style.color             = c.fg;
    b.textContent             = c.txt;
    b.classList.add('visible');
})();