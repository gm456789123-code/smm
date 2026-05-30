export const LOCALES = ['th', 'en', 'lo', 'my', 'vi', 'km'] as const;
export type Locale = typeof LOCALES[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  th: 'ไทย',
  en: 'English',
  lo: 'ລາວ',
  my: 'မြန်မာ',
  vi: 'Tiếng Việt',
  km: 'ខ្មែរ',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  th: '🇹🇭',
  en: '🇬🇧',
  lo: '🇱🇦',
  my: '🇲🇲',
  vi: '🇻🇳',
  km: '🇰🇭',
};

// Map Accept-Language codes → our supported locales
export function detectLocale(acceptLanguage: string): Locale {
  const langMap: Record<string, Locale> = {
    th: 'th',
    lo: 'lo',
    my: 'my',
    ms: 'my', // close enough fallback
    vi: 'vi',
    km: 'km',
    en: 'en',
  };

  const langs = acceptLanguage
    .split(',')
    .map((l) => l.split(';')[0].trim().toLowerCase().split('-')[0]);

  for (const lang of langs) {
    if (lang in langMap) return langMap[lang];
  }
  return 'th'; // default
}

export async function getMessages(locale: Locale) {
  try {
    const messages = await import(`../messages/${locale}.json`);
    return messages.default as Record<string, unknown>;
  } catch {
    const messages = await import('../messages/th.json');
    return messages.default as Record<string, unknown>;
  }
}

// Simple nested key getter: t('hero.badge')
export function createTranslator(messages: Record<string, unknown>) {
  return function t(key: string, fallback = ''): string {
    const parts = key.split('.');
    let current: unknown = messages;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as object)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return fallback || key;
      }
    }
    return typeof current === 'string' ? current : fallback || key;
  };
}
