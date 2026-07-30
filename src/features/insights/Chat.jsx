// ─────────────────────────────────────────────────────────────
// Chat — "Chat with your IRIS" via in-browser AI.
// ─────────────────────────────────────────────────────────────
// The model loads directly in your browser via llama.cpp WASM.
// No server. No API key. First load downloads ~50 MB of model
// weights from HuggingFace CDN; subsequent loads use cache.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Emoji from '../../components/Emoji.jsx';
import Empty from '../../components/Empty.jsx';
import { useStore } from '../../lib/store.js';
import { sendChatMessage } from '../../lib/claude.js';
import { isModelReady, getLoadState, onLoadChange, abortGeneration, retryLoad } from '../../lib/browser-ai.js';

/** Human-readable label for error types. */
const ERROR_LABELS = {
  network: 'Network error — check your connection',
  wasm: 'WebAssembly not supported — try a different browser',
  model: 'Model failed to load — file may be corrupted',
  timeout: 'Model load timed out — try again',
  unknown: 'Unknown error loading model',
};

export default function Chat() {
  const navigate = useNavigate();
  const iris = useStore((s) => s.iris);
  const threads = useStore((s) => s.chatThreads);
  const startChatThread = useStore((s) => s.startChatThread);
  const appendChatMessage = useStore((s) => s.appendChatMessage);

  const [activeId, setActiveId] = useState(threads[0]?.id || null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [modelState, setModelState] = useState(getLoadState());
  const endRef = useRef(null);
  const abortRef = useRef(null);

  const active = threads.find((t) => t.id === activeId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length]);

  useEffect(() => {
    return onLoadChange(setModelState);
  }, []);

  const startNew = () => {
    const id = startChatThread(new Date().toLocaleDateString());
    setActiveId(id);
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    let threadId = activeId;
    if (!threadId) {
      threadId = startChatThread(new Date().toLocaleDateString());
      setActiveId(threadId);
    }
    const text = input.trim();
    setInput('');
    appendChatMessage(threadId, { role: 'user', content: text });
    setSending(true);
    setStreaming('');

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const timeout = setTimeout(() => { ac.abort(); abortGeneration(); }, 45000);

    try {
      const history = threads
        .find((t) => t.id === threadId)
        ?.messages.concat({ role: 'user', content: text }) || [];

      const res = await sendChatMessage({
        history,
        message: text,
        irisContext: iris,
        onToken: (chunk) => setStreaming((prev) => prev + chunk),
        signal: ac.signal,
      });
      appendChatMessage(threadId, {
        role: 'assistant',
        content: res.content,
        model: res.model,
        aiError: res.error || null,
        aiErrorType: res.errorType || null,
      });
    } catch (e) {
      if (e.name === 'AbortError') {
        appendChatMessage(threadId, {
          role: 'assistant',
          content: streaming
            ? streaming + '\n\n[response timed out — showing partial output]'
            : 'Response timed out. The model may be busy. Try a shorter message.',
          error: true,
        });
      } else {
        appendChatMessage(threadId, {
          role: 'assistant',
          content: `Something went wrong: ${e.message || e}. Try again.`,
          error: true,
        });
      }
    } finally {
      clearTimeout(timeout);
      setSending(false);
      setStreaming('');
      abortRef.current = null;
    }
  };

  if (!iris?.enneagramType) {
    return (
      <Screen label="Chat" title="Chat with your IRIS">
        <Empty
          emoji="1f441"
          title="Run IRIS first"
          body="Chat needs your 24 facet scores to write in your voice. The simulation is 16 questions, ~4 minutes."
          action={<Button variant="solid" tone="#b197fc" onClick={() => navigate('/iris')}>Begin IRIS</Button>}
        />
      </Screen>
    );
  }

  const modelReady = isModelReady();
  const modelLoading = modelState.state === 'loading' || modelState.state === 'downloading';
  const modelError = modelState.state === 'error';

  return (
    <Screen
      label={`IRIS Type ${iris.enneagramType}`}
      title="Chat"
      subtitle="In-browser AI — no server, no API key"
      action={<Button variant="subtle" size="sm" onClick={startNew}>+ New</Button>}
    >
      {/* ── Model loading ── */}
      {modelLoading && (
        <Card style={{ marginBottom: 12, borderColor: 'rgba(126,181,255,0.35)' }}>
          <div style={{ fontSize: 12, color: '#7eb5ff', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
            {modelState.state === 'downloading'
              ? `Downloading model… ${modelState.progress > 0 ? `${modelState.progress}%` : 'connecting'}`
              : 'Loading model…'}
          </div>
          {modelState.progress > 0 && (
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
              <div style={{ width: `${modelState.progress}%`, height: '100%', background: '#7eb5ff', transition: 'width 300ms ease' }} />
            </div>
          )}
        </Card>
      )}

      {/* ── Model error — diagnostic badge with retry ── */}
      {modelError && (
        <Card style={{ marginBottom: 12, borderColor: 'rgba(255,107,107,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#ff6b6b', fontFamily: 'var(--mono)', letterSpacing: '0.04em', marginBottom: 4 }}>
                {ERROR_LABELS[modelState.errorType] || ERROR_LABELS.unknown}
              </div>
              {modelState.error && (
                <div style={{ fontSize: 11, color: 'var(--ink-dim)', fontFamily: 'var(--mono)', wordBreak: 'break-word' }}>
                  {modelState.error.slice(0, 200)}
                </div>
              )}
            </div>
            <Button variant="subtle" size="sm" tone="var(--accent)" onClick={retryLoad}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* ── Model ready ── */}
      {modelReady && (
        <Card style={{ marginBottom: 12, borderColor: 'rgba(105,219,124,0.35)' }}>
          <div style={{ fontSize: 12, color: '#69db7c', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
            Model ready — SmolLM2-135M running in your browser
          </div>
        </Card>
      )}

      {/* ── Messages ── */}
      {active && active.messages.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {active.messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              error={m.error}
              aiError={m.aiError}
              aiErrorType={m.aiErrorType}
            />
          ))}
          {sending && (
            <MessageBubble
              role="assistant"
              content={streaming || '…'}
              streaming={!!streaming}
            />
          )}
          <div ref={endRef} />
        </div>
      ) : (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-dim)' }}>
          <Emoji code="2728" size={42} />
          <p style={{ margin: '16px 0 0', fontStyle: 'italic' }}>
            Ask anything. Your IRIS is listening.
          </p>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {SEED_PROMPTS.map((p) => (
              <button key={p} onClick={() => setInput(p)} style={{
                padding: '10px 16px', borderRadius: 999, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--ink-soft)', fontSize: 13, cursor: 'pointer', fontStyle: 'italic',
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Composer ── */}
      <div style={{ position: 'sticky', bottom: 0, display: 'flex', gap: 8, alignItems: 'flex-end', padding: '12px 0', background: 'linear-gradient(180deg, transparent, var(--bg) 40%)' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="What is asking to be named?"
          rows={1}
          style={{ flex: 1, resize: 'none', padding: 14, minHeight: 48, maxHeight: 160, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--ink)', fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.5 }}
        />
        <Button variant="solid" tone="#b197fc" onClick={send} disabled={sending || !input.trim()}>
          Send
        </Button>
      </div>
    </Screen>
  );
}

function MessageBubble({ role, content, error, streaming, aiError, aiErrorType }) {
  const isUser = role === 'user';
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: '12px 16px',
      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      background: isUser ? 'linear-gradient(180deg, rgba(255,209,102,0.15), rgba(255,209,102,0.05))' : 'var(--bg-raised)',
      border: isUser ? '1px solid rgba(255,209,102,0.28)' : '1px solid var(--border)',
      color: error ? '#ff6b6b' : 'var(--ink)', fontSize: 15, lineHeight: 1.65,
      fontFamily: 'var(--serif)', whiteSpace: 'pre-wrap',
    }}>
      {content}
      {aiError && (
        <div style={{
          marginTop: 8, padding: '6px 10px', borderRadius: 6,
          background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
          fontSize: 10, fontFamily: 'var(--mono)', color: '#ff6b6b', letterSpacing: '0.04em',
        }}>
          {ERROR_LABELS[aiErrorType] || aiError}
        </div>
      )}
      {streaming && (
        <span style={{
          display: 'inline-block', width: 2, height: '1em', background: 'var(--ink-soft)',
          marginLeft: 1, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite',
        }} />
      )}
    </div>
  );
}

const SEED_PROMPTS = [
  'What am I missing about myself this week?',
  'Where is my shadow driving me right now?',
  'What should I stop doing?',
  'Write me a letter from my future self.',
];
