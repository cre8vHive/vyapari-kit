import React, { useEffect, useRef, useState } from 'react';

const CourseHero = ({ course, onPurchase, onAddToCart, isInCart }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);
  const [timerReset, setTimerReset] = useState(0);
  const touchStartX = useRef(null);
  const didSwipe = useRef(false);
  const lightboxTouchStartX = useRef(null);
  const lightboxMouseStartX = useRef(null);
  const [isLightboxDragging, setIsLightboxDragging] = useState(false);

  const defaultGallery = [
    {
      id: 'bundle-hero',
      url: course.thumbnail && !course.thumbnail.includes('unsplash') ? course.thumbnail : 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/products/vyapaarkit-bundle-hero.jpg',
      label: '3D Kit Bundle',
      caption: 'Complete 3D MSME Toolkit Bundle',
      alt: `${course.title} 3D Bundle Mockup`,
    },
    {
      id: 'whats-inside',
      url: 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/products/vyapaarkit-whats-inside.jpg',
      label: "What's Inside",
      caption: 'Included Modules & Documents Breakdown',
      alt: `${course.title} Included Modules & Documents`,
    },
    {
      id: 'financial-model',
      url: 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/products/vyapaarkit-financial-model.jpg',
      label: 'Financial Model',
      caption: '5-Year Editable Excel Model with Formulas',
      alt: `${course.title} 5-Year Excel Model Preview`,
    },
    {
      id: 'comparison',
      url: 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/products/vyapaarkit-comparison.jpg',
      label: 'Why VyapaarKit',
      caption: 'VyapaarKit vs Traditional Project Consultant',
      alt: `Why VyapaarKit vs Traditional Consultant`,
    },
  ];

  const sourceGallery = (course.gallery && course.gallery.length > 0) ? course.gallery : defaultGallery;
  const imageGallery = sourceGallery.filter((item) =>
    /\.(jpe?g|png|webp|gif)(?:[?#].*)?$/i.test(String(item.url || ''))
  );
  const gallery = imageGallery.length > 0 ? imageGallery : defaultGallery;
  const currentImage = gallery[activeImageIndex] || gallery[0];

  useEffect(() => {
    setActiveImageIndex((index) => Math.min(index, gallery.length - 1));
  }, [gallery.length]);

  useEffect(() => {
    if (isGalleryPaused || gallery.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveImageIndex((index) => (index + 1) % gallery.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [gallery.length, isGalleryPaused, timerReset]);

  // Keyboard navigation when zoomed
  useEffect(() => {
    if (!isZoomed) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        changeImage(activeImageIndex - 1);
      } else if (e.key === 'ArrowRight') {
        changeImage(activeImageIndex + 1);
      } else if (e.key === 'Escape') {
        setIsZoomed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, activeImageIndex, gallery.length]);

  const changeImage = (index) => {
    setActiveImageIndex((index + gallery.length) % gallery.length);
    setTimerReset((reset) => reset + 1);
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0].clientX;
    setIsGalleryPaused(true);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current !== null) {
      const distance = event.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(distance) > 40 && gallery.length > 1) {
        didSwipe.current = true;
        changeImage(activeImageIndex + (distance < 0 ? 1 : -1));
      }
    }
    touchStartX.current = null;
    setIsGalleryPaused(false);
  };

  const handleLightboxTouchStart = (event) => {
    lightboxTouchStartX.current = event.changedTouches[0].clientX;
  };

  const handleLightboxTouchEnd = (event) => {
    if (lightboxTouchStartX.current !== null) {
      const distance = event.changedTouches[0].clientX - lightboxTouchStartX.current;
      if (Math.abs(distance) > 40 && gallery.length > 1) {
        changeImage(activeImageIndex + (distance < 0 ? 1 : -1));
      }
    }
    lightboxTouchStartX.current = null;
  };

  const handleLightboxMouseDown = (event) => {
    lightboxMouseStartX.current = event.clientX;
    setIsLightboxDragging(true);
  };

  const handleLightboxMouseUp = (event) => {
    if (lightboxMouseStartX.current !== null) {
      const distance = event.clientX - lightboxMouseStartX.current;
      if (Math.abs(distance) > 40 && gallery.length > 1) {
        changeImage(activeImageIndex + (distance < 0 ? 1 : -1));
      }
    }
    lightboxMouseStartX.current = null;
    setIsLightboxDragging(false);
  };

  const isBusinessInABox = course.isBusinessInABox || course.packageType === 'business-in-the-box' || course.slug?.includes('business-in-the-box');

  return (
    <section className="course-hero">
      {/* 1. Header Block: Tags, Title, Subtitle */}
      <div className="hero-header-block">
        <div className="hero-tags">
          {isBusinessInABox && (
            <span className="hero-chip hero-chip-box-bundle" style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              📦 Business in a Box Bundle
            </span>
          )}
          <span className="hero-chip hero-chip-accent">{course.category}</span>
          <span className="hero-chip">{course.difficulty}</span>
          {course.editionNote && !/2026/i.test(course.editionNote) && (
            <span className="hero-chip hero-chip-edition">{course.editionNote}</span>
          )}
        </div>
        <h1 className="hero-title">{course.title}</h1>
        <p className="hero-copy">{course.subtitle}</p>

        {isBusinessInABox && (
          <div style={{
            margin: '18px 0 8px 0',
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '2px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
          }}>
            <div style={{ fontSize: '32px', lineHeight: 1, flexShrink: 0 }}>
              🎁
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                All-In-One Box Bundle
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#78350f', marginTop: '2px', lineHeight: 1.4 }}>
                Includes this full <strong>Business Plan</strong> + ALL <strong>Business Tools & Playbooks</strong> in {course.category}!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Product Gallery Block (Prominent on both Desktop & Mobile) */}
      <div className="hero-gallery-block">
        <div
          className="hero-gallery-wrapper"
          onMouseEnter={() => setIsGalleryPaused(true)}
          onMouseLeave={() => setIsGalleryPaused(false)}
          onTouchStart={() => setIsGalleryPaused(true)}
          onTouchEnd={() => setIsGalleryPaused(false)}
        >
          <div
            className="hero-media-card product-main-gallery"
            onClick={() => {
              if (didSwipe.current) {
                didSwipe.current = false;
                return;
              }
              setIsZoomed(true);
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Right Edition Badge (dynamic from DB) */}
            {course.editionNote && !/2026/i.test(course.editionNote) && (
              <div className="gallery-badge-top-right">
                <span className="edition-badge">{course.editionNote}</span>
              </div>
            )}

            <img
              key={currentImage.url}
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
            {gallery.length > 1 && (
              <div className="gallery-slider-controls">
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(event) => {
                    event.stopPropagation();
                    changeImage(activeImageIndex - 1);
                  }}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(event) => {
                    event.stopPropagation();
                    changeImage(activeImageIndex + 1);
                  }}
                >
                  →
                </button>
              </div>
            )}
            {gallery.length > 1 && (
              <div className="gallery-pagination" role="tablist" aria-label="Choose gallery image">
                {gallery.map((item, index) => (
                  <button
                    key={item.id || item.url || index}
                    type="button"
                    role="tab"
                    aria-label={`Show image ${index + 1}`}
                    aria-selected={activeImageIndex === index}
                    className={activeImageIndex === index ? 'active' : ''}
                    onClick={(event) => {
                      event.stopPropagation();
                      changeImage(index);
                    }}
                  />
                ))}
              </div>
            )}
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
            <span>Entrepreneurs</span>
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
            <button
              type="button"
              className={`btn btn-primary${isInCart ? ' btn-in-cart' : ''}`}
              onClick={onAddToCart}
            >
              {isInCart ? 'In Cart (View)' : 'Add to cart'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onPurchase}>Buy Now</button>
          </div>
          <div className="hero-include-list">
            <h3>Kit includes</h3>
            <ul>
              {course.includes.map((item) => (
                <li key={item}>{typeof item === 'string' ? item.replace(/\s*\[cite:[^\]]+\]/g, '') : item}</li>
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
            <div
              className={`gallery-lightbox-image-container${isLightboxDragging ? ' is-dragging' : ''}`}
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}
              onMouseDown={handleLightboxMouseDown}
              onMouseUp={handleLightboxMouseUp}
              onMouseLeave={() => {
                lightboxMouseStartX.current = null;
                setIsLightboxDragging(false);
              }}
            >
              <img
                src={currentImage.url}
                alt={currentImage.alt}
                draggable="false"
                style={{ pointerEvents: 'none', userSelect: 'none', maxHeight: '70vh' }}
              />

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-lightbox-nav-btn prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeImage(activeImageIndex - 1);
                    }}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="gallery-lightbox-nav-btn next"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeImage(activeImageIndex + 1);
                    }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="gallery-lightbox-caption">
                <div className="gallery-lightbox-dots">
                  {gallery.map((item, index) => (
                    <button
                      key={item.id || item.url || index}
                      type="button"
                      className={`gallery-lightbox-dot${activeImageIndex === index ? ' active' : ''}`}
                      aria-label={`Go to image ${index + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeImage(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CourseHero;
