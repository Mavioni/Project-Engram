# ADR-0001 — Self Mirror feature architecture

**Date:** 2026-04-17
**Status:** Accepted
**Operator:** Revan (Massimo Panella)
**Audit chain:** anbu-intel (Shino) · anbu-audit (Saber) · MAVERICK synthesis

---

## Context

Engram's ISO doctrine (operator memory `user_vision_iso_companion.md`) states
that the eventual companion must **emerge** from a rich, doctrine-clean
substrate — not be authored. An earlier seed proposed an n-gram replica that
would "speak in the operator's voice." That seed was rejected: mimicry of the
operator is the opposite of emergence, and any LLM crystallising on top of a
mimicry layer grows on polluted ground.

This ADR records the replacement design: a **Self Mirror** feature inside the
existing Engram PWA, scoped as a one-way self-observation instrument. It
produces a fossil record of the operator's own language, mood, and themes
over time, and displays that record back to the operator as reflection only.
It never generates text, never impersonates, and is architecturally isolated
from any future companion-substrate process.

## Decision

### 1. Route placement

Mount Self Mirror as a **secondary route** under the existing `/insights`
path, matching the precedent of `/insights/chat`:

- `src/features/self-mirror/SelfMirrorPage.jsx`
- canonical URL: `/insights/self-mirror`
- not added to bottom nav
- linked from Insights and Journal pages

### 2. Feature folder layout

```
src/features/self-mirror/
├── index.js
├── SelfMirrorPage.jsx
├── SelfMirrorPanel.jsx
├── useSelfMirror.js
├── store.js
├── model/
│   └── schema.js
├── analysis/
│   ├── tokenize.js
│   ├── aggregate.js
│   └── drift.js
├── privacy/
│   └── redact.js
├── storage/
│   ├── crypto.js
│   ├── db.js
│   ├── repository.js
│   └── export.js
└── __tests__/
    ├── schema.test.js
    ├── redact.test.js
    ├── crypto.test.js
    ├── db.test.js
    ├── repository.test.js
    ├── aggregate.test.js
    └── drift.test.js
```

### 3. Data model

**Envelope** stays operational (indexable, never sensitive). **Payload** is
always encrypted.

```
MirrorEntryEnvelope {
  id, keyVersion, schemaVersion,
  createdDay: 'YYYY-MM-DD',
  sourceKind: 'journal' | 'checkin' | 'iris-note' | 'manual',
  ciphertext: ArrayBuffer,
  iv: ArrayBuffer
}

MirrorEntryPayload {
  createdAt, mood?, text, tags?
}

MirrorSnapshotEnvelope {
  id: 'recent-30d' | 'mid-90d' | 'long-all',
  keyVersion, schemaVersion, updatedAt,
  ciphertext, iv
}

MirrorSnapshotPayload {
  window: 'recent-30d' | 'mid-90d' | 'long-all'
  phraseCounts: Record<phrase, number>
  themeScores: Record<phrase, { score: number, classification: -1 | 0 | 1 }>
  moodLanguage: Record<mood, Record<phrase, number>>
  drift: { added: string[], rising: string[], fading: string[] }
}

// Notes:
//   - themeScores.score holds the raw aggregate count for the phrase.
//   - classification is the ternary bucket from balancedTernary() after
//     min-max normalisation of scores across the snapshot's phrase set.
//   - drift is left as empty arrays by aggregateWindow(); repository.js
//     fills it by calling computeDrift(current, baseline) before persist.
```

**IndexedDB schema (locked v1, DB name `engram-self-mirror-v1`):**

| Store | Key | Indexes |
|---|---|---|
| `mirror_entries` | `&id` | `createdDay`, `sourceKind`, `keyVersion` |
| `mirror_snapshots` | `&id` (one of `recent-30d` / `mid-90d` / `long-all`) | `updatedAt`, `keyVersion` |
| `mirror_meta` | `&id` | `updatedAt` |

