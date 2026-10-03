import React from 'react';

export interface HeroSectionProps {
  eyebrow?: string;
  headline?: string;
  subheading?: string;
  primaryButton?: {
    text: string;
    link: string;
  };
  secondaryButton?: {
    text: string;
    link: string;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  primaryButton,
  secondaryButton,
}) => {
  const handleScrollToPackages = (e: React.MouseEvent) => {
    e.preventDefault();
    const pkgSection =
      document.querySelector('.vyapaar-pkg-grid') ||
      document.querySelector('.elementor-element-1438c1b');
    if (pkgSection) {
      pkgSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = '/courses';
    }
  };

  const primaryBtnText = primaryButton?.text || 'Explore Business Solutions';
  const primaryBtnLink = primaryButton?.link || '/courses';
  const secondaryBtnText = secondaryButton?.text || "See What's Inside";

  return (
    <section className="vyapaar-hero-section">
      <div className="vyapaar-hero-container">
        {/* Left Column (Content) */}
        <div className="vyapaar-hero-left">
          {/* Eyebrow */}
          <div className="vyapaar-hero-eyebrow">
            IDEAS <span>→</span> PLAYBOOKS <span>→</span> PLANS <span>→</span> GROWTH
          </div>

          {/* Headline */}
          <h1 className="vyapaar-hero-headline">
            <span className="hero-headline-line">Everything You Need</span>
            <span className="hero-headline-line hero-headline-blue">to Start &amp; Grow</span>
            <span className="hero-headline-line hero-underline-wrapper">
              Your Business
              <svg
                className="hero-sketch-underline"
                viewBox="0 0 240 14"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M3 10C65 3.5 175 3.5 237 9"
                  stroke="#0066ff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Subheading */}
          <p className="vyapaar-hero-subheading">
            Ready-to-use business playbooks, plans &amp; kits — built to save you time and help you move faster.
          </p>

          {/* Feature Badges */}
          <div className="vyapaar-hero-badges">
            <div className="vyapaar-hero-badge">
              <div className="hero-badge-icon badge-icon--lightning">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#0284c7">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="hero-badge-label">Instant Access</span>
            </div>

            <div className="vyapaar-hero-badge">
              <div className="hero-badge-icon badge-icon--check">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="hero-badge-label">Ready-to-Use</span>
            </div>

            <div className="vyapaar-hero-badge">
              <div className="hero-badge-icon badge-icon--flag">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  style={{ borderRadius: '50%', display: 'block' }}
                >
                  <rect y="0" width="32" height="10.67" fill="#FF9933" />
                  <rect y="10.67" width="32" height="10.67" fill="#FFFFFF" />
                  <rect y="21.34" width="32" height="10.67" fill="#128807" />
                  <circle cx="16" cy="16" r="3.6" fill="none" stroke="#000080" strokeWidth="0.8" />
                  <circle cx="16" cy="16" r="0.8" fill="#000080" />
                </svg>
              </div>
              <span className="hero-badge-label">Made for Indian Businesses</span>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="vyapaar-hero-actions desktop-actions">
            <a href={primaryBtnLink} className="hero-explore-btn">
              <span>{primaryBtnText}</span>
              <span className="hero-btn-arrow">→</span>
            </a>
            <a
              href="#packages"
              className="hero-see-inside-link"
              onClick={handleScrollToPackages}
            >
              {secondaryBtnText}
            </a>
          </div>
        </div>

        {/* Right Column: Hero Graphic (Desktop & Mobile) */}
        <div className="vyapaar-hero-right">
          <div className="vyapaar-hero-image-wrapper">
            <img
              src="/images/hero-banner-new.png"
              alt="Build Your Business Faster with VyapaarKit"
              className="vyapaar-hero-img"
              loading="eager"
            />
          </div>
        </div>

        {/* Mobile Actions (Appears below image on mobile) */}
        <div className="vyapaar-hero-mobile-actions">
          <a href={primaryBtnLink} className="hero-explore-btn">
            <span>{primaryBtnText}</span>
            <span className="hero-btn-arrow">→</span>
          </a>
          <a
            href="#packages"
            className="hero-see-inside-link"
            onClick={handleScrollToPackages}
          >
            {secondaryBtnText}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
