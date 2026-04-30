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
  const [planDetails, setPlanDetails] = useState(null);
  const [paddleLoaded, setPaddleLoaded] = useState(false);
  const [checkoutInitialized, setCheckoutInitialized] = useState(false);
  const [planId, setPlanId] = useState(null);

  // Get planId from query params, state, or localStorage
  useEffect(() => {
    const urlPlanId = new URLSearchParams(location.search).get('planId');
    const statePlanId = location.state?.planId;
    const storedPlanId = localStorage.getItem('checkout_planId');
    
    const currentPlanId = urlPlanId || statePlanId || storedPlanId;
    
    if (currentPlanId) {
      setPlanId(currentPlanId);
      // Store in localStorage as backup
      if (currentPlanId) {
        localStorage.setItem('checkout_planId', currentPlanId);
      }
    }
  }, [location]);

  // Cleanup localStorage on unmount or successful checkout
  useEffect(() => {
    return () => {
      // Don't clear on unmount, only clear after successful payment
      // This allows recovery if user navigates back
    };
  }, []);

  // Check if we're returning from payment redirect and restore data
  useEffect(() => {
    const storedTransactionId = sessionStorage.getItem('checkout_transactionId');
    const storedCheckoutUrl = sessionStorage.getItem('checkout_url');
    const storedPlanId = sessionStorage.getItem('checkout_planId') || localStorage.getItem('checkout_planId');
    
    if (storedTransactionId && storedCheckoutUrl) {
      // We're returning from payment, restore checkout data
      setCheckoutData({
        transactionId: storedTransactionId,
        checkoutUrl: storedCheckoutUrl,
      });
      if (storedPlanId && !planId) {
        setPlanId(storedPlanId);
      }
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (!planId) {
      // Check localStorage one more time
      const storedPlanId = localStorage.getItem('checkout_planId');
      if (storedPlanId) {
        setPlanId(storedPlanId);
        return;
      }
      
      // Only show error if we don't have checkout data either
      if (!checkoutData) {
        setError('No plan selected. Please select a plan from the subscriptions page.');
        setLoading(false);
      }
      return;
    }

    // Fetch plan details
    const fetchPlanDetails = async () => {
      try {
        const response = await apiClient.get(`/subscriptions/plans/${planId}`);
        setPlanDetails(response.data);
      } catch (err) {
        console.error('Failed to fetch plan details:', err);
        // Continue even if plan details fail
      }
    };

    fetchPlanDetails();

    // Try to load Paddle.js script from CDN (optional, won't block checkout)
    if (typeof window !== 'undefined' && window.Paddle) {
      setPaddleLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      script.onload = () => {
        // Wait a bit for Paddle to be fully ready
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.Paddle) {
            console.log('Paddle.js loaded successfully');
            setPaddleLoaded(true);
          } else {
            console.warn('Paddle.js script loaded but Paddle object not available');
            setPaddleLoaded(false);
          }
        }, 100);
      };
      script.onerror = () => {
        // Don't show error, just log it - checkout can proceed without Paddle.js
        console.log('Paddle.js failed to load, but checkout can proceed with direct URL');
        setPaddleLoaded(false);
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [planId]);

  useEffect(() => {
    if (!planId || checkoutInitialized) return;

    const initializeCheckout = async () => {
      try {
        setLoading(true);
        setError('');

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

        // Create checkout session first (this should work regardless of Paddle.js)
        const response = await apiClient.post('/subscriptions', { 
          planId,
          teamId: user.teamId,
        });
        
        if (response.data.checkoutUrl) {
          // Use transaction ID from backend response (preferred) or extract from URL as fallback
          let transactionId = response.data.transactionId;
          
          // Fallback: extract from URL if not provided by backend
          if (!transactionId) {
            try {
              const url = new URL(response.data.checkoutUrl);
              transactionId = url.searchParams.get('_ptxn');
            } catch (e) {
              console.warn('Could not extract transaction ID from URL:', e);
            }
          }
          
          setCheckoutData({
            transactionId,
            subscription: response.data.subscription,
            checkoutUrl: response.data.checkoutUrl,
          });
          
          // Store checkout data in sessionStorage for recovery
          sessionStorage.setItem('checkout_transactionId', transactionId);
          sessionStorage.setItem('checkout_url', response.data.checkoutUrl);
          if (planId) {
            sessionStorage.setItem('checkout_planId', planId);
            localStorage.setItem('checkout_planId', planId);
          }
          
          // Try to initialize Paddle.js if available (optional)
          try {
            const [configResponse, tokenResponse] = await Promise.all([
              apiClient.get('/payments/paddle/config/status').catch(() => null),
              apiClient.get('/payments/paddle/client-token').catch(() => null),
            ]);
            
            // Make sure Paddle.js is fully loaded before initializing
            if (configResponse?.data && typeof window !== 'undefined' && window.Paddle && (window.Paddle.Initialize || window.Paddle.Setup)) {
              const { environment, vendorId } = configResponse.data;
              
              // Get vendor ID from backend config or frontend env variable
              const frontendVendorId = import.meta.env.VITE_PADDLE_VENDOR_ID;
              const finalVendorId = vendorId || frontendVendorId;
              
              // Get client token from multiple sources (priority order):
              // 1. Frontend env variable (manually set from Paddle dashboard)
              // 2. Backend API endpoint
              const frontendClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
              const backendClientToken = tokenResponse?.data?.clientToken;
              const clientToken = frontendClientToken || backendClientToken;
              
              // Try to initialize with client token first (preferred method)
              if (clientToken) {
                try {
                  // Paddle.js v2 uses Initialize() method - only token is needed, no environment parameter
                  if (window.Paddle.Initialize) {
                    window.Paddle.Initialize({
                      token: clientToken,
                    });
                  } else if (window.Paddle.Setup) {
                    // Fallback to Setup() if Initialize() not available
                    window.Paddle.Setup({
                      token: clientToken,
                    });
                  }
                  console.log('Paddle.js initialized with client token', frontendClientToken ? '(from env)' : '(from backend)');
                  // Try to open Paddle checkout overlay
                  initializePaddleCheckout(transactionId);
                } catch (initError) {
                  console.error('Failed to initialize Paddle with client token:', initError);
                  setLoading(false);
                }
              } 
              // Fallback to vendor ID if client token not available
              else if (finalVendorId) {
                // Alternative initialization with vendor ID (Seller ID)
                const vendorIdNum = parseInt(finalVendorId);
                if (!isNaN(vendorIdNum)) {
                  try {
                    // Paddle.js v2 uses Initialize() with seller ID - only seller is needed, no environment parameter
                    if (window.Paddle.Initialize) {
                      window.Paddle.Initialize({
                        seller: vendorIdNum,
                      });
                    } else if (window.Paddle.Setup) {
                      // Fallback to Setup() if Initialize() not available
                      window.Paddle.Setup({
                        vendor: vendorIdNum,
                      });
                    }
                    console.log('Paddle.js initialized with vendor/seller ID:', vendorIdNum);
                    // Try to open Paddle checkout overlay
                    initializePaddleCheckout(transactionId);
                  } catch (initError) {
                    console.error('Failed to initialize Paddle with vendor ID:', initError);
                    setLoading(false);
                  }
                } else {
                  console.error('Invalid vendor ID format:', finalVendorId);
                  setLoading(false);
                }
              } else {
                console.log('Paddle.js not fully configured - missing both client token and vendor ID');
                console.log('Add PADDLE_VENDOR_ID to backend .env or VITE_PADDLE_VENDOR_ID to frontend .env');
                setLoading(false);
              }
            } else {
              // Paddle not configured, but checkout URL is available - user can proceed manually
              console.log('Paddle.js not configured, using direct checkout URL');
              setLoading(false);
            }
          } catch (paddleError) {
            // Paddle initialization failed, but we still have checkout URL
            console.log('Paddle initialization failed, but checkout URL is available:', paddleError);
            setLoading(false);
          }
          
          setCheckoutInitialized(true);
        } else {
          setError('Failed to create checkout session. Please try again.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Checkout initialization error:', err);
        setError(
          err.response?.data?.message || 
          'Failed to create checkout. Please ensure you have a team and try again.'
        );
        setLoading(false);
      }
    };

    // Wait a bit for Paddle.js to load if it's loading, but don't block on it
    if (paddleLoaded) {
      initializeCheckout();
    } else {
      // If Paddle.js hasn't loaded after 2 seconds, proceed anyway
      const timeout = setTimeout(() => {
        if (!checkoutInitialized) {
          initializeCheckout();
        }
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [paddleLoaded, planId, checkoutInitialized]);

  const initializePaddleCheckout = (transactionId) => {
    if (typeof window === 'undefined' || !window.Paddle || !transactionId) {
      console.warn('Paddle.js not initialized or transaction ID missing, using redirect checkout');
      if (checkoutData?.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        setLoading(false);
      }
      return;
    }

    // Validate transaction ID format (should start with 'txn_')
    if (!transactionId.startsWith('txn_')) {
      console.warn('Invalid transaction ID format:', transactionId, '- falling back to redirect');
      if (checkoutData?.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        setLoading(false);
      }
      return;
    }

    // Check if we have a valid checkout URL to fall back to
    const hasCheckoutUrl = checkoutData?.checkoutUrl;

    try {
      // Open Paddle checkout overlay (shows embedded payment form in modal)
      if (window.Paddle && window.Paddle.Checkout) {
        console.log('Attempting to open Paddle checkout overlay with transaction:', transactionId);
        
        // Wait a moment to ensure Paddle is fully ready
        setTimeout(() => {
          try {
            let overlayOpened = false;
            
            // Note: Paddle requires closeUrl and successUrl to be whitelisted in dashboard
            // If URLs are not whitelisted, omit them and let Paddle use dashboard defaults
            // Or use redirect checkout instead (which doesn't require URL validation)
            const checkoutSettings = {
              displayMode: 'overlay', // This shows the payment form in a modal overlay
              theme: 'light',
              locale: 'en',
            };
            
            // Only include URLs if they're whitelisted in Paddle dashboard
            // For now, we'll omit them to avoid validation errors
            // The checkout will use the URLs from the transaction or dashboard defaults
            // Uncomment these after whitelisting URLs in Paddle Dashboard:
            // checkoutSettings.successUrl = `${window.location.origin}/subscription/success`;
            // checkoutSettings.closeUrl = `${window.location.origin}/subscriptions`;
            
            window.Paddle.Checkout.open({
              transactionId: transactionId,
              settings: checkoutSettings,
              eventCallback: (event) => {
                console.log('Paddle checkout event:', event);
                
                if (event.name === 'checkout.completed' || event.name === 'checkout.transaction.completed') {
                  // Payment successful
                  overlayOpened = true;
                  navigate('/subscription/success', { 
                    state: { 
                      transactionId: event.data?.transactionId || transactionId,
                      subscription: checkoutData?.subscription,
                    } 
                  });
                } else if (event.name === 'checkout.closed' || event.name === 'checkout.close') {
                  // User closed checkout
                  overlayOpened = true;
                  navigate('/subscriptions');
                } else if (event.name === 'checkout.error' || event.name === 'checkout.error.occurred') {
                  console.error('Paddle checkout error:', event.data);
                  overlayOpened = true;
                  
                  // Check for specific error types
                  const errorMessage = event.data?.message || event.data?.details || 'An error occurred during checkout';
                  const errorCode = event.data?.code || '';
                  
                  // Handle "Seller is not active" error
                  if (errorMessage.includes('Seller is not active') || errorCode === 'seller_not_active') {
                    setError(
                      'Your Paddle seller account is not active. ' +
                      'Please activate your account in Paddle Dashboard → Settings → Account. ' +
                      'For sandbox accounts, make sure you have completed the account setup. ' +
                      'Using redirect checkout instead...'
                    );
                    // Automatically fall back to redirect checkout
                    if (hasCheckoutUrl) {
                      setTimeout(() => {
                        window.location.href = checkoutData.checkoutUrl;
                      }, 2000);
                    } else {
                      setLoading(false);
                    }
                    return;
                  }
                  
                  // For other errors, automatically fall back to redirect
                  if (hasCheckoutUrl) {
                    console.log('Overlay failed, falling back to redirect checkout');
                    setTimeout(() => {
                      window.location.href = checkoutData.checkoutUrl;
                    }, 1000);
                  } else {
                    setError(errorMessage + '. Please use the redirect option below.');
                    setLoading(false);
                  }
                } else if (event.name === 'checkout.loaded') {
                  console.log('Paddle checkout overlay loaded successfully');
                  overlayOpened = true;
                  setLoading(false);
                } else if (event.name === 'checkout.warning') {
                  console.warn('Paddle checkout warning:', event.data);
                }
              },
            });
            
            // Monitor for 400 errors via network or timeout
            // If overlay doesn't load within 2 seconds, it likely failed
            setTimeout(() => {
              if (!overlayOpened) {
                console.warn('Paddle overlay may have failed (no events received). Falling back to redirect.');
                // Check if there was a network error (400)
                // If we have a checkout URL, use redirect instead
                if (hasCheckoutUrl) {
                  console.log('Using redirect checkout as fallback');
                  window.location.href = checkoutData.checkoutUrl;
                } else {
                  setLoading(false);
                }
              }
            }, 2000);
          } catch (openError) {
            console.error('Failed to open Paddle checkout overlay:', openError);
            // Automatically fall back to redirect if overlay fails
            if (hasCheckoutUrl) {
              console.log('Overlay initialization failed, using redirect checkout');
              window.location.href = checkoutData.checkoutUrl;
            } else {
              setError('Failed to open checkout overlay. Please use the "Complete Payment" button below.');
              setLoading(false);
            }
          }
        }, 500); // Wait 500ms for Paddle to be fully ready
      } else {
        console.warn('Paddle.Checkout not available, using redirect');
        if (hasCheckoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Paddle checkout overlay error:', err);
      // Automatically fall back to redirect
      if (hasCheckoutUrl) {
        console.log('Error initializing overlay, using redirect checkout');
        window.location.href = checkoutData.checkoutUrl;
      } else {
        setError('Checkout overlay failed. Please use the "Complete Payment" button below.');
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    // Clear stored checkout data
    localStorage.removeItem('checkout_planId');
    sessionStorage.removeItem('checkout_transactionId');
    sessionStorage.removeItem('checkout_url');
    
    if (typeof window !== 'undefined' && window.Paddle && window.Paddle.Checkout) {
      window.Paddle.Checkout.close();
    }
    navigate('/subscriptions');
  };

  const handleOpenCheckout = () => {
    if (checkoutData?.checkoutUrl) {
      // Store checkout data in sessionStorage before redirecting
      if (checkoutData.transactionId) {
        sessionStorage.setItem('checkout_transactionId', checkoutData.transactionId);
      }
      if (checkoutData.checkoutUrl) {
        sessionStorage.setItem('checkout_url', checkoutData.checkoutUrl);
      }
      if (planId) {
        sessionStorage.setItem('checkout_planId', planId);
        localStorage.setItem('checkout_planId', planId);
      }
      
      // Log the checkout URL for debugging
      console.log('Redirecting to Paddle checkout:', checkoutData.checkoutUrl);
      console.log('Transaction ID:', checkoutData.transactionId);
      
      // Open in same window - this will take user to Paddle's hosted checkout page
      // The user will complete payment there, then be redirected back
      window.location.href = checkoutData.checkoutUrl;
    } else if (checkoutData?.transactionId) {
      // Store data before redirecting
      sessionStorage.setItem('checkout_transactionId', checkoutData.transactionId);
      if (planId) {
        sessionStorage.setItem('checkout_planId', planId);
        localStorage.setItem('checkout_planId', planId);
      }
      // Construct Paddle checkout URL with transaction ID
      const url = `https://pay.paddle.com/checkout?_ptxn=${checkoutData.transactionId}`;
      console.log('Redirecting to Paddle checkout with transaction ID:', url);
      window.location.href = url;
    } else {
      setError('Checkout URL not available. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="checkout-loading">
          <h2>Loading checkout...</h2>
          <p>Please wait while we prepare your payment</p>
          {planDetails && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px', maxWidth: '400px', margin: '20px auto 0' }}>
              <h3 style={{ marginTop: 0 }}>{planDetails.name}</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', margin: '10px 0' }}>
                ${parseFloat(planDetails.price).toFixed(2)}/month
              </p>
              <p style={{ margin: '5px 0' }}>Seat Limit: {planDetails.seatLimit}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error && !checkoutData) {
    return (
      <div className="checkout-container">
        <div className="checkout-error">
          <h2>Error</h2>
          <p>{error}</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleClose} className="btn btn-primary">
              Go Back to Subscriptions
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        <div className="checkout-header">
          <h2>Complete Your Payment</h2>
          <button onClick={handleClose} className="checkout-close" title="Close">×</button>
        </div>
        <div className="checkout-content">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}
          
          {planDetails && (
            <div className="checkout-info" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Plan Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <strong>Plan:</strong> {planDetails.name}
                </div>
                <div>
                  <strong>Price:</strong> ${parseFloat(planDetails.price).toFixed(2)}/month
                </div>
                <div>
                  <strong>Seat Limit:</strong> {planDetails.seatLimit} {planDetails.seatLimit === 1 ? 'seat' : 'seats'}
                </div>
                <div>
                  <strong>Description:</strong> {planDetails.description || 'N/A'}
                </div>
              </div>
            </div>
          )}

          {checkoutData && (
            <div className="checkout-info">
              <p><strong>Transaction ID:</strong> {checkoutData.transactionId || 'N/A'}</p>
              
              {/* Explanation about Paddle vs Stripe */}
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px', fontSize: '14px' }}>
                <strong>About Paddle Checkout:</strong>
                <p style={{ marginTop: '8px', marginBottom: 0 }}>
                  Unlike Stripe (which shows embedded payment forms), Paddle uses a <strong>hosted checkout page</strong> or an <strong>overlay modal</strong>.
                  When you click "Complete Payment", you'll be taken to Paddle's secure payment page where you can enter your payment details.
                </p>
                {checkoutData?.transactionId && (
                  <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '12px', fontFamily: 'monospace' }}>
                    Transaction ID: {checkoutData.transactionId}
                  </p>
                )}
              </div>
              
              {/* Debug info about Paddle configuration */}
              {typeof window !== 'undefined' && !window.Paddle && (
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>⚠️ Paddle.js Not Configured:</strong>
                  <p style={{ marginTop: '8px', marginBottom: 0 }}>
                    To enable the overlay checkout (embedded payment form), you need to configure Paddle in your backend:
                  </p>
                  <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                    <li>Add <code>PADDLE_API_KEY</code> to your backend .env file (starts with <code>test_</code> for sandbox or <code>live_</code> for production)</li>
                    <li>Add <code>PADDLE_ENVIRONMENT=sandbox</code> (or <code>production</code>)</li>
                    <li>Restart your backend server</li>
                  </ul>
                  <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '12px' }}>
                    <strong>Note:</strong> Currently using hosted checkout (redirect). This works fine, but the overlay provides a better user experience.
                  </p>
                </div>
              )}
              
              {/* Troubleshooting info if overlay fails */}
              {error && error.includes('checkout') && (
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>💡 Troubleshooting Checkout Overlay:</strong>
                  <p style={{ marginTop: '8px', marginBottom: 0 }}>
                    If the overlay shows "Something went wrong", try:
                  </p>
                  <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                    <li>Verify your domain is added in Paddle Dashboard → Settings → Domains</li>
                    <li>Check that the transaction exists in Paddle Dashboard</li>
                    <li>Use the "Complete Payment" button below to redirect to Paddle's hosted checkout (this always works)</li>
                    <li>Check browser console for detailed error messages</li>
                  </ul>
                </div>
              )}

              <p style={{ marginTop: '15px' }}>
                {typeof window !== 'undefined' && window.Paddle 
                  ? 'The Paddle checkout overlay (payment form modal) should open automatically. If it doesn\'t appear, click the button below to open the payment page.'
                  : 'Click the button below to complete your payment on Paddle\'s secure checkout page.'}
              </p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleOpenCheckout}
                  className="btn btn-primary"
                  style={{ fontSize: '16px', padding: '12px 24px' }}
                >
                  Complete Payment
                </button>
                <button 
                  onClick={handleClose}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
              {typeof window !== 'undefined' && window.Paddle && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>Note:</strong> If the overlay doesn't open automatically, it may be because Paddle.js isn't fully configured. 
                  Click "Complete Payment" to open the payment page directly. Make sure popup blockers are disabled for this site.
                </div>
              )}
              {typeof window !== 'undefined' && !window.Paddle && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>Note:</strong> Paddle.js overlay is not available. You'll be redirected to Paddle's hosted checkout page to complete payment.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Checkout;