Indexes live on envelope fields only. No `keyPath` points into the
encrypted payload. A `MirrorMetaRecord` is `{ id, value, updatedAt }`
per §12.3 and is **not encrypted** (operational parameters, not content).

### 4. Storage split

Three modules, each tested independently:

- `storage/crypto.js` — WebCrypto AES-GCM (256-bit) + PBKDF2-HMAC-SHA-256 key
  derivation. KDF parameters versioned in `mirror_meta`.
- `storage/db.js` — Dexie-backed IndexedDB. Three stores: `mirror_entries`,
  `mirror_snapshots`, `mirror_meta`.
- `storage/repository.js` — orchestration. Decrypts in memory, never persists
  plaintext intermediates, enforces schema/key versioning on read/write.

### 5. Cryptographic parameters

- **Cipher:** AES-GCM, 256-bit key, 12-byte IV per record.
- **KDF:** PBKDF2-HMAC-SHA-256, **default 600,000 iterations** (OWASP 2024
  floor). Parameters serialized into `mirror_meta` so future rotation or
  algorithm upgrade is a data-migration, not a hard fork.
- **AAD binding:** envelope metadata (`createdDay`, `sourceKind`,
  `keyVersion`, `schemaVersion`, `id`) is passed as AES-GCM Additional
  Authenticated Data. Tampering any envelope field invalidates the tag.
- **Key lifecycle:** passphrase → KEK → data key. Data key held **in
  memory only** (see §7).
- **Passphrase entropy minimum:** enforced at UI layer. `[TODO operator
  contribution]` — see §9.

### 6. Analysis pipeline (hybrid)

- **On save (incremental):** decrypt, tokenize, fold into affected
  per-window snapshots, re-encrypt. Cheap path.
- **On demand (full rebuild):** iterate all entries, rebuild all three
  per-window snapshots from scratch. Used for schema migrations, algorithm
  changes, and integrity repair.

Three analysis modules:

- `analysis/tokenize.js` — normalization, stopwords, phrase windowing.
- `analysis/aggregate.js` — counts, mood-language pairing, ternary
  classification over `balancedTernary` from `src/lib/ternary.js`.
- `analysis/drift.js` — baseline-vs-recent comparison; emits
  `{ added, rising, fading }`. Stability threshold `[TODO operator
  contribution]` — see §9.

**Invariant:** analysis runs only in decrypted memory. Plaintext tokens,
phrase indexes, and derived counts are **never written to disk outside of
an encrypted snapshot payload**.

**Drift baseline pairing (repository.js):**

| Current window | Baseline window | Drift shape |
|---|---|---|
| `recent-30d` | `mid-90d` (phraseCounts) | added / rising / fading populated |
| `mid-90d` | `long-all` (phraseCounts) | added / rising / fading populated |
| `long-all` | — | all empty (self-comparison undefined) |

Window ranges overlap in v1 (recent ⊂ mid ⊂ long); the drift read is
therefore "this bucket vs its enclosing bucket" rather than strictly
disjoint corpora. Phase 1.1 refinement is to subtract the inner window
from the baseline before computing G². Acceptable approximation for v1.

### 7. Session-key UX — U2 confirmed

- Passphrase unlock on first access per session.
- Derived data key held in a JS closure — no storage, no `sessionStorage`,
  no `localStorage`.
- **30-minute idle timeout** — key is zeroed from memory.
- Explicit "Lock now" button in the page header.
- Tab close / app restart forgets the key unconditionally.
- No recovery without the passphrase (this is the point — false recovery
  is false security).
- **WebAuthn-wrapped key** deferred to Phase 2 (platform-authenticator
  unlock via Windows Hello / Touch ID).

### 8. Retention — ternary horizon

Three user-visible horizons, all stored locally:

- **Recent** — 30 days
- **Mid** — 90 days (default view)
- **Long** — all-time

Retention is observational, not punitive: no auto-deletion. The operator
deletes. All three horizons derive from the same encrypted entry store.

