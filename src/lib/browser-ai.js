// ─────────────────────────────────────────────────────────────
// browser-ai.js — 1-bit LLM inference via llama.cpp WASM.
// ─────────────────────────────────────────────────────────────
// Uses @wllama/wllama — WebAssembly port of llama.cpp that runs
// GGUF models directly in the browser. Supports IQ1_S (true 1-bit)
// and Q2_K (near-1-bit) quantization — same principle as BitNet.
//
// The inference engine (~5 MB WASM) loads from the npm package.
// The model (~50 MB GGUF) downloads from HuggingFace on first use
// and caches in IndexedDB for instant reload.
//
// HOW IT WORKS
//   1. wllama boots the WASM engine (one-time, ~2s)
//   2. Downloads GGUF model from URL (one-time, ~50 MB)
//   3. Caches both in IndexedDB
//   4. Inference runs in a Web Worker — never blocks the UI
//   5. ~5-15 tokens/sec on CPU (WASM), faster with SIMD
//
// MODEL: SmolLM2-135M-Instruct Q2_K (~50 MB, instruction-tuned)
//   Quant: Q2_K = 2-bit with k-quant techniques (near BitNet)
//   For true 1-bit: swap URL to an IQ1_S model when available
// ─────────────────────────────────────────────────────────────

import { Wllama } from '@wllama/wllama';

// ── Model config ────────────────────────────────────────────
// Single-file GGUF model. Q2_K is near-1-bit quantization.
// Swap URL for IQ1_S when available for true BitNet parity.
const MODEL_URL = 'https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q2_K.gguf';

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
 * Load the model. Downloads GGUF + boots WASM engine on first call.
 * Subsequent calls return instantly (cached in IndexedDB).
 */
export async function loadModel() {
  if (loadState === 'ready') return wllama;
  if (loadState === 'loading' || loadState === 'downloading') {
    // Wait for existing load to complete
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
    // Create wllama instance with multi-thread WASM
    wllama = new Wllama({
      'n_threads': Math.max(2, navigator.hardwareConcurrency || 4),
      // Cache models in IndexedDB for instant reload
      'cache_type': 'f32', // 'f32' | 'f16' | 'q8_0' | 'q4_0'
    });

    // Download + load model from URL. wllama handles caching internally.
    loadState = 'downloading';
    notify();

    await wllama.loadModelFromUrl(MODEL_URL, {
      progressCallback: (pct) => {
        loadProgress = Math.round(pct * 100);
        notify();
      },
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
 * Generate a response from the in-browser model.
 */
export async function generateResponse(prompt, opts = {}) {
  const llm = await loadModel();
  const { maxTokens = 256, temperature = 0.7 } = opts;

  // Build the full prompt using Llama 2 chat format
  const fullPrompt = buildChatPrompt({ messages: [{ role: 'user', content: prompt }] });

  let response = '';
  await llm.createCompletion(fullPrompt, {
    nPredict: maxTokens,
    temperature,
    topP: 0.9,
    onToken: (_tokens) => {
      // tokens is an array of token IDs; we track completion length
    },
    onTextChunk: (text) => {
      response += text;
    },
  });

  return response.trim();
}

/**
 * Build a chat prompt in Llama 2 format.
 * SmolLM2 uses the standard Llama chat template.
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

  if (type) parts.push(`User's Enneagram type is ${type}. Top resonances: ${topScores}.`);
  if (recentNote) parts.push(`Recent journal: ${recentNote.slice(0, 200)}`);

  return parts.join(' ');
}
