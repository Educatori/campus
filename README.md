campus_hub.html            orchestratore + bootstrap inline
js/
├── ambiente.js
├── firebase-campus_hub-config.js
├── data-loader.js
├── campus_hub-script.js   ~330 righe (core)
├── core/ (5 file)
├── pannello/ (2 file)
├── stampe/ (6 file)
└── reset/ (1 file)
offline/
├── studenti_26_offline.js
└── permessi_26_offline.js

- 14 file tematici con responsabilità isolate
- caricamento ordinato: core → pannello → main → stampe → reset
- nessuna modifica funzionale, solo spostamento di codice