### 9. Learning-mode contribution points

Two spots where the right answer depends on operator values, not
engineering. Hatake leaves these as `TODO operator` blocks with clear
alternatives:

1. **`privacy/redact.js`** — v1 redaction regexes for email / phone / URL
   are mechanical. But the operator has stronger personal rules for
   family names, locations, and IRIS-sensitive topics. Operator picks
   the additional rules. ~5–10 lines.
2. **`analysis/drift.js`** — RESOLVED 2026-04-18: **LLR** (Dunning's
   log-likelihood ratio, G²) chosen as the drift metric. Default
   threshold `DEFAULT_LLR_THRESHOLD = 10.83` (p < 0.001, one degree of
   freedom). Caller may override via `options.threshold`. Rationale:
   LLR handles small-frequency phrases robustly, needs no variance
   history, and is the classical NLP choice for "distinctive terms
   between corpora." Remaining values-call: `privacy/redact.js` extra
   redaction rules (still `TODO operator`).

### 10. Export / import

- **Canonical export (bundle v1):** a single JSON document. Individual
  record ciphertext+iv values are base64-encoded under keys
  `ciphertextB64` / `ivB64`; all other envelope fields are preserved
  verbatim. AES-GCM tag authentication is per-record (each envelope
  carries its own tag inside its ciphertext), which means tampering with
  any record invalidates that record's decrypt but not the whole bundle
  — parseImportBundle does a full decrypt-verify pass per record to
  enforce integrity.
  ```
  {
    schemaVersion: 1,
    bundleKind: 'self-mirror-v1',
    exportedAt: '2026-...ISO',
    kdfParams: { ... from mirror_meta.kdf-params ... } | null,
    entries:   [ { id, keyVersion, schemaVersion, createdDay, sourceKind,
                   ciphertextB64, ivB64 }, ... ],
    snapshots: [ { id, keyVersion, schemaVersion, updatedAt,
                   ciphertextB64, ivB64 }, ... ],
    meta:      [ { id, value, updatedAt }, ... ]
  }
  ```
- **Human-readable export (optional, opt-in, Phase 1.1):** redacted
  summary CSV/JSON through the same redaction pipeline used for display.
  Not in v1.
- **Import:** rejects mismatched `schemaVersion` or `bundleKind`, rejects
  any record whose AAD + ciphertext fails to round-trip decrypt with the
  provided key. Merges by id (last-writer-wins).

### 11. What this feature will never do

Standing doctrine guardrails, tested by CI assertion where possible:

- Never generate text in the operator's voice.
- Never pass decrypted entry text to any outbound network call.
- Never persist plaintext tokens, plaintext phrase indexes, or plaintext
  derived counts.
- Never add a model-inference dependency (no `@anthropic/sdk`, no
  `openai`, no `ollama-js` imports) in this feature tree.
- Never place IndexedDB indexes on payload fields.

## Alternatives considered

- **U1 (passphrase every launch):** rejected — friction punishes the
  reflection cadence Engram is built for.
- **U3 (`sessionStorage`-wrapped key):** rejected — measurable XSS
  attack-surface increase for negligible UX gain over U2.
- **U4 (WebAuthn immediately):** deferred — depends on platform
  authenticator availability across operator's devices; ships as Phase 2.
- **Raw IndexedDB:** rejected — disproportionate friction for a feature
  where the storage layer is not the differentiator. Dexie chosen.
- **Single aggregate snapshot:** rejected — coupled invalidation; three
  per-window snapshots rebuild independently.
- **N-gram generator (original seed):** rejected on ISO-doctrine grounds.
  Statistical self-model as input data = fine. Statistical self-model as
  output voice = doctrine breach.

## Audit trail

**Shino's intel (2026-04-17):** local checkout at `5c76757` matches
`origin/main` exactly. No drift.

