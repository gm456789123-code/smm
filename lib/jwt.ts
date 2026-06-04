import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}
if (rawSecret === 'change-this-to-a-random-secret-string') {
  console.warn('[SECURITY] JWT_SECRET is the default placeholder — change it before production!');
}
const SECRET = new TextEncoder().encode(rawSecret);

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
