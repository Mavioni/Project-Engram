// ─────────────────────────────────────────────────────────────
// Chat — "Chat with your IRIS". A focused thread view that calls
// the Supabase `claude-insight` edge function with the user's
// IRIS context attached to every message.
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
import { hasSupabase } from '../../lib/supabase.js';

export default function Chat() {
  const navigate = useNavigate();
  const iris = useStore((s) => s.iris);
  const threads = useStore((s) => s.chatThreads);
  const startChatThread = useStore((s) => s.startChatThread);
  const appendChatMessage = useStore((s) => s.appendChatMessage);

  const [activeId, setActiveId] = useState(threads[0]?.id || null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const active = threads.find((t) => t.id === activeId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length]);

  const startNew = () => {
    const id = startChatThread(new Date().toLocaleDateString());
    setActiveId(id);
  };

  const send = async () => {
    if (!input.trim()) return;
    let threadId = activeId;
    if (!threadId) {
      threadId = startChatThread(new Date().toLocaleDateString());
      setActiveId(threadId);
    }
    const text = input.trim();
    setInput('');
    appendChatMessage(threadId, { role: 'user', content: text });
    setSending(true);
    try {
      const history = (threads.find((t) => t.id === threadId)?.messages || []).concat({
        role: 'user',
        content: text,
      });
      const res = await sendChatMessage({
        threadId,
        history,
        message: text,
        irisContext: iris,
      });
      appendChatMessage(threadId, {
        role: 'assistant',
        content: res.content,
        model: res.model,
      });
    } catch (e) {
      appendChatMessage(threadId, {
        role: 'assistant',
        content: `Something went wrong: ${e.message || e}. Try again in a moment.`,
        error: true,
      });
    } finally {
      setSending(false);
    }
  };

  if (!iris.enneagramType) {
    return (
      <Screen
        label="Chat"
        title="Chat with your IRIS"
        action={
          <button
            onClick={() => navigate(-1)}
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: 'var(--ink-dim)',
              textTransform: 'uppercase',
            }}
          >
            Back
          </button>
        }
      >
        <Empty
          emoji="1f441"
          title="Run IRIS first"
          body="Chat needs your 24 facet scores to write in your voice. The simulation is 16 questions, ~4 minutes."
          action={
            <Button variant="solid" tone="#b197fc" onClick={() => navigate('/iris')}>
              Begin IRIS
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      label={`IRIS Type ${iris.enneagramType}`}
      title="Chat"
      subtitle="Grounded in your 24 facets"
      action={
        <Button variant="subtle" size="sm" onClick={startNew}>
          + New
        </Button>
      }
    >
      {!hasSupabase() && (
        <Card style={{ marginBottom: 12, borderColor: 'rgba(255,209,102,0.35)' }}>
          <div style={{ fontSize: 12, color: '#ffd166', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
            Backend not configured — messages will get a local fallback response. See README.
          </div>
        </Card>
      )}

      {active && active.messages.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {active.messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} error={m.error} />
          ))}
          {sending && (
            <div
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'var(--ink-dim)',
                textTransform: 'uppercase',
                padding: '8px 14px',
              }}
            >
              Claude is writing…
            </div>
          )}
          <div ref={endRef} />
        </div>
      ) : (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-dim)' }}>
          <Emoji code="2728" size={42} />
          <p style={{ margin: '16px 0 0', fontStyle: 'italic' }}>
            Ask anything. Your IRIS is listening.
          </p>
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {SEED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setInput(p)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--ink-soft)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontStyle: 'italic',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          padding: '12px 0',
          background: 'linear-gradient(180deg, transparent, var(--bg) 40%)',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="What is asking to be named?"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            padding: 14,
            minHeight: 48,
            maxHeight: 160,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg-raised)',
            color: 'var(--ink)',
            fontFamily: 'var(--serif)',
            fontSize: 16,
            lineHeight: 1.5,
          }}
        />
        <Button
          variant="solid"
          tone="#b197fc"
          onClick={send}
          disabled={sending || !input.trim()}
        >
          Send
        </Button>
      </div>
    </Screen>
  );
}

function MessageBubble({ role, content, error }) {
  const isUser = role === 'user';
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser
          ? 'linear-gradient(180deg, rgba(255,209,102,0.15), rgba(255,209,102,0.05))'
          : 'var(--bg-raised)',
        border: isUser ? '1px solid rgba(255,209,102,0.28)' : '1px solid var(--border)',
        color: error ? '#ff6b6b' : 'var(--ink)',
        fontSize: 15,
        lineHeight: 1.65,
        fontFamily: 'var(--serif)',
        whiteSpace: 'pre-wrap',
      }}
    >
      {content}
    </div>
  );
}

const SEED_PROMPTS = [
  'What am I missing about myself this week?',
  'Where is my shadow driving me right now?',
  'What should I stop doing?',
  'Write me a letter from my future self.',
];
