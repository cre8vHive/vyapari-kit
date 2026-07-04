import React, { useCallback, useEffect, useRef, useState } from 'react';
import CourseListing from './pages/CourseListing';
import Home from './pages/Home';
import AuthPage from './pages/Auth';
import PdfViewer from './pages/PdfViewer';
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';
import { AuthUser, authApi } from './services/api';
import vyapaarKitLogo from './assets/vyapaar-kit-logo.jpg';

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem('upskill_auth_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // ── Validate token on mount ──
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

  // ── Listen for session-expired event from API interceptor ──
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setSessionExpired(true);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  // ── Heartbeat: keep session alive while logged in ──
  useEffect(() => {
    if (!user) {
      // Clear heartbeat when not logged in
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    // Send immediate heartbeat, then every 30s
    const sendHeartbeat = () => {
      authApi.heartbeat().catch(() => {
        // If heartbeat fails (session expired), the response interceptor handles it
      });
    };

    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [user]);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = basePath && currentPath.startsWith(basePath)
    ? currentPath.slice(basePath.length) || '/'
    : currentPath;
  const withBase = (path: string) => `${basePath}${path}`;
  const courseViewerMatch = path.match(/^\/courses\/([^/]+)\/viewer$/);

  const handleAuth = (nextUser: AuthUser, token: string) => {
    setUser(nextUser);
    setSessionExpired(false);
    localStorage.setItem('upskill_auth_user', JSON.stringify(nextUser));
    localStorage.setItem('upskill_auth_token', token);
  };

  const handleLogout = useCallback(async () => {
    // Call backend to clear the session in MongoDB
    try {
      await authApi.logout();
    } catch {
      // Even if the backend call fails, clear local state
    }
    setUser(null);
    localStorage.removeItem('upskill_auth_user');
    localStorage.removeItem('upskill_auth_token');
  }, []);

  const handleSessionExpiredDismiss = () => {
    setSessionExpired(false);
    window.history.pushState(null, '', withBase('/login'));
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <>
      <header className="site-header">
        <a
          className="site-brand"
          href={withBase('/')}
          aria-label="Vyapaar Kit home"
          style={{ backgroundImage: `url(${vyapaarKitLogo})` }}
        />
        <nav className="site-nav" aria-label="Primary navigation">
          <a href={withBase('/')}>Home</a>
          <a href={withBase('/courses')}>Course</a>
          <a href={withBase('/courses')}>Bootcamp</a>
          <a href={withBase('/')}>Page</a>
          <a href={withBase('/')}>Blog</a>
          <a href={withBase('/')}>Contact</a>
          {user?.role === 'admin' && <a href={withBase('/admin')}>Admin</a>}
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
        {path.startsWith('/admin') && <AdminDashboard user={user} />}
        {courseViewerMatch && <PdfViewer courseId={courseViewerMatch[1]} />}
        {!path.startsWith('/admin') && !courseViewerMatch && path.startsWith('/courses') && <CourseListing />}
        {!path.startsWith('/admin') && !path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/courses') && <Home />}
      </main>
      
      <Footer />

      {/* ── Session Expired Modal ── */}
      {sessionExpired && (
        <div className="session-modal-backdrop" id="session-expired-modal">
          <div className="session-modal">
            <div className="session-modal-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Session Expired</h2>
            <p>Your session has ended. This can happen if you were inactive for too long or your account was logged out.</p>
            <button
              className="session-modal-btn"
              type="button"
              onClick={handleSessionExpiredDismiss}
              id="session-expired-signin-btn"
            >
              Sign In Again
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
