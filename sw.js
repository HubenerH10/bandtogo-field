// BandToGo Field — Service Worker
// Versão do cache — incrementar ao atualizar os arquivos
const CACHE_NAME = 'bandtogo-field-v4';

// Arquivos para cache offline
const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Instalação — cacheia os arquivos principais
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Cache aberto');
      return cache.addAll(ARQUIVOS_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação — limpa caches antigos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve do cache se offline, senão busca na rede
self.addEventListener('fetch', function(event) {
  // Não interceptar chamadas externas (Google Sheets, Maps, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        // Servir do cache e atualizar em background
        fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, response);
            });
          }
        }).catch(function() {});
        return cached;
      }
      // Não tem no cache — buscar na rede
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(function() {
        // Offline e sem cache — retornar página principal
        return caches.match('./index.html');
      });
    })
  );
});
