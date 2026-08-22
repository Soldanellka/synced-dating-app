/* ==============================================================
   SYNCED – service worker (app shell)
   --------------------------------------------------------------
   Stratégia:
   - KÓD APPKY (html/js/css/json) → network-first s fallbackom
     na cache. Musí to tak byť: navigácia je network-first, takže
     po nasadení príde nová index.html — a keby JS/CSS chodili
     cache-first, nová stránka by bežala na starom kóde (novú
     sekciu by vykresľoval starý script.js, ktorý o nej nevie,
     a ostala by prázdna).
   - MÉDIÁ (obrázky, ikony, fonty) → cache-first; sú veľké
     a menia sa zriedka
   - localStorage a appková logika ostávajú nedotknuté; SW
     nezasahuje do ukladania dát ani do volaní mimo vlastný pôvod

   ⚠️ PRI ZMENE ASSETOV BUMPNI VERZIU CACHE (CACHE_VERSION) –
   inak sa používateľom nemusí načítať nová verzia súborov.
   ============================================================== */

'use strict';

const CACHE_VERSION = 'synced-v11';
const OFFLINE_URL = './index.html';

/* App shell – to, čo appka potrebuje na otvorenie */
const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './data.js',
  './manifest.json',
  './assets/icon/icon-192.png',
  './assets/icon/icon-512.png',
  './assets/icon/icon-512-maskable.png',
  './assets/icon/apple-touch-icon.png',
  './assets/icon/favicon-32.png',
  './assets/archetypes/rytier.png',
  './assets/archetypes/kralovna.png',
  './assets/archetypes/trubadur.png',
  './assets/archetypes/muza.png',
  './assets/archetypes/alchymista.png',
  './assets/archetypes/hvezdarka.png',
  './assets/archetypes/templar.png',
  './assets/archetypes/amazonka.png'
];

/* INSTALL – nacacheuj app shell (jednotlivo, nech jeden chýbajúci
   súbor nezhodí celú inštaláciu) */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(SHELL_ASSETS.map(url =>
      cache.add(url).catch(err => console.warn('[SW] preskočené:', url, err))
    ));
    self.skipWaiting();
  })());
});

/* ACTIVATE – zmaž staré verzie cache */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k !== CACHE_VERSION)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* FETCH */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Cudzie pôvody (fonty, prípadné API) necháme na prehliadači
  if (url.origin !== self.location.origin) return;

  // Navigácia → network-first, aby sa nová verzia prejavila hneď
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(OFFLINE_URL, fresh.clone());
        return fresh;
      } catch (_) {
        // offline → app shell z cache
        const cached = await caches.match(OFFLINE_URL);
        return cached || Response.error();
      }
    })());
    return;
  }

  // Kód appky musí ísť v páre s HTML → network-first
  const isAppCode = /\.(?:js|mjs|css|json|html)$/i.test(url.pathname);

  if (isAppCode) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok && fresh.type === 'basic') {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (_) {
        // offline → posledná známa verzia
        const cached = await caches.match(req);
        return cached || Response.error();
      }
    })());
    return;
  }

  // Médiá (obrázky, ikony, fonty) → cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && fresh.type === 'basic') {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
