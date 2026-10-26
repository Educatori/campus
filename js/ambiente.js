(function rilevaAmbiente() {
    const params   = new URLSearchParams(location.search);
    const proto    = location.protocol;
    const hostname = location.hostname;

    let modalita, origine;

    // 1. file:// → SEMPRE locale con dati reali (vince su tutto)
    if (proto === 'file:') {
        modalita = 'offline';
        origine  = 'locale-reale';
    }
    // 2. ?offline=1 su http(s) → demo GitHub con dati dummy
    else if (params.get('offline') === '1') {
        modalita = 'offline';
        origine  = 'github-demo';
    }
    // 3. ?online=1 → forza Firebase
    else if (params.get('online') === '1') {
        modalita = 'online';
        origine  = 'firebase';
    }
    // 4. localhost → sviluppo offline
    else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
        modalita = 'offline';
        origine  = 'localhost-demo';
    }
    // 5. default → Firebase online
    else {
        modalita = 'online';
        origine  = 'firebase';
    }

    window.APP_MODE   = modalita;
    window.APP_ORIGIN = origine;

    const labels = {
        'locale-reale':   '📁 LOCALE — DATI REALI',
        'github-demo':    '🎭 DEMO — DATI FANTOCCIO',
        'localhost-demo': '🛠️ SVILUPPO — DATI LOCALI',
        'firebase':       '☁️ ONLINE — FIREBASE'
    };
    window.APP_ORIGIN_LABEL = labels[origine];

    console.log(`🌐 Ambiente: ${modalita.toUpperCase()} | origine: ${origine} → ${labels[origine]}`);
})();
