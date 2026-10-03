import React, { useState } from 'react';
import CourseHero from './CourseHero';
import CourseOverview from './CourseOverview';
import CourseCurriculum from './CourseCurriculum';
import InstructorSection from './InstructorSection';
import ReviewSection from './ReviewSection';
import FAQSection from './FAQSection';
import RelatedCourses from './RelatedCourses';
import StickyPurchaseCard from './StickyPurchaseCard';
import BundleItemsSection from './BundleItemsSection';
import { paymentApi } from '../services/api';
import { useCart } from '../context/CartContext';

const MobileStickyBuyBar = ({ course, onPurchase, onAddToCart, isInCart }) => {
  const currentPrice = typeof course.price === 'object'
    ? course.price?.current
    : (typeof course.price === 'number' ? `₹${course.price}` : String(course.price || ''));

  const oldPrice = typeof course.price === 'object'
    ? course.price?.old
    : (course.oldPrice ? `₹${course.oldPrice}` : null);

  const thumbnail = course.thumbnail && !course.thumbnail.includes('unsplash')
    ? course.thumbnail
    : '/images/products/vyapaarkit-bundle-hero.jpg';

  const formatDisplayAmount = (priceVal) => {
    if (!priceVal) return '';
    const num = parseFloat(String(priceVal).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return priceVal;
    return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formattedCurPrice = formatDisplayAmount(currentPrice) || currentPrice;
  const formattedOldPrice = formatDisplayAmount(oldPrice) || oldPrice;

  let discountPercentage = null;
  if (currentPrice && oldPrice) {
    const curVal = parseFloat(String(currentPrice).replace(/[^0-9.]/g, ''));
    const oldVal = parseFloat(String(oldPrice).replace(/[^0-9.]/g, ''));
    if (!isNaN(curVal) && !isNaN(oldVal) && oldVal > curVal && curVal > 0) {
      discountPercentage = Math.round(((oldVal - curVal) / oldVal) * 100);
    }
  }

  const isBusinessInABox = course.isBusinessInABox || course.packageType === 'business-in-the-box' || course.slug?.includes('business-in-the-box');

  return (
    <aside className="mobile-sticky-buy-bar" aria-label="Mobile quick purchase">
      <div className="mobile-sticky-top-row">
        <img
          src={thumbnail}
          alt={course.title}
          className="mobile-sticky-thumb"
        />
        <div className="mobile-sticky-info">
          {isBusinessInABox && (
            <span style={{
              background: '#f59e0b',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'inline-block',
              marginBottom: '2px'
            }}>
              📦 Business in a Box Bundle
            </span>
          )}
          <h4 className="mobile-sticky-title">{course.title}</h4>
          <div className="mobile-sticky-prices">
            {formattedOldPrice && (
              <span className="mobile-sticky-old-price">{formattedOldPrice}</span>
            )}
            <span className="mobile-sticky-cur-price">{formattedCurPrice}</span>
            {discountPercentage && (
              <span className="mobile-sticky-discount-badge">{discountPercentage}% OFF</span>
            )}
          </div>
        </div>
      </div>
      <div className="mobile-sticky-actions">
        <button
          type="button"
          className="mobile-sticky-cart-btn"
          onClick={onAddToCart}
          style={{
            padding: '12px 14px',
            background: isInCart ? '#dcfce7' : '#f1f5f9',
            color: isInCart ? '#166534' : '#0f172a',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {isInCart ? 'In Cart' : 'Add to Cart'}
        </button>
        <button
          type="button"
          className="mobile-sticky-cta-btn"
          onClick={onPurchase}
        >
          Buy Now
        </button>
      </div>
    </aside>
  );
};

const CourseDetails = ({ course, onBack }) => {
  const goBack = onBack || (() => {
    window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/courses`;
  });

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseAccessUrl, setPurchaseAccessUrl] = useState('');

  const { addToCart, isInCart, openCart } = useCart();

  const handleAddToCart = () => {
    if (isInCart(course.id)) {
      openCart();
      return;
    }
    const numPrice = typeof course.price === 'object'
      ? parseFloat(String(course.price?.current || '').replace(/[^0-9.]/g, '')) || 0
      : Number(course.price) || 0;
    const numOldPrice = typeof course.price === 'object'
      ? parseFloat(String(course.price?.old || '').replace(/[^0-9.]/g, '')) || undefined
      : Number(course.oldPrice) || undefined;

    addToCart({
      id: course.id,
      slug: course.slug,
      title: course.title,
      price: numPrice,
      oldPrice: numOldPrice,
      imageUrl: course.thumbnail,
      categoryName: course.category,
      packageType: course.packageType,
      instructorName: course.instructor?.name || course.instructorName,
    });
  };

  const isLoggedIn = !!localStorage.getItem('VyapaarKit_auth_token');

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      // Show guest email modal
      setShowGuestModal(true);
      setGuestError('');
      return;
    }

    try {
      const courseId = course.id;
      const order = await paymentApi.createOrder(courseId);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'Vyapari Kit',
        description: `Purchase ${course.title}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await paymentApi.verifyPayment(courseId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/courses?tab=my`;
          } catch (err) {
            alert('Payment verification failed.');
          }
        },
        modal: {
          ondismiss: function () {
            // Dismissed by user
          },
        },
        theme: {
          color: '#0b6cff',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + (response.error?.description || 'Transaction failed or was cancelled.'));
      });
      rzp.open();
    } catch (err) {
      if (err.response?.status === 401) {
        setShowGuestModal(true);
        setGuestError('');
      } else {
        alert(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
        console.error(err);
      }
    }
  };

  const handleGuestPurchase = async (e) => {
    e.preventDefault();
    setGuestError('');
    setGuestLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      setGuestError('Please enter a valid email address.');
      setGuestLoading(false);
      return;
    }

    try {
      const courseId = course.id;
      const orderData = await paymentApi.createGuestOrder(courseId, guestEmail, guestName || undefined);
      const guestToken = orderData.guestToken;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vyapari Kit',
        description: `Purchase ${course.title}`,
        order_id: orderData.id,
        prefill: {
          email: guestEmail,
          name: guestName || undefined,
        },
        handler: async function (response) {
          setShowGuestModal(false);
          try {
            const result = await paymentApi.verifyGuestPayment(courseId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              guestToken,
            });
            setPurchaseAccessUrl(result.accessUrl || '');
            setPurchaseSuccess(true);
          } catch (err) {
            alert(err.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setGuestLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setGuestLoading(false);
            setShowGuestModal(false);
          },
        },
        theme: {
          color: '#0b6cff',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setGuestLoading(false);
        setShowGuestModal(false);
        alert('Payment failed: ' + (response.error?.description || 'Transaction was cancelled or failed.'));
      });
      rzp.open();
    } catch (err) {
      setGuestError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setGuestLoading(false);
    }
  };

  return (
    <div className="course-details-page">
      <div className="course-details-shell">
        <div className="details-header">
          <button type="button" className="details-back" onClick={goBack}>
            ← Back to Business Solutions
          </button>
          <div className="details-actions">
            {(course.isBusinessInABox || course.packageType === 'business-in-the-box' || course.slug?.includes('business-in-the-box')) && (
              <span className="details-pill" style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontWeight: 800,
                border: 'none',
              }}>
                📦 Business in a Box Bundle
              </span>
            )}
            <span className="details-pill">{course.category}</span>
            <button type="button" className="details-action">♡ Wishlist</button>
            <button type="button" className="details-action">↗ Share</button>
          </div>
        </div>

        <CourseHero
          course={course}
          onPurchase={handlePurchase}
          onAddToCart={handleAddToCart}
          isInCart={isInCart(course.id)}
        />

        <div className="course-details-layout">
          <main className="course-details-main">
            <BundleItemsSection course={course} />
            <CourseOverview course={course} />
            <CourseCurriculum curriculum={course.curriculum} />
            <div className="details-grid-two">
              <section className="info-panel">
                <h2>Requirements</h2>
                <ul>
                  {course.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="info-panel">
                <h2>Who this business solution is for</h2>
                <ul>
                  {course.audience.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
            <InstructorSection instructor={course.instructor} />
            <ReviewSection reviews={course.reviews} rating={course.rating} />
            <FAQSection faqs={course.faqs} />
            <RelatedCourses courses={course.relatedCourses} />
          </main>
          <aside className="course-details-aside">
            <StickyPurchaseCard
              course={course}
              onPurchase={handlePurchase}
              onAddToCart={handleAddToCart}
              isInCart={isInCart(course.id)}
            />
          </aside>
        </div>
      </div>

      {/* Guest Email Modal */}
      {showGuestModal && (
        <div className="session-modal-backdrop" onClick={() => setShowGuestModal(false)}>
          <div className="session-modal" style={{ maxWidth: '420px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowGuestModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#6b7280',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px 8px',
              }}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="session-modal-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0b6cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 6L2 7" />
              </svg>
            </div>
            <h2 style={{ marginBottom: '4px' }}>Quick Checkout</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '0', marginBottom: '20px' }}>
              Enter your email to purchase. We'll send you a link to access your business solution.
            </p>
            <form onSubmit={handleGuestPurchase}>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="auth-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  autoComplete="name"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="email"
                  placeholder="Email address *"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="auth-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {guestError && (
                <div className="auth-error" style={{ marginBottom: '12px' }}>{guestError}</div>
              )}
              {(() => {
                const displayPrice = typeof course.price === 'object'
                  ? course.price?.current || ''
                  : (typeof course.price === 'number' ? `₹${course.price}` : String(course.price || ''));
                return (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowGuestModal(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="session-modal-btn"
                      type="submit"
                      disabled={guestLoading || !guestEmail}
                      style={{ flex: 2, margin: 0, opacity: guestLoading ? 0.7 : 1 }}
                    >
                      {guestLoading ? 'Processing...' : `Pay ${displayPrice}`}
                    </button>
                  </div>
                );
              })()}
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', textAlign: 'center' }}>
                Already have an account?{' '}
                <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/login`} style={{ color: '#0b6cff' }}>Log in</a>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {purchaseSuccess && (
        <div className="session-modal-backdrop">
          <div className="session-modal" style={{ maxWidth: '460px' }}>
            <div className="session-modal-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Purchase Successful!</h2>
            <p style={{ color: '#374151', lineHeight: '1.6' }}>
              Thank you for purchasing <strong>{course.title}</strong>. We've sent an access link to <strong>{guestEmail}</strong>.
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Check your email to access your business solution. You can also set a password to manage your account.
            </p>
            {purchaseAccessUrl && (
              <a
                href={purchaseAccessUrl}
                className="session-modal-btn"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: '8px' }}
              >
                Access Business Solution Now
              </a>
            )}
            <button
              className="session-modal-btn"
              type="button"
              onClick={() => {
                setPurchaseSuccess(false);
                window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/courses`;
              }}
              style={{ width: '100%', background: '#f3f4f6', color: '#374151' }}
            >
              Back to Business Solutions
            </button>
          </div>
        </div>
      )}

      {/* Persistent Mobile Bottom Sticky Buy / Enroll Bar */}
      <MobileStickyBuyBar
        course={course}
        onPurchase={handlePurchase}
        onAddToCart={handleAddToCart}
        isInCart={isInCart(course.id)}
      />
    </div>
  );
};

export default CourseDetails;
