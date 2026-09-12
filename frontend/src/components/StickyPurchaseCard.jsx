import React from 'react';

const StickyPurchaseCard = ({ course, onPurchase }) => {
  const thumbnail = course.thumbnail && !course.thumbnail.includes('unsplash')
    ? course.thumbnail
    : '/images/products/vyapaarkit-bundle-hero.jpg';

  return (
    <aside className="sticky-purchase-card">
      <div className="purchase-card">
        <div className="sticky-card-media">
          <img
            src={thumbnail}
            alt={course.title}
            className="sticky-card-img"
          />
          {course.editionNote && (
            <span className="sticky-card-edition-badge">{course.editionNote}</span>
          )}
        </div>

        <p className="purchase-card-label">Instant Toolkit Access</p>
        <div className="purchase-price-row">
          <div>
            <p>Now</p>
            <strong>{course.price.current}</strong>
          </div>
          {course.price.old && <span>{course.price.old}</span>}
        </div>
        <div className="purchase-actions">
          <button type="button" className="btn btn-primary" onClick={onPurchase}>Enroll Now</button>
          <button type="button" className="btn btn-secondary" onClick={onPurchase}>Buy Now</button>
        </div>
        <ul className="purchase-benefits">
          {course.includes.map((benefit) => <li key={benefit}>{benefit}</li>)}
        </ul>
      </div>
    </aside>
  );
};

export default StickyPurchaseCard;

