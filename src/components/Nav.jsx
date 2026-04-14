// ─────────────────────────────────────────────────────────────
// <Nav /> — bottom tab bar, 5 destinations.
// ─────────────────────────────────────────────────────────────
// Icons are inline SVG, NOT Twemoji images, because the nav is
// persistent chrome that mounts on every initial render. Depending
// on a CDN for chrome icons would make first-paint hostage to
// jsdelivr availability — which is how Engram ended up with a
// stuck-spinner bug on a fresh Netlify Drop deploy.
//
// These icons are purposefully simple/abstract so they hold up
// next to the IRIS aesthetic. Color shifts on active state.
// ─────────────────────────────────────────────────────────────

import { NavLink, useLocation } from 'react-router-dom';

// Routes where the nav should hide (full-screen flows).
const HIDDEN_PREFIXES = ['/iris', '/onboarding', '/checkout'];

function IconHome({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconJournal({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 17a3 3 0 0 1 3-3h11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 8h6M9 11h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.4" fill={color} />
    </svg>
  );
}

function IconInsights({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.5" />
      <path d="M12 3.5v17M3.5 12h17" stroke={color} strokeWidth="1" opacity="0.6" />
      <path d="m6 15 3-3 3 2 5-5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconYou({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12C4.5 7.5 8 5 12 5s7.5 2.5 9.5 7c-2 4.5-5.5 7-9.5 7s-7.5-2.5-9.5-7Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.2" fill={color} />
    </svg>
  );
}

const TABS = [
  { to: '/', label: 'Home', Icon: IconHome },
  { to: '/journal', label: 'Journal', Icon: IconJournal },
  { to: '/calendar', label: 'Calendar', Icon: IconCalendar },
  { to: '/insights', label: 'Insights', Icon: IconInsights },
  { to: '/you', label: 'You', Icon: IconYou },
];

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
            gap: 4,
            color: isActive ? 'var(--ink)' : 'var(--ink-dim)',
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            opacity: isActive ? 1 : 0.7,
            transition: 'all 240ms ease',
            paddingTop: 8,
          })}
        >
          {({ isActive }) => (
            <>
              <div
                style={{
                  position: 'relative',
                  width: 30,
                  height: 30,
                  display: 'grid',
                  placeItems: 'center',
                  transform: isActive ? 'translateY(-1px) scale(1.05)' : 'none',
                  transition: 'transform 240ms ease',
                }}
              >
                {/* Active-state sigil: a thin rotating ring behind
                    the icon, visible only when the tab is selected. */}
                {isActive && (
                  <svg
                    viewBox="-50 -50 100 100"
                    width={32}
                    height={32}
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 'auto',
                      color: '#ffd166',
                      opacity: 0.45,
                      animation: 'engramRotate 18s linear infinite',
                      transformOrigin: 'center',
                    }}
                  >
                    <circle cx="0" cy="0" r="44" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle
                      cx="0"
                      cy="0"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.8"
                      strokeDasharray="2 6"
                    />
                  </svg>
                )}
                <div style={{ position: 'relative' }}>
                  <tab.Icon color={isActive ? '#ffd166' : '#666677'} />
                </div>
              </div>
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
