import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

/**
 * Public /view page: resolves token from query ?t=... via backend,
 * then redirects to the correct page (e.g. /listings/:id for property).
 */
export default function View() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'redirecting' | 'error'

  useEffect(() => {
    const t = searchParams.get('t');
    if (!t) {
      setStatus('error');
      return;
    }
    const resolve = async () => {
      try {
        const payload = await apiClient.request(`/whatsapp/webview-resolve?t=${encodeURIComponent(t)}`);
        if (payload?.type === 'property' && payload?.entityId) {
          setStatus('redirecting');
          navigate(`/listings/${payload.entityId}`, { replace: true });
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    };
    resolve();
  }, [searchParams, navigate]);

  if (status === 'loading' || status === 'redirecting') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <p style={{ color: '#64748b', margin: 0 }}>
          {status === 'loading' ? 'Verifying link…' : 'Opening property…'}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <p style={{ color: '#dc2626', margin: 0, textAlign: 'center' }}>
          This link is invalid or has expired.
        </p>
        <a href="/listings" style={{ marginTop: '16px', color: '#2563eb' }}>
          Browse listings
        </a>
      </div>
    );
  }

  return null;
}
