// ─────────────────────────────────────────────────────────────
// <Nav /> — bottom tab bar, 3 destinations.
// ─────────────────────────────────────────────────────────────
// The whole app runs off three tabs:
//
//   Dashboard  —  /         your daily surface
//   Chat       —  /chat     talk to your IRIS
//   Engram     —  /engram   your replica + arena
//
// Settings, pricing, account, IRIS assessment, journal, calendar,
// and insights are all reachable via in-page links — they don't
// take up primary navigation real estate.
// ─────────────────────────────────────────────────────────────

import { NavLink, useLocation } from 'react-router-dom';

// `/iris` is the IRIS v4 assessment — full-screen experience, the bottom
// nav would compete with the 3D scene and its own action buttons.
const HIDDEN_PREFIXES = ['/iris', '/onboarding', '/checkout'];

function IconDashboard({ color, active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" stroke={color} strokeWidth={active ? 1.7 : 1.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" stroke={color} strokeWidth={active ? 1.7 : 1.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" stroke={color} strokeWidth={active ? 1.7 : 1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChat({ color, active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5l-4 3v-3H6a2 2 0 0 1-2-2V6Z"
        stroke={color}
        strokeWidth={active ? 1.7 : 1.4}
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10.5" r="1" fill={color} />
      <circle cx="12" cy="10.5" r="1" fill={color} />
      <circle cx="15" cy="10.5" r="1" fill={color} />
    </svg>
  );
}

function IconEngram({ color, active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={active ? 1.7 : 1.4} />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth={active ? 1.3 : 1} opacity="0.75" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={color} strokeWidth={active ? 1.3 : 1} strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard },
  { to: '/chat', label: 'Chat', Icon: IconChat },
  { to: '/engram', label: 'Engram', Icon: IconEngram },
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
          'linear-gradient(180deg, color-mix(in srgb, var(--bg) 55%, transparent), color-mix(in srgb, var(--bg) 95%, transparent) 60%)',
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
                  width: 32,
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  transform: isActive ? 'translateY(-1px)' : 'none',
                  transition: 'transform 240ms ease',
                }}
              >
                {isActive && (
                  <svg
                    viewBox="-50 -50 100 100"
                    width={34}
                    height={34}
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      color: 'var(--accent)',
                      opacity: 0.4,
                      animation: 'engramRotate 18s linear infinite',
                      transformOrigin: 'center',
                    }}
                  >
                    <circle cx="0" cy="0" r="46" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle
                      cx="0"
                      cy="0"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.8"
                      strokeDasharray="2 6"
                    />
                  </svg>
                )}
                <div style={{ position: 'relative' }}>
                  <tab.Icon
                    color={isActive ? 'var(--accent)' : 'var(--ink-dim)'}
                    active={isActive}
                  />
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
