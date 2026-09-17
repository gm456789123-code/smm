import { SignJWT, jwtVerify } from 'jose';

function getSecret(): Uint8Array {
  const rawSecret = process.env.JWT_SECRET;
  if (!rawSecret || rawSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  return new TextEncoder().encode(rawSecret);
}

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
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
      requiredClaims: ['exp', 'iat'],
    });
    if (
      typeof payload.userId !== 'number' || !Number.isSafeInteger(payload.userId) || payload.userId <= 0 ||
      typeof payload.username !== 'string' || !payload.username.trim() ||
      typeof payload.email !== 'string' || !payload.email.trim() ||
      (payload.role !== 'user' && payload.role !== 'admin') ||
      typeof payload.emailVerified !== 'boolean'
    ) return null;
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
