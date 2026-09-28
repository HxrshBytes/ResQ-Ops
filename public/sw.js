const CACHE_NAME = 'resqops-cache-v1';
const OFFLINE_URLS = ['/', '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});

// Background Sync for offline SOS flushing
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sos') {
    event.waitUntil(flushSOSQueue());
  }
});

async function flushSOSQueue() {
  const db = await openDB();
  const tx = db.transaction('sos-store', 'readwrite');
  const store = tx.objectStore('sos-store');
  const allSOS = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  for (const sos of allSOS) {
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sos),
      });

      if (response.ok) {
        await new Promise((resolve, reject) => {
          const deleteReq = store.delete(sos.id);
          deleteReq.onsuccess = resolve;
          deleteReq.onerror = reject;
        });
      } else {
         // SMS Fallback if server responds with error but connection is up
         sendSMSFallback(sos);
      }
    } catch (error) {
      console.error('Failed to sync SOS, completely offline. Triggering Mesh.', error);
      broadcastViaMesh(sos);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ResQOpsDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sos-store')) {
        db.createObjectStore('sos-store', { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function sendSMSFallback(sos) {
  // Mock SMS fallback triggering via an external Intent or native bridge
  console.log('Sending SMS Fallback for SOS:', sos.id);
  // Example for mobile web: window.location.href = `sms:112?body=SOS%20${sos.lat},${sos.lon}`
  // Service workers cannot directly invoke window.location, but can postMessage to clients
  self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SMS_FALLBACK', data: sos }));
  });
}

/**
 * 5. Peer-to-Peer (P2P) Offline Mesh Networking
 * Bounces encrypted SOS payloads off nearby devices via BLE/Wi-Fi Direct.
 */
function broadcastViaMesh(sos) {
  console.log(`[P2P MESH] Attempting to broadcast SOS ${sos.id} via BLE/Wi-Fi Direct mesh...`);
  // Simulate Web Bluetooth / Mesh API bouncing payload to a perimeter device
  const encryptedPayload = btoa(JSON.stringify(sos)); // Mock encryption
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ 
        type: 'BLE_MESH_BROADCAST', 
        data: { payload: encryptedPayload, hops: 0, maxHops: 5 }
      });
    });
  });
}
