const buckets = new Map<string, { count: number; resetAt: number }>();
const loginFailures = new Map<string, { count: number; lockedUntil: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

const VALID_IP = /^[\d.:a-fA-F]+$/;

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim() ?? '';
    if (VALID_IP.test(ip)) return ip;
  }
  const real = (req.headers.get('x-real-ip') ?? '').trim();
  if (VALID_IP.test(real)) return real;
  return 'unknown';
}

export function getLoginLockState(key: string) {
  const now = Date.now();
  const state = loginFailures.get(key);
  if (!state) return { locked: false, retryAfterMs: 0 };
  if (state.lockedUntil > now) {
    return { locked: true, retryAfterMs: state.lockedUntil - now };
  }
  return { locked: false, retryAfterMs: 0 };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const state = loginFailures.get(key) ?? { count: 0, lockedUntil: 0 };
  const nextCount = state.count + 1;
  if (nextCount >= 5) {
    loginFailures.set(key, { count: 0, lockedUntil: now + 15 * 60 * 1000 });
    return { lockedNow: true, retryAfterMs: 15 * 60 * 1000 };
  }
  loginFailures.set(key, { count: nextCount, lockedUntil: 0 });
  return { lockedNow: false, retryAfterMs: 0 };
}

export function clearLoginFailures(key: string) {
  loginFailures.delete(key);
}
