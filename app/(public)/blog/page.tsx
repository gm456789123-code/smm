import Link from 'next/link';
import Image from 'next/image';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import { sanitizeUrl } from '@/lib/sanitize-html';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AURA SMM Blog - Tips and Platform Updates',
  description: 'Guides and updates on social media marketing, growth strategies, and platform trends.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    title: 'AURA SMM Blog',
    description: 'Social media growth tips, SMM guides, and platform updates.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AURA SMM Blog',
    description: 'Social media growth tips, SMM guides, and platform updates.',
  },
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
        <h1 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold text-[#2D1B4E]">Blog</h1>
        <p className="text-[#5B4A7A]">Tips, platform updates, and practical SMM strategies</p>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-12 text-center">
          <p className="text-[#6B5B82]">No posts yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post: RowDataPacket) => {
            const safeCoverImage = sanitizeUrl(post.cover_image, 'image');

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="bg-white/80 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl p-5 space-y-3 group hover:border-[#8B5CF6]/50 hover:shadow-md transition-all"
              >
                {safeCoverImage && (
                  <div className="aspect-video bg-[rgba(139,92,246,0.08)] rounded-xl overflow-hidden">
                    <Image
                      src={safeCoverImage}
                      alt={post.title}
                      width={960}
                      height={540}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-[#2D1B4E] text-sm group-hover:text-[#7C3AED] transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && <p className="text-[#5B4A7A] text-xs line-clamp-3 leading-relaxed">{post.excerpt}</p>}
                  {post.published_at && (
                    <p className="text-[11px] text-[#8B7A9E] font-medium">
                      {new Date(post.published_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

