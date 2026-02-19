const CACHE_NAME = 'homeystay-v1';
const STATIC_ASSETS = [
    '/',
    '/rooms',
    '/tenants',
    '/meters',
    '/billing',
    '/history',
    '/settings',
    '/report',
    '/floorplan',
];

// API paths that contain sensitive data — never cache
const SENSITIVE_API = ['/api/tenants', '/api/billing', '/api/history', '/api/report'];

// Install — cache static shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch — network-first for API, cache-first for pages
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET
    if (request.method !== 'GET') return;

    // API calls
    if (url.pathname.startsWith('/api/')) {
        // Sensitive APIs: network-only, never cache
        if (SENSITIVE_API.some((p) => url.pathname.startsWith(p))) {
            event.respondWith(fetch(request));
            return;
        }

        // Other APIs: network-first with cache fallback
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Static assets & pages: stale-while-revalidate
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                return response;
            });
            return cached || fetchPromise;
        })
    );
});
