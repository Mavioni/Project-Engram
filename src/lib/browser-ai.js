// ─────────────────────────────────────────────────────────────
// browser-ai.js — In-browser LLM inference via transformers.js.
// ─────────────────────────────────────────────────────────────
// No server. No API key. The model loads directly in the browser
// using ONNX Runtime Web (WebAssembly). First load downloads the
// model weights from HuggingFace CDN (~80-130 MB); subsequent
// loads use IndexedDB cache. The service worker also caches the
// weights so the app works offline after the first visit.
//
// Powered by HuggingFace transformers.js v3, which runs ONNX
// models via ort-web (WASM backend). This is the same stack
// behind the HuggingFace web demo pages — battle-tested.
//
// MODEL: Xenova/TinyLlama-1.1B-Chat-v1.0 (transformers.js compatible)
//   Size: ~400 MB (ONNX, split into shards, cached in IndexedDB)
//   Quality: Decent chat — Llama-architecture, instruction-tuned
//   Speed:  ~10-20 tokens/sec on WASM, ~30-50 with WebGPU
//
// TINIER OPTION: 'Xenova/gpt2' (~250MB, much dumber but instant)
import { pipeline } from '@huggingface/transformers';

// ── Model config ────────────────────────────────────────────
// Swap MODEL_ID to change models. Same interface throughout.
const MODEL_ID = 'Xenova/TinyLlama-1.1B-Chat-v1.0';

// ── Pipeline singleton ──────────────────────────────────────
let generator = null;
let loadPromise = null;
let loadState = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'
let loadError = null;
let loadProgress = 0; // 0-100

/** Callbacks for UI progress updates. */
const listeners = new Set();

export function onLoadChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn({ state: loadState, progress: loadProgress, error: loadError });
}

/**
 * Load the model. Safe to call multiple times — returns the
 * existing pipeline if already loaded or in progress.
 */
export async function loadModel() {
  if (generator) return generator;
  if (loadPromise) return loadPromise;

  loadState = 'loading';
  loadProgress = 0;
  loadError = null;
  notify();

  loadPromise = (async () => {
    try {
      // transformers.js auto-downloads the ONNX model from HuggingFace
      // and caches it in IndexedDB. Subsequent calls use the cache.
      generator = await pipeline('text-generation', MODEL_ID, {
        // WebGPU gives 2-4x speedup where supported. Falls back to WASM.
        device: 'webgpu',
        dtype: 'q8', // 8-bit quantized — similar principle to BitNet
        progress_callback: (info) => {
          if (info.status === 'progress' && info.progress) {
            loadProgress = Math.round(info.progress);
            notify();
          }
        },
      });

      loadState = 'ready';
      loadProgress = 100;
      notify();
      return generator;
    } catch (e) {
      // WebGPU might not be available. Retry with WASM fallback.
      console.warn('WebGPU load failed, falling back to WASM:', e.message);
      try {
        generator = await pipeline('text-generation', MODEL_ID, {
          device: 'wasm',
          dtype: 'q8',
          progress_callback: (info) => {
            if (info.status === 'progress' && info.progress) {
              loadProgress = Math.round(info.progress);
              notify();
            }
          },
        });
        loadState = 'ready';
        loadProgress = 100;
        notify();
        return generator;
      } catch (e2) {
        loadState = 'error';
        loadError = e2.message;
        notify();
        throw e2;
      }
    }
  })();

  return loadPromise;
}

/**
 * Check if the model is loaded and ready.
 */
export function isModelReady() {
  return loadState === 'ready' && generator !== null;
}

/**
 * Get current load state for UI rendering.
 */
export function getLoadState() {
  return { state: loadState, progress: loadProgress, error: loadError };
}

/**
 * Generate a response from the in-browser model.
 *
 * @param {string} prompt — the full prompt including system + history + user message
 * @param {object} [opts]
 * @param {number} [opts.maxTokens=256]
 * @param {number} [opts.temperature=0.7]
 * @returns {Promise<string>}
 */
export async function generateResponse(prompt, opts = {}) {
  const pipe = await loadModel();
  const { maxTokens = 256, temperature = 0.7 } = opts;

  const result = await pipe(prompt, {
    max_new_tokens: maxTokens,
    temperature,
    do_sample: temperature > 0,
    top_p: 0.9,
    repetition_penalty: 1.1,
  });

  // transformers.js returns: [{ generated_text: '...' }]
  const fullText = result[0]?.generated_text || '';
  // Strip the prompt to return only the model's response
  const response = fullText.slice(prompt.length).trim();
  return response;
}

/**
 * Build a chat prompt for TinyLlama (uses Llama 2 chat format).
 */
export function buildChatPrompt({ systemPrompt, messages }) {
  const parts = [];

  if (systemPrompt) {
    parts.push(`<|system|>\n${systemPrompt}</s>`);
  }

  for (const msg of messages || []) {
    const role = msg.role === 'user' ? 'user' : 'assistant';
    parts.push(`<|${role}|>\n${msg.content}</s>`);
  }

  parts.push('<|assistant|>\n');
  return parts.join('\n');
}

/**
 * Build an IRIS-aware system prompt for the in-browser model.
 * Keeps it concise — small models work better with focused prompts.
 */
export function buildIrisPrompt({ iris, entries }) {
  const type = iris?.enneagramType;
  const topScores = iris?.enneagramScores
    ? Object.entries(iris.enneagramScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t, s]) => `Type ${t} (${Math.round(s * 100)}%)`)
        .join(', ')
    : '';

  const recentEntry = entries?.[0];
  const recentNote = recentEntry?.notes?.map((n) => n.text).filter(Boolean).join('; ') || '';

  const parts = [
    'You are IRIS, a warm and perceptive personality companion.',
    'Respond in 2-4 sentences. Be specific and kind.',
  ];

  if (type) parts.push(`User's Enneagram type is ${type}. Top resonances: ${topScores}.`);
  if (recentNote) parts.push(`Recent journal: ${recentNote.slice(0, 200)}`);

  return parts.join(' ');
}
