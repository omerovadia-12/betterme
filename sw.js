const CACHE_NAME = 'betterme-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/config.js',
  '/js/db.js',
  '/js/app.js',
  '/js/home.js',
  '/js/tools.js',
  '/js/crisis.js',
  '/js/plan.js',
  '/js/tracker.js',
  '/audio/breathing-intro.mp3',
  '/audio/breathing-tip1.mp3',
  '/audio/breathing-tip2.mp3',
  '/audio/breathing-tip3.mp3',
  '/audio/breathing-closing.mp3',
  '/audio/pmr-short.mp3',
  '/audio/pmr-long.mp3',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});

// Handle push notifications (daily reminder)
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  self.registration.showNotification(data.title || 'BetterMe', {
    body: data.body || "Don't forget to log today's progress.",
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'daily-reminder',
  });
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
