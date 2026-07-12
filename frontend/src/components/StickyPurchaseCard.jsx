import React from 'react';

const StickyPurchaseCard = ({ course, onPurchase }) => {
  return (
    <aside className="sticky-purchase-card">
      <div className="purchase-card">
        <p className="purchase-card-label">Course access</p>
        <div className="purchase-price-row">
          <div>
            <p>Now</p>
            <strong>{course.price.current}</strong>
          </div>
          <span>{course.price.old}</span>
        </div>
        <div className="purchase-actions">
          <button type="button" className="btn btn-primary" onClick={onPurchase}>Enroll Now</button>
          <button type="button" className="btn btn-secondary" onClick={onPurchase}>Buy Now</button>
        </div>
        <ul className="purchase-benefits">
          <li>Lifetime access</li>
          <li>Certificate</li>
          <li>Downloadable resources</li>
          <li>Assignments</li>
        </ul>
      </div>
    </aside>
  );
};

export default StickyPurchaseCard;
