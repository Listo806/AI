import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

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

  return children;
}
