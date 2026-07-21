/**
 * E.164 normalization before any lead/contact lookup or insert.
 * Spec: WHATSAPP-QR-ENTERPRISE-SPEC.md §17
 */

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Normalize Baileys JID or raw phone to E.164 when possible.
 * Returns null if cannot normalize safely.
 */
export function normalizeToE164(
  input?: string | null,
): string | null {
  if (!input) {
    return null;
  }

  let value = String(input).trim();

  value = value.replace(/^whatsapp:/i, "");

  // JID
  if (value.includes("@")) {
    value = value.split("@")[0];
  }

  // Multi-device
  if (value.includes(":")) {
    value = value.split(":")[0];
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  return `+${digits}`;
}

export function isValidE164(
  phone?: string | null,
) {
  if (!phone) {
    return false;
  }

  return E164_REGEX.test(phone);
}
