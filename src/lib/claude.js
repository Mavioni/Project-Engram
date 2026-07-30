// ─────────────────────────────────────────────────────────────
// claude.js — In-browser AI client via llama.cpp WASM.
// ─────────────────────────────────────────────────────────────
// Uses @wllama/wllama (WebAssembly port of llama.cpp) with a
// Q2_K quantized GGUF model — near-1-bit, same principle as
// Microsoft BitNet. The model downloads once (~50 MB) and caches
// in IndexedDB. All inference runs in a Web Worker.
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
  local: 'SmolLM2-135M-Instruct (Q2_K)',
};

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
