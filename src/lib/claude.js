// ─────────────────────────────────────────────────────────────
// claude.js — In-browser AI client via llama.cpp WASM.
// ─────────────────────────────────────────────────────────────
// Uses @wllama/wllama (llama.cpp WebAssembly) with Q2_K GGUF.
// All inference runs in a Web Worker. No server. No API key.
// ─────────────────────────────────────────────────────────────

import {
  AI_PROVIDERS,
  fallbackChatMessage,
  fallbackInsight,
  normalizeAiResponse,
} from './ai-provider.js';
import {
  generateResponse,
  buildIrisPrompt,
} from './browser-ai.js';

export const MODELS = {
  local: 'SmolLM2-135M-Instruct (Q2_K)',
};

export async function requestInsight({ kind, windowDays = 7, context = {} }) {
  try {
    const content = await generateResponse([
      { role: 'system', content: 'You are IRIS, a personality insight engine. Write a concise, warm reflection.' },
      { role: 'user', content: `Write a ${kind} reflection for the last ${windowDays} days. Context: ${JSON.stringify(context).slice(0, 500)}` },
    ], { maxTokens: 200, temperature: 0.7 });
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

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
    ];
    // Ensure the last user message is included if not in history
    if (!messages.some((m) => m.role === 'user' && m.content === message)) {
      messages.push({ role: 'user', content: message });
    }

    const content = await generateResponse(messages, { maxTokens: 256, temperature: 0.7 });
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
