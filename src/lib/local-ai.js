// ─────────────────────────────────────────────────────────────
// local-ai.js — Local LLM provider (OpenAI-compatible API).
// ─────────────────────────────────────────────────────────────
// Engram ships with support for any local inference server that
// speaks the OpenAI /v1/chat/completions protocol. This includes:
//
//   llama.cpp server   `llama-server -m model.gguf`
//   Ollama             `ollama serve` (openai compat mode)
//   bitnet.cpp          via a thin HTTP wrapper
//   vLLM / TGI          any self-hosted inference server
//
// To activate: set VITE_LOCAL_AI_URL in .env (defaults to
// http://localhost:8080/v1). When the local server responds to
// GET /v1/models, all chat + insight requests route through it
// instead of Supabase.
//
// MODEL RECOMMENDATION (BitNet-compatible, runs on CPU):
//   Use a heavily quantized GGUF model via llama.cpp server:
//     llama-server -m models/llama-3.2-1b-instruct-Q2_K.gguf
//   Or use Microsoft bitnet.cpp for true 1.58-bit inference:
//     https://github.com/microsoft/BitNet
//
// Pure functions. No side effects until actually called.
// ─────────────────────────────────────────────────────────────

const LOCAL_URL = import.meta.env.VITE_LOCAL_AI_URL || 'http://localhost:11434/v1';
const LOCAL_MODEL = import.meta.env.VITE_LOCAL_AI_MODEL || 'local-model';
const REQUEST_TIMEOUT_MS = 60_000;

let healthCache = null;
let healthCacheAt = 0;
const HEALTH_CACHE_MS = 30_000;

/**
 * Quick health check: is the local server reachable?
 * Cached for 30 seconds to avoid hammering localhost on every render.
 *
 * Only attempts the check when running on localhost — a deployed site
 * on github.io can't reach your machine and the HTTPS→HTTP fetch
 * would be blocked by CORS + mixed content policy.
 */
export async function isLocalAvailable() {
  // Skip entirely on non-localhost origins — can't reach a local server
  // from a deployed domain and the blocked request spams the console.
  if (!window.location.hostname.match(/^(localhost|127\.0\.0\.1|\[::1])$/)) {
    return false;
  }

  const now = Date.now();
  if (healthCache !== null && now - healthCacheAt < HEALTH_CACHE_MS) {
    return healthCache;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${LOCAL_URL}/models`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    healthCache = res.ok;
  } catch {
    healthCache = false;
  }
  healthCacheAt = now;
  return healthCache;
}

/**
 * Send a chat completion request to the local model.
 *
 * @param {object} params
 * @param {Array<{role: string, content: string}>} params.messages
 * @param {string} [params.systemPrompt] — injected as a system message
 * @param {number} [params.temperature=0.7]
 * @param {number} [params.maxTokens=600]
 * @returns {Promise<{content: string, model: string, provider: string}>}
 */
export async function localChatCompletion({
  messages,
  systemPrompt,
  temperature = 0.7,
  maxTokens = 600,
}) {
  const body = {
    model: LOCAL_MODEL,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ],
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${LOCAL_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Local server returned ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '';

    return {
      content: content.trim(),
      model: json.model || LOCAL_MODEL,
      provider: 'local',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build an IRIS-aware system prompt for the chat interface.
 * Injects the user's enneagram type, facet scores, and recent
 * journal entries so the local model can write in context.
 */
export function buildIrisSystemPrompt({ iris, entries }) {
  const type = iris?.enneagramType;
  const scores = iris?.enneagramScores;
  const facets = iris?.facetScores;
  const recentEntries = (entries || []).slice(0, 5);

  const parts = [
    'You are IRIS, an integrative personality companion for the Engram app.',
    'You speak with warmth, precision, and psychological depth.',
    'Your role is to help the user understand themselves — not to diagnose, not to therapise, not to judge.',
    '',
  ];

  if (type) {
    parts.push(`The user's Enneagram type is ${type}.`);
  }
  if (scores) {
    const top = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t, s]) => `Type ${t} (${Math.round(s * 100)}%)`)
      .join(', ');
    parts.push(`Top type resonances: ${top}.`);
  }
  if (facets) {
    const highest = Object.entries(facets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([f]) => f)
      .join(', ');
    const lowest = Object.entries(facets)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([f]) => f)
      .join(', ');
    parts.push(`Strongest facets: ${highest}. Growth edges: ${lowest}.`);
  }
  if (recentEntries.length > 0) {
    parts.push('Recent journal entries:');
    for (const e of recentEntries) {
      const notes = (e.notes || []).map((n) => n.text).filter(Boolean).join('; ');
      if (notes) parts.push(`- ${e.day}: ${notes}`);
    }
  }

  parts.push('');
  parts.push('Respond concisely (3-5 sentences). Be specific to their profile. If they ask something outside the domain of personality, gently steer back.');

  return parts.join('\n');
}
