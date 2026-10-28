import React, { useEffect, useRef, useState } from 'react';

const CourseHero = ({ course, onPurchase, onAddToCart, isInCart }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);
  const [timerReset, setTimerReset] = useState(0);
  const touchStartX = useRef(null);
  const didSwipe = useRef(false);
  const lightboxTouchStartX = useRef(null);
  const lightboxTouchStartY = useRef(null);
  const lightboxMouseStartX = useRef(null);
  const lightboxMouseStartY = useRef(null);
  const [isLightboxDragging, setIsLightboxDragging] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchDistanceStart = useRef(null);
  const pinchScaleStart = useRef(1);

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
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = (e) => {
    if (e) e.stopPropagation();
    setZoomScale((prev) => Math.min(4, Math.round((prev + 0.5) * 10) / 10));
  };

  const handleZoomOut = (e) => {
    if (e) e.stopPropagation();
    setZoomScale((prev) => {
      const next = Math.max(1, Math.round((prev - 0.5) * 10) / 10);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleZoomReset = (e) => {
    if (e) e.stopPropagation();
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleToggleZoom = (e) => {
    if (e) e.stopPropagation();
    setZoomScale((prev) => {
      if (prev > 1) {
        setPanPosition({ x: 0, y: 0 });
        return 1;
      }
      return 2.2;
    });
  };

  const handleLightboxWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.25 : -0.25;
    setZoomScale((prev) => {
      const next = Math.max(1, Math.min(4, Math.round((prev + delta) * 100) / 100));
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const getPinchDistance = (touches) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
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
    if (event.touches.length === 2) {
      pinchDistanceStart.current = getPinchDistance(event.touches);
      pinchScaleStart.current = zoomScale;
      setIsLightboxDragging(false);
      return;
    }
    const touch = event.changedTouches[0];
    lightboxTouchStartX.current = touch.clientX;
    lightboxTouchStartY.current = touch.clientY;
    panStartRef.current = { ...panPosition };
    if (zoomScale > 1) {
      setIsLightboxDragging(true);
    }
  };

  const handleLightboxTouchMove = (event) => {
    if (event.touches.length === 2 && pinchDistanceStart.current) {
      const curDist = getPinchDistance(event.touches);
      if (curDist) {
        const ratio = curDist / pinchDistanceStart.current;
        const nextScale = Math.max(1, Math.min(4, Math.round(pinchScaleStart.current * ratio * 100) / 100));
        setZoomScale(nextScale);
        if (nextScale === 1) {
          setPanPosition({ x: 0, y: 0 });
        }
      }
      return;
    }
    if (zoomScale <= 1 || lightboxTouchStartX.current === null) return;
    const touch = event.changedTouches[0];
    const dx = (touch.clientX - lightboxTouchStartX.current) / zoomScale;
    const dy = (touch.clientY - (lightboxTouchStartY.current || touch.clientY)) / zoomScale;
    setPanPosition({
      x: Math.max(-180, Math.min(180, panStartRef.current.x + dx)),
      y: Math.max(-180, Math.min(180, panStartRef.current.y + dy)),
    });
  };

  const handleLightboxTouchEnd = (event) => {
    if (event.touches.length < 2) {
      pinchDistanceStart.current = null;
    }
    if (lightboxTouchStartX.current !== null) {
      const touch = event.changedTouches[0];
      const distX = touch.clientX - lightboxTouchStartX.current;
      const distY = touch.clientY - (lightboxTouchStartY.current || touch.clientY);
      const distTotal = Math.sqrt(distX * distX + distY * distY);

      if (distTotal < 12) {
        // Tap detected: toggle zoom
        handleToggleZoom();
      } else if (zoomScale <= 1 && Math.abs(distX) > 40 && gallery.length > 1) {
        changeImage(activeImageIndex + (distX < 0 ? 1 : -1));
      }
    }
    lightboxTouchStartX.current = null;
    lightboxTouchStartY.current = null;
    setIsLightboxDragging(false);
  };

  const handleLightboxMouseDown = (event) => {
    lightboxMouseStartX.current = event.clientX;
    lightboxMouseStartY.current = event.clientY;
    panStartRef.current = { ...panPosition };
    if (zoomScale > 1) {
      setIsLightboxDragging(true);
    }
  };

  const handleLightboxMouseMove = (event) => {
    if (!isLightboxDragging || zoomScale <= 1 || lightboxMouseStartX.current === null) return;
    const dx = (event.clientX - lightboxMouseStartX.current) / zoomScale;
    const dy = (event.clientY - (lightboxMouseStartY.current || event.clientY)) / zoomScale;
    setPanPosition({
      x: Math.max(-200, Math.min(200, panStartRef.current.x + dx)),
      y: Math.max(-200, Math.min(200, panStartRef.current.y + dy)),
    });
  };

  const handleLightboxMouseUp = (event) => {
    if (lightboxMouseStartX.current !== null) {
      const distX = event.clientX - lightboxMouseStartX.current;
      const distY = event.clientY - (lightboxMouseStartY.current || event.clientY);
      const distTotal = Math.sqrt(distX * distX + distY * distY);

      if (distTotal < 10) {
        // Click / tap detected: toggle zoom
        handleToggleZoom();
      } else if (zoomScale <= 1 && Math.abs(distX) > 40 && gallery.length > 1) {
        changeImage(activeImageIndex + (distX < 0 ? 1 : -1));
      }
    }
    lightboxMouseStartX.current = null;
    lightboxMouseStartY.current = null;
    setIsLightboxDragging(false);
  };

  const handleLightboxMouseLeave = () => {
    lightboxMouseStartX.current = null;
    lightboxMouseStartY.current = null;
    setIsLightboxDragging(false);
  };

  const isTool = course.packageType === 'business-tools';
  const isBusinessInABox = !isTool && (
    course.isBusinessInABox ||
    course.packageType === 'business-in-the-box' ||
    course.packageType === 'business-in-a-box' ||
    course.slug?.endsWith('-business-in-a-box') ||
    course.slug?.endsWith('-business-in-the-box')
  );

  const basePlanSlug = course.slug
    ? course.slug.replace(/-business-in-a-box$/, '').replace(/-business-in-the-box$/, '')
    : '';

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
          <div className="hero-box-callout-banner is-all-in-one">
            <div className="hero-box-callout-content">
              <div className="hero-box-callout-icon">🎁</div>
              <div className="hero-box-callout-text">
                <div className="hero-box-callout-title">
                  All-In-One Box Bundle
                </div>
                <div className="hero-box-callout-desc">
                  Includes this full <strong>Business Plan</strong> + ALL <strong>Business Playbooks</strong> in {course.category}!
                </div>
              </div>
            </div>
            {basePlanSlug && (
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/courses/${basePlanSlug}`}
                className="hero-box-callout-link"
              >
                View Single Business Plan (₹399) →
              </a>
            )}
          </div>
        )}

        {!isBusinessInABox && course.packageType === 'business-plans' && (
          <div className="hero-box-callout-banner is-upsell">
            <div className="hero-box-callout-content">
              <div className="hero-box-callout-icon">📦</div>
              <div className="hero-box-callout-text">
                <div className="hero-box-callout-title">
                  Looking for the complete Business in a Box Bundle?
                </div>
                <p className="hero-box-callout-desc">
                  Get this Business Plan + <strong>ALL {course.category} Business Playbooks</strong> bundled together for only ₹899.
                </p>
              </div>
            </div>
            <a
              href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/courses/${basePlanSlug || course.slug}-business-in-a-box`}
              className="hero-box-callout-btn"
            >
              View Business in a Box →
            </a>
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

      {/* 4. Purchase Block: Pricing, CTA buttons, Kit includes */}
      <div className="hero-purchase-block">
        <div className={`hero-purchase-card${isBusinessInABox ? ' is-business-in-box' : ''}`}>
          {isBusinessInABox && (
            <div className="hero-box-badge-banner">
              <span>📦</span>
              <span>Business in a Box Bundle</span>
            </div>
          )}
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
              {isInCart ? '✓ Added to Cart' : (isBusinessInABox ? '+ Add Box to Cart' : 'Add to cart')}
            </button>
            <button
              type="button"
              className={`btn btn-secondary${isBusinessInABox ? ' btn-box-secondary' : ''}`}
              onClick={onPurchase}
            >
              {isBusinessInABox ? '⚡ Buy Complete Box' : 'Buy Now'}
            </button>
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
        <div
          className="gallery-lightbox-backdrop"
          onClick={() => {
            setIsZoomed(false);
            setZoomScale(1);
            setPanPosition({ x: 0, y: 0 });
          }}
        >
          <div className="gallery-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gallery-lightbox-close"
              onClick={() => {
                setIsZoomed(false);
                setZoomScale(1);
                setPanPosition({ x: 0, y: 0 });
              }}
              aria-label="Close image preview"
            >
              ✕
            </button>
            <div
              className={`gallery-lightbox-image-container${zoomScale > 1 ? ' is-magnified' : ''}${isLightboxDragging ? ' is-dragging' : ''}`}
              onTouchStart={handleLightboxTouchStart}
              onTouchMove={handleLightboxTouchMove}
              onTouchEnd={handleLightboxTouchEnd}
              onMouseDown={handleLightboxMouseDown}
              onMouseMove={handleLightboxMouseMove}
              onMouseUp={handleLightboxMouseUp}
              onMouseLeave={handleLightboxMouseLeave}
              onWheel={handleLightboxWheel}
              style={{
                cursor: zoomScale > 1 ? (isLightboxDragging ? 'grabbing' : 'grab') : 'zoom-in',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <img
                src={currentImage.url}
                alt={currentImage.alt}
                draggable="false"
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  maxHeight: '70vh',
                  transform: zoomScale > 1
                    ? `scale(${zoomScale}) translate(${panPosition.x}px, ${panPosition.y}px)`
                    : 'scale(1) translate(0px, 0px)',
                  transition: isLightboxDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  transformOrigin: 'center center',
                }}
              />

              {/* Manual Zoom Controls Toolbar */}
              <div
                className="lightbox-manual-zoom-toolbar"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 1}
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="zoom-label-btn"
                  onClick={handleToggleZoom}
                  aria-label="Toggle zoom scale"
                  title="Click to toggle zoom"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 4}
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                {zoomScale > 1 && (
                  <button
                    type="button"
                    className="zoom-reset-btn"
                    onClick={handleZoomReset}
                    aria-label="Reset zoom"
                    title="Reset zoom to 100%"
                  >
                    Reset
                  </button>
                )}
              </div>
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
