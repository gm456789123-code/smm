import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { detectLocale, LOCALES, type Locale } from '@/lib/i18n';

const PROTECTED = [
  '/dashboard', '/order', '/orders', '/services',
  '/topup', '/balance', '/profile', '/admin',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // ── Locale detection ───────────────────────────────────
  if (!pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const cookieLocale = req.cookies.get('locale')?.value as Locale | undefined;
    const validLocale  = cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale);

    if (!validLocale) {
      const acceptLang = req.headers.get('accept-language') ?? 'th';
      const detected   = detectLocale(acceptLang);
      res.cookies.set('locale', detected, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
      });
    }
  }

  // ── Auth guard ─────────────────────────────────────────
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (!isProtected) return res;

  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  const user = await verifyToken(token);
  if (!user) {
    const redirect = NextResponse.redirect(new URL('/login', req.url));
    redirect.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return redirect;
  }

  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
