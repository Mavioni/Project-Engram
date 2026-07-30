// ─────────────────────────────────────────────────────────────
// browser-ai.js — 1-bit LLM via llama.cpp WASM (wllama v3).
// ─────────────────────────────────────────────────────────────
// Uses @wllama/wllama — WebAssembly llama.cpp that loads GGUF
// models directly in the browser. Downloads ~50 MB Q2_K model
// from HuggingFace on first use, caches in IndexedDB.
//
// Q2_K = near-1-bit quantization — same principle as BitNet.
// ─────────────────────────────────────────────────────────────

import { Wllama } from '@wllama/wllama';

// WASM binaries hosted on jsDelivr CDN — avoids bundling 5MB in the repo.
// These URLs are stable and versioned to the @wllama/wllama-compat package.
const WASM_CONFIG = {
  'wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama-compat@3.5.1/wasm/wllama.wasm',
};

// ── Model config ────────────────────────────────────────────
// SmolLM2-135M-Instruct Q2_K (~50 MB). Swap for IQ1_S when available.
const MODEL = {
  repo: 'bartowski/SmolLM2-135M-Instruct-GGUF',
  file: 'SmolLM2-135M-Instruct-Q2_K.gguf',
};

// ── State ───────────────────────────────────────────────────
let wllama = null;
let loadState = 'idle'; // 'idle' | 'loading' | 'downloading' | 'ready' | 'error'
let loadProgress = 0;
let loadError = null;

const listeners = new Set();

export function onLoadChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn({ state: loadState, progress: loadProgress, error: loadError });
}

/**
 * Load the model. Downloads GGUF + boots WASM on first call.
 * Subsequent calls return instantly (cached in IndexedDB).
 */
export async function loadModel() {
  if (loadState === 'ready') return wllama;
  if (loadState === 'loading' || loadState === 'downloading') {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (loadState === 'ready') resolve(wllama);
        else if (loadState === 'error') reject(new Error(loadError));
        else setTimeout(check, 200);
      };
      check();
    });
  }

  loadState = 'loading';
  loadProgress = 0;
  loadError = null;
  notify();

  try {
    // Use CDN-hosted WASM binaries to keep the repo small
    wllama = new Wllama(WASM_CONFIG);

    loadState = 'downloading';
    notify();

    // loadModelFromHF handles HuggingFace download + IndexedDB cache
    await wllama.loadModelFromHF(MODEL, {
      progressCallback: ({ loaded, total }) => {
        if (total > 0) {
          loadProgress = Math.round((loaded / total) * 100);
          notify();
        }
      },
      n_threads: Math.max(2, navigator.hardwareConcurrency || 4),
    });

    loadState = 'ready';
    loadProgress = 100;
    notify();
    return wllama;
  } catch (e) {
    loadState = 'error';
    loadError = e.message || 'Unknown error loading model';
    console.error('Browser AI: model load failed:', loadError);
    notify();
    throw e;
  }
}

export function isModelReady() {
  return loadState === 'ready';
}

export function getLoadState() {
  return { state: loadState, progress: loadProgress, error: loadError };
}

/**
 * Generate a chat response from the in-browser model.
 * Uses OpenAI-compatible chat completion API (wllama v3).
 */
export async function generateResponse(messages, opts = {}) {
  const llm = await loadModel();
  const { maxTokens = 256, temperature = 0.7 } = opts;

  // Build messages array in OpenAI format
  const chatMessages = Array.isArray(messages) ? messages : [{ role: 'user', content: messages }];

  const response = await llm.createChatCompletion({
    messages: chatMessages,
    max_tokens: maxTokens,
    temperature,
    top_k: 40,
    top_p: 0.9,
  });

  return response.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Build an IRIS-aware system prompt.
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

  if (type) parts.push(`User Enneagram type: ${type}. Top resonances: ${topScores}.`);
  if (recentNote) parts.push(`Recent journal: ${recentNote.slice(0, 200)}`);

  return parts.join(' ');
}
