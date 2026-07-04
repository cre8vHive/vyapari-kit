import React from 'react';
import './Footer.css';
import vyapaarKitLogo from '../assets/vyapaar-kit-logo.jpg';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const withBase = (path: string) => `${basePath}${path}`;

  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        <div className="site-footer-grid">
          {/* Column 1: Brand */}
          <div className="footer-col footer-brand">
            <a href={withBase('/')} className="footer-logo" aria-label="Vyapaar Kit home">
              <img src={vyapaarKitLogo} alt="Vyapaar Kit" />
            </a>
            <p className="footer-desc">
              Empowering businesses with cutting-edge tools to streamline operations, enhance growth, and achieve success in the modern digital landscape.
            </p>
          </div>

          {/* Column 2: Company */}
          <div className="footer-col">
            <h3 className="footer-heading">Company</h3>
            <ul className="footer-links">
              <li><a href={withBase('/about')}>About Us</a></li>
              <li><a href={withBase('/courses')}>Courses</a></li>
              <li><a href={withBase('/blog')}>Blog</a></li>
              <li><a href={withBase('/contact')}>Contact Us</a></li>
            </ul>
          </div>

          {/* Column 3: Helpful Links */}
          <div className="footer-col">
            <h3 className="footer-heading">Helpful Links</h3>
            <ul className="footer-links">
              <li><a href={withBase('/privacy')}>Privacy Policy</a></li>
              <li><a href={withBase('/terms')}>Terms & Conditions</a></li>
              <li><a href={withBase('/refund')}>Refund Policy</a></li>
              <li><a href={withBase('/faq')}>FAQ</a></li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div className="footer-col footer-connect">
            <h3 className="footer-heading">Connect</h3>
            <div className="footer-socials">
              <a href="#" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="#" aria-label="X/Twitter">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            </div>

            <form className="footer-newsletter" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input type="email" id="newsletter-email" placeholder="Enter your email" required />
              <button type="submit" aria-label="Subscribe to newsletter">Subscribe</button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {currentYear} Vyapaar Kit. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
