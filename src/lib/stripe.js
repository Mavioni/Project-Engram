// ─────────────────────────────────────────────────────────────
// Stripe helpers — opens Checkout/Portal via Supabase Edge Fns.
// ─────────────────────────────────────────────────────────────
// We never touch a Stripe server key in the browser. Instead we
// call two edge functions:
//   - stripe-checkout  → creates a Checkout Session, returns URL
//   - stripe-portal    → creates a Customer Portal session URL
// Both live under supabase/functions/ and are committed to this repo.
// ─────────────────────────────────────────────────────────────

import { getSupabase } from './supabase.js';

export function hasStripe() {
  return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
}

export const PRICE_IDS = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || null,
  yearly: import.meta.env.VITE_STRIPE_PRICE_YEARLY || null,
};

/**
 * Launch Stripe Checkout for a given plan. Redirects away from
 * the SPA to the hosted Checkout page; Stripe sends the user
 * back via success_url / cancel_url configured in the function.
 */
export async function startCheckout(plan = 'monthly') {
  const priceId = PRICE_IDS[plan];
  if (!priceId) throw new Error(`No price ID for plan "${plan}"`);
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase backend required for checkout');
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      priceId,
      successUrl: window.location.origin + '/you?checkout=success',
      cancelUrl: window.location.origin + '/you?checkout=cancel',
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Stripe returned no URL');
  window.location.href = data.url;
}

/**
 * Open the Stripe Customer Portal so users can cancel/upgrade.
 */
export async function openBillingPortal() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase backend required');
  const { data, error } = await supabase.functions.invoke('stripe-portal', {
    body: { returnUrl: window.location.origin + '/you' },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Stripe portal returned no URL');
  window.location.href = data.url;
}
