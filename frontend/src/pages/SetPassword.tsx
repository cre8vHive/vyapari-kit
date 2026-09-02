import React, { FormEvent, useEffect, useState } from 'react';
import { authApi, AuthUser } from '../services/api';

interface SetPasswordProps {
  onAuth: (user: AuthUser, token: string) => void;
}

const SetPassword: React.FC<SetPasswordProps> = ({ onAuth }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (!tokenParam) {
      setError('Missing password setup token. Please use the link from your email.');
    } else {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorList([]);

    if (!token) {
      setError('Missing setup token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authApi.setPassword({ token, password });
      setSuccess(true);
      if (result.user && result.token) {
        onAuth(result.user, result.token);
        // Redirect after a short delay
        setTimeout(() => {
          window.history.pushState(null, '', '/courses?tab=my');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 2000);
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setErrorList(data.errors);
        setError(data.message || 'Password does not meet requirements.');
      } else {
        setError(data?.message || 'Failed to set password. The link may be invalid or expired.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <svg className="auth-check-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Password Set Successfully!</h2>
          <p style={{ color: '#6b7280' }}>Your account is now active. You'll be redirected to your courses shortly...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0b6cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 0.75rem' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 style={{ margin: '0 0 0.25rem 0' }}>Set Your Password</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Create a password to activate your full account and manage your courses.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="sp-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="sp-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: '3rem' }}
              />
              <button
                type="button"
                className="auth-toggle-pw"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: 0,
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="sp-confirm">Confirm Password</label>
            <input
              id="sp-confirm"
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div className="auth-error" style={{ marginBottom: '12px' }}>
              {error}
              {errorList.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px', textAlign: 'left' }}>
                  {errorList.map((e, i) => (
                    <li key={i} style={{ fontSize: '13px' }}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={isSubmitting || !token}
            style={{ width: '100%', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Setting password...' : 'Set Password & Activate Account'}
          </button>
        </form>

        <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginTop: '1rem' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#0b6cff' }}>Log in</a>
        </p>
      </div>
    </div>
  );
};

export default SetPassword;
