// Service Worker — Trufas Estoque PWA
// Permite funcionamento 100% offline no celular

const CACHE_NAME = "trufas-pwa-v1";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./static/css/style.css",
  "./static/js/app.js",
  "./static/icons/icon-192.png",
  "./static/icons/icon-512.png"
];

// Instalação: baixa os arquivos para o cache do celular
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos se houver atualização
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições: Cache First com fallback de rede
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Se for fonte ou ícone externo, guarda no cache dinamicamente
        if (
          event.request.url.includes("fonts.googleapis.com") ||
          event.request.url.includes("fonts.gstatic.com") ||
          event.request.url.includes("cdnjs.cloudflare.com")
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se estiver offline e pedir a raiz, entrega index.html
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});

