import Link from 'next/link';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurasmm.com';

export const metadata = {
  title: 'บทความ — เทคนิค SMM และอัปเดตแพลตฟอร์ม',
  description: 'บทความ เทคนิค Social Media Marketing, วิธีเพิ่ม Followers, Likes, Views และอัปเดตข่าวสารแพลตฟอร์มต่างๆ',
  alternates: { canonical: `${BASE}/blog` },
  openGraph: { url: `${BASE}/blog`, title: 'บทความ AURA SMM', description: 'เทคนิค SMM และอัปเดตแพลตฟอร์ม' },
};

async function getPosts() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT slug, title, excerpt, cover_image, published_at FROM blog_posts WHERE published = 1 ORDER BY published_at DESC'
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold text-white">บทความ</h1>
        <p className="text-[#475569]">เทคนิค SMM, อัปเดตแพลตฟอร์ม และข่าวสาร</p>
      </div>

      {posts.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-[#475569]">ยังไม่มีบทความ</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post: RowDataPacket) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="glass p-5 space-y-3 group hover:border-[rgba(139,92,246,0.3)] transition-colors">
              {post.cover_image && (
                <div className="aspect-video bg-[rgba(139,92,246,0.08)] rounded-lg overflow-hidden">
                  <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="space-y-1.5">
                <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-[#F1F5F9] text-sm group-hover:text-[#c4b5fd] transition-colors line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && <p className="text-[#475569] text-xs line-clamp-3">{post.excerpt}</p>}
                {post.published_at && (
                  <p className="text-[10px] text-[#334155]">
                    {new Date(post.published_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
