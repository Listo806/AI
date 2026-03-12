/**
 * E.164 normalization before any lead/contact lookup or insert.
 * Spec: WHATSAPP-QR-ENTERPRISE-SPEC.md §17
 */

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Normalize Baileys JID or raw phone to E.164 when possible.
 * Returns null if cannot normalize safely.
 */
export function normalizeToE164(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  let s = input.trim();
  // Strip whatsapp: prefix if present
  s = s.replace(/^whatsapp:/i, '');
  // JID form: 1234567890@s.whatsapp.net
  const jidMatch = s.match(/^(\d+)@/);
  if (jidMatch) {
    const digits = jidMatch[1];
    if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  }
  // Already E.164
  if (E164_REGEX.test(s)) return s;
  // Digits only → prepend + if length valid
  const digitsOnly = s.replace(/\D/g, '');
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) return `+${digitsOnly}`;
  return null;
}

export function isValidE164(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return E164_REGEX.test(phone.trim());
}
