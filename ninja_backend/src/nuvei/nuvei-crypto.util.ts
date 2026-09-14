import * as crypto from 'crypto';

/**
 * AES-256-GCM at-rest encryption for the Nuvei/Paymentez card TOKEN.
 *
 * The Paymentez card token is a reusable payment reference (never the PAN/CVV,
 * which we never receive or store). Nuvei's integration guide nonetheless
 * requires the stored token to be encrypted at rest, so every token is sealed
 * with a key derived from NUVEI_TOKEN_ENC_KEY before it touches the database.
 *
 * Envelope format (self-describing, versioned):
 *   v1:<ivBase64>:<authTagBase64>:<ciphertextBase64>
 *
 * The key material may be supplied as 64 hex chars, a 32-byte base64 string, or
 * any passphrase (scrypt-stretched to 32 bytes). If no key is configured the
 * helpers throw, so a token is never persisted in the clear by accident.
 */

const VERSION = 'v1';

function resolveKey(secret: string | undefined): Buffer {
  const raw = String(secret || '').trim();
  if (!raw) {
    throw new Error(
      'NUVEI_TOKEN_ENC_KEY is not set; refusing to store a card token without encryption.',
    );
  }
  // 64 hex chars => exactly 32 bytes.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  // 32-byte base64 (44 chars incl. padding).
  try {
    const b = Buffer.from(raw, 'base64');
    if (b.length === 32) return b;
  } catch {
    /* fall through to scrypt */
  }
  // Any other passphrase: stretch deterministically to 32 bytes.
  return crypto.scryptSync(raw, 'cortexa-nuvei-token', 32);
}

export function encryptToken(plain: string, secret: string | undefined): string {
  const key = resolveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([
    cipher.update(String(plain), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    ct.toString('base64'),
  ].join(':');
}

export function decryptToken(sealed: string, secret: string | undefined): string {
  const key = resolveKey(secret);
  const parts = String(sealed || '').split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Malformed encrypted token envelope.');
  }
  const iv = Buffer.from(parts[1], 'base64');
  const tag = Buffer.from(parts[2], 'base64');
  const ct = Buffer.from(parts[3], 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/**
 * Stable, non-reversible fingerprint of a token so we can dedupe a customer's
 * saved cards without a unique index over the (randomly-IV'd) ciphertext.
 */
export function tokenFingerprint(plain: string): string {
  return crypto.createHash('sha256').update(String(plain)).digest('hex');
}
