import type { Metadata, Viewport } from 'next';
import type { CSSProperties } from 'react';
import './globals.css';
import LocaleProvider from '@/components/LocaleProvider';
import LineFloatButtonServer from '@/components/LineFloatButtonServer';
import { getMessages, LOCALES, type Locale } from '@/lib/i18n';
import { SITE_DESCRIPTION, SITE_NAME, SITE_OG_IMAGE, SITE_TITLE, SITE_URL } from '@/lib/site';

const fontVars = {
  '--font-jakarta': 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  '--font-inter': 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
} as CSSProperties;

const localeAlternates = Object.fromEntries(
  LOCALES.map((l) => [l, `${SITE_URL}/?lang=${l}`])
);

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_TITLE} - High-quality SMM services with fast and reliable delivery`,
    template: `%s | ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'SMM Panel',
    'SMM Panel Thailand',
    'Buy Followers',
    'Increase Followers',
    'Increase Likes',
    'Increase Views',
    'Instagram Followers',
    'TikTok Followers',
    'YouTube Views',
    'Facebook Likes',
    'Twitter Followers',
    'Cheap SMM Panel',
    SITE_NAME,
    'Social Media Marketing',
    'Audience Growth',
    'Engagement Boost',
  ],
  authors: [{ name: 'Saint', url: SITE_URL }],
  creator: 'Saint',
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: SITE_URL,
    siteName: SITE_TITLE,
    title: `${SITE_TITLE} - High-quality SMM services with fast and reliable delivery`,
    description: SITE_DESCRIPTION,
    images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_TITLE} - SMM panel for creators and brands`,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
    creator: '@aurasmm',
  },
  alternates: { canonical: SITE_URL, languages: localeAlternates },
  category: 'technology',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = 'th' as Locale;
  const messages = getMessages(locale);

  return (
    <html lang={locale} className="h-full" style={fontVars}>
      <head>
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="h-full">
        <LocaleProvider initialLocale={locale} initialMessages={messages}>
          {children}
          <LineFloatButtonServer />
        </LocaleProvider>
      </body>
    </html>
  );
}
