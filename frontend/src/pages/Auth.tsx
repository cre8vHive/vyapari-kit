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

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
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

              {/* Social Buttons */}
              <div className="auth-social-row">
                <button type="button" className="auth-social-btn" id="auth-google-btn" title="Continue with Google (coming soon)" disabled>
                  <GoogleIcon />
                  <span>Google</span>
                </button>
                <button type="button" className="auth-social-btn" id="auth-github-btn" title="Continue with GitHub (coming soon)" disabled>
                  <GithubIcon />
                  <span>GitHub</span>
                </button>
              </div>

              <div className="auth-divider">
                <span>or continue with email</span>
              </div>

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
