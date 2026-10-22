/* Campus Hub — service worker (sw.js)*/
const VERSION = 'campus-hub-v2';   // ← bump (v2, v3...) per forzare l'aggiornamento

const CORE = [
  // Pagine
  './',
  './index.html',
  './campus_hub.html',
  './roomcloud.html',
  './storico.html',
  './trasportini.html',

  // CSS
  './css/campus_hub.css',

  // JS principali
  './js/ambiente.js',
  './js/campus_hub-script.js',
  './js/data-loader.js',

  // JS core
  './js/core/stato.js',
  './js/core/turni.js',
  './js/core/pp.js',
  './js/core/filtri.js',
  './js/core/persistenza.js',

  // JS pannello
  './js/pannello/assenze-programmate.js',
  './js/pannello/side-panel.js',

  // JS stampe
  './js/stampe/dinner.js',
  './js/stampe/bus.js',
  './js/stampe/transfer.js',
  './js/stampe/uscite-rooming.js',
  './js/stampe/ritardi.js',
  './js/stampe/convitto.js',

  // JS reset
  './js/reset/reset-permessi.js',

  // Config Firebase (import dinamici)
  './js/firebase-campus_hub-config.js',
  './js/firebase-roomcloud-config.js',

  // Dati offline
  './offline/studenti_26_offline.js',
  './offline/permessi_26_offline.js',

  // Icone
  './icon-192.png',
  './icon-512.png'
];

/* ─────────────────────────────────────────────────────────────
   HOST "SOLO RETE": non devono MAI passare dalla cache.
   Se una di queste richieste passasse da una risposta cacheata,
   login Firebase, sessioni, RTDB e token si romperebbero in modo
   silenzioso (l'app sembrerebbe funzionare ma con dati/identità
   sbagliati o scaduti).
   ───────────────────────────────────────────────────────────── */
const NETWORK_ONLY_HOSTS = [
  'googleapis.com',        // identitytoolkit, securetoken, firestore
  'firebaseio.com',        // RTDB legacy
  'firebasedatabase.app',  // RTDB nuove regioni (es. *.europe-west1.firebasedatabase.app)
  'firebaseapp.com',       // hosting / auth handler
  'apis.google.com'        // eventuali popup auth
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // ── Firebase API (auth, RTDB, identity toolkit, securetoken, hosting): MAI in cache ──
  if (NETWORK_ONLY_HOSTS.some(h => url.hostname.endsWith(h))) {
    return; // nessun respondWith → il browser va in rete come se il SW non ci fosse
  }

  // ── File dati offline: network-first (sempre freschi se c'è rete) ──
  if (url.pathname.endsWith('permessi_26_offline.js') ||
      url.pathname.endsWith('studenti_26_offline.js')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // ── HTML: network-first con fallback ──
  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    event.respondWith(networkFirst(req));
    return;
  }

  // ── Stessa origine: stale-while-revalidate ──
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // ── Esterni (firebase SDK su gstatic, fonts, QR): cache-first ──
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const fresh = await fetch(req);
    // await sul put per non perdere la scrittura se il SW viene sospeso
    await cache.put(req, fresh.clone()).catch(() => {});
    return fresh;
  } catch {
    return (await cache.match(req)) || (await cache.match('./index.html'));
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then(async res => {
      if (res && res.ok) {
        // await + catch per lo stesso motivo
        await cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      await cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    return Response.error();
  }
}
