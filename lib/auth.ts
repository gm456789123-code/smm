import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export { signToken, verifyToken } from '@/lib/jwt';
export type { JWTPayload } from '@/lib/jwt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// cryptographically secure — returns hex string of (bytes * 2) chars
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateReferralCode(username: string): string {
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return username.substring(0, 4).toUpperCase() + suffix;
}
