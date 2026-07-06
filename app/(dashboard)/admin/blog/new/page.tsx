'use client';

import BlogEditor from '@/components/BlogEditor';

export default function NewBlogPage() {
  return (
    <main className="flex-1 p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">บทความใหม่</h1>
        <p className="text-[#475569] text-sm mt-0.5">เขียนบทความพร้อมเครื่องมือ SEO</p>
      </div>
      <BlogEditor />
    </main>
  );
}
