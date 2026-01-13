import { useState } from 'react';
import apiClient from '../api/apiClient';
import '../styles/ContactModal.css';

export default function ContactModal({ property, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Build property address for notes
      const addressParts = [];
      if (property.address) addressParts.push(property.address);
      if (property.city) addressParts.push(property.city);
      if (property.state) addressParts.push(property.state);
      const address = addressParts.length > 0 ? addressParts.join(', ') : property.title;

      // Create lead with property association
      const leadData = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        notes: formData.notes || `Interested in property: ${address}`,
        source: 'contact_form',
        status: 'new',
        propertyId: property.id, // Associate lead with property
      };

      // Use public endpoint for contact form (no auth required)
      const response = await apiClient.request('/leads/public', {
        method: 'POST',
        body: JSON.stringify(leadData),
      });

      setSuccess(true);
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(response);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit contact form');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="crm-modal-overlay" onClick={onClose}>
        <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="crm-modal-header">
            <h3>Success!</h3>
            <button className="crm-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="crm-modal-body">
            <p style={{ textAlign: 'center', padding: '20px', color: '#166534' }}>
              ✓ Your message has been sent. We'll get back to you soon!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <h3>Contact Agent</h3>
          <button className="crm-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="crm-modal-body">
          <p style={{ marginBottom: '20px', color: '#64748b' }}>
            Interested in <strong>{property.title}</strong>? Fill out the form below and we'll get back to you.
          </p>

          {error && (
            <div className="crm-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="crm-form">
            <div className="crm-form-field">
              <label htmlFor="contact-name">Name *</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Your full name"
              />
            </div>

            <div className="crm-form-field">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="crm-form-field">
              <label htmlFor="contact-phone">Phone</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="crm-form-field">
              <label htmlFor="contact-notes">Message</label>
              <textarea
                id="contact-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                disabled={loading}
                placeholder="Tell us about your interest in this property..."
              />
            </div>

            <div className="crm-form-actions">
              <button
                type="button"
                onClick={onClose}
                className="crm-btn crm-btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="crm-btn crm-btn-primary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
