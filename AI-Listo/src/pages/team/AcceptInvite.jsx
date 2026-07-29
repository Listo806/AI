import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  lookupTeamInvitation,
  acceptTeamInvitation,
} from '../../api/platformApi';
import '../auth/Auth.css';

const STORAGE_PREFIX = 'listo_';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const { isAuthenticated, login, setUser, refreshUser } = useAuth();

  // Lookup state
  const [loadingLookup, setLoadingLookup] = useState(true);
  const [invite, setInvite] = useState(null); // { valid, email, teamName, role, expired }

  // Auth + accept state
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin'
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [joinedTeam, setJoinedTeam] = useState(null);

  const autoTried = useRef(false);

  /* ----------------------------------------------------------------
     1. Look up the invitation by token
  ---------------------------------------------------------------- */
  useEffect(() => {
    let active = true;
    if (!token) {
      setLoadingLookup(false);
      setInvite({ valid: false });
      return;
    }
    (async () => {
      try {
        const res = await lookupTeamInvitation(token);
        if (active) setInvite(res || { valid: false });
      } catch {
        if (active) setInvite({ valid: false });
      } finally {
        if (active) setLoadingLookup(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  /* ----------------------------------------------------------------
     Accept the invitation (assumes the user is authenticated)
  ---------------------------------------------------------------- */
  const doAccept = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await acceptTeamInvitation(token);
      setJoinedTeam(invite?.teamName || 'your team');
      try {
        await refreshUser?.();
      } catch {
        /* non-fatal */
      }
      setTimeout(() => navigate('/dashboard/team', { replace: true }), 1400);
      return res;
    } catch (err) {
      // The shared apiClient rewrites most 4xx bodies. The seat-limit message
      // carries a 🔒 and survives (err.isSubscriptionError); a plain 403 here
      // means the signed-in email does not match the invited address.
      let msg = err?.message || 'Could not accept this invitation.';
      if (err?.status === 403 && !err?.isSubscriptionError) {
        msg =
          'This invitation was sent to a different email. Please sign in with the invited email address.';
      }
      setError(msg);
      throw err;
    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------------------------------------------
     2. If valid + already authenticated → accept automatically (once)
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (loadingLookup) return;
    if (!invite?.valid) return;
    if (autoTried.current) return;
    if (isAuthenticated()) {
      autoTried.current = true;
      doAccept().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingLookup, invite]);

  /* ----------------------------------------------------------------
     3. Not authenticated → sign up (new) or sign in, then accept
  ---------------------------------------------------------------- */
  const handleAuthAndAccept = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const res = await apiClient.request('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: invite.email,
            password,
            role: 'agent',
          }),
        });
        if (res?.accessToken) {
          apiClient.setTokens(res.accessToken, res.refreshToken);
          localStorage.setItem(
            STORAGE_PREFIX + 'user',
            JSON.stringify(res.user),
          );
          setUser(res.user);
        } else {
          throw new Error('Could not create your account. Please try again.');
        }
      } else {
        // Authenticate without the built-in redirect so we can accept first.
        await login(invite.email, password, { redirect: false });
      }

      await doAccept();
    } catch (err) {
      // doAccept already set a friendly error; only override if none is set.
      setError((prev) => prev || err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------------------------------------------
     Render
  ---------------------------------------------------------------- */
  if (loadingLookup) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-badge">Cortexa AI OS</div>
          <h1 className="auth-title">Checking your invitation…</h1>
          <p className="auth-subtitle">One moment.</p>
        </div>
      </div>
    );
  }

  // Invalid / expired / already-used invitation
  if (!invite?.valid) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-badge">Cortexa AI OS</div>
          <h1 className="auth-title">Invitation unavailable</h1>
          <p className="auth-subtitle">
            {invite?.expired
              ? 'This invitation has expired. Ask the team owner to send a new one.'
              : 'This invitation is invalid or has already been used.'}
          </p>
          <p className="auth-footer" style={{ marginTop: 20 }}>
            <Link to="/sign-in">Go to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // Joined successfully
  if (joinedTeam) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-badge">Cortexa AI OS</div>
          <h1 className="auth-title">You've joined {joinedTeam}</h1>
          <div
            className="auth-error"
            style={{ background: '#f0fdf4', color: '#16a34a' }}
          >
            Taking you to your team workspace…
          </div>
          <p className="auth-footer" style={{ marginTop: 20 }}>
            <Link to="/dashboard/team">Go to team</Link>
          </p>
        </div>
      </div>
    );
  }

  // Valid + authenticated → accepting in progress (auto)
  if (isAuthenticated()) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-badge">Cortexa AI OS</div>
          <h1 className="auth-title">Join {invite.teamName || 'the team'}</h1>
          <p className="auth-subtitle">
            You were invited as <strong>{invite.role || 'agent'}</strong>.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="button"
            className="auth-submit"
            onClick={() => doAccept().catch(() => {})}
            disabled={busy}
          >
            {busy ? 'Joining…' : `Accept invitation`}
          </button>
        </div>
      </div>
    );
  }

  // Valid + NOT authenticated → sign up / sign in card
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">Cortexa AI OS</div>
        <h1 className="auth-title">Join {invite.teamName || 'the team'}</h1>
        <p className="auth-subtitle">
          You were invited as <strong>{invite.role || 'agent'}</strong>.{' '}
          {mode === 'signup'
            ? 'Create your account to join.'
            : 'Sign in to join.'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleAuthAndAccept} className="auth-form">
          <div className="auth-field">
            <label htmlFor="invite-email">Email</label>
            <input
              id="invite-email"
              type="email"
              value={invite.email || ''}
              readOnly
              disabled
            />
          </div>

          <div className="auth-field">
            <label htmlFor="invite-password">
              {mode === 'signup' ? 'Create a password' : 'Password'}
            </label>
            <input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
              disabled={busy}
              autoFocus
            />
          </div>

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy
              ? 'Joining…'
              : mode === 'signup'
                ? 'Create account & join'
                : 'Sign in & join'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 20 }}>
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setError('');
                  setMode('signin');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit',
                }}
              >
                Sign in instead
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setError('');
                  setMode('signup');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit',
                }}
              >
                Create an account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
