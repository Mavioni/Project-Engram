// ─────────────────────────────────────────────────────────────
// App shell — routes, layout, ambient backdrop, and auth gates.
// ─────────────────────────────────────────────────────────────

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Nav from './components/Nav.jsx';
import AuthGate from './components/AuthGate.jsx';
import Backdrop from './components/Backdrop.jsx';
import Home from './features/home/Home.jsx';
import Journal from './features/journal/Journal.jsx';
import CheckIn from './features/journal/CheckIn.jsx';
import Calendar from './features/calendar/Calendar.jsx';
import You from './features/profile/You.jsx';

// Lazy-load the heavier routes to keep the initial bundle lean.
const Insights = lazy(() => import('./features/insights/Insights.jsx'));
const Chat = lazy(() => import('./features/insights/Chat.jsx'));
const IrisRoute = lazy(() => import('./features/iris/IrisRoute.jsx'));
const Pricing = lazy(() => import('./features/subscription/Pricing.jsx'));

// Auth screens (lazy — most users hit them rarely).
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
  return (
    <>
      {/* Fixed ambient sacred-geometry layer behind everything. */}
      <Backdrop />

      {/* Routed content sits above the backdrop. */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          // 100dvh falls back in browsers without dvh support via the
          // outer layout; older `100vh` fallback had to go because it
          // duplicated the key in an inline style object.
          minHeight: '100dvh',
        }}
      >
        <Suspense fallback={<LazyFallback />}>
          {/* key on pathname re-triggers the Screen fade-in on every route change */}
          <Routes location={location} key={location.pathname}>
            {/* IRIS v4 is the site's front door: landing / coliseum /
                assessment / results / Player Card export. From here
                the user transfers to /home (the extended Engram app). */}
            <Route path="/" element={<IrisRoute />} />

            {/* Extended site — the "after IRIS" experience */}
            <Route path="/home" element={<Home />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/checkin" element={<CheckIn />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/you" element={<You />} />

            {/* Auth flow */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signin/2fa" element={<TwoFactorChallenge />} />

            {/* Authenticated routes (require sign-in + 2FA challenge if enrolled) */}
            <Route
              path="/account"
              element={
                <AuthGate>
                  <Account />
                </AuthGate>
              }
            />
            <Route
              path="/account/2fa"
              element={
                <AuthGate requireMfa={false}>
                  <TwoFactorEnroll />
                </AuthGate>
              }
            />
            <Route
              path="/pricing"
              element={
                <AuthGate>
                  <Pricing />
                </AuthGate>
              }
            />
            <Route
              path="/insights/chat"
              element={
                <AuthGate>
                  <Chat />
                </AuthGate>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <Nav />
    </>
  );
}
