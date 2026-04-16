// ─────────────────────────────────────────────────────────────
// App shell — routes, theme sync, top/bottom chrome.
// ─────────────────────────────────────────────────────────────
//
// Primary nav (3 tabs): Dashboard / Chat / Engram
// Secondary: reached via in-page links — Journal, Calendar,
//            Insights, Settings, IRIS, Pricing, Account, Auth
//
// Legacy paths (/home, /insights/chat, /you) redirect so any
// old bookmarks and links in previous HTML exports keep working.
// ─────────────────────────────────────────────────────────────

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Nav from './components/Nav.jsx';
import TopBar from './components/TopBar.jsx';
import AuthGate from './components/AuthGate.jsx';
import Backdrop from './components/Backdrop.jsx';
import LevelUpToast from './components/LevelUpToast.jsx';
import Home from './features/home/Home.jsx';
import CheckIn from './features/journal/CheckIn.jsx';
import { useThemeEffect } from './lib/theme.js';

// Secondary routes (reached via in-page links)
const Journal = lazy(() => import('./features/journal/Journal.jsx'));
const Calendar = lazy(() => import('./features/calendar/Calendar.jsx'));
const Insights = lazy(() => import('./features/insights/Insights.jsx'));
const Chat = lazy(() => import('./features/insights/Chat.jsx'));
const Engram = lazy(() => import('./features/engram/Engram.jsx'));
const Settings = lazy(() => import('./features/settings/Settings.jsx'));
const IrisRoute = lazy(() => import('./features/iris/IrisRoute.jsx'));
const Pricing = lazy(() => import('./features/subscription/Pricing.jsx'));
const SignIn = lazy(() => import('./features/auth/SignIn.jsx'));
const TwoFactorChallenge = lazy(() =>
  import('./features/auth/TwoFactorChallenge.jsx'),
);
const TwoFactorEnroll = lazy(() => import('./features/auth/TwoFactorEnroll.jsx'));
const Account = lazy(() => import('./features/auth/Account.jsx'));

function LazyFallback() {
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--ink-dim)',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        minHeight: '60vh',
      }}
    >
      Loading…
    </div>
  );
}

export default function App() {
  const location = useLocation();
  // Keeps <html data-theme> in sync with the store's theme value.
  useThemeEffect();

  return (
    <>
      <Backdrop />
      <TopBar />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
        }}
      >
        <Suspense fallback={<LazyFallback />}>
          <Routes location={location} key={location.pathname}>
            {/* Primary routes (bottom nav) */}
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<AuthGate><Chat /></AuthGate>} />
            <Route path="/engram" element={<Engram />} />

            {/* Secondary routes (in-page links) */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/iris" element={<IrisRoute />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/insights" element={<Insights />} />

            {/* Auth */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signin/2fa" element={<TwoFactorChallenge />} />
            <Route
              path="/account"
              element={<AuthGate><Account /></AuthGate>}
            />
            <Route
              path="/account/2fa"
              element={<AuthGate requireMfa={false}><TwoFactorEnroll /></AuthGate>}
            />
            <Route path="/pricing" element={<AuthGate><Pricing /></AuthGate>} />

            {/* Legacy redirects — preserve bookmarks */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/journal/checkin" element={<Navigate to="/checkin" replace />} />
            <Route path="/insights/chat" element={<Navigate to="/chat" replace />} />
            <Route path="/you" element={<Navigate to="/settings" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <Nav />
      <LevelUpToast />
    </>
  );
}
