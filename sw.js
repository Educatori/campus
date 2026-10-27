self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // De-registra il service worker
    await self.registration.unregister();

    // Cancella tutte le cache
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));

    // Ricarica le finestre controllate
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.navigate(client.url).catch(() => {});
    }
  })());
});