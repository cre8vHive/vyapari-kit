import React from 'react';

const StickyPurchaseCard = ({ course, onPurchase, onAddToCart, isInCart }) => {
  const resolveImageUrl = (url) => {
    if (!url) return 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/products/vyapaarkit-bundle-hero.jpg';
    if (url.startsWith('/images/')) return `https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev${url}`;
    return url;
  };

  const rawThumb = course.thumbnail && !course.thumbnail.includes('unsplash')
    ? course.thumbnail
    : (course.imageUrl || course.bannerImage);

  const thumbnail = resolveImageUrl(rawThumb);

  const isTool = course.packageType === 'business-tools';
  const isBusinessInABox = !isTool && (
    course.isBusinessInABox ||
    course.packageType === 'business-in-the-box' ||
    course.packageType === 'business-in-a-box' ||
    course.slug?.includes('business-in-the-box') ||
    course.slug?.includes('business-in-a-box') ||
    /business in a box/i.test(course.title || '')
  );

  return (
    <aside className="sticky-purchase-card">
      <div className={`purchase-card${isBusinessInABox ? ' is-business-in-box' : ''}`} style={isBusinessInABox ? { border: '2px solid #f59e0b', boxShadow: '0 12px 28px -6px rgba(245, 158, 11, 0.25)' } : {}}>
        {isBusinessInABox && (
          <div className="sticky-card-bundle-banner">
            <span>📦</span>
            <span>Business in a Box Bundle</span>
          </div>
        )}

        <div className={`sticky-card-media${isBusinessInABox ? ' has-bundle-banner' : ''}`}>
          <img
            src={thumbnail}
            alt={course.title}
            className="sticky-card-img"
            onError={(e) => {
              e.currentTarget.src = 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/products/vyapaarkit-bundle-hero.jpg';
            }}
          />
          {course.editionNote && !/2026/i.test(course.editionNote) && (
            <span className="sticky-card-edition-badge">{course.editionNote}</span>
          )}
        </div>

        <p className="purchase-card-label">
          Instant Toolkit Access
        </p>

        {isBusinessInABox && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '12px',
            fontSize: '12px',
            color: '#92400e',
            fontWeight: 600,
            lineHeight: 1.4
          }}>
            ⚡ Unlocks full <strong>Business Plan</strong> + all <strong>Business Playbooks</strong> in {course.category}!
          </div>
        )}

        <div className="purchase-price-row">
          <div>
            <p>Now</p>
            <strong>{course.price.current}</strong>
          </div>
          {course.price.old && <span>{course.price.old}</span>}
        </div>
        <div className="purchase-actions">
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
        <ul className="purchase-benefits">
          {course.includes.map((benefit) => (
            <li key={benefit}>{typeof benefit === 'string' ? benefit.replace(/\s*\[cite:[^\]]+\]/g, '') : benefit}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default StickyPurchaseCard;

