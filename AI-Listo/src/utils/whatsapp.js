/**
 * WhatsApp helper utilities
 */

/**
 * Build WhatsApp link with pre-filled message
 * @param {string} phone - Phone number (with country code, e.g., +1234567890)
 * @param {object} property - Property object
 * @returns {string} WhatsApp URL
 */
export const buildWhatsAppLink = (phone, property) => {
  if (!phone) {
    console.warn('No phone number provided for WhatsApp link');
    return '#';
  }

  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Build property address string
  const addressParts = [];
  if (property.address) addressParts.push(property.address);
  if (property.city) addressParts.push(property.city);
  if (property.state) addressParts.push(property.state);
  const address = addressParts.length > 0 ? addressParts.join(', ') : property.title || 'this property';

  // Build message
  const message = `Hi, I'm interested in the property at ${address}. Is it still available?`;
  
  // Build WhatsApp URL
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