**Saber's claim-audit (2026-04-17):** external reviewer fabricated four
repo-state claims across two rounds (routes `/chat` + `/engram`,
`scripts/update-docs.mjs`, `scripts/status.mjs`, package.json
`docs:check` wiring, `/insights/chat` redirect). All refuted against
live main. Reviewer's design recommendations retained on merit;
reviewer's repo-fact citation privileges suspended. Convergence on U2
(MAVERICK + reviewer, independently) noted as positive signal.

**Crystal's pre-flight (next):** encryption round-trip under
`fake-indexeddb`, tamper-detection under flipped envelope fields,
wrong-passphrase failure modes, idle-timeout key zeroing.

## Consequences

- One new devDependency on `dexie` (~40 KB gzipped, runtime).
- One new devDependency on `fake-indexeddb` (test-only).
- No runtime dependency on any LLM SDK from this feature tree.
- `/insights` route gains a secondary child; bottom nav unchanged.
- Schema + key versions stored from v1, so future migrations do not
  require a hard break.
- PBKDF2 @ 600k adds ~200–800 ms to unlock on modern hardware; benchmark
  on operator's actual devices before locking the default.

## 12. Clarifications (post-scaffold, 2026-04-17)

Added after Hatake's scaffold delivery to close ambiguities he flagged.

### 12.1 Passphrase entropy — location

Lives at `privacy/entropy.js`, exporting `scoreEntropy(passphrase) → number`
and `MIN_ENTROPY_SCORE = 3` (zxcvbn-style 0–4 scale, threshold enforced at
the unlock-form validator inside `SelfMirrorPage.jsx`). No external
`zxcvbn` dependency in v1 — a hand-rolled approximation based on charset
size + length is sufficient and avoids a 400 KB bundle cost. Upgrade to
real zxcvbn is a Phase 1.1 decision once bundle budget is measured.

### 12.2 AAD canonical byte form

The AAD passed into AES-GCM is the canonical JSON serialization of the
envelope field set for the record type, with **sorted keys** (lexicographic,
codepoint-ascending), emitted via `JSON.stringify(fields, sortedKeys)`,
UTF-8 encoded. Encode and decode must call the same canonicaliser — in
practice, a single non-exported `canonicaliseAad(fields)` inside
`storage/crypto.js` used by both `encryptPayload` and `decryptPayload`.

**Per-record-type field sets:**

| Record type | AAD fields |
|---|---|
| Entry envelope | `{ id, createdDay, sourceKind, keyVersion, schemaVersion }` |
| Snapshot envelope | `{ id, updatedAt, keyVersion, schemaVersion }` |

Callers supply the fields object; the crypto module canonicalises.
`undefined`-valued keys are elided by `JSON.stringify` (standard behaviour)
— repository.js is responsible for stripping or rejecting `undefined`
field values before calling `encryptPayload`, so that accidental shape
drift cannot silently invalidate AAD.

**Canonical signature contract for encrypt/decrypt (supersedes the
looser scaffold stub headers):**

```js
encryptPayload(key, payload, aadFields)  // aadFields: plain object, not bytes
decryptPayload(key, ciphertext, iv, aadFields)
```

The canonicaliser does not currently sort nested object keys recursively;
AAD field sets in v1 are flat. Introducing nested AAD requires revisiting
§12.2.

### 12.3 `mirror_meta` record shape

```
MirrorMetaRecord {
  id: string              // e.g. 'kdf-params', 'schema-version', 'key-epoch'
  value: unknown          // JSON-serialisable
  updatedAt: string       // ISO-8601
}
```

Not encrypted (these are operational parameters, not content).

### 12.4 Hook surface — snapshots plural

`useSelfMirror()` returns `{ unlocked, unlock, lock, snapshots, activeWindow,
setActiveWindow, error }` where `snapshots` is an object keyed by window id
(`recent`, `mid`, `long`). All three are primed eagerly on unlock; the
panel selects which one to display via `activeWindow`. This avoids a
per-tab reload round-trip and keeps decryption concentrated in a single
unlock transaction.

### 12.5a Test KDF iteration policy

