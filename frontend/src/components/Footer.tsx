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
          <div className="footer-col footer-brand" id="about-us">
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
              <li><a href={withBase('/about-us')}>About Us</a></li>
              <li><a href={withBase('/courses')}>Courses</a></li>
              <li><a href={withBase('/blog')}>Blog</a></li>
              <li><a href={withBase('/contact-us')}>Contact Us</a></li>
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
          <div className="footer-col footer-connect" id="contact-us">
            <h3 className="footer-heading">Connect</h3>
            <p className="footer-desc" style={{ marginBottom: '10px' }}>
              <a href="tel:9008778718" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'text-bottom' }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                +91 9008778718
              </a>
            </p>
            <div className="footer-socials">
              <a
                href="https://www.facebook.com/vyapaarKit1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a
                href="https://www.instagram.com/vyapaarkit"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
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
        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="footer-copyright">
            &copy; {currentYear} Vyapaar Kit. All rights reserved.
          </div>
          <div className="footer-credit" style={{ fontSize: '0.85em', opacity: 0.8 }}>
            Designed and developed by Cre8v Studio™
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
