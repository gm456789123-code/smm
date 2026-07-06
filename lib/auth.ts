import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from '@/lib/jwt';

export { signToken, verifyToken } from '@/lib/jwt';
export type { JWTPayload } from '@/lib/jwt';

const AUTH_COOKIE_NAME = 'auth_token';
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getAuthCookieOptions(maxAge = AUTH_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', getAuthCookieOptions(0));
}

export async function getUserFromToken(token?: string | null): Promise<JWTPayload | null> {
  return token ? await verifyToken(token) : null;
}

export async function getRequestUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return getUserFromToken(token);
}

// cryptographically secure - returns hex string of (bytes * 2) chars
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateReferralCode(username: string): string {
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return username.substring(0, 4).toUpperCase() + suffix;
}