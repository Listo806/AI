/**
 * E.164 normalization before any lead/contact lookup or insert.
 * Spec: WHATSAPP-QR-ENTERPRISE-SPEC.md §17
 */

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Normalize Baileys JID or raw phone to E.164 when possible.
 * Returns null if cannot normalize safely.
 */
export function normalizeToE164(
  input: string | null | undefined,
): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  let value = input.trim();

  value = value.replace(/^whatsapp:/i, "");

  /*
   * Baileys :
   *
   * 15190074595@s.whatsapp.net
   * 15190074595:3392@s.whatsapp.net
   *
   * The part after the colon ":" is the device ID, not the phone number.
   */
  if (value.includes("@")) {
    const jidUser = value.split("@")[0];
    const phonePart = jidUser.split(":")[0];
    const digits = phonePart.replace(/\D/g, "");

    if (digits.length >= 7 && digits.length <= 15) {
      return `+${digits}`;
    }

    return null;
  }
  if (E164_REGEX.test(value)) {
    return value;
  }
  const digitsOnly = value.replace(/\D/g, "");

  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  return null;
}

export function isValidE164(phone: string | null | undefined): boolean {
  if (!phone) {
    return false;
  }

  return E164_REGEX.test(phone.trim());
}
