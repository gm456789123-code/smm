import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SignJWT } from 'jose';
import { signToken, verifyToken } from '../lib/jwt.ts';

process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters';
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const user = { userId: 1, username: 'tester', email: 'test@example.com', role: 'user', emailVerified: true };

test('valid existing sessions still verify', async () => {
  const verified = await verifyToken(await signToken(user));
  assert.equal(verified?.userId, user.userId);
  assert.equal(verified?.role, 'user');
});

test('rejects signed tokens with malformed authorization claims', async () => {
  for (const change of [{ userId: '1' }, { userId: -1 }, { role: 'owner' }, { emailVerified: 'false' }, { username: null }]) {
    const token = await new SignJWT({ ...user, ...change }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(secret);
    assert.equal(await verifyToken(token), null);
  }
});

test('rejects tokens without expiry and unexpected signing algorithms', async () => {
  const noExpiry = await new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().sign(secret);
  assert.equal(await verifyToken(noExpiry), null);
  const otherAlgorithm = await new SignJWT(user).setProtectedHeader({ alg: 'HS384' }).setIssuedAt().setExpirationTime('1h').sign(secret);
  assert.equal(await verifyToken(otherAlgorithm), null);
});

test('rejects expired and tampered sessions', async () => {
  const expired = await new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1 second ago').sign(secret);
  assert.equal(await verifyToken(expired), null);
  const token = await signToken(user);
  const [header, payload, signature] = token.split('.');
  const altered = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), role: 'admin' })).toString('base64url');
  assert.equal(await verifyToken(`${header}.${altered}.${signature}`), null);
});
