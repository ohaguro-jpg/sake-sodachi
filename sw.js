// 酒育日記 — プッシュ通知の受信＆クリック処理
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || '🍻 酒育日記';
  const options = {
    body: data.body || '友達が乾杯したよ',
    icon: './icon.svg',
    badge: './icon.svg',
    tag: 'sake-feed',      // まとめて1件に（連投で通知が溜まりすぎない）
    renotify: true,
    data: { url: './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL('./', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(url) && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
