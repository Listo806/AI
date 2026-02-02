/**
 * WhatsApp helper utilities
 */

/**
 * Normalize phone to E.164 format: +1234567890
 * Handles input like "+1 (495) 345-1234" or "1-495-345-1234"
 * @param {string} phone - Raw phone string
 * @returns {string} E.164 format e.g. "+14953451234", or empty string if invalid
 */
export const normalizePhoneToE164 = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '';
  // US: 10 digits → +1xxx, 11 digits starting with 1 → +1xxx
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Other: assume already has country code
  return `+${digits}`;
};

/**
 * Build WhatsApp link with pre-filled message
 * @param {string} phone - Phone number (with country code, e.g., +1234567890) - agent's phone for properties, or lead's phone for leads
 * @param {object} propertyOrLead - Property object OR Lead object with phone and optional message
 * @returns {string} WhatsApp URL
 */
export const buildWhatsAppLink = (phone, propertyOrLead) => {
  let cleanPhone;
  let message;

  // If it's a lead object with phone property (for contacting the lead)
  if (propertyOrLead.phone) {
    // Use the lead's phone - normalize to E.164
    cleanPhone = normalizePhoneToE164(propertyOrLead.phone).replace(/^\+/, '') || propertyOrLead.phone.replace(/\D/g, '');
    message = propertyOrLead.message || `Hi ${propertyOrLead.name || ''}, I'm following up on your interest. How can I help you?`.trim();
  } 
  // If it's a property object
  else {
    if (!phone) {
      console.warn('No phone number provided for WhatsApp link');
      return '#';
    }
    // Normalize to E.164 then strip + for wa.me (wa.me/15551234567)
    const e164 = normalizePhoneToE164(phone);
    cleanPhone = e164 ? e164.replace(/^\+/, '') : phone.replace(/\D/g, '');
    
    // Build property address string
    const addressParts = [];
    if (propertyOrLead.address) addressParts.push(propertyOrLead.address);
    if (propertyOrLead.city) addressParts.push(propertyOrLead.city);
    if (propertyOrLead.state) addressParts.push(propertyOrLead.state);
    const address = addressParts.length > 0 ? addressParts.join(', ') : propertyOrLead.title || 'this property';

    // Build message
    message = `Hi, I'm interested in the property at ${address}. Is it still available?`;
  }
  
  // Build WhatsApp URL
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
