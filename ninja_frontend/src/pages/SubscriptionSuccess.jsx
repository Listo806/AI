import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // The webhook should have already processed the payment
    // Just redirect to subscriptions page after a moment
    const timer = setTimeout(() => {
      navigate('/subscriptions');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '100px' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#28a745' }}>Payment Successful!</h2>
        <p>Your subscription has been activated.</p>
        <p>Redirecting to subscriptions page...</p>
        <button onClick={() => navigate('/subscriptions')} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Go to Subscriptions
        </button>
      </div>
    </div>
  );
}

export default SubscriptionSuccess;

