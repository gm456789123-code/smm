import thMessages from '../messages/th.json';
import zhMessages from '../messages/zh.json';
import enMessages from '../messages/en.json';

export const LOCALES = ['th', 'en', 'zh'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'th';

export const LOCALE_NAMES: Record<Locale, string> = {
  th: 'ไทย',
  en: 'English',
  zh: '中文',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  th: '🇹🇭',
  en: '🇬🇧',
  zh: '🇨🇳',
};

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  th: thMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
  zh: zhMessages as Record<string, unknown>,
};

export function getMessages(locale: Locale): Record<string, unknown> {
  return MESSAGES[locale];
}

export function detectLocale(acceptLanguage: string): Locale {
  const tags = acceptLanguage.split(',').map((s) => s.split(';')[0].trim().toLowerCase());
  for (const tag of tags) {
    if (tag.startsWith('th')) return 'th';

    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}
