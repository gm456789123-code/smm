const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'u',
  'ul',
]);

const SELF_CLOSING_TAGS = new Set(['br', 'hr', 'img']);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

export function sanitizeUrl(input: unknown, mode: 'link' | 'image' = 'link'): string | null {
  if (typeof input !== 'string') return null;

  const value = input.trim();
  if (!value) return null;

  if (value.startsWith('/')) {
    return value.replace(/[\u0000-\u001f\u007f\s]+/g, '');
  }

  try {
    const url = new URL(value);
    const protocol = url.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return null;
    return url.toString();
  } catch {
    if (mode === 'image' && value.startsWith('data:image/')) {
      return value.replace(/[\u0000-\u001f\u007f\s]+/g, '');
    }
    return null;
  }
}

function sanitizeAttributes(tagName: string, rawAttributes: string): string {
  const attrs: string[] = [];
  const attrRegex = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

  for (const match of rawAttributes.matchAll(attrRegex)) {
    const name = match[1].toLowerCase();
    const value = decodeHtml(match[3] ?? match[4] ?? match[5] ?? '');

    if (!value || name.startsWith('on')) continue;

    if (tagName === 'a') {
      if (name === 'href') {
        const safeHref = sanitizeUrl(value, 'link');
        if (!safeHref) continue;
        attrs.push(`href="${escapeHtml(safeHref)}"`);
        if (/^https?:\/\//i.test(safeHref)) {
          attrs.push('target="_blank"');
          attrs.push('rel="nofollow noopener noreferrer"');
        }
      }
      continue;
    }

    if (tagName === 'img') {
      if (name === 'src') {
        const safeSrc = sanitizeUrl(value, 'image');
        if (!safeSrc) continue;
        attrs.push(`src="${escapeHtml(safeSrc)}"`);
        continue;
      }

      if (name === 'alt' || name === 'title') {
        attrs.push(`${name}="${escapeHtml(value)}"`);
        continue;
      }

      if ((name === 'width' || name === 'height') && /^\d{1,4}$/.test(value)) {
        attrs.push(`${name}="${value}"`);
      }
    }
  }

  return attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
}

export function sanitizeHtml(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) return '';

  const stripped = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<(object|embed|form|input|button|textarea|select|svg|math)[\s\S]*?>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  return stripped.replace(/<\/?([A-Za-z0-9]+)([^>]*)>/g, (match, rawTagName, rawAttributes) => {
    const tagName = String(rawTagName).toLowerCase();
    const isClosing = match.startsWith('</');

    if (!ALLOWED_TAGS.has(tagName)) return '';
    if (isClosing) return SELF_CLOSING_TAGS.has(tagName) ? '' : `</${tagName}>`;

    const attrs = sanitizeAttributes(tagName, String(rawAttributes ?? ''));
    return SELF_CLOSING_TAGS.has(tagName) ? `<${tagName}${attrs} />` : `<${tagName}${attrs}>`;
  });
}

