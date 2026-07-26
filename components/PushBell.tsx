'use client';

import { useEffect, useRef, useState } from 'react';
import { BsBell, BsBellFill, BsBellSlash, BsSendCheck } from 'react-icons/bs';

type State =
  | 'checking'
  | 'no-support'
  | 'no-vapid'
  | 'denied'
  | 'idle'
  | 'subscribing'
  | 'subscribed'
  | 'unsubscribing'
  | 'sending';

function urlBase64ToUint8Array(b64: string) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from([...atob(base64)].map((c) => c.charCodeAt(0)));
}

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export default function PushBell() {
  const [state, setState] = useState<State>('checking');
  const [msg, setMsg] = useState('');
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(text: string) {
    setMsg(text);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(''), 3000);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('no-support');
      return;
    }

    // 2. VAPID key baked into bundle
    if (!VAPID_KEY) {
      setState('no-vapid');
      return;
    }

    // 3. permission already denied
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    // 4. check if already subscribed
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => navigator.serviceWorker.ready.then(() => reg))
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'subscribed' : 'idle'))
      .catch(() => setState('idle'));
  }, []);

  // ── nothing to show ─────────────────────────────────────────────────────────
  if (state === 'checking' || state === 'no-support') return null;

  // ── VAPID not configured (env var missing) ───────────────────────────────────
  if (state === 'no-vapid') {
    return (
      <button
        title="Push ยังไม่ได้ตั้งค่า — ขาด NEXT_PUBLIC_VAPID_PUBLIC_KEY"
        className="p-2 rounded-lg text-yellow-500 cursor-not-allowed opacity-60"
      >
        <BsBellSlash size={17} />
      </button>
    );
  }

  // ── notification permission denied ───────────────────────────────────────────
  if (state === 'denied') {
    return (
      <button
        title="เบราว์เซอร์บล็อกการแจ้งเตือน — แก้ในการตั้งค่าเบราว์เซอร์"
        className="p-2 rounded-lg text-[#475569] cursor-not-allowed"
      >
        <BsBellSlash size={17} />
      </button>
    );
  }

  // ── subscribe ────────────────────────────────────────────────────────────────
  async function subscribe() {
    setState('subscribing');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState('denied');
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });

      const res = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      if (!res.ok) throw new Error(await res.text());
      setState('subscribed');
      flash('เปิดรับแจ้งเตือนแล้ว ✅');
    } catch (err) {
      console.error('[PushBell] subscribe:', err);
      flash('เปิดแจ้งเตือนไม่สำเร็จ ❌');
      setState('idle');
    }
  }

  // ── unsubscribe ──────────────────────────────────────────────────────────────
  async function unsubscribe() {
    setState('unsubscribing');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/admin/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('idle');
      flash('ปิดรับแจ้งเตือนแล้ว');
    } catch (err) {
      console.error('[PushBell] unsubscribe:', err);
      flash('ปิดแจ้งเตือนไม่สำเร็จ ❌');
      setState('subscribed');
    }
  }

  // ── send test ────────────────────────────────────────────────────────────────
  async function sendTest() {
    setState('sending');
    try {
      const res = await fetch('/api/admin/push/test', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      flash('ส่งแจ้งเตือนทดสอบแล้ว 🔔');
    } catch (err) {
      console.error('[PushBell] test:', err);
      flash('ส่งไม่สำเร็จ ❌');
    } finally {
      setState('subscribed');
    }
  }

  const busy = state === 'subscribing' || state === 'unsubscribing' || state === 'sending';
  const isSubscribed = state === 'subscribed' || state === 'sending';

  return (
    <div className="relative flex items-center gap-1">
      {/* flash message */}
      {msg && (
        <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-[rgba(0,0,0,0.75)] px-2 py-1 text-xs text-white">
          {msg}
        </span>
      )}

      {/* bell toggle */}
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={busy}
        title={isSubscribed ? 'ปิดรับแจ้งเตือน' : 'เปิดรับแจ้งเตือนออเดอร์ใหม่'}
        className={[
          'p-2 rounded-lg transition-all disabled:opacity-40',
          isSubscribed
            ? 'text-[#a78bfa] bg-[rgba(139,92,246,0.15)] hover:bg-[rgba(139,92,246,0.25)]'
            : 'text-[#475569] hover:text-white hover:bg-[rgba(255,255,255,0.07)]',
        ].join(' ')}
      >
        {isSubscribed ? <BsBellFill size={17} /> : <BsBell size={17} />}
      </button>

      {/* test button — only when subscribed */}
      {isSubscribed && (
        <button
          onClick={sendTest}
          disabled={busy}
          title="ส่งแจ้งเตือนทดสอบ"
          className="p-2 rounded-lg transition-all disabled:opacity-40 text-[#475569] hover:text-[#a78bfa] hover:bg-[rgba(139,92,246,0.15)]"
        >
          <BsSendCheck size={15} />
        </button>
      )}
    </div>
  );
}
