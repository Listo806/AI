import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

function Subscriptions() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('plans');
  const [user, setUser] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    price: '',
    seatLimit: '',
    paddlePriceId: '',
    isActive: true,
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      // Get plans from /api/subscriptions/plans (get all, not just active)
      const plansRes = await apiClient.get('/subscriptions/plans');
      setPlans(plansRes.data || []);
      
      // Get user's team subscription
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

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setActiveTab('my-subscriptions');
  };

  const handleCancel = async () => {
    if (!selectedSubscription) return;
    
    try {
      setError('');
      setSuccess('');
      await apiClient.post(`/subscriptions/${selectedSubscription.id}/cancel`, {
        immediately: cancelImmediately,
      });
      setSuccess(
        cancelImmediately
          ? 'Subscription canceled immediately.'
          : 'Subscription will be canceled at the end of the current period.'
      );
      setShowCancelConfirm(false);
      setSelectedSubscription(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const handleBillingPortal = async () => {
    if (!user?.teamId) {
      setError('Team ID not found');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      const response = await apiClient.post(`/subscriptions/team/${user.teamId}/billing-portal`);
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError('Failed to create billing portal session');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to access billing portal');
    }
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: '',
      description: '',
      price: '',
      seatLimit: '',
      paddlePriceId: '',
      isActive: true,
    });
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const payload = {
        name: planFormData.name.trim(),
        description: planFormData.description.trim() || undefined,
        price: parseFloat(planFormData.price),
        seatLimit: parseInt(planFormData.seatLimit),
        paddlePriceId: planFormData.paddlePriceId.trim() || undefined,
      };
      await apiClient.post('/subscriptions/plans', payload);
      setSuccess('Plan created successfully!');
      setShowPlanForm(false);
      resetPlanForm();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      setError('');
      setSuccess('');
      const payload = {
        name: planFormData.name.trim(),
        description: planFormData.description.trim() || undefined,
        price: planFormData.price ? parseFloat(planFormData.price) : undefined,
        seatLimit: planFormData.seatLimit ? parseInt(planFormData.seatLimit) : undefined,
        paddlePriceId: planFormData.paddlePriceId.trim() || undefined,
        isActive: planFormData.isActive,
      };
      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });
      await apiClient.put(`/subscriptions/plans/${editingPlan.id}`, payload);
      setSuccess('Plan updated successfully!');
      setEditingPlan(null);
      resetPlanForm();
      await fetchData();
      if (selectedPlan && selectedPlan.id === editingPlan.id) {
        await fetchPlanDetails(editingPlan.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await apiClient.delete(`/subscriptions/plans/${planId}`);
      setSuccess('Plan deleted successfully!');
      await fetchData();
      if (selectedPlan && selectedPlan.id === planId) {
        setSelectedPlan(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || '',
      seatLimit: plan.seatLimit || '',
      paddlePriceId: plan.paddlePriceId || '',
      isActive: plan.isActive !== undefined ? plan.isActive : true,
    });
    setShowPlanForm(false);
    setSelectedPlan(null);
  };

  const handleViewPlanDetails = async (plan) => {
    setSelectedPlan(plan);
    setEditingPlan(null);
    setShowPlanForm(false);
    await fetchPlanDetails(plan.id);
  };

  const fetchPlanDetails = async (planId) => {
    try {
      const response = await apiClient.get(`/subscriptions/plans/${planId}`);
      setSelectedPlan(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load plan details');
    }
  };

  const handleCancelPlanForm = () => {
    setShowPlanForm(false);
    setEditingPlan(null);
    resetPlanForm();
    setSelectedPlan(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: { bg: '#d4edda', color: '#155724' },
      past_due: { bg: '#fff3cd', color: '#856404' },
      canceled: { bg: '#f8d7da', color: '#721c24' },
      suspended: { bg: '#e2e3e5', color: '#383d41' },
      incomplete: { bg: '#d1ecf1', color: '#0c5460' },
      incomplete_expired: { bg: '#f8d7da', color: '#721c24' },
      trialing: { bg: '#d1ecf1', color: '#0c5460' },
      unpaid: { bg: '#f8d7da', color: '#721c24' },
      inactive: { bg: '#e2e3e5', color: '#383d41' },
    };
    return colors[status] || colors.inactive;
  };

  const formatStatus = (status) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Subscriptions</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ borderBottom: '1px solid #ddd' }}>
          <button
            onClick={() => {
              setActiveTab('plans');
              setSelectedSubscription(null);
              setSelectedPlan(null);
              setShowPlanForm(false);
              setEditingPlan(null);
            }}
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
            onClick={() => {
              setActiveTab('my-subscriptions');
              setSelectedSubscription(null);
              setSelectedPlan(null);
              setShowPlanForm(false);
              setEditingPlan(null);
            }}
            className="btn"
            style={{
              backgroundColor: activeTab === 'my-subscriptions' ? '#007bff' : '#6c757d',
              color: 'white',
            }}
          >
            My Subscriptions
          </button>
        </div>
        {activeTab === 'plans' && !showPlanForm && !editingPlan && !selectedPlan && (
          <button
            onClick={() => setShowPlanForm(true)}
            className="btn btn-primary"
          >
            Create Plan
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {activeTab === 'plans' && !showPlanForm && !editingPlan && !selectedPlan && (
        <div>
          <h2>Available Plans</h2>
          {plans.length === 0 ? (
            <div className="card">
              <p>No subscription plans available at the moment.</p>
              <button
                onClick={() => setShowPlanForm(true)}
                className="btn btn-primary"
                style={{ marginTop: '15px' }}
              >
                Create Your First Plan
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {plans.map((plan) => (
                <div key={plan.id} className="card" style={{ position: 'relative' }}>
                  {!plan.isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '4px 8px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>
                      Inactive
                    </div>
                  )}
                  <h3>{plan.name}</h3>
                  <p style={{ color: '#666', marginBottom: '15px' }}>{plan.description || 'No description'}</p>
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
                      ${parseFloat(plan.price).toFixed(2)}
                    </span>
                    <span style={{ color: '#666', marginLeft: '5px' }}>/month</span>
                  </div>
                  <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>Seat Limit:</strong> {plan.seatLimit} {plan.seatLimit === 1 ? 'seat' : 'seats'}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      className="btn btn-primary"
                      style={{ flex: 1, minWidth: '100px' }}
                      disabled={!plan.isActive}
                    >
                      {plan.isActive ? 'Subscribe' : 'Unavailable'}
                    </button>
                    <button
                      onClick={() => handleViewPlanDetails(plan)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="btn btn-sm btn-danger"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Plan Form */}
      {activeTab === 'plans' && showPlanForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create New Plan</h3>
          <form onSubmit={handleCreatePlan}>
            <div className="form-group">
              <label>Plan Name *</label>
              <input
                type="text"
                value={planFormData.name}
                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                required
                placeholder="e.g., Professional Plan"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={planFormData.description}
                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                rows="3"
                placeholder="Plan description..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Price (USD) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planFormData.price}
                  onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                  required
                  placeholder="99.00"
                />
              </div>
              <div className="form-group">
                <label>Seat Limit *</label>
                <input
                  type="number"
                  min="1"
                  value={planFormData.seatLimit}
                  onChange={(e) => setPlanFormData({ ...planFormData, seatLimit: e.target.value })}
                  required
                  placeholder="10"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Paddle Price ID (Optional)</label>
              <input
                type="text"
                value={planFormData.paddlePriceId}
                onChange={(e) => setPlanFormData({ ...planFormData, paddlePriceId: e.target.value })}
                placeholder="pri_xxxxx"
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Paddle price ID from your Paddle dashboard
              </small>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Create Plan
              </button>
              <button type="button" onClick={handleCancelPlanForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Plan Form */}
      {activeTab === 'plans' && editingPlan && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Edit Plan: {editingPlan.name}</h3>
          <form onSubmit={handleUpdatePlan}>
            <div className="form-group">
              <label>Plan Name *</label>
              <input
                type="text"
                value={planFormData.name}
                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={planFormData.description}
                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Price (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planFormData.price}
                  onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Seat Limit</label>
                <input
                  type="number"
                  min="1"
                  value={planFormData.seatLimit}
                  onChange={(e) => setPlanFormData({ ...planFormData, seatLimit: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Paddle Price ID (Optional)</label>
              <input
                type="text"
                value={planFormData.paddlePriceId}
                onChange={(e) => setPlanFormData({ ...planFormData, paddlePriceId: e.target.value })}
                placeholder="pri_xxxxx"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={planFormData.isActive}
                  onChange={(e) => setPlanFormData({ ...planFormData, isActive: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Active (plan is available for subscription)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                Update Plan
              </button>
              <button type="button" onClick={handleCancelPlanForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plan Details View */}
      {activeTab === 'plans' && selectedPlan && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Plan Details: {selectedPlan.name}</h3>
            <button
              onClick={() => setSelectedPlan(null)}
              className="btn btn-secondary"
            >
              Back to List
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <strong>Plan ID:</strong>
                <p style={{ marginTop: '5px', wordBreak: 'break-all' }}>{selectedPlan.id}</p>
              </div>
              <div>
                <strong>Name:</strong>
                <p style={{ marginTop: '5px' }}>{selectedPlan.name}</p>
              </div>
              <div>
                <strong>Description:</strong>
                <p style={{ marginTop: '5px' }}>{selectedPlan.description || 'N/A'}</p>
              </div>
              <div>
                <strong>Price:</strong>
                <p style={{ marginTop: '5px' }}>${parseFloat(selectedPlan.price).toFixed(2)}/month</p>
              </div>
              <div>
                <strong>Seat Limit:</strong>
                <p style={{ marginTop: '5px' }}>{selectedPlan.seatLimit}</p>
              </div>
              <div>
                <strong>Status:</strong>
                <div style={{ marginTop: '5px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: selectedPlan.isActive ? '#d4edda' : '#f8d7da',
                      color: selectedPlan.isActive ? '#155724' : '#721c24',
                    }}
                  >
                    {selectedPlan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div>
                <strong>Paddle Price ID:</strong>
                <p style={{ marginTop: '5px', wordBreak: 'break-all', fontSize: '12px' }}>
                  {selectedPlan.paddlePriceId || 'N/A'}
                </p>
              </div>
              <div>
                <strong>Created:</strong>
                <p style={{ marginTop: '5px' }}>
                  {new Date(selectedPlan.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <strong>Last Updated:</strong>
                <p style={{ marginTop: '5px' }}>
                  {new Date(selectedPlan.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleEditPlan(selectedPlan)}
              className="btn btn-primary"
            >
              Edit Plan
            </button>
            <button
              onClick={() => handleSubscribe(selectedPlan.id)}
              className="btn btn-success"
              disabled={!selectedPlan.isActive}
            >
              Subscribe to This Plan
            </button>
            <button
              onClick={() => handleDeletePlan(selectedPlan.id)}
              className="btn btn-danger"
            >
              Delete Plan
            </button>
          </div>
        </div>
      )}

      {activeTab === 'my-subscriptions' && !selectedSubscription && (
        <div>
          <h2>My Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <div className="card">
              <p>No active subscriptions found.</p>
              <p style={{ marginTop: '10px', color: '#666' }}>
                Subscribe to a plan to get started with your team.
              </p>
              <button
                onClick={() => setActiveTab('plans')}
                className="btn btn-primary"
                style={{ marginTop: '15px' }}
              >
                View Plans
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Plan ID</th>
                    <th>Status</th>
                    <th>Seat Limit</th>
                    <th>Period Start</th>
                    <th>Period End</th>
                    <th>Canceled At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td>{sub.planId || 'N/A'}</td>
                      <td>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            ...getStatusColor(sub.status),
                          }}
                        >
                          {formatStatus(sub.status)}
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
                      <td>
                        {sub.canceledAt
                          ? new Date(sub.canceledAt).toLocaleDateString()
                          : sub.cancelAtPeriodEnd ? 'End of Period' : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleViewDetails(sub)}
                            className="btn btn-sm btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            View Details
                          </button>
                          {user?.teamId && (
                            <button
                              onClick={handleBillingPortal}
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Billing Portal
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subscription Details View */}
      {activeTab === 'my-subscriptions' && selectedSubscription && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Subscription Details</h3>
            <button
              onClick={() => setSelectedSubscription(null)}
              className="btn btn-secondary"
            >
              Back to List
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <strong>Subscription ID:</strong>
                <p style={{ marginTop: '5px', wordBreak: 'break-all' }}>{selectedSubscription.id}</p>
              </div>
              <div>
                <strong>Plan ID:</strong>
                <p style={{ marginTop: '5px' }}>{selectedSubscription.planId || 'N/A'}</p>
              </div>
              <div>
                <strong>Status:</strong>
                <div style={{ marginTop: '5px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      ...getStatusColor(selectedSubscription.status),
                    }}
                  >
                    {formatStatus(selectedSubscription.status)}
                  </span>
                </div>
              </div>
              <div>
                <strong>Seat Limit:</strong>
                <p style={{ marginTop: '5px' }}>{selectedSubscription.seatLimit}</p>
              </div>
              <div>
                <strong>Current Period Start:</strong>
                <p style={{ marginTop: '5px' }}>
                  {selectedSubscription.currentPeriodStart
                    ? new Date(selectedSubscription.currentPeriodStart).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <strong>Current Period End:</strong>
                <p style={{ marginTop: '5px' }}>
                  {selectedSubscription.currentPeriodEnd
                    ? new Date(selectedSubscription.currentPeriodEnd).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <strong>Cancel at Period End:</strong>
                <p style={{ marginTop: '5px' }}>
                  {selectedSubscription.cancelAtPeriodEnd ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <strong>Canceled At:</strong>
                <p style={{ marginTop: '5px' }}>
                  {selectedSubscription.canceledAt
                    ? new Date(selectedSubscription.canceledAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <strong>Paddle Subscription ID:</strong>
                <p style={{ marginTop: '5px', wordBreak: 'break-all', fontSize: '12px' }}>
                  {selectedSubscription.paddleSubscriptionId || 'N/A'}
                </p>
              </div>
              <div>
                <strong>Paddle Customer ID:</strong>
                <p style={{ marginTop: '5px', wordBreak: 'break-all', fontSize: '12px' }}>
                  {selectedSubscription.paddleCustomerId || 'N/A'}
                </p>
              </div>
              <div>
                <strong>Created:</strong>
                <p style={{ marginTop: '5px' }}>
                  {new Date(selectedSubscription.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <strong>Last Updated:</strong>
                <p style={{ marginTop: '5px' }}>
                  {new Date(selectedSubscription.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            {user?.teamId && (
              <button
                onClick={handleBillingPortal}
                className="btn btn-primary"
              >
                Open Billing Portal
              </button>
            )}
            {selectedSubscription.status !== 'canceled' && !selectedSubscription.cancelAtPeriodEnd && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="btn btn-danger"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '20px' }}>
            <h3>Cancel Subscription</h3>
            <p>Are you sure you want to cancel this subscription?</p>
            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={cancelImmediately}
                  onChange={(e) => setCancelImmediately(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Cancel immediately (vs. at end of period)
              </label>
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                {cancelImmediately
                  ? 'Your subscription will be canceled immediately and you will lose access right away.'
                  : 'Your subscription will remain active until the end of the current billing period.'}
              </small>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleCancel}
                className="btn btn-danger"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelImmediately(false);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscriptions;
