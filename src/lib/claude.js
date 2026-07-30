// ─────────────────────────────────────────────────────────────
// claude.js — In-browser AI client facade.
// ─────────────────────────────────────────────────────────────
// Priority chain: browser model → fallback.
// The app runs fully in the browser — no server, no API key.
// The model loads via transformers.js (ONNX + WASM) on first use
// and caches in IndexedDB for instant reload.
//
// Model: SmolLM2-135M-Instruct (~80 MB, 8-bit quantized ONNX)
// Upgrade: swap MODEL_ID in browser-ai.js for larger models.
// ─────────────────────────────────────────────────────────────

import {
  AI_PROVIDERS,
  fallbackChatMessage,
  fallbackInsight,
  normalizeAiResponse,
} from './ai-provider.js';
import {
  generateResponse,
  buildChatPrompt,
  buildIrisPrompt,
} from './browser-ai.js';

export const MODELS = {
  local: 'SmolLM2-135M-Instruct',
};

/**
 * Ask the in-browser model for an insight.
 * Tries browser model first, falls back to deterministic local text.
 */
export async function requestInsight({ kind, windowDays = 7, context = {} }) {
  try {
    const systemPrompt = 'You are IRIS, a personality insight engine. Write a concise, warm reflection.';
    const prompt = buildChatPrompt({
      systemPrompt,
      messages: [{ role: 'user', content: insightPrompt(kind, windowDays, context) }],
    });
    const content = await generateResponse(prompt, { maxTokens: 200, temperature: 0.7 });
    if (content) {
      return normalizeAiResponse({ content }, { model: MODELS.local, provider: AI_PROVIDERS.LOCAL });
    }
  } catch (e) {
    console.warn('Browser AI insight failed:', e.message);
  }

  return normalizeAiResponse(null, {
    content: fallbackInsight(kind),
    model: AI_PROVIDERS.FALLBACK,
    provider: AI_PROVIDERS.FALLBACK,
  });
}

/**
 * Chat with IRIS through the in-browser model.
 */
export async function sendChatMessage({ history, message, irisContext }) {
  try {
    const systemPrompt = buildIrisPrompt({
      iris: irisContext,
      entries: irisContext?.entries || [],
    });
    const prompt = buildChatPrompt({
      systemPrompt,
      messages: history || [{ role: 'user', content: message }],
    });
    const content = await generateResponse(prompt, { maxTokens: 256, temperature: 0.7 });
    if (content) {
      return normalizeAiResponse({ content }, { model: MODELS.local, provider: AI_PROVIDERS.LOCAL });
    }
  } catch (e) {
    console.warn('Browser AI chat failed:', e.message);
  }

  return normalizeAiResponse(null, {
    content: fallbackChatMessage(),
    model: AI_PROVIDERS.FALLBACK,
    provider: AI_PROVIDERS.FALLBACK,
  });
}

function insightPrompt(kind, windowDays, context) {
  const windowLabel = kind === 'daily' ? 'today' : `the last ${windowDays} days`;
  return `Write a ${kind} reflection for ${windowLabel}. Context: ${JSON.stringify(context).slice(0, 500)}`;
}
