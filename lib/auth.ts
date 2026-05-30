import bcrypt from 'bcryptjs';

export { signToken, verifyToken } from '@/lib/jwt';
export type { JWTPayload } from '@/lib/jwt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function generateReferralCode(username: string): string {
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return username.substring(0, 4).toUpperCase() + suffix;
}
