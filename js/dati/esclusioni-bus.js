/**
 * js/dati/esclusioni-bus.js
 * ─────────────────────────────────────────────────────────────
 * Classi escluse dal trasporto BUS, per variante di stampa.
 *
 * Fonte unica: se domani cambia una regola, si cambia qui.
 *
 * ⚠️ Le liste NON sono identiche tra le varianti:
 *    • "mattina"    → 4C INCLUSA (compare come "sì GIO")
 *    • "pomeriggio" → 4C esclusa
 *    • "generico"   → 4C esclusa
 *    • "transfer"   → 4C e i P esclusi (i P sono già coperti da
 *                     ESCLUDI_CLASSI_CON_P, ma qui sono esplicitati
 *                     per chiarezza storica)
 *
 * Consumata da:
 *   • campus_hub-script.js   (haDirittoAlBus)
 *   • js/stampe/bus.js       (tre funzioni di stampa)
 *   • js/stampe/ritardi.js   (Ritardi mattino)
 *   • js/stampe/transfer.js  (Transfer lunch)
 *   • bus_pom.html           (filtro iniziale)
 * ─────────────────────────────────────────────────────────────
 */
window.ESCLUSIONI_BUS = {
  /** Bus mattina: 4C inclusa (compare come "solo GIO"). */
  mattina:    ["2A", "2B"],

  /** Bus pomeriggio: 4C esclusa. */
  pomeriggio: ["2A", "2B", "4C"],

  /** Schema generico: 4C esclusa. */
  generico:   ["2A", "2B", "4C"],

  /** Transfer lunch: 4C e i P esclusi (lista storica esplicita). */
  transfer:   ["1P", "2P", "3P", "2A", "2B", "4C"],

  /** Regola generale usata da haDirittoAlBus nel main. */
  standard:   ["2A", "2B", "4C"]
};

/**
 * Le classi con "P" nel nome (es. "1P", "2P", "3P") sono sempre escluse.
 * Il controllo è ridondante per la variante "transfer" (che li elenca
 * esplicitamente) ma è necessario per le altre.
 */
window.ESCLUDI_CLASSI_CON_P = true;

/**
 * Helper unico: decide se uno studente è idoneo al bus.
 * @param {{classe:string}} s
 * @param {"mattina"|"pomeriggio"|"generico"|"transfer"|"standard"} variante
 * @returns {boolean}
 */
window.haDirittoAlBusVariante = function (s, variante) {
  if (!s || !s.classe) return false;
  const classe = String(s.classe).toUpperCase();

  // Regola trasversale: i P non prendono mai il bus
  if (window.ESCLUDI_CLASSI_CON_P && classe.includes("P")) return false;

  const lista = (window.ESCLUSIONI_BUS || {})[variante] || [];
  return !lista.includes(classe);
};
