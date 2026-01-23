/**
 * WhatsApp helper utilities
 */

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
    // Use the lead's phone instead of the agent's phone
    cleanPhone = propertyOrLead.phone.replace(/[\s\-\(\)]/g, '');
    message = propertyOrLead.message || `Hi ${propertyOrLead.name || ''}, I'm following up on your interest. How can I help you?`.trim();
  } 
  // If it's a property object
  else {
    if (!phone) {
      console.warn('No phone number provided for WhatsApp link');
      return '#';
    }
    cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
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
