// ─────────────────────────────────────────────────────────────
// IrisRoute — the route wrapper for IRIS v4.
// ─────────────────────────────────────────────────────────────
// Handles:
//   - Lazy-loading the heavy Three.js IRIS bundle
//   - Persisting results to Zustand via saveIrisResults
//   - Awarding XP on completion so the Engram levels up
//   - Providing the "Enter Engram →" handoff button
// ─────────────────────────────────────────────────────────────

import { Suspense, lazy, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store.js';
import { XP } from '../engram/rewards.js';

const IRISApp = lazy(() => import('./IRIS.jsx'));

export default function IrisRoute() {
  const navigate = useNavigate();
  const saveIrisResults = useStore((s) => s.saveIrisResults);
  const awardXp = useStore((s) => s.awardXp);
  const iris = useStore((s) => s.iris);

  const onComplete = useCallback(
    (results) => {
      const wasFirstAssessment = !iris?.enneagramType;
      saveIrisResults(results);
      // First-ever assessment is a big moment — reward accordingly.
      // Re-runs still award half to keep the replica evolving.
      awardXp(wasFirstAssessment ? XP.irisComplete : Math.floor(XP.irisComplete / 2));
    },
    [iris, saveIrisResults, awardXp],
  );

  const onExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink-dim)',
            background: 'var(--bg)',
            fontFamily: 'var(--mono)',
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
