// ─────────────────────────────────────────────────────────────
// IrisRoute — the route wrapper for IRIS v4.
// ─────────────────────────────────────────────────────────────
// IRIS is mounted at `/` (the entry experience), so this
// wrapper handles:
//   - Lazy-loading the heavy Three.js bundle
//   - Persisting results to Zustand via saveIrisResults
//   - Providing the "Enter Engram →" handoff button that
//     transfers the user to /home (the extended dashboard)
// ─────────────────────────────────────────────────────────────

import { Suspense, lazy, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store.js';

// Three.js is ~600 KB. Keep it off the critical path.
const IRISApp = lazy(() => import('./IRIS.jsx'));

export default function IrisRoute() {
  const navigate = useNavigate();
  const saveIrisResults = useStore((s) => s.saveIrisResults);

  const onComplete = useCallback(
    (results) => {
      saveIrisResults(results);
    },
    [saveIrisResults],
  );

  const onExit = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            color: '#555',
            background: '#06060e',
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          Initializing IRIS…
        </div>
      }
    >
      <IRISApp onComplete={onComplete} onExit={onExit} initialPhase="landing" />
    </Suspense>
  );
}
