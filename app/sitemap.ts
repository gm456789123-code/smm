import { MetadataRoute } from 'next';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurasmm.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/blog`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/login`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/register`,lastModified: new Date(),changeFrequency: 'monthly', priority: 0.6 },
  ];

  try {
    const [posts] = await db.query<RowDataPacket[]>(
      'SELECT slug, updated_at FROM blog_posts WHERE published = 1'
    );
    const blogPages: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
    return [...staticPages, ...blogPages];
  } catch {
    return staticPages;
  }
}
