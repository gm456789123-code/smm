export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { BsArrowLeft, BsClockHistory, BsPersonCircle } from 'react-icons/bs';
import type { Metadata } from 'next';
import { SITE_ICON, SITE_OG_IMAGE, SITE_URL } from '@/lib/site';
import { sanitizeHtml, sanitizeUrl } from '@/lib/sanitize-html';

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found', robots: { index: false, follow: false } };

  const title = `${post.title} | AURA SMM Blog`;
  const description = post.excerpt || 'Read the latest social media marketing insights from AURA SMM.';
  const image = sanitizeUrl(post.og_image || post.cover_image, 'image') || SITE_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/blog/${slug}`,
      title,
      description,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : [],
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const safeCoverImage = sanitizeUrl(post.cover_image, 'image');
  const safeContent = sanitizeHtml(post.content ?? '');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: safeCoverImage ? [safeCoverImage] : [SITE_OG_IMAGE],
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    author: { '@type': 'Person', name: post.author_name ?? 'AURA SMM' },
    publisher: { '@type': 'Organization', name: 'AURA SMM', logo: { '@type': 'ImageObject', url: SITE_ICON } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${slug}` },
      ],
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="flex items-center gap-2 text-xs text-[#334155]">
        <Link href="/" className="hover:text-[#8B5CF6] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[#8B5CF6] transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-[#475569] truncate max-w-[200px]">{post.title}</span>
      </nav>

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

      <style>{`
        .blog-content a{color:#a78bfa;text-decoration:underline;text-underline-offset:2px}
        .blog-content a:hover{color:#c4b5fd}
        .blog-content img{max-width:100%;height:auto;border-radius:0.5rem;display:block}
        .blog-content img[style*="float:left"],.blog-content img[style*="float: left"]{margin-right:1.25rem;margin-bottom:0.5rem}
        .blog-content img[style*="float:right"],.blog-content img[style*="float: right"]{margin-left:1.25rem;margin-bottom:0.5rem;float:right}
        .blog-content h1,.blog-content h2,.blog-content h3,.blog-content h4,.blog-content h5,.blog-content h6{color:#f1f5f9;font-weight:700;line-height:1.3;margin-top:1.6em;margin-bottom:0.6em}
        .blog-content h1{font-size:2rem}.blog-content h2{font-size:1.6rem}.blog-content h3{font-size:1.3rem}
        .blog-content h4{font-size:1.15rem}.blog-content h5,.blog-content h6{font-size:1rem}
        .blog-content p{margin-bottom:1em}
        .blog-content ul,.blog-content ol{padding-left:1.5rem;margin-bottom:1em}
        .blog-content ul{list-style-type:disc}.blog-content ol{list-style-type:decimal}
        .blog-content li{margin-bottom:0.25em}
        .blog-content blockquote{border-left:3px solid rgba(139,92,246,0.5);padding-left:1rem;color:#94a3b8;font-style:italic;margin:1em 0}
        .blog-content pre{background:rgba(0,0,0,0.35);border:1px solid rgba(139,92,246,0.2);border-radius:0.5rem;padding:1rem;overflow-x:auto;font-size:0.85rem;margin-bottom:1em}
        .blog-content code{background:rgba(139,92,246,0.12);border-radius:0.25rem;padding:0.1em 0.35em;font-size:0.9em}
        .blog-content pre code{background:none;padding:0;font-size:inherit}
        .blog-content table{width:100%;border-collapse:collapse;margin-bottom:1em;font-size:0.9rem}
        .blog-content th,.blog-content td{border:1px solid rgba(139,92,246,0.2);padding:0.5rem 0.75rem;text-align:left}
        .blog-content th{background:rgba(139,92,246,0.12);color:#e2e8f0;font-weight:600}
        .blog-content hr{border:none;border-top:1px solid rgba(139,92,246,0.15);margin:2em 0}
        .blog-content strong,.blog-content b{color:#e2e8f0}
        .blog-content mark{background:rgba(139,92,246,0.3);color:#f1f5f9;border-radius:0.2em;padding:0 0.15em}
      `}</style>
      <article
        className="blog-content max-w-none text-[#94A3B8] leading-relaxed select-text"
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />

      <div className="pt-6 border-t border-[rgba(139,92,246,0.10)]">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#475569] hover:text-[#8B5CF6] transition-colors">
          <BsArrowLeft size={14} /> Back to blog
        </Link>
      </div>
    </div>
  );
}

