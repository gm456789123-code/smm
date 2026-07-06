'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BlogEditor, { BlogForm } from '@/components/BlogEditor';

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<BlogForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then(r => r.json())
      .then(d => {
        setInitial({
          title:            d.title            ?? '',
          slug:             d.slug             ?? '',
          excerpt:          d.excerpt          ?? '',
          content:          d.content          ?? '',
          cover_image:      d.cover_image      ?? '',
          meta_title:       d.meta_title       ?? '',
          meta_description: d.meta_description ?? '',
          focus_keyword:    d.focus_keyword    ?? '',
          og_image:         d.og_image         ?? '',
        });
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <p className="text-[#475569] animate-pulse">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">แก้ไขบทความ</h1>
        <p className="text-[#475569] text-sm mt-0.5">แก้ไขเนื้อหาและ SEO</p>
      </div>
      <BlogEditor initial={initial!} postId={Number(id)} />
    </main>
  );
}
