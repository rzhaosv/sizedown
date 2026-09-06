/** Stripe Payment Links (live). client_reference_id carries the Supabase uid so the webhook can grant Pro. */
export const STRIPE_LINKS = {
  monthly: process.env.EXPO_PUBLIC_STRIPE_LINK_MONTHLY ?? 'https://buy.stripe.com/bJe4gygxk9bj49Jb2H3gk03',
  lifetime: process.env.EXPO_PUBLIC_STRIPE_LINK_LIFETIME ?? 'https://buy.stripe.com/4gM6oGch44V3fSr3Af3gk04',
};
export const SITE = 'https://tryforma.app/sizedown';
export const APP_URL = 'https://tryforma.app/sizedown/app/';
export const FREE_TRADES_PER_MONTH = 30;
export const FREE_EVALS = 1;
export const PRICES = { monthly: '$9.99', lifetime: '$79' };
