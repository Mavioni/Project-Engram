// ─────────────────────────────────────────────────────────────
// Profile slice — user identity, theme, onboarding state.
// ─────────────────────────────────────────────────────────────

export function initialProfile() {
  return {
    name: '',
    timezone:
      (Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC',
    startedAt: new Date().toISOString(),
    theme: 'dark',
  };
}

export function createProfileSlice(_set, _get) {
  return {
    profile: initialProfile(),
    theme: 'dark', // 'light' | 'dark' — app-wide UI theme

    // ── Theme ──
    setTheme: (theme) =>
      _set(() => ({ theme: theme === 'dark' ? 'dark' : 'light' })),

    // ── Onboarding ──
    setName: (name) =>
      _set((s) => ({ profile: { ...s.profile, name } })),
  };
}
