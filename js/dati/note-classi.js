/**
 * js/dati/note-classi.js
 * ─────────────────────────────────────────────────────────────
 * Note testuali per classe e riga informativa laboratori,
 * usate dalle stampe BUS.
 *
 * Consumata da:
 *   • js/stampe/bus.js (generaPopUpStampaBus)
 *
 * NOTA: NOTE_CLASSI è testo semplice (va in textContent).
 *       NOTA_LABORATORI_BUS contiene HTML (<br>, emoji) e va
 *       inserita con innerHTML, non textContent.
 * ─────────────────────────────────────────────────────────────
 */
window.NOTE_CLASSI = {
  classi: {
    "4C": "sì GIO",
    "5B": "no GIO"
  },
  studenti: {
    "5A": {
      "TAPPELLA": "⚠️ solo VEN"
    }
  }
};

window.NOTA_LABORATORI_BUS =
  "LABORATORI <br> LUN 5A + 3A ━🍸━ MAR 4A + 3B <br> MER 4B + 1A ━🍹━ GIO 4C + 1B";
