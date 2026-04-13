// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function — stripe-portal
// ═══════════════════════════════════════════════════════════════
// Returns a Stripe Customer Portal URL so users can update cards,
// download invoices, or cancel. Requires an existing customer ID
// in the `subscriptions` table (created by stripe-checkout).
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

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

  const { returnUrl } = (await req.json().catch(() => ({}))) as { returnUrl: string };

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) return json({ error: 'no customer on file' }, 404);

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: returnUrl,
  });

  return json({ url: portal.url });
});
