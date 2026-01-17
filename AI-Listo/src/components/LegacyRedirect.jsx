import { Navigate, useParams } from 'react-router-dom';

export function LegacyPropertyRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/properties/${id}`} replace />;
}

export function LegacyLeadRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/leads/${id}`} replace />;
}
