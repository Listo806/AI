import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  if (verificationPending && !['admin', 'super_admin', 'developer'].includes(String(user?.role || '').toLowerCase())) {
    const path = window.location.pathname;
    const prefix = path.startsWith('/es-ec/')
      ? '/es-ec'
      : path.startsWith('/es/')
        ? '/es'
        : path.startsWith('/pt/')
          ? '/pt'
          : '';
    return <Navigate to={`${prefix}/verify-email`} replace />;
  }

  return children;
}
