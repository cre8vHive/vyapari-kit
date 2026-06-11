import React, { useEffect, useState } from 'react';
import CourseListing from './pages/CourseListing';
import Home from './pages/Home';
import AuthPage from './pages/Auth';
import { AuthUser, authApi } from './services/api';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem('upskill_auth_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('upskill_auth_token');
    if (!token) return;

    authApi.me()
      .then(({ user }) => {
        setUser(user);
        localStorage.setItem('upskill_auth_user', JSON.stringify(user));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('upskill_auth_user');
        localStorage.removeItem('upskill_auth_token');
      });
  }, []);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = basePath && currentPath.startsWith(basePath)
    ? currentPath.slice(basePath.length) || '/'
    : currentPath;
  const withBase = (path: string) => `${basePath}${path}`;
  const handleAuth = (nextUser: AuthUser, token: string) => {
    setUser(nextUser);
    localStorage.setItem('upskill_auth_user', JSON.stringify(nextUser));
    localStorage.setItem('upskill_auth_token', token);
  };
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('upskill_auth_user');
    localStorage.removeItem('upskill_auth_token');
  };

  return (
    <>
      <header className="site-header">
        <a className="site-brand" href={withBase('/')}>Upskill</a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href={withBase('/')}>Home</a>
          <a href={withBase('/courses')}>Course</a>
          <a href={withBase('/courses')}>Bootcamp</a>
          <a href={withBase('/')}>Page</a>
          <a href={withBase('/')}>Blog</a>
          <a href={withBase('/')}>Contact</a>
        </nav>
        {user ? (
          <div className="site-actions site-user-actions" aria-label="Account actions">
            <span className="site-user-name">{user.name}</span>
            <button className="site-action site-action-secondary" type="button" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className="site-actions" aria-label="Account actions">
            <a className="site-action site-action-secondary" href={withBase('/login')}>Login</a>
            <a className="site-action site-action-primary" href={withBase('/register')}>Register</a>
          </div>
        )}
      </header>
      <main>
        {path.startsWith('/login') && <AuthPage mode="login" onAuth={handleAuth} />}
        {path.startsWith('/register') && <AuthPage mode="register" onAuth={handleAuth} />}
        {path.startsWith('/courses') && <CourseListing />}
        {!path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/courses') && <Home />}
      </main>
    </>
  );
};

export default App;
