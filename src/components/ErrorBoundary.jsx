// ─────────────────────────────────────────────────────────────
// <ErrorBoundary /> — last line of defense.
// ─────────────────────────────────────────────────────────────
// If anything in the React tree throws during render or in a
// lifecycle method, this catches it and renders a readable dark
// panel with the error text and a reload button — instead of
// silently leaving #root empty (which looks like a broken deploy).
// ─────────────────────────────────────────────────────────────

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
     
    console.error('[Engram] ErrorBoundary caught', error, info);
  }

  handleReload = () => {
    try {
      // If a broken persisted state caused the crash, the user can
      // still reload. Reset happens from the You tab manually.
      location.reload();
    } catch {
      /* noop */
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    const msg =
      (this.state.error && (this.state.error.stack || this.state.error.message)) ||
      String(this.state.error);
    return (
      <div
        style={{
          minHeight: '100vh',
          padding: '40px 24px',
          background: '#06060e',
          color: '#e6e6f0',
          fontFamily: 'Georgia, serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#ff6b6b',
              marginBottom: 12,
            }}
          >
            Runtime error
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 300,
              margin: '0 0 12px',
              color: '#fff',
              letterSpacing: '0.01em',
            }}
          >
            Engram tripped over itself.
          </h1>
          <p
            style={{
              margin: '0 0 20px',
              color: '#888',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            Your local data is safe — only the UI crashed. Reload to try again.
          </p>
          <pre
            style={{
              textAlign: 'left',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              lineHeight: 1.5,
              color: '#888',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 14,
              margin: '16px 0 20px',
              maxHeight: 240,
              overflow: 'auto',
            }}
          >
            {msg}
          </pre>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 28px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#ffd166',
              border: '1px solid rgba(255,209,102,0.4)',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
