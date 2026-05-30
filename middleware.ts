import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const PROTECTED = [
  '/dashboard', '/order', '/orders', '/services',
  '/topup', '/balance', '/profile', '/admin',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  const user = await verifyToken(token);
  if (!user) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return res;
  }

  // /admin/* — ต้องเป็น admin เท่านั้น
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
