'use client';

import { useEffect, useState } from 'react';
import { BsBell, BsBellFill, BsBellSlash } from 'react-icons/bs';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export default function PushBell() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(ok);
    if (!ok) return;

    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    );
  }, []);

  if (!supported) return null;

  if (permission === 'denied') {
    return (
      <button
        title="การแจ้งเตือนถูกบล็อก — แก้ไขในการตั้งค่าเบราว์เซอร์"
        className="p-2 rounded-lg text-[#475569] cursor-not-allowed"
      >
        <BsBellSlash size={17} />
      </button>
    );
  }

  async function toggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/admin/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
          setSubscribed(false);
        }
      } else {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== 'granted') return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        });

        await fetch('/api/admin/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
        setSubscribed(true);
      }
    } catch (err) {
      console.error('[PushBell]', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={subscribed ? 'ปิดการแจ้งเตือนออเดอร์' : 'เปิดรับแจ้งเตือนออเดอร์ใหม่'}
      className={[
        'p-2 rounded-lg transition-all disabled:opacity-50',
        subscribed
          ? 'text-[#a78bfa] bg-[rgba(139,92,246,0.15)] hover:bg-[rgba(139,92,246,0.25)]'
          : 'text-[#475569] hover:text-white hover:bg-[rgba(255,255,255,0.07)]',
      ].join(' ')}
    >
      {subscribed ? <BsBellFill size={17} /> : <BsBell size={17} />}
    </button>
  );
}
