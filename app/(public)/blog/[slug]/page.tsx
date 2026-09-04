export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { BsArrowLeft, BsClockHistory, BsPersonCircle } from 'react-icons/bs';
import type { Metadata } from 'next';
import { SITE_ICON, SITE_NAME, SITE_OG_IMAGE, SITE_URL } from '@/lib/site';
import { sanitizeHtml, sanitizeUrl } from '@/lib/sanitize-html';

interface Props { params: Promise<{ slug: string }> }

function absUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) return `${SITE_URL}${pathOrUrl}`;
  return pathOrUrl;
}

function seoTitleOf(post: RowDataPacket): string {
  const custom = typeof post.meta_title === 'string' ? post.meta_title.trim() : '';
  return custom || String(post.title ?? '');
}

function seoDescriptionOf(post: RowDataPacket): string {
  const custom = typeof post.meta_description === 'string' ? post.meta_description.trim() : '';
  if (custom) return custom;
  const excerpt = typeof post.excerpt === 'string' ? post.excerpt.trim() : '';
  if (excerpt) return excerpt;
  return 'Read the latest social media marketing insights from AURA SMM.';
}

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

  const title = seoTitleOf(post);
  const description = seoDescriptionOf(post);
  const imagePath = sanitizeUrl(post.og_image || post.cover_image, 'image');
  const image = imagePath ? absUrl(imagePath) : SITE_OG_IMAGE;
  const keywords = typeof post.focus_keyword === 'string' && post.focus_keyword.trim()
    ? post.focus_keyword.split(/[,|]/).map((k: string) => k.trim()).filter(Boolean)
    : undefined;

  return {
    // Let root template append " | AURA SMM Panel" unless meta_title already looks complete
    title,
    description,
    keywords,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/blog/${slug}`,
      siteName: SITE_NAME,
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: post.author_name ? [String(post.author_name)] : [SITE_NAME],
      images: [{ url: image, width: 1200, height: 630, alt: title }],
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

  const title = String(post.title ?? '');
  const seoTitle = seoTitleOf(post);
  const seoDescription = seoDescriptionOf(post);
  const safeCoverImage = sanitizeUrl(post.cover_image, 'image');
  const coverAbs = safeCoverImage ? absUrl(safeCoverImage) : null;
  const safeContent = sanitizeHtml(post.content ?? '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: seoTitle,
    name: title,
    description: seoDescription,
    image: coverAbs ? [coverAbs] : [SITE_OG_IMAGE],
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    keywords: typeof post.focus_keyword === 'string' ? post.focus_keyword : undefined,
    author: { '@type': 'Person', name: post.author_name ?? SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_ICON },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: title, item: `${SITE_URL}/blog/${slug}` },
      ],
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="flex items-center gap-2 text-xs text-[#6B5B8A]">
        <Link href="/" className="hover:text-[#7C3AED] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[#7C3AED] transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-[#4A3B63] truncate max-w-[200px]">{title}</span>
      </nav>

      <div className="space-y-4">
        <h1 className="font-[family-name:var(--font-jakarta)] text-3xl md:text-4xl font-extrabold text-[#2D1B4E] leading-tight">
          {title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-[#6B5B8A]">
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

      {safeCoverImage && (
        <figure className="overflow-hidden rounded-2xl border border-[rgba(139,92,246,0.15)] bg-[rgba(139,92,246,0.05)]">
          <Image
            src={safeCoverImage}
            alt={seoTitle}
            width={1200}
            height={630}
            priority
            className="w-full max-h-[28rem] object-cover"
          />
        </figure>
      )}

      {post.excerpt && (
        <p className="text-[#5B4A7A] text-lg leading-relaxed border-l-2 border-[rgba(139,92,246,0.4)] pl-4 italic">
          {post.excerpt}
        </p>
      )}

      <style>{`
        .blog-content a{color:#7C3AED;text-decoration:underline;text-underline-offset:2px}
        .blog-content a:hover{color:#5B21B6}
        .blog-content img{max-width:100%;height:auto;border-radius:0.5rem;display:block}
        .blog-content img[style*="float:left"],.blog-content img[style*="float: left"]{margin-right:1.25rem;margin-bottom:0.5rem}
        .blog-content img[style*="float:right"],.blog-content img[style*="float: right"]{margin-left:1.25rem;margin-bottom:0.5rem;float:right}
        .blog-content h1,.blog-content h2,.blog-content h3,.blog-content h4,.blog-content h5,.blog-content h6{color:#2D1B4E;font-weight:700;line-height:1.3;margin-top:1.6em;margin-bottom:0.6em}
        .blog-content h1{font-size:2rem}.blog-content h2{font-size:1.6rem}.blog-content h3{font-size:1.3rem}
        .blog-content h4{font-size:1.15rem}.blog-content h5,.blog-content h6{font-size:1rem}
        .blog-content p{margin-bottom:1em}
        .blog-content ul,.blog-content ol{padding-left:1.5rem;margin-bottom:1em}
        .blog-content ul{list-style-type:disc}.blog-content ol{list-style-type:decimal}
        .blog-content li{margin-bottom:0.25em}
        .blog-content blockquote{border-left:3px solid rgba(124,58,237,0.5);padding-left:1rem;color:#5B4A7A;font-style:italic;margin:1em 0}
        .blog-content pre{background:rgba(45,27,78,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:0.5rem;padding:1rem;overflow-x:auto;font-size:0.85rem;margin-bottom:1em}
        .blog-content code{background:rgba(124,58,237,0.10);border-radius:0.25rem;padding:0.1em 0.35em;font-size:0.9em;color:#4C1D95}
        .blog-content pre code{background:none;padding:0;font-size:inherit;color:inherit}
        .blog-content table{width:100%;border-collapse:collapse;margin-bottom:1em;font-size:0.9rem}
        .blog-content th,.blog-content td{border:1px solid rgba(124,58,237,0.2);padding:0.5rem 0.75rem;text-align:left}
        .blog-content th{background:rgba(124,58,237,0.10);color:#2D1B4E;font-weight:600}
        .blog-content hr{border:none;border-top:1px solid rgba(124,58,237,0.15);margin:2em 0}
        .blog-content strong,.blog-content b{color:#1A0F36}
        .blog-content mark{background:rgba(201,177,232,0.55);color:#2D1B4E;border-radius:0.2em;padding:0 0.15em}
      `}</style>
      <article
        className="blog-content max-w-none text-[#3D2C5E] leading-relaxed select-text"
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />

      {/* SEO Internal Linking Call-To-Action Box */}
      <div className="my-8 p-6 sm:p-7 rounded-2xl border border-[rgba(139,92,246,0.25)] bg-gradient-to-br from-[rgba(139,92,246,0.08)] to-[rgba(6,182,212,0.08)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-[#2D1B4E]">
              พร้อมเพิ่มยอดผู้ติดตาม ยอดไลก์ และยอดวิวแล้วหรือยัง?
            </h3>
            <p className="text-sm text-[#5B4A7A]">
              เลือกใช้บริการ <Link href="/" className="font-semibold text-[#7C3AED] hover:underline">AURA SMM Panel</Link> ระบบปั๊มยอดอัตโนมัติ 24 ชม. ราคาถูกที่สุด เริ่มต้นเพียง 10 บาท
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/#services"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#7C3AED] bg-white border border-[rgba(139,92,246,0.3)] hover:bg-[rgba(139,92,246,0.05)] transition-all shadow-sm"
            >
              ดูบริการทั้งหมด
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:opacity-95 transition-all shadow-md shadow-purple-500/20"
            >
              สมัครสมาชิกฟรี
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-[rgba(139,92,246,0.10)]">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#6B5B8A] hover:text-[#7C3AED] transition-colors">
          <BsArrowLeft size={14} /> Back to blog
        </Link>
      </div>
    </div>
  );
}