Integration tests (repository.test.js, export.test.js) use a
`TEST_KDF_PARAMS = { ...DEFAULT_KDF_PARAMS, iterations: 1000 }` via
`__tests__/_helpers.js`. Rationale: those tests exercise orchestration
and round-trip integrity, not PBKDF2 hardness; at 600k iterations they
add ~5–8 s per run for zero added signal. The OWASP-floor 600k is still
exercised in `crypto.test.js` which uses `DEFAULT_KDF_PARAMS` directly.
Do not "normalise" test iterations upward — it is intentionally lowered.

### 12.5 Idle-watch cadence

Commit 1 uses a 1-minute `setInterval` poll for simplicity. Phase 1.1
refinement: replace with a debounced `setTimeout` re-armed on each
`bumpActivity()` call. Non-blocking — the 1-minute resolution is well
within the 30-minute timeout semantics.

## 13. Test plan (commit 2 scope)

Each `__tests__/*.test.js` file ships in commit 1 with `it.todo(...)`
placeholders matching this list. Commit 2 fills bodies.

### `schema.test.js`
- it.todo('SCHEMA_VERSION is a positive integer')
- it.todo('DEFAULT_KDF_PARAMS contains the five required fields')
- it.todo('WINDOW_IDS is frozen and enumerates recent/mid/long')
- it.todo('SOURCE_KINDS is frozen')

### `redact.test.js`
- it.todo('redacts a bare email address')
- it.todo('redacts an international phone number')
- it.todo('redacts an https URL')
- it.todo('does not redact plain text without matches')
- it.todo('applies URL before email before phone (order matters)')

### `crypto.test.js`
- it.todo('deriveKey produces the same CryptoKey for same passphrase + salt')
- it.todo('encrypt/decrypt round-trips a payload')
- it.todo('decrypt fails under the wrong passphrase')
- it.todo('decrypt fails under a tampered envelope field (AAD detects)')
- it.todo('zeroKey nulls the reference so post-zero decrypt attempts fail')

### `db.test.js`
- it.todo('opens all three object stores with correct indexes')
- it.todo('round-trips a MirrorEntryEnvelope by id')
- it.todo('queries entries by createdDay range')
- it.todo('resetDb clears all stores')
- it.todo('migrates from schemaVersion N to N+1 cleanly (placeholder)')

### `repository.test.js`
- it.todo('saveEntry encrypts payload and writes envelope')
- it.todo('loadWindow returns decrypted payloads for the correct date range')
- it.todo('rebuildSnapshots produces all three per-window snapshots')
- it.todo('exportEncrypted bundle round-trips via parseImportBundle')
- it.todo('never exposes plaintext tokens to the caller')

### `aggregate.test.js`
- it.todo('aggregates phrase counts within a window')
- it.todo('pairs mood labels with language buckets')
- it.todo('handles an empty window without throwing')
- it.todo('classifies intensity via balancedTernary')

### `drift.test.js`
- it.todo('identifies rising concepts against a baseline')
- it.todo('identifies fading concepts')
- it.todo('identifies newly-added concepts')
- it.todo('respects stability threshold (operator-chosen)')

## Follow-ups

- [ ] Operator runs `npm install` to pull `dexie` + `fake-indexeddb`.
- [ ] Benchmark PBKDF2 iterations on operator's primary devices.
- [ ] Operator fills the two `TODO operator` blocks (redact rules,
      drift threshold).
- [ ] Operator fills the entropy threshold + decides zxcvbn vs
      hand-rolled (§12.1).
- [ ] Crystal test suite reaches green (commit 2).
- [ ] Decide whether the existing journal should back-populate
      `mirror_entries` via a one-time encrypted-import pass, or stay
      independent. (Separate ADR when ready.)
- [ ] Phase 1.1: debounced idle-watch (§12.5), real zxcvbn if bundle
      budget allows.
- [ ] Phase 2: WebAuthn-wrapped data-key unlock.
