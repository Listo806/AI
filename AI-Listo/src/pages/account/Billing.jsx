import { useState } from 'react';
import './account.css';

export default function Billing() {
  // Placeholder data - will be connected to backend in future phase
  const [currentPlan] = useState({
    name: 'AI CRM PRO+',
    price: 149.99,
    billingCycle: 'monthly',
    status: 'Active'
  });

  const [paymentMethod] = useState({
    brand: 'Visa',
    last4: '4242',
    expiryMonth: '12',
    expiryYear: '2025'
  });

  const handleUpdateCard = () => {
    alert('Update card functionality will be available in a future phase.');
  };

  const handleChangePlan = () => {
    alert('Change plan functionality will be available in a future phase.');
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="account-title">Billing</h1>
        <p className="account-description">
          Manage your subscription, payment method, and billing information.
        </p>
      </div>

      {/* Current Plan */}
      <div className="billing-section">
        <h2 className="billing-section-title">Current Plan</h2>
        <div className="billing-plan-card">
          <div className="billing-plan-header">
            <div>
              <h3 className="billing-plan-name">{currentPlan.name}</h3>
              <p className="billing-plan-price">
                ${currentPlan.price} / {currentPlan.billingCycle === 'monthly' ? 'month' : 'year'}
              </p>
            </div>
            <span className="billing-status">{currentPlan.status}</span>
          </div>

          {/* Payment Method */}
          <div className="billing-payment-method">
            <div className="billing-payment-label">Payment Method</div>
            <div className="billing-payment-info">
              {paymentMethod.brand} •••• {paymentMethod.last4}
            </div>
            <div className="billing-payment-info" style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
            </div>
          </div>

          <div className="billing-actions">
            <button 
              className="account-btn-secondary"
              onClick={handleUpdateCard}
            >
              Update Card
            </button>
            <button 
              className="account-btn-primary"
              onClick={handleChangePlan}
            >
              Change Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
