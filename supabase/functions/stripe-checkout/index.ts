// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function — stripe-checkout
// ═══════════════════════════════════════════════════════════════
// Creates a Stripe Checkout Session for the authenticated user
// and returns the URL to redirect to. Upserts a stub subscription
// row on the user so the webhook has something to patch.
//
// Deploy:
//   supabase functions deploy stripe-checkout
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY not set' }, 500);
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'missing auth' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return json({ error: 'invalid session' }, 401);

  const { priceId, successUrl, cancelUrl } =
    (await req.json().catch(() => ({}))) as {
      priceId: string;
      successUrl: string;
      cancelUrl: string;
    };
  if (!priceId) return json({ error: 'priceId required' }, 400);

  // Reuse or create a Stripe customer for this user.
  let { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.user.id)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.user.email ?? undefined,
      metadata: { supabase_user_id: user.user.id },
    });
    customerId = customer.id;
    await supabase.from('subscriptions').upsert(
      {
        user_id: user.user.id,
        tier: 'free',
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    client_reference_id: user.user.id,
    metadata: { supabase_user_id: user.user.id },
  });

  return json({ url: session.url });
});
