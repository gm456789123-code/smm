import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/blog/', '/privacy', '/terms'],
        disallow: [
          '/dashboard',
          '/admin',
          '/order',
          '/orders',
          '/mass-order',
          '/services',
          '/profile',
          '/balance',
          '/topup',
          '/report',
          '/login',
          '/register',
          '/verify-email',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
