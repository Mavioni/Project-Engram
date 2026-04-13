// ─────────────────────────────────────────────────────────────
// App shell — routes, layout, and the onboarding gate.
// ─────────────────────────────────────────────────────────────

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Nav from './components/Nav.jsx';
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
      }}
    >
      Loading…
    </div>
  );
}

export default function App() {
  const location = useLocation();
  // The router mounts Nav once; Nav itself decides whether to hide
  // on fullscreen routes (see Nav.jsx HIDDEN_PREFIXES).
  return (
    <>
      <Suspense fallback={<LazyFallback />}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/checkin" element={<CheckIn />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/insights/chat" element={<Chat />} />
          <Route path="/iris" element={<IrisRoute />} />
          <Route path="/you" element={<You />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Nav />
    </>
  );
}
