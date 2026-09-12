import React, { useState } from 'react';

const CourseHero = ({ course, onPurchase }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const defaultGallery = [
    {
      id: 'bundle-hero',
      url: course.thumbnail && !course.thumbnail.includes('unsplash') ? course.thumbnail : '/images/products/vyapaarkit-bundle-hero.jpg',
      label: '3D Kit Bundle',
      caption: 'Complete 3D MSME Toolkit Bundle',
      alt: `${course.title} 3D Bundle Mockup`,
    },
    {
      id: 'whats-inside',
      url: '/images/products/vyapaarkit-whats-inside.jpg',
      label: "What's Inside",
      caption: 'Included Modules & Documents Breakdown',
      alt: `${course.title} Included Modules & Documents`,
    },
    {
      id: 'financial-model',
      url: '/images/products/vyapaarkit-financial-model.jpg',
      label: 'Financial Model',
      caption: '5-Year Editable Excel Model with Formulas',
      alt: `${course.title} 5-Year Excel Model Preview`,
    },
    {
      id: 'comparison',
      url: '/images/products/vyapaarkit-comparison.jpg',
      label: 'Why VyapaarKit',
      caption: 'VyapaarKit vs Traditional Project Consultant',
      alt: `Why VyapaarKit vs Traditional Consultant`,
    },
  ];

  const gallery = (course.gallery && course.gallery.length > 0) ? course.gallery : defaultGallery;
  const currentImage = gallery[activeImageIndex] || gallery[0];

  return (
    <section className="course-hero">
      {/* 1. Header Block: Tags, Title, Subtitle */}
      <div className="hero-header-block">
        <div className="hero-tags">
          <span className="hero-chip hero-chip-accent">{course.category}</span>
          <span className="hero-chip">{course.difficulty}</span>
          {course.editionNote && (
            <span className="hero-chip hero-chip-edition">{course.editionNote}</span>
          )}
        </div>
        <h1 className="hero-title">{course.title}</h1>
        <p className="hero-copy">{course.subtitle}</p>
      </div>

      {/* 2. Product Gallery Block (Prominent on both Desktop & Mobile) */}
      <div className="hero-gallery-block">
        <div className="hero-gallery-wrapper">
          <div className="hero-media-card product-main-gallery" onClick={() => setIsZoomed(true)}>
            {/* Top Right Edition Badge (dynamic from DB) */}
            {course.editionNote && (
              <div className="gallery-badge-top-right">
                <span className="edition-badge">{course.editionNote}</span>
              </div>
            )}

            {/* Main Featured Image */}
            <img
              src={currentImage.url}
              alt={currentImage.alt}
              className="gallery-featured-img"
            />

            {/* Bottom Controls (Clean Tap to Zoom only - format pill removed) */}
            <div className="gallery-badge-bottom">
              <span className="zoom-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                Tap to Zoom
              </span>
            </div>
          </div>

          {/* Gallery Thumbnails Selection Carousel */}
          <div className="gallery-thumbnail-row" role="tablist" aria-label="Product image gallery">
            {gallery.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                role="tab"
                aria-selected={activeImageIndex === index}
                className={`gallery-thumb-btn ${activeImageIndex === index ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(index)}
                title={item.caption || item.label}
              >
                <div className="thumb-img-wrapper">
                  <img src={item.url} alt={item.label} />
                </div>
                <span className="thumb-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Details Block: Trust Bullets, Rating & Stats, Specs */}
      <div className="hero-details-block">
        <div className="hero-trust-bullets">
          <div className="hero-trust-bullet">
            <span className="trust-icon">✓</span>
            <span><strong>100% Bank Loan Ready</strong> — PMEGP, CGTMSE & Mudra Compliant</span>
          </div>
          <div className="hero-trust-bullet">
            <span className="trust-icon">✓</span>
            <span><strong>5-Year Financial Model</strong> — Auto-calculating Excel with P&L & Cash Flow</span>
          </div>
          <div className="hero-trust-bullet">
            <span className="trust-icon">✓</span>
            <span><strong>Instant Access</strong> — Immediate Download upon payment</span>
          </div>
        </div>

        <div className="hero-cards">
          <article className="hero-card">
            <span>Rating</span>
            <strong>{course.rating} ★</strong>
          </article>
          <article className="hero-card">
            <span>Students</span>
            <strong>{course.students}</strong>
          </article>
          <article className="hero-card">
            <span>Instructor</span>
            <strong>{course.instructorName}</strong>
          </article>
        </div>

        <div className="hero-details-grid">
          <article className="hero-detail">
            <span>Language</span>
            <strong>{course.language}</strong>
          </article>
          <article className="hero-detail">
            <span>Last updated</span>
            <strong>{course.lastUpdated}</strong>
          </article>
          <article className="hero-detail">
            <span>Category</span>
            <strong>{course.category}</strong>
          </article>
        </div>
      </div>

      {/* 4. Purchase Block: Pricing, CTA buttons, Kit includes */}
      <div className="hero-purchase-block">
        <div className="hero-purchase-card">
          <div className="hero-price-row">
            <div>
              <p>Price</p>
              <strong>{course.price.current}</strong>
            </div>
            {course.price.old && <span>{course.price.old}</span>}
          </div>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onPurchase}>Enroll Now</button>
            <button type="button" className="btn btn-secondary" onClick={onPurchase}>Buy Now</button>
          </div>
          <div className="hero-include-list">
            <h3>Kit includes</h3>
            <ul>
              {course.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      {isZoomed && (
        <div className="gallery-lightbox-backdrop" onClick={() => setIsZoomed(false)}>
          <div className="gallery-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gallery-lightbox-close"
              onClick={() => setIsZoomed(false)}
              aria-label="Close image preview"
            >
              ✕
            </button>
            <div className="gallery-lightbox-content">
              <img src={currentImage.url} alt={currentImage.alt} />
              <div className="gallery-lightbox-caption">
                <strong>{currentImage.label}</strong> — {currentImage.caption}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CourseHero;
