import React from 'react';

/**
 * BundlePromoBanner
 * Redesigned Business in a Box promotional banner matching the visual reference.
 * Displays:
 *  - Left: 3D vector blue box illustration with Vyapaar Kit branding and growth bars
 *  - Center: COMPLETE BUNDLE pill, "Business in a Box" heading, and contents row (1 Business Plan + 10 Business Playbooks)
 *  - Top Right: Yellow price badge with lightning bolt ("Just ₹899")
 *  - Bottom: Full-width vivid blue CTA button ("Get Business in a Box →")
 */
const BundlePromoBanner = ({ course, basePlanSlug, className = '' }) => {
  if (!course) return null;

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const targetSlug = basePlanSlug || (course.slug ? course.slug.replace(/-business-in-a-box$/, '').replace(/-business-in-the-box$/, '') : '');
  const bundleUrl = `${basePath}/courses/${targetSlug}-business-in-a-box`;

  // Dynamically determine tools count from course data if available, defaulting to standard 10
  const playbooksCount = Array.isArray(course.bundledTools) && course.bundledTools.length > 0
    ? course.bundledTools.length
    : 10;

  // Retrieve approved bundle price from course or default to approved ₹899
  const bundlePrice = course.bundlePrice
    ? (typeof course.bundlePrice === 'number' ? `₹${course.bundlePrice.toLocaleString('en-IN')}` : course.bundlePrice)
    : '₹899';

  return (
    <div className={`bib-banner-card${className ? ` ${className}` : ''}`} role="region" aria-label="Business in a Box Complete Bundle Offer">
      {/* 1. Left: 3D Blue Box Illustration */}
      <div className="bib-box-col" aria-hidden="true">
        <svg viewBox="0 0 150 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="bib-box-svg">
          {/* Ground shadow */}
          <ellipse cx="76" cy="122" rx="58" ry="11" fill="#1d4ed8" fillOpacity="0.15" />

          {/* Yellow accent burst marks above box */}
          <line x1="18" y1="26" x2="10" y2="14" stroke="#f59e0b" strokeWidth="4.2" strokeLinecap="round" />
          <line x1="9" y1="38" x2="2" y2="35" stroke="#f59e0b" strokeWidth="4.2" strokeLinecap="round" />

          {/* Left face (Darker shade for 3D depth) */}
          <path d="M20 48 L48 62 V122 L20 108 Z" fill="#1646b8" />

          {/* Front face (Vivid royal blue) */}
          <path d="M48 62 L138 38 V98 L48 122 Z" fill="#2262ee" />

          {/* Top face (Lighter blue with perspective) */}
          <path d="M20 48 L98 24 L138 38 L48 62 Z" fill="#3b7cf8" />

          {/* Top seam / crease line */}
          <path d="M59 36 L93 50" stroke="#1d4ed8" strokeWidth="2.2" strokeLinecap="round" />

          {/* Front Face: White "VyapaarKit" Brand Badge */}
          <g transform="translate(68, 63) rotate(-14.9)">
            <rect x="0" y="0" width="58" height="22" rx="4.5" fill="#ffffff" />
            <text
              x="29"
              y="15.2"
              fontSize="10"
              fontFamily="Inter, system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fill="#1e3a8a"
              textAnchor="middle"
              letterSpacing="-0.2"
            >
              VyapaarKit
            </text>
          </g>

          {/* Front Face: White Business-Growth Chart Bars */}
          <g transform="translate(86, 91) rotate(-14.9)">
            <rect x="0" y="8" width="4.8" height="7" rx="1.2" fill="#ffffff" />
            <rect x="7" y="4" width="4.8" height="11" rx="1.2" fill="#ffffff" />
            <rect x="14" y="0" width="4.8" height="15" rx="1.2" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* 2. Top Label: COMPLETE BUNDLE */}
      <div className="bib-badge-row">
        <span className="bib-pill-badge">
          COMPLETE BUNDLE
        </span>
      </div>

      {/* 3. Top-Right: Price Badge */}
      <div className="bib-price-badge">
        <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <div className="bib-price-col">
          <span className="bib-price-label">Just</span>
          <span className="bib-price-amount">{bundlePrice}</span>
        </div>
      </div>

      {/* 4. Main Heading: Business in a Box */}
      <h3 className="bib-heading">
        Business in a Box
      </h3>

      {/* 5. Bundle Contents Row */}
      <div className="bib-contents-row">
        <span className="bib-content-item">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          1 Business Plan
        </span>

        <span className="bib-content-plus" aria-hidden="true">+</span>

        <span className="bib-content-item">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          {playbooksCount} Business Playbooks
        </span>
      </div>

      {/* 6. Bottom: Primary Full-Width CTA Button */}
      <a
        href={bundleUrl}
        className="bib-cta-btn"
        aria-label={`Get Business in a Box for ${bundlePrice}`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>

        <span>Get Business in a Box</span>

        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </a>
    </div>
  );
};

export default BundlePromoBanner;
