// ─────────────────────────────────────────────────────────────
// Pricing — the paywall destination. Two plans, honest copy.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import { hasStripe, startCheckout, openBillingPortal } from '../../lib/stripe.js';
import { useStore } from '../../lib/store.js';

const FEATURES_FREE = [
  { emoji: '1f4d4', label: 'Unlimited journal entries' },
  { emoji: '1f3a8', label: 'Emoji mood + activity catalog' },
  { emoji: '1f5d3', label: 'Calendar + trend charts' },
  { emoji: '1f441', label: 'Full IRIS assessment' },
  { emoji: '2728', label: '3 Claude insights / month' },
];

const FEATURES_PRO = [
  { emoji: '267e', label: 'Unlimited Claude insights' },
  { emoji: '1f4ac', label: 'Chat with your IRIS' },
  { emoji: '1f319', label: 'Weekly + monthly reviews' },
  { emoji: '1f4e4', label: 'Profile export + print card' },
  { emoji: '2601', label: 'Encrypted cloud sync (when enabled)' },
  { emoji: '1f3af', label: 'Goal tracking & pattern detection' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const subscription = useStore((s) => s.subscription);

  const go = async () => {
    setErr(null);
    setLoading(true);
    try {
      await startCheckout(plan);
    } catch (e) {
      setErr(e.message || 'Checkout failed.');
      setLoading(false);
    }
  };

  const manage = async () => {
    try {
      await openBillingPortal();
    } catch (e) {
      setErr(e.message);
    }
  };

  const isPro = subscription.tier === 'pro';

  return (
    <Screen
      label="Engram Pro"
      title="Go further"
      subtitle="Support the work + unlock Claude-powered insights"
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
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <PlanTab
          label="Monthly"
          price="$4.99"
          sub="/ month"
          active={plan === 'monthly'}
          onClick={() => setPlan('monthly')}
        />
        <PlanTab
          label="Yearly"
          price="$39"
          sub="/ year"
          badge="35% off"
          active={plan === 'yearly'}
          onClick={() => setPlan('yearly')}
        />
      </div>

      <Card accent="#ffd166" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Emoji code="1f31f" size={28} />
          <div>
            <div
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.28em',
                color: '#ffd166',
                textTransform: 'uppercase',
              }}
            >
              Engram Pro
            </div>
            <div style={{ fontSize: 22, fontWeight: 300 }}>Everything in Free, plus:</div>
          </div>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES_PRO.map((f) => (
            <li key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Emoji code={f.emoji} size={18} />
              <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{f.label}</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 20 }}>
          {isPro ? (
            <Button variant="solid" tone="#ffd166" full onClick={manage}>
              Manage billing
            </Button>
          ) : (
            <Button
              variant="solid"
              tone="#ffd166"
              full
              onClick={go}
              disabled={loading || !hasStripe()}
            >
              {loading
                ? 'Opening Checkout…'
                : hasStripe()
                  ? `Upgrade — ${plan === 'yearly' ? '$39/yr' : '$4.99/mo'}`
                  : 'Stripe not configured'}
            </Button>
          )}
        </div>
        {err && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#ff6b6b' }}>{err}</div>
        )}
      </Card>

      <Card>
        <div
          className="mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.28em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Free — always
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES_FREE.map((f) => (
            <li key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Emoji code={f.emoji} size={16} />
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{f.label}</span>
            </li>
          ))}
        </ul>
      </Card>

      {!hasStripe() && (
        <div
          className="mono"
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 10,
            border: '1px dashed var(--border)',
            fontSize: 10,
            color: 'var(--ink-dim)',
            letterSpacing: '0.04em',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          To collect payments, set VITE_STRIPE_PUBLISHABLE_KEY, VITE_STRIPE_PRICE_MONTHLY
          and VITE_STRIPE_PRICE_YEARLY, then deploy the stripe-checkout edge function.
          Full instructions in README → Subscriptions.
        </div>
      )}

      <div
        className="mono"
        style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 9,
          color: 'var(--ink-faint)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          lineHeight: 1.8,
        }}
      >
        Cancel anytime · 30-day refund
      </div>
    </Screen>
  );
}

function PlanTab({ label, price, sub, badge, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '18px 12px',
        borderRadius: 14,
        border: `1px solid ${active ? '#ffd16688' : 'var(--border)'}`,
        background: active ? 'rgba(255,209,102,0.08)' : 'transparent',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 240ms ease',
      }}
    >
      {badge && (
        <span
          className="mono"
          style={{
            position: 'absolute',
            top: -8,
            right: 12,
            fontSize: 8,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            background: '#ffd166',
            color: '#06060e',
            padding: '3px 8px',
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          {badge}
        </span>
      )}
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.28em',
          color: active ? '#ffd166' : 'var(--ink-dim)',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 300, color: 'var(--ink)' }}>{price}</div>
      <div
        className="mono"
        style={{ fontSize: 9, color: 'var(--ink-dim)', marginTop: 2, letterSpacing: '0.08em' }}
      >
        {sub}
      </div>
    </button>
  );
}
