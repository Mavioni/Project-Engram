// ─────────────────────────────────────────────────────────────
// <Nav /> — bottom tab bar, 5 destinations.
// Visible on all routes except the IRIS onboarding flow.
// ─────────────────────────────────────────────────────────────

import { NavLink, useLocation } from 'react-router-dom';
import Emoji from './Emoji.jsx';

const TABS = [
  { to: '/', label: 'Home', emoji: '1f3e1' }, // house with garden
  { to: '/journal', label: 'Journal', emoji: '1f4d6' }, // open book
  { to: '/calendar', label: 'Calendar', emoji: '1f5d3' }, // spiral calendar
  { to: '/insights', label: 'Insights', emoji: '1f52e' }, // crystal ball
  { to: '/you', label: 'You', emoji: '1f441' }, // eye
];

// Routes where the nav should hide (full-screen flows).
const HIDDEN_PREFIXES = ['/iris', '/onboarding', '/checkout'];

export default function Nav() {
  const { pathname } = useLocation();
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(var(--nav-height) + var(--safe-bottom))',
        paddingBottom: 'var(--safe-bottom)',
        paddingLeft: 'var(--safe-left)',
        paddingRight: 'var(--safe-right)',
        background:
          'linear-gradient(180deg, rgba(6,6,14,0.55), rgba(6,6,14,0.95) 60%)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            color: isActive ? 'var(--ink)' : 'var(--ink-dim)',
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            opacity: isActive ? 1 : 0.65,
            transition: 'all 240ms ease',
            paddingTop: 6,
          })}
        >
          {({ isActive }) => (
            <>
              <Emoji
                code={tab.emoji}
                label={tab.label}
                size={isActive ? 26 : 22}
                style={{
                  transform: isActive ? 'translateY(-1px)' : 'none',
                  transition: 'transform 240ms ease',
                }}
              />
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
