// CONVITTORI_26.JS
// Filtra tuttiStudenti per includere solo convittori (room tra 101 e 221)

(function() {
    // Verifica che l'array globale tuttiStudenti esista
    if (typeof tuttiStudenti === 'undefined') {
        console.error("Errore: manca l'array 'tuttiStudenti'. Assicurati di aver incluso studenti_26.js PRIMA di convittori_26.js");
        window.studenticonvittori = [];
        return;
    }

    // Filtra i convittori: room tra 101 e 221 (inclusi)
    const convittori = tuttiStudenti.filter(s => {
        const roomNum = parseInt(s.room, 10);
        return !isNaN(roomNum) && roomNum >= 101 && roomNum <= 221;
    });

    // Mappa i campi per mantenerli compatibili con gli script esistenti
    window.studenticonvittori = convittori.map(s => ({
        cognome: s.cognome,
        nome: s.nome,
        classe: s.classe,
        room: s.room,
        gruppo: s.gruppo || "",
        percorso: s.percorso || ""
    }));

    console.log(`Convittori caricati: ${window.studenticonvittori.length}`);
})();