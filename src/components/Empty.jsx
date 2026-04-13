// Friendly empty states with a big centered emoji.
import Emoji from './Emoji.jsx';

export default function Empty({ emoji = '2728', title, body, action }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 20px',
        color: 'var(--ink-dim)',
      }}
    >
      <Emoji code={emoji} size={56} style={{ opacity: 0.85 }} />
      <h3
        style={{
          margin: '16px 0 6px',
          fontWeight: 300,
          fontSize: 22,
          color: 'var(--ink)',
          letterSpacing: '0.01em',
        }}
      >
        {title}
      </h3>
      {body && (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontStyle: 'italic',
            color: 'var(--ink-soft)',
            lineHeight: 1.6,
            maxWidth: 340,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {body}
        </p>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
