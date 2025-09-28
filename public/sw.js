// Service Worker for Klycs PWA - Advanced Version
// No CSP headers applied from SW
const CACHE_VERSION = '3.0.0';
const CACHE_NAME = `klycs-v${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Advanced caching configuration
const CACHE_CONFIG = {
  static: { maxAge: 30 * 24 * 60 * 60 * 1000, maxEntries: 100 }, // 30 days
  dynamic: { maxAge: 24 * 60 * 60 * 1000, maxEntries: 50 }, // 1 day
  api: { maxAge: 5 * 60 * 1000, maxEntries: 30 }, // 5 minutes
  images: { maxAge: 7 * 24 * 60 * 60 * 1000, maxEntries: 100 } // 7 days
};

// Archivos críticos para caché estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login',
  '/register',
  '/manifest.json',
  // CSS y JS se añadirán dinámicamente
];

// Patrones de URLs para diferentes estrategias de caché
const CACHE_STRATEGIES = {
  // Cache First - Assets estáticos (CSS, JS, imágenes locales)
  CACHE_FIRST: [
    /\.(?:css|js|woff|woff2|ttf|eot)$/,
    /\/assets\//,
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/
  ],
  
  // Network First - HTML, API calls
  NETWORK_FIRST: [
    /\/api\//,
    /\.(?:html)$/,
    /\/dashboard/,
    /\/cards/
  ],
  
  // Stale While Revalidate - Imágenes de Firebase, contenido dinámico
  STALE_WHILE_REVALIDATE: [
    /firebasestorage\.googleapis\.com/,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/
  ]
};

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error caching static assets:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar cachés antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control de todas las pestañas
      self.clients.claim()
    ])
  );
});

// Interceptar y manejar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests de extensiones del navegador
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // Ignorar requests de Firebase Auth
  if (url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Manejador principal de requests
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Determinar estrategia de caché
    if (isStaticAsset(url)) {
      return await cacheFirstStrategy(request);
    } else if (isApiCall(url)) {
      return await networkFirstStrategy(request);
    } else if (isImage(url)) {
      return await staleWhileRevalidateStrategy(request);
    } else if (isNavigationRequest(request)) {
      return await navigationStrategy(request);
    } else {
      return await networkFirstStrategy(request);
    }
  } catch (error) {
    console.error('❌ Error handling request:', error);
    return await handleOfflineFallback(request);
  }
}

// Cache First Strategy - Para assets estáticos
async function cacheFirstStrategy(request) {
  // Only handle GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Opcional: Actualizar caché en background
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {}); // Silently fail
    
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network First Strategy - Para contenido dinámico
async function networkFirstStrategy(request) {
  const cacheName = isApiCall(new URL(request.url)) ? API_CACHE : DYNAMIC_CACHE;
  
  try {
    const response = await fetch(request);
    
    // Only cache GET requests with successful responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Only try to serve from cache for GET requests
    if (request.method === 'GET') {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    // Return safe fallback Response instead of rejecting the promise
    return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Stale While Revalidate Strategy - Para imágenes y fuentes
async function staleWhileRevalidateStrategy(request) {
  // Only handle GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Intentar actualizar en background, pero no rechazar si falla
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  
  // Devolver caché si existe, o respuesta de red si llegó, o un fallback seguro
  const networkResponse = await fetchPromise;
  return cachedResponse || networkResponse || new Response('', { status: 503, statusText: 'Service Unavailable' });
}

// Navigation Strategy - Para páginas HTML
async function navigationStrategy(request) {
  try {
    const response = await fetch(request);
    
    // Only cache GET requests with successful responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Only serve from cache for GET requests
    if (request.method === 'GET') {
      // Fallback a index.html para SPA routing
      const cache = await caches.open(STATIC_CACHE);
      const fallback = await cache.match('/index.html');
    
      if (fallback) {
        return fallback;
      }
    }
    
    return new Response('Offline - No cached content available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Fallback para requests offline
async function handleOfflineFallback(request) {
  if (request.destination === 'document') {
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('/index.html') || new Response('Offline', { status: 503 });
  }
  
  if (request.destination === 'image') {
    return new Response(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#f3f4f6"/>
        <text x="100" y="100" text-anchor="middle" dy=".35em" font-family="Arial" font-size="14" fill="#9ca3af">
          Imagen no disponible offline
        </text>
      </svg>
    `, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
  
  return new Response('Offline', { status: 503 });
}

// Utilidades para determinar tipo de request
function isStaticAsset(url) {
  return CACHE_STRATEGIES.CACHE_FIRST.some(pattern => pattern.test(url.pathname));
}

function isApiCall(url) {
  return CACHE_STRATEGIES.NETWORK_FIRST.some(pattern => pattern.test(url.pathname)) ||
         url.hostname.includes('firestore.googleapis.com') ||
         url.hostname.includes('firebase.googleapis.com');
}

function isImage(url) {
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE.some(pattern => pattern.test(url.hostname)) ||
         /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url.pathname);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background Sync para requests fallidos
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implementar lógica de sincronización en background
  console.log('🔄 Performing background sync...');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Klycs', options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Limpieza periódica de caché
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearOldCaches());
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function clearOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.includes('klycs') && name !== STATIC_CACHE && 
    name !== DYNAMIC_CACHE && name !== API_CACHE && name !== IMAGE_CACHE
  );
  
  return Promise.all(oldCaches.map(name => caches.delete(name)));
}

console.log('🎯 Klycs Service Worker loaded successfully');