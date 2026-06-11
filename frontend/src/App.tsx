import React from 'react';
import CourseListing from './pages/CourseListing';
import Home from './pages/Home';

const App: React.FC = () => {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = basePath && window.location.pathname.startsWith(basePath)
    ? window.location.pathname.slice(basePath.length) || '/'
    : window.location.pathname;
  const withBase = (path: string) => `${basePath}${path}`;

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
        <div className="site-actions" aria-label="Account actions">
          <a className="site-action site-action-secondary" href={withBase('/')}>Login</a>
          <a className="site-action site-action-primary" href={withBase('/')}>Register</a>
        </div>
      </header>
      <main>
        {path.startsWith('/courses') ? <CourseListing /> : <Home />}
      </main>
    </>
  );
};

export default App;
