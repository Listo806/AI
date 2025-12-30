import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

function Subscriptions() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get plans from /api/subscriptions/plans
      const plansRes = await apiClient.get('/subscriptions/plans');
      setPlans(plansRes.data);
      
      // Get user's team subscription
      // First, get user info to find teamId
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.teamId) {
          try {
            const subsRes = await apiClient.get(`/subscriptions/team/${user.teamId}`);
            // Wrap in array for consistency with UI
            setSubscriptions(subsRes.data ? [subsRes.data] : []);
          } catch (err) {
            // Team might not have subscription yet
            if (err.response?.status === 404) {
              setSubscriptions([]);
            } else {
              throw err;
            }
          }
        } else {
          setSubscriptions([]);
        }
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setError('');
      // Navigate to custom checkout page
      navigate(`/checkout?planId=${planId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subscription');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Subscriptions</h1>
      
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('plans')}
          className="btn"
          style={{
            marginRight: '10px',
            backgroundColor: activeTab === 'plans' ? '#007bff' : '#6c757d',
            color: 'white',
          }}
        >
          Plans
        </button>
        <button
          onClick={() => setActiveTab('my-subscriptions')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'my-subscriptions' ? '#007bff' : '#6c757d',
            color: 'white',
          }}
        >
          My Subscriptions
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'plans' && (
        <div>
          <h2>Available Plans</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {plans.map((plan) => (
              <div key={plan.id} className="card">
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
                  ${plan.price}
                </p>
                <p>Seat Limit: {plan.seatLimit}</p>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'my-subscriptions' && (
        <div>
          <h2>My Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <p>No subscriptions found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Seat Limit</th>
                  <th>Period Start</th>
                  <th>Period End</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.planId}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            sub.status === 'active' ? '#d4edda' : '#f8d7da',
                          color: sub.status === 'active' ? '#155724' : '#721c24',
                        }}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td>{sub.seatLimit}</td>
                    <td>
                      {sub.currentPeriodStart
                        ? new Date(sub.currentPeriodStart).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Subscriptions;

