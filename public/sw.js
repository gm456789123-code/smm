self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'AURA SMM', {
      body: data.body ?? '',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: data.tag ?? 'order',
      renotify: true,
      data: { url: data.url ?? '/admin/orders' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/admin/orders';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // focus existing tab that's already on the target URL
      const match = list.find((c) => new URL(c.url).pathname === new URL(url, self.location.origin).pathname);
      if (match) return match.focus();
      // navigate any existing tab
      if (list.length) {
        list[0].navigate(url);
        return list[0].focus();
      }
      // open new tab
      return clients.openWindow(url);
    })
  );
});
