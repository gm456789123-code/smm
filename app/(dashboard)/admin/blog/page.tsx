'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Post { id: number; slug: string; title: string; published: number; published_at: string; created_at: string; }

export default function AdminBlogPage() {
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoad]  = useState(true);

  function load() {
    fetch('/api/admin/blog').then(r => r.json()).then(d => {
      setPosts(Array.isArray(d) ? d : []);
      setLoad(false);
    });
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(id: number, current: number) {
    await fetch(`/api/admin/blog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: current ? 0 : 1 }),
    });
    load();
  }

  async function deletePost(id: number) {
    if (!confirm('ลบบทความนี้?')) return;
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">จัดการบทความ</h1>
          <p className="text-[#475569] text-sm mt-0.5">{posts.length} บทความ</p>
        </div>
        <Link href="/admin/blog/new" className="glass-tab glass-tab-active px-5 py-2.5 text-sm font-semibold text-[#c4b5fd] hover:text-white">
          + บทความใหม่
        </Link>
      </div>

      <div className="glass p-5">
        {loading ? <p className="py-10 text-center text-[#475569] animate-pulse">กำลังโหลด...</p> : (
          <div className="space-y-2">
            {posts.length === 0 ? (
              <p className="py-10 text-center text-[#475569]">ยังไม่มีบทความ</p>
            ) : posts.map(p => (
              <div key={p.id} className="glass-tab flex items-center justify-between px-4 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#F1F5F9] truncate">{p.title}</p>
                  <p className="text-xs text-[#475569]">/blog/{p.slug}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {p.published ? 'เผยแพร่' : 'ร่าง'}
                  </span>
                  <button onClick={() => togglePublish(p.id, p.published)}
                    className="glass-tab px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white">
                    {p.published ? 'ซ่อน' : 'เผยแพร่'}
                  </button>
                  <Link href={`/admin/blog/${p.id}/edit`}
                    className="glass-tab px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white">
                    แก้ไข
                  </Link>
                  <button onClick={() => deletePost(p.id)}
                    className="glass-tab px-3 py-1.5 text-xs text-red-400 hover:text-red-300">
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
