const FALLBACK_SITE_URL = 'https://aura-smm.com';

function normalizeSiteUrl(value?: string | null): string {
  const raw = value?.trim();
  if (!raw) return FALLBACK_SITE_URL;

  try {
    const url = new URL(raw);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
export const SITE_NAME = 'AURA SMM';
export const SITE_TITLE = 'AURA SMM Panel';
export const SITE_DESCRIPTION =
  'High-quality SMM panel for followers, likes, views, and fast top-ups across major platforms.';
export const SITE_OG_IMAGE = `${SITE_URL}/icon.png`;
export const SITE_ICON = `${SITE_URL}/icon.png`;
