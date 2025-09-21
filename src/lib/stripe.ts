import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublishableKey) {
  console.warn('VITE_STRIPE_PUBLIC_KEY not found in environment variables');
}

export const stripePromise: Promise<Stripe | null> = loadStripe(stripePublishableKey || '');