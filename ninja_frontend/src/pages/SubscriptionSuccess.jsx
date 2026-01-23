import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';

function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const sessionId = searchParams.get('session_id');
  const transactionId = location.state?.transactionId || searchParams.get('transaction_id');
  const subscriptionData = location.state?.subscription;

  useEffect(() => {
    // Clear checkout session data on success
    sessionStorage.removeItem('checkout_transactionId');
    sessionStorage.removeItem('checkout_url');
    localStorage.removeItem('checkout_planId');

    // If we have subscription data from state, use it
    if (subscriptionData) {
      setSubscription(subscriptionData);
      setLoading(false);
      return;
    }

    // Otherwise, try to fetch subscription details
    const fetchSubscription = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.teamId) {
            const response = await apiClient.get(`/subscriptions/team/${user.teamId}`);
            if (response.data) {
              setSubscription(response.data);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        // Don't show error, just continue
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [subscriptionData]);

  const handleGoToSubscriptions = () => {
    navigate('/subscriptions');
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '100px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Processing...</h2>
          <p>Please wait while we verify your subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '100px' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
        <h2 style={{ color: '#28a745', marginBottom: '10px' }}>Payment Successful!</h2>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Your subscription has been activated successfully.
        </p>

        {subscription && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'left',
          }}>
            <h3 style={{ marginTop: 0 }}>Subscription Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div>
                <strong>Status:</strong>
                <div style={{ marginTop: '5px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: subscription.status === 'active' ? '#d4edda' : '#f8d7da',
                      color: subscription.status === 'active' ? '#155724' : '#721c24',
                    }}
                  >
                    {subscription.status || 'active'}
                  </span>
                </div>
              </div>
              <div>
                <strong>Seat Limit:</strong>
                <p style={{ marginTop: '5px' }}>{subscription.seatLimit}</p>
              </div>
              {subscription.currentPeriodStart && (
                <div>
                  <strong>Period Start:</strong>
                  <p style={{ marginTop: '5px' }}>
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                  </p>
                </div>
              )}
              {subscription.currentPeriodEnd && (
                <div>
                  <strong>Period End:</strong>
                  <p style={{ marginTop: '5px' }}>
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {transactionId && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', fontSize: '12px' }}>
            <strong>Transaction ID:</strong> {transactionId}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: '20px' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleGoToSubscriptions}
            className="btn btn-primary"
          >
            View My Subscriptions
          </button>
          <button
            onClick={handleGoToDashboard}
            className="btn btn-secondary"
          >
            Go to Dashboard
          </button>
        </div>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          You will be redirected to the subscriptions page in a few seconds...
        </p>
      </div>
    </div>
  );
}

export default SubscriptionSuccess;
