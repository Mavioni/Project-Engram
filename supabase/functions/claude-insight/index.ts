// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function — claude-insight
// ═══════════════════════════════════════════════════════════════
// Server-side proxy to the Anthropic API.
//   - Reads the user's IRIS snapshot + recent entries from Postgres
//     (RLS-bypassed via service role, filtered by auth.uid())
//   - Enforces the free-tier AI credit cap (3 / month)
//   - Calls Claude with a grounded, tone-matched system prompt
//   - Persists the result to `insights` and returns it
//
// Deploy:
//   supabase functions deploy claude-insight --no-verify-jwt=false
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-6
//
// Invoke from the client:
//   supabase.functions.invoke('claude-insight', { body: { kind, windowDays } })
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6';
const FREE_MONTHLY_CREDITS = 3;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
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

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not set' }, 500);

  // Verify the user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'missing auth' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return json({ error: 'invalid session' }, 401);
  const userId = auth.user.id;

  const { kind, windowDays = 7, message, history, irisContext } =
    (await req.json().catch(() => ({}))) as {
      kind: 'daily' | 'weekly' | 'monthly' | 'chat';
      windowDays?: number;
      message?: string;
      history?: Array<{ role: string; content: string }>;
      irisContext?: Record<string, unknown>;
    };

  // ── Credit check (free tier: 3 insights/month) ──
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const isPro = sub?.tier === 'pro' && sub?.status === 'active';
  if (!isPro) {
    const credits = sub?.ai_credits_used ?? 0;
    if (credits >= FREE_MONTHLY_CREDITS) {
      return json(
        { error: 'credit_exhausted', message: 'Upgrade to continue.' },
        402,
      );
    }
  }

  // ── Load IRIS snapshot + recent entries ──
  const { data: iris } = await supabase
    .from('iris_snapshots')
    .select('facet_scores, enneagram_type, enneagram_scores, taken_at')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const since = new Date();
  since.setDate(since.getDate() - windowDays);
  const { data: entries } = await supabase
    .from('entries_with_notes')
    .select('day, mood, activities, notes, metadata')
    .eq('user_id', userId)
    .gte('day', since.toISOString().slice(0, 10))
    .order('day', { ascending: true });

  const system = buildSystemPrompt({ iris: iris ?? irisContext, kind });
  const userMessage = buildUserMessage({ kind, entries: entries ?? [], message, history });

  const anthropicRes = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: kind === 'chat' ? 1024 : 700,
      system,
      messages: kind === 'chat' && history
        ? history.map((m) => ({ role: m.role, content: m.content }))
        : [{ role: 'user', content: userMessage }],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return json({ error: 'anthropic_error', detail: errText }, 502);
  }
  const payload = await anthropicRes.json();
  const content: string =
    payload?.content?.[0]?.text ?? '(no response)';

  // ── Persist + decrement credits ──
  await supabase.from('insights').insert({
    user_id: userId,
    kind,
    content,
    model: DEFAULT_MODEL,
    window_days: windowDays,
  });

  if (!isPro) {
    await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          tier: 'free',
          ai_credits_used: (sub?.ai_credits_used ?? 0) + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
  }

  return json({ content, model: DEFAULT_MODEL, cached: false });
});

// ─────────────────────────────────────────────────────────────
// Prompt construction
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt({ iris, kind }: { iris: any; kind: string }) {
  const facetLine = iris?.facet_scores
    ? Object.entries(iris.facet_scores)
        .map(([k, v]) => `${k}:${Math.round((v as number) * 100)}`)
        .join(' ')
    : '(unknown)';
  return `You are Engram's resident insight engine, writing to a single user whose
24-facet IRIS profile you know intimately. You never flatter, never psychoanalyze
in jargon, and never mention that you are an AI. You write like a careful friend
who has been watching quietly.

Format rules:
  - Second person, present tense.
  - 2–3 short paragraphs (120–220 words).
  - One concrete observation from the data, then one gentle-but-sharp invitation.
  - Never say "I notice" or "it seems" — state.
  - No bulleted lists. No headings. No apologies. No disclaimers.

Voice calibration:
  IRIS Enneagram type: ${iris?.enneagram_type ?? 'unknown'}
  Facet vector: ${facetLine}

Kind: ${kind}
`;
}

function buildUserMessage({
  kind,
  entries,
  message,
  history,
}: {
  kind: string;
  entries: Array<{ day: string; mood: number; activities: string[]; notes: any[] }>;
  message?: string;
  history?: Array<{ role: string; content: string }>;
}) {
  if (kind === 'chat' && message) return message;

  const compact = entries
    .map((e) => {
      const notes = (e.notes ?? [])
        .map((n: any) => `  - [${n.kind}] ${n.text}`)
        .join('\n');
      return `${e.day} · mood ${Math.round(e.mood * 100)} · ${(e.activities ?? []).join(', ')}${
        notes ? '\n' + notes : ''
      }`;
    })
    .join('\n');

  const window =
    kind === 'daily'
      ? 'the last 24 hours'
      : kind === 'weekly'
        ? 'the last 7 days'
        : 'the last month';

  return `Here is the user's cataloged data for ${window}:\n\n${compact || '(no entries)'}\n\nWrite ${kind === 'daily' ? 'a daily insight' : kind === 'weekly' ? 'a weekly synthesis' : 'a monthly review'} per the rules.`;
}
