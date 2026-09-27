// Minimal service worker: enables "Add to Home Screen" installability and handles
// Web Push notifications sent from backend/src/services/pushService.js.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'PhoenixCare', body: event.data.text() };
  }

  const { title = 'PhoenixCare', body = '', url = '/' } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/logo-icon.svg',
      badge: '/logo-icon.svg',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
        return;
      }
      self.clients.openWindow(targetUrl);
    })
  );
});
