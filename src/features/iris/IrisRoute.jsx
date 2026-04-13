// ─────────────────────────────────────────────────────────────
// IrisRoute — wraps the legacy IRIS component and wires its
// onComplete callback into the Zustand store.
// ─────────────────────────────────────────────────────────────

import { Suspense, lazy, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../lib/store.js';

// Lazy-load — Three.js is ~600 KB, keep it off the critical path.
const IRISApp = lazy(() => import('./IRIS.jsx'));

export default function IrisRoute() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const saveIrisResults = useStore((s) => s.saveIrisResults);
  const hasIris = useStore((s) => Boolean(s.iris.enneagramType));

  // Allow deep-linking straight into the assessment.
  const initialPhase = params.get('start') === '1' || hasIris ? 'assess' : 'landing';

  const onComplete = useMemo(
    () => (results) => {
      saveIrisResults(results);
    },
    [saveIrisResults],
  );

  const onExit = () => navigate('/');

  return (
    <Suspense
      fallback={
        <div
          style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink-dim)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          Initializing IRIS…
        </div>
      }
    >
      <IRISApp onComplete={onComplete} onExit={onExit} initialPhase={initialPhase} />
    </Suspense>
  );
}
