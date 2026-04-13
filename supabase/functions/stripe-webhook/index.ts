// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function — stripe-webhook
// ═══════════════════════════════════════════════════════════════
// Stripe → Supabase. Mirrors subscription state onto the
// `subscriptions` table so the app can gate Pro features.
//
// Deploy WITHOUT JWT verification, since Stripe won't send one:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// Register the endpoint in the Stripe dashboard:
//   https://<project>.supabase.co/functions/v1/stripe-webhook
//
// Events handled:
//   checkout.session.completed
//   customer.subscription.created | updated | deleted
//   invoice.paid | invoice.payment_failed
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Stripe from 'https://esm.sh/stripe@16.12.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, whSecret);
  } catch (e) {
    return new Response(`bad signature: ${(e as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          (session.metadata?.supabase_user_id as string) || (session.client_reference_id as string);
        if (userId && typeof session.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await upsertSub(userId, sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.supabase_user_id as string) || await resolveUserIdFromCustomer(sub.customer as string);
        if (userId) await upsertSub(userId, sub);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (typeof invoice.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId =
            (sub.metadata?.supabase_user_id as string) ||
            (await resolveUserIdFromCustomer(sub.customer as string));
          if (userId) await upsertSub(userId, sub);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (typeof invoice.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId =
            (sub.metadata?.supabase_user_id as string) ||
            (await resolveUserIdFromCustomer(sub.customer as string));
          if (userId) {
            await supabase
              .from('subscriptions')
              .update({ status: 'past_due', updated_at: new Date().toISOString() })
              .eq('user_id', userId);
          }
        }
        break;
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response('handler error', { status: 500 });
  }
});

async function resolveUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function upsertSub(userId: string, sub: Stripe.Subscription) {
  const active =
    sub.status === 'active' || sub.status === 'trialing';
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      tier: active ? 'pro' : 'free',
      status: sub.status,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}
