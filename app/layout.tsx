import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import type { CSSProperties } from 'react';
import './globals.css';
import LocaleProvider from '@/components/LocaleProvider';
import { getMessages, LOCALES, type Locale } from '@/lib/i18n';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurasmm.com';
const fontVars = {
  '--font-jakarta': 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  '--font-inter': 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
} as CSSProperties;
const localeAlternates = Object.fromEntries(
  LOCALES.map((l) => [l, `${BASE}/?lang=${l}`])
);

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'AURA SMM Panel — บริการ SMM คุณภาพสูง เร็ว ราคาถูก',
    template: '%s | AURA SMM Panel',
  },
  description:
    'AURA SMM Panel บริการเพิ่ม Followers, Likes, Views, Comments สำหรับ Instagram, TikTok, YouTube, Facebook, Twitter/X, Telegram, Spotify และอีกมากมาย ราคาถูก เริ่มต้นเพียงไม่กี่บาท ระบบอัตโนมัติ 24/7',
  keywords: [
    'SMM Panel', 'SMM Panel ไทย', 'ซื้อ Followers', 'เพิ่ม Followers', 'เพิ่ม Likes',
    'เพิ่ม Views', 'Instagram Followers', 'TikTok Followers', 'YouTube Views',
    'Facebook Likes', 'Twitter Followers', 'SMM Panel Thailand', 'ราคาถูก', 'AURA SMM',
    'Social Media Marketing', 'เพิ่มยอดผู้ติดตาม', 'ซื้อยอดไลค์',
  ],
  authors: [{ name: 'Saint', url: BASE }],
  creator: 'Saint',
  publisher: 'AURA SMM',
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: BASE,
    siteName: 'AURA SMM Panel',
    title: 'AURA SMM Panel — บริการ SMM คุณภาพสูง เร็ว ราคาถูก',
    description: 'บริการ SMM Panel คุณภาพสูง เพิ่ม Followers, Likes, Views ทุกแพลตฟอร์ม ราคาถูก ระบบอัตโนมัติ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AURA SMM Panel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AURA SMM Panel — SMM Panel อันดับ 1 ในไทย',
    description: 'เพิ่ม Followers, Likes, Views ทุกแพลตฟอร์ม ราคาถูก เริ่มต้นไม่กี่บาท',
    images: ['/og-image.png'],
    creator: '@aurasmm',
  },
  alternates: { canonical: BASE, languages: localeAlternates },
  category: 'technology',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore  = await cookies();
  const cookieLang   = cookieStore.get('locale')?.value;
  const locale       = (LOCALES as readonly string[]).includes(cookieLang ?? '')
    ? (cookieLang as Locale)
    : 'th';
  const messages = getMessages(locale);

  return (
    <html
      lang={locale}
      className="h-full"
      style={fontVars}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="h-full">
        <LocaleProvider initialLocale={locale} initialMessages={messages}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
