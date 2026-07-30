// ─────────────────────────────────────────────────────────────
// AI slice — chat threads, cached insights.
// ─────────────────────────────────────────────────────────────

const uid = () =>
  (crypto && crypto.randomUUID && crypto.randomUUID()) ||
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export function createAISlice(_set, _get) {
  return {
    insights: [],     // cached AI outputs
    chatThreads: [],

    cacheInsight: (insight) =>
      _set((s) => ({
        insights: [
          { id: uid(), createdAt: new Date().toISOString(), ...insight },
          ...s.insights,
        ].slice(0, 60),
      })),

    startChatThread: (title) => {
      const id = uid();
      _set((s) => ({
        chatThreads: [
          { id, title, createdAt: new Date().toISOString(), messages: [] },
          ...s.chatThreads,
        ].slice(0, 40),
      }));
      return id;
    },

    appendChatMessage: (threadId, message) =>
      _set((s) => ({
        chatThreads: s.chatThreads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  { id: uid(), createdAt: new Date().toISOString(), ...message },
                ],
              }
            : t,
        ),
      })),
  };
}
