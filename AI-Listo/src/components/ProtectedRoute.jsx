import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userLocalePrefix } from '../i18n/funnelLocale';
import { isInternalAccount } from '../utils/internalAccess';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="app-splash">
        <div className="app-splash-word">CORTEXA</div>
        <div className="app-spinner" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/sign-in" replace />;
  }

  const verificationPending =
    String(user?.paymentStatus || '').toLowerCase() === 'paid_email_verification_pending' ||
    String(user?.accountStatus || '').toLowerCase() === 'paid_email_verification_pending';

  if (verificationPending && !isInternalAccount(user)) {
    return <Navigate to={`${userLocalePrefix(user)}/verify-email`} replace />;
  }

  // Launch flow: a browser login/JWT alone never unlocks the CRM. Customer
  // owners must have a backend-confirmed activation payment. The old Free-tier
  // bypass is intentionally not accepted by the current launch requirements.
  if (!isInternalAccount(user) && user?.role === 'owner') {
    const paymentStatus = String(user?.paymentStatus || '').toLowerCase();
    const paid = ['active', 'paid', 'trialing'].includes(paymentStatus);
    if (!paid) {
      const plan = String(user?.selectedPlan || '').trim();
      const prefix = userLocalePrefix(user);
      return <Navigate to={plan && plan.toLowerCase() !== 'free' ? `${prefix}/checkout?plan=${encodeURIComponent(plan)}` : `${prefix}/pricing`} replace />;
    }
  }

  return children;
}
