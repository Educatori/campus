/**
 * js/ambiente.js
 * Rileva se l'app deve girare in modalità ONLINE (Firebase)
 * oppure OFFLINE (liste + localStorage).
 *
 * Priorità:
 *   1. ?offline=1 / ?online=1 nell'URL (override manuale)
 *   2. protocollo file://  → offline
 *   3. hostname localhost / 127.0.0.1 / ""  → offline
 *   4. altrimenti → online
 */
(function rilevaAmbiente() {
    const params   = new URLSearchParams(location.search);
    const proto    = location.protocol;
    const hostname = location.hostname;

    let modalita;

    if (params.get('offline') === '1')      modalita = 'offline';
    else if (params.get('online') === '1')  modalita = 'online';
    else if (proto === 'file:')             modalita = 'offline';
    else if (hostname === 'localhost' ||
             hostname === '127.0.0.1' ||
             hostname === '')                modalita = 'offline';
    else                                    modalita = 'online';

    window.APP_MODE = modalita;
    console.log(`🌐 Ambiente: ${modalita.toUpperCase()} (proto=${proto}, host=${hostname || 'n/d'})`);
})();