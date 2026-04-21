// ─────────────────────────────────────────────────────────────
// Self Mirror — WebCrypto wrapper.
// ─────────────────────────────────────────────────────────────
// AES-GCM 256 + PBKDF2-HMAC-SHA-256. AAD bindings make envelope
// fields tamper-evident — flipping a single envelope bit after
// write invalidates the tag and refuses decryption.
//
// AAD contract:
//   AAD is produced by `canonicaliseAad(fields)` — a non-exported
//   helper that sorts the object keys alphabetically, JSON-stringifies
//   the result, then UTF-8 encodes it. Encode and decode share this
//   one function so the byte representation cannot diverge.
//
//   An entry envelope typically binds:
//     { id, createdDay, sourceKind, keyVersion, schemaVersion }
//   A snapshot envelope typically binds:
//     { id, updatedAt, keyVersion, schemaVersion }
//   Callers choose the field set; crypto.js does not enforce the
//   shape — it only guarantees byte-stable canonicalization.
//
// This module is pure functions. It never touches IndexedDB.
// ─────────────────────────────────────────────────────────────

const IV_LENGTH_BYTES = 12;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Canonicalize an AAD fields object to stable bytes.
 *
 * Key order: alphabetical (Array#sort default — codepoint-ascending,
 * which is deterministic for the ASCII envelope field names the ADR
 * uses). JSON.stringify with a replacer array preserves that order
 * across engines. UTF-8 encoded.
 *
 * @param {Record<string, unknown>} fields
 * @returns {Uint8Array}
 */
function canonicaliseAad(fields) {
  if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new TypeError('aadFields must be a plain object');
  }
  const sortedKeys = Object.keys(fields).sort();
  const json = JSON.stringify(fields, sortedKeys);
  return textEncoder.encode(json);
}

/**
 * Resolve WebCrypto SubtleCrypto. Node test env (happy-dom + Node 20+)
 * provides `globalThis.crypto.subtle` out of the box. We fail loudly
 * rather than silently falling back, so the doctrine of "fail fast"
 * holds.
 *
 * @returns {SubtleCrypto}
 */
function subtle() {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error(
      'WebCrypto SubtleCrypto is unavailable; self-mirror cannot operate',
    );
  }
  return globalThis.crypto.subtle;
}

/**
 * Derive a data key from passphrase + salt under the given KDF
 * parameters. Output is a non-exportable CryptoKey bound to the
 * AES-GCM ops. Never serialize or log the returned key.
 *
 * @param {string} passphrase
 * @param {Uint8Array | ArrayBuffer} salt         >= 16 bytes.
 * @param {{kdf: 'PBKDF2', hash: 'SHA-256', iterations: number, aes: 'AES-GCM', keyLength: number}} kdfParams
 * @returns {Promise<CryptoKey>}                  non-extractable AES-GCM key.
 */
export async function deriveKey(passphrase, salt, kdfParams) {
  if (typeof passphrase !== 'string' || passphrase.length === 0) {
    throw new TypeError('passphrase must be a non-empty string');
  }
  const saltBytes = salt instanceof Uint8Array ? salt : new Uint8Array(salt);
  if (saltBytes.byteLength < 16) {
    throw new RangeError('salt must be at least 16 bytes');
  }
  if (!kdfParams || kdfParams.kdf !== 'PBKDF2' || kdfParams.aes !== 'AES-GCM') {
    throw new TypeError('kdfParams must specify PBKDF2 + AES-GCM');
  }

  const sub = subtle();
  const keyMaterial = await sub.importKey(
    'raw',
    textEncoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return sub.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: kdfParams.iterations,
      hash: kdfParams.hash,
    },
    keyMaterial,
    { name: 'AES-GCM', length: kdfParams.keyLength },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * AES-GCM encrypt a JSON-serializable payload. The AAD is the
 * canonical encoding of `aadFields` (see module header). Caller must
 * pass the same `aadFields` into `decryptPayload`.
 *
 * @param {CryptoKey} key
 * @param {unknown} payload                       JSON-serializable.
 * @param {Record<string, unknown>} aadFields     Envelope fields to bind.
 * @returns {Promise<{ ciphertext: Uint8Array, iv: Uint8Array }>}
 */
export async function encryptPayload(key, payload, aadFields) {
  const aadBytes = canonicaliseAad(aadFields);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const plaintext = textEncoder.encode(JSON.stringify(payload));
  const cipherBuf = await subtle().encrypt(
    { name: 'AES-GCM', iv, additionalData: aadBytes },
    key,
    plaintext,
  );
  return {
    ciphertext: new Uint8Array(cipherBuf),
    iv,
  };
}

/**
 * AES-GCM decrypt. Throws if the tag is invalid (wrong key, tampered
 * AAD fields, or tampered ciphertext). Return value is the parsed
 * JSON payload.
 *
 * @param {CryptoKey} key
 * @param {Uint8Array | ArrayBuffer} ciphertext
 * @param {Uint8Array | ArrayBuffer} iv
 * @param {Record<string, unknown>} aadFields
 * @returns {Promise<unknown>}
 */
export async function decryptPayload(key, ciphertext, iv, aadFields) {
  const aadBytes = canonicaliseAad(aadFields);
  const cipherBytes =
    ciphertext instanceof Uint8Array ? ciphertext : new Uint8Array(ciphertext);
  const ivBytes = iv instanceof Uint8Array ? iv : new Uint8Array(iv);
  const plainBuf = await subtle().decrypt(
    { name: 'AES-GCM', iv: ivBytes, additionalData: aadBytes },
    key,
    cipherBytes,
  );
  return JSON.parse(textDecoder.decode(plainBuf));
}

/**
 * Drop the JS-side CryptoKey reference. WebCrypto CryptoKeys are
 * opaque to JS, so we can't scrub their underlying bytes — mutating
 * `keyRef.current` to null is the strongest guarantee we can offer
 * and prevents further use via the shared ref. Paired with the
 * 30-min idle timer in store.js.
 *
 * @param {{ current: CryptoKey | null }} keyRef
 * @returns {void}
 */
export function zeroKey(keyRef) {
  if (!keyRef || typeof keyRef !== 'object') {
    throw new TypeError('zeroKey expects a { current } ref object');
  }
  keyRef.current = null;
}
