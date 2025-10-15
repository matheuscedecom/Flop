// Define um nome e versão para o nosso cache
const CACHE_NAME = 'pontos-bh-v1';

// Lista de arquivos que queremos salvar em cache para uso offline
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', // Cache do CSS do Leaflet
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'  // Cache do JS do Leaflet
];

// Evento 'install': é disparado quando o Service Worker é instalado
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    // Espera até que o cache seja aberto e todos os nossos arquivos sejam adicionados a ele
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache aberto, adicionando arquivos estáticos.');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Força a ativação do novo SW
    );
});

// Evento 'fetch': é disparado toda vez que a página faz uma requisição de rede (ex: imagem, css, js)
self.addEventListener('fetch', (event) => {
    // Responde à requisição
    event.respondWith(
        // Tenta encontrar a requisição no cache primeiro
        caches.match(event.request)
            .then((cachedResponse) => {
                // Se a resposta estiver no cache, retorna ela
                // Se não, faz a requisição à rede
                return cachedResponse || fetch(event.request);
            })
    );
});