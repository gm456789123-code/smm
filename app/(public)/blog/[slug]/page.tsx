import { notFound } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Props { params: Promise<{ slug: string }> }

async function getPost(slug: string) {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT bp.*, u.username as author_name
       FROM blog_posts bp
       LEFT JOIN users u ON bp.author_id = u.id
       WHERE bp.slug = ? AND bp.published = 1`,
      [slug]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'ไม่พบบทความ' };
  return { title: `${post.title} | AURA SMM`, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link href="/blog" className="text-sm text-[#475569] hover:text-[#8B5CF6] transition-colors">
        ← กลับไปบทความ
      </Link>

      {post.cover_image && (
        <div className="aspect-video rounded-2xl overflow-hidden bg-[rgba(139,92,246,0.08)]">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl md:text-4xl font-extrabold text-white leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-xs text-[#475569]">
          {post.author_name && <span>โดย <span className="text-[#94A3B8]">{post.author_name}</span></span>}
          {post.published_at && (
            <span>{new Date(post.published_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          )}
        </div>
      </div>

      {post.excerpt && (
        <p className="text-[#94A3B8] text-lg leading-relaxed border-l-2 border-[rgba(139,92,246,0.4)] pl-4">
          {post.excerpt}
        </p>
      )}

      <article
        className="prose prose-invert prose-sm max-w-none text-[#94A3B8] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
      />
    </div>
  );
}
