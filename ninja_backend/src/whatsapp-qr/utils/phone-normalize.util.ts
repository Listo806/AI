/**
 * E.164 normalization before any lead/contact lookup or insert.
 * Spec: WHATSAPP-QR-ENTERPRISE-SPEC.md §17
 */

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

function extractJidUser(value: string): string {
  const beforeDomain = value.split("@")[0] || "";

  return beforeDomain.split(":")[0] || "";
}

export function normalizeToE164(
  input?: string | null,
): string | null {
  if (!input) {
    return null;
  }

  let value = String(input).trim();

  if (!value) {
    return null;
  }

  value = value.replace(/^whatsapp:/i, "");

  if (/@lid$/i.test(value)) {
    return null;
  }

  if (
    /@g\.us$/i.test(value) ||
    /@broadcast$/i.test(value) ||
    /@newsletter$/i.test(value)
  ) {
    return null;
  }

  if (value.includes("@")) {
    value = extractJidUser(value);
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  const normalized = `+${digits}`;

  return E164_REGEX.test(normalized)
    ? normalized
    : null;
}

export function normalizePhoneDigits(
  input?: string | null,
): string | null {
  const normalized = normalizeToE164(input);

  return normalized
    ? normalized.slice(1)
    : null;
}

export function isValidE164(
  input?: string | null,
): boolean {
  return normalizeToE164(input) !== null;
}