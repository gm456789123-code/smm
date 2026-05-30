import { notFound } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { BsArrowLeft, BsClockHistory, BsPersonCircle } from 'react-icons/bs';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurasmm.com';

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
  } catch { return null; }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'ไม่พบบทความ' };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${BASE}/blog/${slug}` },
    openGraph: {
      type: 'article',
      url: `${BASE}/blog/${slug}`,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : [],
      images: post.cover_image ? [{ url: post.cover_image, width: 1200, height: 630, alt: post.title }] : [],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, images: post.cover_image ? [post.cover_image] : [] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image ? [post.cover_image] : [],
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    author: { '@type': 'Person', name: post.author_name ?? 'AURA SMM' },
    publisher: { '@type': 'Organization', name: 'AURA SMM', logo: { '@type': 'ImageObject', url: `${BASE}/og-image.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}/blog/${slug}` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'บทความ', item: `${BASE}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `${BASE}/blog/${slug}` },
      ],
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#334155]">
        <Link href="/" className="hover:text-[#8B5CF6] transition-colors">หน้าแรก</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[#8B5CF6] transition-colors">บทความ</Link>
        <span>/</span>
        <span className="text-[#475569] truncate max-w-[200px]">{post.title}</span>
      </nav>

      {post.cover_image && (
        <div className="aspect-video rounded-2xl overflow-hidden bg-[rgba(139,92,246,0.08)]">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="space-y-4">
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl md:text-4xl font-extrabold text-white leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-[#475569]">
          {post.author_name && (
            <span className="flex items-center gap-1.5">
              <BsPersonCircle size={13} className="text-[#8B5CF6]" />
              {post.author_name}
            </span>
          )}
          {post.published_at && (
            <span className="flex items-center gap-1.5">
              <BsClockHistory size={12} className="text-[#06B6D4]" />
              {new Date(post.published_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {post.excerpt && (
        <p className="text-[#94A3B8] text-lg leading-relaxed border-l-2 border-[rgba(139,92,246,0.4)] pl-4 italic">
          {post.excerpt}
        </p>
      )}

      <article
        className="prose prose-invert prose-sm max-w-none text-[#94A3B8] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
      />

      <div className="pt-6 border-t border-[rgba(139,92,246,0.10)]">
        <Link href="/blog"
          className="inline-flex items-center gap-2 text-sm text-[#475569] hover:text-[#8B5CF6] transition-colors">
          <BsArrowLeft size={14} /> กลับไปบทความทั้งหมด
        </Link>
      </div>
    </div>
  );
}
