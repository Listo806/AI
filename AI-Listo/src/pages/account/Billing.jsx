import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './account.css';

export default function Billing() {
  const { t } = useTranslation();
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
    alert(t('account.billing.updateCard') + ' - ' + t('common.loading'));
  };

  const handleChangePlan = () => {
    alert(t('account.billing.changePlan') + ' - ' + t('common.loading'));
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="account-title">{t('account.billing.title')}</h1>
        <p className="account-description">
          {t('account.billing.description')}
        </p>
      </div>

      {/* Current Plan */}
      <div className="billing-section">
        <h2 className="billing-section-title">{t('account.billing.currentPlan')}</h2>
        <div className="billing-plan-card">
          <div className="billing-plan-header">
            <div>
              <h3 className="billing-plan-name">{currentPlan.name}</h3>
              <p className="billing-plan-price">
                ${currentPlan.price} / {currentPlan.billingCycle === 'monthly' ? t('account.billing.month') : t('account.billing.year')}
              </p>
            </div>
            <span className="billing-status">{t('account.billing.active')}</span>
          </div>

          {/* Payment Method */}
          <div className="billing-payment-method">
            <div className="billing-payment-label">{t('account.billing.paymentMethod')}</div>
            <div className="billing-payment-info">
              {paymentMethod.brand} •••• {paymentMethod.last4}
            </div>
            <div className="billing-payment-info" style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              {t('account.billing.expires')} {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
            </div>
          </div>

          <div className="billing-actions">
            <button 
              className="account-btn-secondary"
              onClick={handleUpdateCard}
            >
              {t('account.billing.updateCard')}
            </button>
            <button 
              className="account-btn-primary"
              onClick={handleChangePlan}
            >
              {t('account.billing.changePlan')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
