import React, { FormEvent, useState } from 'react';
import { authApi, AuthUser } from '../services/api';

interface AuthPageProps {
  mode: 'login' | 'register';
  onAuth: (user: AuthUser, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode, onAuth }) => {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = isRegister
        ? await authApi.register({ name, email, password })
        : await authApi.login({ email, password });

      onAuth(response.user, response.token);
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="auth-kicker">Upskill Account</span>
          <h1>{isRegister ? 'Start learning today' : 'Welcome back'}</h1>
          <p>
            {isRegister
              ? 'Create your student account and keep your learning journey connected to the platform.'
              : 'Sign in to continue browsing courses and managing your learning profile.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{isRegister ? 'Register' : 'Login'}</h2>

          {isRegister && (
            <label>
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to Upskill?'}{' '}
            <a href={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Login' : 'Register'}
            </a>
          </p>
        </form>
      </div>
    </section>
  );
};

export default AuthPage;
