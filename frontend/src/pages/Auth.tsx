import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { authApi, AuthUser } from '../services/api';

interface AuthPageProps {
  mode: 'login' | 'register';
  onAuth: (user: AuthUser, token: string) => void;
}

/* ── SVG Icons (inline to avoid extra deps) ── */

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="auth-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const CheckIcon = () => (
  <svg className="auth-check-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({ mode, onAuth }) => {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  /* Reset state when mode changes */
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
    setSuccess(false);
    setShake(false);
  }, [mode]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = isRegister
        ? await authApi.register({ name, email, password })
        : await authApi.login({ email, password });

      setSuccess(true);

      /* Brief success animation before redirect */
      setTimeout(() => {
        onAuth(response.user, response.token);
        window.history.pushState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 900);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page" id="auth-page">
      <div className={`auth-panel auth-animate-in${shake ? ' auth-shake' : ''}`}>
        {/* ── Left: Animated Gradient Panel ── */}
        <div className="auth-copy">
          <div className="auth-copy-bg" aria-hidden="true">
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-orb auth-orb-3" />
          </div>
          <div className="auth-copy-content">
            <span className="auth-kicker">
              <span className="auth-kicker-dot" /> Upskill Account
            </span>
            <h1>{isRegister ? 'Start learning\ntoday' : 'Welcome\nback'}</h1>
            <p>
              {isRegister
                ? 'Create your student account and unlock thousands of expert-led courses, bootcamps, and learning paths.'
                : 'Sign in to continue your learning journey. Your progress, certificates, and bookmarks are waiting.'}
            </p>
            <div className="auth-stats" aria-hidden="true">
              <div className="auth-stat">
                <strong>12k+</strong>
                <span>Students</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <strong>200+</strong>
                <span>Courses</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <strong>4.9</strong>
                <span>Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Auth Form ── */}
        <div className="auth-form-wrapper">
          {success ? (
            <div className="auth-success" id="auth-success">
              <CheckIcon />
              <h2>{isRegister ? 'Account Created!' : 'Welcome Back!'}</h2>
              <p>Redirecting you to the dashboard...</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} ref={formRef} id="auth-form">
              <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
              <p className="auth-form-subtitle">
                {isRegister
                  ? 'Fill in your details to get started'
                  : 'Enter your credentials to continue'}
              </p>

              {/* Name (register only) */}
              {isRegister && (
                <div className="auth-field">
                  <label htmlFor="auth-name">Full Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div className="auth-field">
                <label htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>
                <div className="auth-password-wrapper">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isRegister ? 'Min 8 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    id="auth-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="auth-error" role="alert" id="auth-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                className="auth-submit"
                type="submit"
                disabled={isSubmitting}
                id="auth-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>

              {/* Switch mode link */}
              <p className="auth-switch">
                {isRegister ? 'Already have an account?' : 'New to Upskill?'}{' '}
                <a href={isRegister ? '/login' : '/register'}>
                  {isRegister ? 'Sign in' : 'Create an account'}
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
