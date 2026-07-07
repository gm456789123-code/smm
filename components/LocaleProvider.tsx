'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS, getMessages, type Locale } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
  localeNames: typeof LOCALE_NAMES;
  localeFlags: typeof LOCALE_FLAGS;
  locales: typeof LOCALES;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}

interface Props {
  children: ReactNode;
  initialLocale: Locale;
  initialMessages: Record<string, unknown>;
}

export default function LocaleProvider({ children, initialLocale, initialMessages }: Props) {
  const [locale, setLocaleState]     = useState<Locale>(initialLocale);
  const [messages, setMessages]      = useState(initialMessages);

  const setLocale = useCallback((newLocale: Locale) => {
    // Update cookie
    document.cookie = `locale=${newLocale}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;

    setMessages(getMessages(newLocale));
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string, fallback = ''): string => {
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
  }, [messages]);

  return (
    <LocaleContext.Provider value={{
      locale, setLocale, t,
      localeNames: LOCALE_NAMES,
      localeFlags: LOCALE_FLAGS,
      locales: LOCALES,
    }}>
      {children}
    </LocaleContext.Provider>
  );
}
