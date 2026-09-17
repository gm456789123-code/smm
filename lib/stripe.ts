import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

const stripe = new Stripe(apiKey, {
  apiVersion: '2026-05-27.dahlia' as any,
  typescript: true,
});

export default stripe;

export const TOPUP_AMOUNTS = [
  { thb: 100,  usd: 3 },
  { thb: 300,  usd: 9 },
  { thb: 500,  usd: 14 },
  { thb: 1000, usd: 28 },
  { thb: 2000, usd: 55 },
  { thb: 5000, usd: 138 },
];
