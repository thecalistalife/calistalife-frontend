// CalistaLife Service Worker
// Provides offline functionality and performance optimizations

const CACHE_NAME = 'calistalife-v1.0.0';
const API_CACHE_NAME = 'calistalife-api-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/offline.html', // Fallback page for offline
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/products',
  '/api/collections',
  '/api/categories',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with fallback to cache
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?)$/)) {
    // Static assets - Cache First
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  } else {
    // HTML pages - Stale While Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAME));
  }
});

// Network First Strategy - Good for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API errors
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This content is not available offline' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache First Strategy - Good for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch asset:', error);
    
    // Return a fallback for failed assets
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9ca3af">Image unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy - Good for HTML pages
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // If network fails and we have no cache, return offline page
      if (!cachedResponse) {
        return caches.match('/offline.html');
      }
    });
  
  return cachedResponse || fetchPromise;
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle queued actions when connection is restored
  console.log('[SW] Processing background sync');
  
  // Example: Sync cart updates, form submissions, etc.
  // Implementation depends on your specific needs
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New updates available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('CalistaLife', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(updateContentCache());
  }
});

async function updateContentCache() {
  // Refresh critical content in background
  console.log('[SW] Updating content cache');
  
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    await Promise.all(
      API_ENDPOINTS.map(endpoint => 
        fetch(endpoint).then(response => {
          if (response.ok) {
            cache.put(endpoint, response);
          }
        }).catch(console.error)
      )
    );
  } catch (error) {
    console.error('[SW] Content cache update failed:', error);
  }
}