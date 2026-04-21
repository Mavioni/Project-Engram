// Provider-neutral AI client facade.
// Today the hosted path still calls the Supabase `claude-insight`
// edge function. The rest of the app consumes normalized AI results
// so a future local provider can land without rewriting UI code.

import { getSupabase } from './supabase.js';
import {
  AI_PROVIDERS,
  fallbackChatMessage,
  fallbackInsight,
  normalizeAiResponse,
} from './ai-provider.js';

const HOSTED_EDGE_FUNCTION = 'claude-insight';

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
 * Ask the configured AI provider for an insight.
 *
 * Current implementation:
 * - hosted provider: Supabase Edge Function (`claude-insight`)
 * - fallback provider: deterministic local copy when Supabase is absent
 *
 * Returns { content, model, provider, cached }.
 */
export async function requestInsight({ kind, windowDays = 7, context = {} }) {
  const supabase = getSupabase();
  if (!supabase) {
    return normalizeAiResponse(null, {
      content: fallbackInsight(kind),
      model: AI_PROVIDERS.FALLBACK,
      provider: AI_PROVIDERS.FALLBACK,
    });
  }
  const { data, error } = await supabase.functions.invoke(HOSTED_EDGE_FUNCTION, {
    body: { kind, windowDays, context },
  });
  if (error) throw error;
  return normalizeAiResponse(data, {
    model: MODELS.insight,
    provider: AI_PROVIDERS.HOSTED,
  });
}

/**
 * Chat with your IRIS through the configured AI provider.
 * Each response is normalized so Chat does not care whether the
 * provider is hosted, local, or fallback.
 */
export async function sendChatMessage({ threadId, history, message, irisContext }) {
  const supabase = getSupabase();
  if (!supabase) {
    return normalizeAiResponse(null, {
      content: fallbackChatMessage(),
      model: AI_PROVIDERS.FALLBACK,
      provider: AI_PROVIDERS.FALLBACK,
    });
  }
  const { data, error } = await supabase.functions.invoke(HOSTED_EDGE_FUNCTION, {
    body: {
      kind: INSIGHT_KINDS.CHAT,
      threadId,
      history,
      message,
      irisContext,
    },
  });
  if (error) throw error;
  return normalizeAiResponse(data, {
    model: MODELS.chat,
    provider: AI_PROVIDERS.HOSTED,
  });
}
