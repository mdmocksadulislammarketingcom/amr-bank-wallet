// Service Worker - AMR-Bank Fast Super Wallet
// অফলাইন মোড এবং ক্যাশিং এর জন্য

const CACHE_NAME = 'amr-bank-v1';
const urlsToCache = [
  '/',
  '/amr-bank-wallet/',
  '/amr-bank-wallet/index.html',
  '/amr-bank-wallet/amr-bank-flow.html',
  '/amr-bank-wallet/manifest.json'
];

// ইনস্টল ইভেন্ট
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// অ্যাক্টিভেট ইভেন্ট
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ফেচ ইভেন্ট - অফলাইন সাপোর্ট
self.addEventListener('fetch', (event) => {
  // নেটওয়ার্ক থেকে প্রথমে চেষ্টা করো
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // যদি সফল হয়, ক্যাশে সংরক্ষণ করো
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });

        return response;
      })
      .catch(() => {
        // অফলাইন হলে ক্যাশ থেকে সেবা দাও
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // যদি কাশে না থাকে, default পেজ দাও
            return caches.match('/amr-bank-wallet/amr-bank-flow.html');
          });
      })
  );
});

// পুশ নোটিফিকেশন
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'নতুন আপডেট আছে',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23087f68" width="192" height="192"/><text x="50%" y="50%" font-size="100" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="bold">◈</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23087f68" width="192" height="192"/><text x="50%" y="50%" font-size="100" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="bold">◈</text></svg>',
    tag: 'amr-bank-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('AMR-Bank', options)
  );
});

// নোটিফিকেশন ক্লিক হ্যান্ডলার
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/amr-bank-wallet/');
      }
    })
  );
});
