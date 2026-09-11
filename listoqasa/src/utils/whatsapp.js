export function normalizePhoneToE164(value) {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  let cleaned = raw.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("00")) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15
      ? `+${digits}`
      : null;
  }

  const digits = cleaned.replace(/\D/g, "");

  // Ecuador local mobile/landline numbers: 0XXXXXXXXX -> +593XXXXXXXXX
  if (digits.startsWith("0") && digits.length >= 9) {
    const ec = digits.slice(1);
    return ec.length >= 8 && ec.length <= 10
      ? `+593${ec}`
      : null;
  }

  // Already includes Ecuador country code.
  if (digits.startsWith("593") && digits.length >= 11) {
    return `+${digits}`;
  }

  // Generic international digits fallback.
  return digits.length >= 8 && digits.length <= 15
    ? `+${digits}`
    : null;
}
