/**
 * Phone number normalization utility
 * Converts phone numbers to E.164 format: +[country code][number]
 */

export class PhoneNormalizer {
  /**
   * Normalize phone number to E.164 format
   * @param phone - Raw phone number string
   * @returns Normalized E.164 phone number or null if invalid
   */
  static normalize(phone: string): string | null {
    if (!phone) {
      return null;
    }

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If it already starts with +, validate format
    if (cleaned.startsWith('+')) {
      // Remove + for validation
      const digits = cleaned.slice(1);
      if (digits.length >= 10 && digits.length <= 15) {
        return cleaned; // Already in E.164 format
      }
      return null; // Invalid length
    }

    // If no +, try to infer country code
    // For now, we'll require + prefix for E.164
    // If missing, we'll try common patterns

    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');

    // If it's 10 digits, assume US/Canada (+1)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // If it's 11 digits and starts with 1, assume US/Canada
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    // If it's 9-15 digits, assume it needs country code
    // For now, return null and require explicit + prefix
    // In production, you might want to use a library like libphonenumber-js
    if (cleaned.length >= 9 && cleaned.length <= 15) {
      // Try to detect common country codes
      // This is a simplified version - in production, use a proper library
      return null; // Require explicit + prefix
    }

    return null;
  }

  /**
   * Validate if phone number is in E.164 format
   * @param phone - Phone number to validate
   * @returns true if valid E.164 format
   */
  static isValidE164(phone: string): boolean {
    if (!phone) {
      return false;
    }

    // E.164 format: +[1-15 digits]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Clean phone number for WhatsApp URL (remove + and spaces)
   * @param phone - E.164 phone number
   * @returns Cleaned phone number for wa.me URL
   */
  static cleanForWhatsApp(phone: string): string {
    if (!phone) {
      return '';
    }

    // Remove + and any remaining non-digits
    return phone.replace(/[^\d]/g, '');
  }
}
