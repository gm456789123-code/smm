import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback_for_build_time', {
  apiVersion: '2026-05-27.dahlia',
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
