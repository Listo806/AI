/* Cortexa Charts PWA: network-only, no caching of quotes, sessions, or account data. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
