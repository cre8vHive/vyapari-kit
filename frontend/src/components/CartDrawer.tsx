import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { paymentApi } from '../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function formatCurrency(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export const CartDrawer: React.FC = () => {
  const {
    items,
    removeFromCart,
    clearCart,
    totalCount,
    totalAmount,
    isCartOpen,
    closeCart,
    toastMessage,
    dismissToast,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [accessUrls, setAccessUrls] = useState<{ title: string; url: string }[]>([]);

  const isLoggedIn = !!localStorage.getItem('VyapaarKit_auth_token');

  // Calculate total original price for savings calculation
  const totalOldAmount = items.reduce((sum, item) => {
    return sum + (item.oldPrice && item.oldPrice > item.price ? item.oldPrice : item.price);
  }, 0);
  const totalSavings = totalOldAmount > totalAmount ? totalOldAmount - totalAmount : 0;

  const handleCheckoutClick = () => {
    if (items.length === 0) return;
    if (!isLoggedIn) {
      setShowGuestModal(true);
      setGuestError('');
      return;
    }
    processLoggedInCheckout();
  };

  const processLoggedInCheckout = async () => {
    try {
      setLoading(true);
      const courseIds = items.map((i) => i.id);
      const order = await paymentApi.createCartOrder(courseIds);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'Vyapari Kit',
        description: `Purchase of ${items.length} Business Solution(s)`,
        order_id: order.id,
        handler: async function (response: any) {
          closeCart();
          try {
            await paymentApi.verifyCartPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseIds,
            });
            clearCart();
            window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/courses?tab=my`;
          } catch (err: any) {
            alert(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        theme: {
          color: '#0b6cff',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert('Payment failed: ' + response.error.description);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setShowGuestModal(true);
      } else {
        alert(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) {
      setGuestError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setGuestError('');
      const courseIds = items.map((i) => i.id);
      const orderData = await paymentApi.createGuestCartOrder(courseIds, guestEmail.trim(), guestName.trim() || undefined);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vyapari Kit',
        description: `Purchase of ${items.length} Business Solution(s)`,
        order_id: orderData.id,
        prefill: {
          name: guestName.trim() || undefined,
          email: guestEmail.trim(),
        },
        handler: async function (response: any) {
          setShowGuestModal(false);
          closeCart();
          try {
            const result = await paymentApi.verifyGuestCartPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              guestToken: orderData.guestToken,
              courseIds,
            });
            clearCart();
            setCheckoutSuccess(true);
            setAccessUrls(result.accessUrls || (result.accessUrl ? [{ title: 'Purchased Solution', url: result.accessUrl }] : []));
          } catch (err: any) {
            alert(err.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setShowGuestModal(false);
          },
        },
        theme: {
          color: '#0b6cff',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setGuestError('Payment failed: ' + response.error.description);
        setLoading(false);
        setShowGuestModal(false);
      });
      rzp.open();
    } catch (err: any) {
      setGuestError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const handleBrowseSolutions = () => {
    closeCart();
    window.location.href = '/courses';
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="cart-toast" role="status" aria-live="polite">
          <div className="cart-toast-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button type="button" className="cart-toast-close" onClick={dismissToast} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {/* Cart Drawer Backdrop */}
      {isCartOpen && (
        <div className="cart-backdrop" onClick={closeCart} aria-hidden="true" />
      )}

      {/* Cart Drawer Shell */}
      <aside
        className={`cart-drawer ${isCartOpen ? 'is-open' : ''}`}
        aria-label="Shopping Cart"
        aria-hidden={!isCartOpen}
      >
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title-group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h2>Your Cart</h2>
            <span className="cart-count-pill">{totalCount}</span>
          </div>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h3>Your cart is empty</h3>
              <p>Explore our business solutions, kits, and playbooks to accelerate your entrepreneurial journey.</p>
              <button
                type="button"
                className="cart-empty-btn"
                onClick={handleBrowseSolutions}
              >
                Browse Business Solutions
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {items.map((item) => {
                const thumb = item.imageUrl || item.thumbnail || '/images/products/vyapaarkit-bundle-hero.jpg';
                const isBox = item.packageType === 'business-in-the-box' || item.slug?.includes('business-in-the-box');
                const category = item.categoryName || item.category || 'Business Solution';

                return (
                  <li key={item.id} className={`cart-item${isBox ? ' is-box-bundle' : ''}`}>
                    <img
                      src={thumb}
                      alt={item.title}
                      className="cart-item-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/vyapaarkit-bundle-hero.jpg';
                      }}
                    />
                    <div className="cart-item-details">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '3px' }}>
                        {isBox && (
                          <span style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 800,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase'
                          }}>
                            📦 Box Bundle
                          </span>
                        )}
                        <span className="cart-item-category">
                          {category}
                        </span>
                      </div>
                      <a
                        href={`/courses/${item.slug}`}
                        className="cart-item-title"
                        onClick={closeCart}
                      >
                        {item.title}
                      </a>
                      {isBox && (
                        <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600, marginTop: '2px', lineHeight: 1.3 }}>
                          ✨ Includes Plan + All {category} Tools
                        </div>
                      )}
                      <div className="cart-item-price-row">
                        <span className="cart-item-price">{formatCurrency(item.price)}</span>
                        {item.oldPrice && item.oldPrice > item.price && (
                          <span className="cart-item-old-price">{formatCurrency(item.oldPrice)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id)}
                      title="Remove from cart"
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            {totalSavings > 0 && (
              <div className="cart-savings-notice">
                <span>🎉 You are saving <strong>{formatCurrency(totalSavings)}</strong> on this order!</span>
              </div>
            )}
            <div className="cart-summary-row">
              <span>Subtotal ({totalCount} {totalCount === 1 ? 'solution' : 'solutions'})</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            <div className="cart-summary-row cart-total-row">
              <span>Total Amount</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            <button
              type="button"
              className="cart-checkout-btn"
              onClick={handleCheckoutClick}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Checkout • ${formatCurrency(totalAmount)}`}
            </button>
            <button
              type="button"
              className="cart-clear-btn"
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </div>
        )}
      </aside>

      {/* Guest Checkout Modal */}
      {showGuestModal && (
        <div className="session-modal-backdrop" onClick={() => setShowGuestModal(false)}>
          <div className="session-modal cart-guest-modal" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
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
            <h2>Quick Cart Checkout</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '0', marginBottom: '20px' }}>
              Enter your email to complete your purchase of {totalCount} business solution(s). We'll send access links right to your inbox.
            </p>
            <form onSubmit={handleGuestCheckout}>
              <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {guestError && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>
                  {guestError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  style={{
                    padding: '10px 16px',
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
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0b6cff',
                    color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Processing...' : `Pay ${formatCurrency(totalAmount)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest Checkout Success Modal */}
      {checkoutSuccess && (
        <div className="session-modal-backdrop">
          <div className="session-modal" style={{ maxWidth: '520px', textAlign: 'center' }}>
            <div className="session-modal-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Order Complete!</h2>
            <p style={{ color: '#4b5563', fontSize: '15px' }}>
              Thank you for your purchase! A confirmation email and login setup link has been sent to <strong>{guestEmail}</strong>.
            </p>
            {accessUrls.length > 0 && (
              <div style={{ margin: '20px 0', textAlign: 'left', maxHeight: '180px', overflowY: 'auto' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#111827' }}>Direct Access Links:</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {accessUrls.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>
                      <a
                        href={item.url}
                        style={{
                          display: 'block',
                          padding: '10px 14px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          color: '#15803d',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '14px',
                        }}
                      >
                        📖 Open {item.title} →
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className="session-modal-btn"
              onClick={() => {
                setCheckoutSuccess(false);
                closeCart();
                window.location.href = '/courses';
              }}
            >
              Done & Explore More
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CartDrawer;
