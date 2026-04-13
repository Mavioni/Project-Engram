// ─────────────────────────────────────────────────────────────
// Claude client — browser-side proxy to the Anthropic API.
// ─────────────────────────────────────────────────────────────
// The API key never leaves the server. This module talks to a
// Supabase Edge Function (`claude-insight`) that holds the real
// secret and enforces rate limits + subscription gating.
//
// If Supabase isn't configured, the functions here return a
// graceful fallback so the UI still renders something useful.
// ─────────────────────────────────────────────────────────────

import { getSupabase } from './supabase.js';

export const MODELS = {
  insight: 'claude-sonnet-4-6',
  chat: 'claude-sonnet-4-6',
};

export const INSIGHT_KINDS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CHAT: 'chat',
};

/**
 * Ask the edge function for an insight. The function pulls the
 * user's IRIS scores + recent entries from Postgres (RLS ensures
 * only their own rows) and composes a grounded prompt for Claude.
 *
 * Returns { content, model, cached } or throws.
 */
export async function requestInsight({ kind, windowDays = 7, context = {} }) {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      content: fallbackInsight(kind),
      model: 'fallback',
      cached: false,
    };
  }
  const { data, error } = await supabase.functions.invoke('claude-insight', {
    body: { kind, windowDays, context },
  });
  if (error) throw error;
  return data;
}

/**
 * Chat with your IRIS. Streams back tokens via the edge function.
 * Each message is appended to an in-memory thread; the outer store
 * persists the thread to localStorage.
 */
export async function sendChatMessage({ threadId, history, message, irisContext }) {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      content:
        "I can't reach Claude without a backend configured. Add your Supabase project + Anthropic key to .env, deploy the `claude-insight` edge function, and try again. In the meantime, your journal is still saved locally.",
      model: 'fallback',
    };
  }
  const { data, error } = await supabase.functions.invoke('claude-insight', {
    body: {
      kind: INSIGHT_KINDS.CHAT,
      threadId,
      history,
      message,
      irisContext,
    },
  });
  if (error) throw error;
  return data;
}

// ─── Local fallbacks so the UI never shows a raw error ──────
function fallbackInsight(kind) {
  const base =
    'Engram needs a configured backend (Supabase + Anthropic) to generate live Claude insights. ';
  if (kind === INSIGHT_KINDS.DAILY) {
    return (
      base +
      "Meanwhile: glance at today's entry. Whatever showed up — mood, activity, a line of text — is the data. Trust what you wrote."
    );
  }
  if (kind === INSIGHT_KINDS.WEEKLY) {
    return (
      base +
      'Meanwhile: look at the last 7 days side-by-side. Which day stands out? That contrast is where your signal lives.'
    );
  }
  if (kind === INSIGHT_KINDS.MONTHLY) {
    return (
      base +
      'Meanwhile: scroll the calendar. Color yourself a map of the month. What season were you in?'
    );
  }
  return (
    base +
    "Once configured, I'll read your IRIS scores and recent entries and write something only your data could produce."
  );
}
