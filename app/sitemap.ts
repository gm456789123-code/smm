import { MetadataRoute } from 'next';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Public indexable pages only — do not list noindex auth/dashboard routes
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const [posts] = await db.query<RowDataPacket[]>(
      'SELECT slug, updated_at FROM blog_posts WHERE published = 1'
    );
    const blogPages: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
    return [...staticPages, ...blogPages];
  } catch {
    return staticPages;
  }
}

