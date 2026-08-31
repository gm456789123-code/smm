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
  const [vapidKey, setVapidKey] = useState<string>(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '');
  const [msg, setMsg] = useState('');
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(text: string, duration = 4000) {
    setMsg(text);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(''), duration);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('no-support');
      return;
    }

    // 2. notification permission denied
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    async function init() {
      try {
        let key = vapidKey;
        // Dynamically fetch VAPID key from backend if not present
        const res = await fetch('/api/admin/push/subscribe').then(r => r.json()).catch(() => null);
        if (res?.vapidPublicKey) {
          key = res.vapidPublicKey;
          setVapidKey(key);
        }

        if (!key) {
          setState('no-vapid');
          return;
        }

        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? 'subscribed' : 'idle');
      } catch (err) {
        console.error('[PushBell] init:', err);
        setState('idle');
      }
    }

    init();
  }, []);

  // ── nothing to show ─────────────────────────────────────────────────────────
  if (state === 'checking' || state === 'no-support') return null;

  // ── VAPID not configured (env var missing) ───────────────────────────────────
  if (state === 'no-vapid') {
    return (
      <div className="relative flex items-center">
        {msg && (
          <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-black/90 px-2.5 py-1 text-xs text-amber-300 border border-amber-500/30 shadow-xl z-50">
            {msg}
          </span>
        )}
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/admin/push/subscribe').then((r) => r.json());
              if (res?.vapidPublicKey) {
                setVapidKey(res.vapidPublicKey);
                setState('idle');
                flash('ดึงกุญแจ VAPID สำเร็จแล้ว กดกระดิ่งอีกครั้งเพื่อเปิดรับแจ้งเตือน ✅');
                return;
              }
            } catch {}
            flash('ยังไม่ได้ตั้งค่า VAPID Keys ในเซิร์ฟเวอร์');
          }}
          title="VAPID ยังไม่พร้อม — คลิกเพื่อดึงกุญแจใหม่"
          className="p-2 rounded-lg text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors cursor-pointer"
        >
          <BsBellSlash size={17} />
        </button>
      </div>
    );
  }

  // ── notification permission denied ───────────────────────────────────────────
  if (state === 'denied') {
    return (
      <div className="relative flex items-center">
        {msg && (
          <span className="absolute right-full mr-2 whitespace-nowrap rounded-md bg-black/90 px-2.5 py-1 text-xs text-red-300 border border-red-500/30 shadow-xl z-50">
            {msg}
          </span>
        )}
        <button
          onClick={() => flash('⚠️ กรุณากดไอคอน 🔒 หรือ ⚙️ ที่แถบ Address bar ด้านบน แล้วเปลี่ยนการแจ้งเตือนเป็น "อนุญาต" (Allow)', 6000)}
          title="เบราว์เซอร์บล็อกการแจ้งเตือน — คลิกเพื่อดูวิธีเปิด"
          className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors cursor-pointer"
        >
          <BsBellSlash size={17} />
        </button>
      </div>
    );
  }

  // ── subscribe ────────────────────────────────────────────────────────────────
  async function subscribe() {
    setState('subscribing');
    try {
      let key = vapidKey;
      if (!key) {
        const res = await fetch('/api/admin/push/subscribe').then((r) => r.json()).catch(() => null);
        if (res?.vapidPublicKey) {
          key = res.vapidPublicKey;
          setVapidKey(key);
        }
      }

      if (!key) {
        flash('ไม่พบ VAPID Public Key');
        setState('no-vapid');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState('denied');
        flash('เบราว์เซอร์ไม่อนุญาตการแจ้งเตือน');
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
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
      const data = await res.json();
      const count = data.result?.total ?? 1;
      flash(`ส่งแจ้งเตือนไปยัง ${count} อุปกรณ์แล้ว 🔔`);
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
