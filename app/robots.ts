import { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurasmm.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog/', '/blog/*'],
        disallow: ['/dashboard/', '/admin/', '/order/', '/orders/', '/profile/', '/balance/', '/topup/', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
