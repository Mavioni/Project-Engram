// ─────────────────────────────────────────────────────────────
// IRIS slice — personality assessment results + subscription.
// ─────────────────────────────────────────────────────────────

export function initialIris() {
  return {
    facetScores: null,
    enneagramType: null,
    enneagramScores: null,
    takenAt: null,
    history: [],
  };
}

export function initialSubscription() {
  return {
    tier: 'free',
    status: 'inactive',
    renewsAt: null,
    customerId: null,
    aiCreditsUsed: 0,
  };
}

export function createIrisSlice(_set, _get) {
  return {
    iris: initialIris(),
    subscription: initialSubscription(),

    saveIrisResults: ({ facetScores, enneagramType, enneagramScores }) =>
      _set((s) => {
        const takenAt = new Date().toISOString();
        const snapshot = { facetScores, enneagramType, enneagramScores, takenAt };
        return {
          iris: {
            facetScores,
            enneagramType,
            enneagramScores,
            takenAt,
            history: [...(s.iris.history || []), snapshot].slice(-24),
          },
        };
      }),

    clearIris: () => _set({ iris: initialIris() }),

    setSubscription: (patch) =>
      _set((s) => ({ subscription: { ...s.subscription, ...patch } })),

    useAiCredit: () =>
      _set((s) => ({
        subscription: {
          ...s.subscription,
          aiCreditsUsed: (s.subscription.aiCreditsUsed || 0) + 1,
        },
      })),

    resetAiCredits: () =>
      _set((s) => ({
        subscription: { ...s.subscription, aiCreditsUsed: 0 },
      })),
  };
}
