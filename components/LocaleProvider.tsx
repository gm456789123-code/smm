'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS, getMessages, type Locale } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
  translate: (text: string) => Promise<string>;
  translateBatch: (texts: string[]) => Promise<string[]>;
  localeNames: typeof LOCALE_NAMES;
  localeFlags: typeof LOCALE_FLAGS;
  locales: typeof LOCALES;
}

// Module-level cache: survives re-renders, cleared on page reload
const trCache = new Map<string, string>(); // `${locale}:${text}` → translated

// Chrome AI Translator — on-device, no server call needed.
// Returns null when the browser doesn't support it or the language pair isn't ready.
type ChromeAI = {
  translator?: {
    capabilities(): Promise<{ languagePairAvailable(src: string, tgt: string): string }>;
    create(opts: { sourceLanguage: string; targetLanguage: string }): Promise<{
      translate(text: string): Promise<string>;
      destroy?: () => void;
    }>;
  };
};

async function chromeTranslateBatch(texts: string[], target: string): Promise<string[] | null> {
  try {
    const ai = (window as unknown as { ai?: ChromeAI }).ai;
    if (!ai?.translator) return null;

    const caps = await ai.translator.capabilities();
    const avail = caps.languagePairAvailable('th', target);
    if (avail === 'no') return null; // language pair not supported

    const translator = await ai.translator.create({ sourceLanguage: 'th', targetLanguage: target });
    const results = await Promise.all(texts.map(t => translator.translate(t)));
    translator.destroy?.();
    return results;
  } catch {
    return null;
  }
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

export default function LocaleProvider({ children, initialMessages }: Props) {
  // ล็อคภาษาไทยเป็นหลัก — เปิด i18n ได้ทีหลังโดยเอา locale hardcode ออก
  const locale: Locale = 'th';
  const [messages] = useState(initialMessages);
  const localeRef = useRef(locale);

  // no-op — ยังไม่เปิดใช้การเปลี่ยนภาษา
  const setLocale = useCallback((_newLocale: Locale) => {}, []);

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

  // Batch-translate an array of Thai strings to the current locale.
  // Results are cached in `trCache` — repeated calls for the same text are free.
  const translateBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    const loc = localeRef.current;
    if (loc === 'th' || texts.length === 0) return texts;

    const results = new Array<string>(texts.length);
    const uncached: { idx: number; text: string }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const hit = trCache.get(`${loc}:${texts[i]}`);
      if (hit !== undefined) {
        results[i] = hit;
      } else {
        uncached.push({ idx: i, text: texts[i] });
      }
    }

    if (uncached.length > 0) {
      const uncachedTexts = uncached.map((u) => u.text);
      let translations: string[] | null = null;

      // 1st choice: Chrome on-device AI (no server, no network)
      translations = await chromeTranslateBatch(uncachedTexts, loc);

      // 2nd choice: LibreTranslate server
      if (!translations) {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: uncachedTexts, source: 'th', target: loc }),
          });
          const data = (await res.json()) as { translatedText: string[] };
          translations = Array.isArray(data.translatedText) ? data.translatedText : null;
        } catch {
          // ignore, translations stays null
        }
      }

      for (let i = 0; i < uncached.length; i++) {
        const tr = translations?.[i] ?? uncached[i].text;
        results[uncached[i].idx] = tr;
        trCache.set(`${loc}:${uncached[i].text}`, tr);
      }
    }

    return results;
  }, []); // stable — reads locale via ref, no deps needed

  const translate = useCallback(
    async (text: string): Promise<string> => {
      const [result] = await translateBatch([text]);
      return result;
    },
    [translateBatch],
  );

  return (
    <LocaleContext.Provider value={{
      locale, setLocale, t,
      translate, translateBatch,
      localeNames: LOCALE_NAMES,
      localeFlags: LOCALE_FLAGS,
      locales: LOCALES,
    }}>
      {children}
    </LocaleContext.Provider>
  );
}
