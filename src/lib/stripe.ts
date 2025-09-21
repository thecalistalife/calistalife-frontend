// Stripe integration placeholder
// This would load Stripe.js when Stripe packages are compatible with React 19

export const stripePromise = Promise.resolve(null);

export const isStripeEnabled = () => {
  return !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;
};
