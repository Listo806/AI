import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutData, setCheckoutData] = useState(null);
  const [paddleLoaded, setPaddleLoaded] = useState(false);

  // Get planId from query params or state
  const planId = new URLSearchParams(location.search).get('planId') || location.state?.planId;

  useEffect(() => {
    if (!planId) {
      setError('No plan selected');
      setLoading(false);
      return;
    }

    // Load Paddle.js script from CDN
    if (typeof window !== 'undefined' && window.Paddle) {
      setPaddleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      setPaddleLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load Paddle.js');
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [planId]);

  useEffect(() => {
    if (!paddleLoaded || !planId) return;

    const initializeCheckout = async () => {
      try {
        // Get Paddle environment and client token from backend
        const [configResponse, tokenResponse] = await Promise.all([
          apiClient.get('/payments/paddle/config/status'),
          apiClient.get('/payments/paddle/client-token'),
        ]);
        
        const { environment } = configResponse.data;
        const { clientToken } = tokenResponse.data;

        if (typeof window !== 'undefined' && window.Paddle && clientToken) {
          // Initialize Paddle.js with client token
          window.Paddle.Setup({
            environment: environment === 'production' ? 'production' : 'sandbox',
            token: clientToken,
          });

          // Get user's teamId (required for subscription creation)
          const userStr = localStorage.getItem('user');
          if (!userStr) {
            setError('User not found. Please login again.');
            setLoading(false);
            return;
          }
          
          const user = JSON.parse(userStr);
          if (!user.teamId) {
            setError('You must be part of a team to create a subscription. Please create or join a team first.');
            setLoading(false);
            return;
          }

          // Create checkout session (requires both planId and teamId)
          const response = await apiClient.post('/subscriptions', { 
            planId,
            teamId: user.teamId,
          });
          
          if (response.data.checkoutUrl) {
            // Extract transaction ID from checkout URL
            const url = new URL(response.data.checkoutUrl);
            const transactionId = url.searchParams.get('_ptxn');
            
            setCheckoutData({
              transactionId,
              subscription: response.data.subscription,
            });
            
            // Initialize Paddle checkout
            initializePaddleCheckout(transactionId);
          } else {
            setError('Failed to create checkout session');
            setLoading(false);
          }
        } else {
          setError('Failed to initialize Paddle.js');
          setLoading(false);
        }
      } catch (err) {
        console.error('Checkout initialization error:', err);
        setError(err.response?.data?.message || 'Failed to initialize checkout');
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [paddleLoaded, planId]);

  const initializePaddleCheckout = (transactionId) => {
    if (typeof window === 'undefined' || !window.Paddle || !transactionId) {
      setError('Paddle.js not initialized or transaction ID missing');
      setLoading(false);
      return;
    }

    try {
      // Open Paddle checkout overlay
      // Paddle.js v2 API
      if (window.Paddle && window.Paddle.Checkout) {
        window.Paddle.Checkout.open({
          transactionId: transactionId,
          settings: {
            displayMode: 'overlay',
            theme: 'light',
            locale: 'en',
            successUrl: `${window.location.origin}/subscription/success`,
            closeUrl: `${window.location.origin}/subscriptions`,
          },
          eventCallback: (event) => {
            console.log('Paddle event:', event);
            
            if (event.name === 'checkout.completed' || event.name === 'checkout.transaction.completed') {
              // Payment successful
              navigate('/subscription/success', { 
                state: { transactionId: event.data?.transactionId || transactionId } 
              });
            } else if (event.name === 'checkout.closed' || event.name === 'checkout.close') {
              // User closed checkout
              navigate('/subscriptions');
            } else if (event.name === 'checkout.error' || event.name === 'checkout.error.occurred') {
              setError(event.data?.message || 'Checkout error occurred');
              setLoading(false);
            }
          },
        });
      } else {
        // Fallback: redirect to Paddle checkout URL if overlay doesn't work
        const checkoutUrl = `https://pay.paddle.com/checkout?_ptxn=${transactionId}`;
        window.location.href = checkoutUrl;
      }

      setLoading(false);
    } catch (err) {
      console.error('Paddle checkout error:', err);
      setError('Failed to open checkout. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.Paddle && window.Paddle.Checkout) {
      window.Paddle.Checkout.close();
    }
    navigate('/subscriptions');
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="checkout-loading">
          <h2>Loading checkout...</h2>
          <p>Please wait while we prepare your payment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-container">
        <div className="checkout-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleClose} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        <div className="checkout-header">
          <h2>Complete Your Payment</h2>
          <button onClick={handleClose} className="checkout-close">×</button>
        </div>
        <div className="checkout-content">
          {checkoutData && (
            <div className="checkout-info">
              <p>Transaction ID: {checkoutData.transactionId}</p>
              <p>Paddle checkout overlay should open automatically...</p>
              <p>If it doesn't appear, please check your browser's popup blocker.</p>
              <button 
                onClick={() => {
                  const url = `https://pay.paddle.com/checkout?_ptxn=${checkoutData.transactionId}`;
                  window.open(url, '_blank');
                }}
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
              >
                Open Checkout in New Tab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Checkout;
