import React, { useMemo, useState } from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  titleLines?: [string, string];
  slug?: string;
  subtitle?: string;
  iconUrl?: string;
  productImage?: string;
  price?: string | number;
  badge?: string;
  isPopular?: boolean;
  buttonText?: string;
  features?: string[];
  children?: string[];
}

export interface CategoriesSectionProps {
  sectionTitle?: string;
  categories?: CategoryItem[];
  allCategoriesPopupId?: string;
  onAllCategoriesClick?: () => void;
  variant?: 'tiles' | 'filters';
  selectedSlug?: string;
  onCategorySelect?: (slug: string) => void;
}

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=96&q=80';

function normalizeSlug(value: string | undefined | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toCategorySlug(value: string | undefined | null) {
  return normalizeSlug(value);
}

function toCategoryHref(slug: string) {
  return `/courses?tab=available&type=${encodeURIComponent(slug)}`;
}

function toSubcategoryHref(parentSlug: string, categoryName: string) {
  const categorySlug = toCategorySlug(categoryName);
  return `/courses?tab=available&type=${encodeURIComponent(parentSlug)}&category=${encodeURIComponent(categorySlug)}`;
}

const UNIFIED_SUBCATEGORIES = [
  'Agriculture',
  'Commerce',
  'Digital',
  'F&B',
  'Manufacturing',
  'Services',
];

export const SHOP_CATEGORY_DATA: CategoryItem[] = [
  {
    id: 'business-plans',
    name: 'Business Plans',
    titleLines: ['Business', 'Plans'],
    slug: 'business-plans',
    subtitle: 'Know what to do.',
    productImage: 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/tiles/business-plans-box.png',
    price: '399',
    buttonText: 'Get Business Plans',
    features: [
      'Detailed business plan',
      'Market & financial insights',
      'Growth roadmap',
    ],
    children: UNIFIED_SUBCATEGORIES,
  },
  {
    id: 'business-in-the-box',
    name: 'Business in a Box',
    titleLines: ['Business', 'in a Box'],
    slug: 'business-in-the-box',
    subtitle: 'Everything you need.',
    badge: 'MOST POPULAR',
    isPopular: true,
    productImage: 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/tiles/business-in-a-box-bundle.png',
    price: '899',
    buttonText: 'Get Business in a Box',
    features: [
      '1 complete business plan',
      'All category business tools included',
      'Everything in one package',
    ],
    children: UNIFIED_SUBCATEGORIES,
  },
  {
    id: 'business-tools',
    name: 'Business Tools',
    titleLines: ['Business', 'Tools'],
    slug: 'business-tools',
    subtitle: 'Get things done.',
    productImage: 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/tiles/business-tools-binder.png',
    price: '299',
    buttonText: 'Get Business Tools',
    features: [
      'Industry-specific tools & playbooks',
      'Templates and calculators',
      'Save time and effort',
    ],
    children: UNIFIED_SUBCATEGORIES,
  },
];

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  variant = 'tiles',
  selectedSlug,
  onCategorySelect,
}) => {
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (onCategorySelect) {
      e.preventDefault();
      onCategorySelect(slug);
      return;
    }
    e.preventDefault();
    setExpandedParentId(null);
    const targetUrl = toCategoryHref(slug);
    window.history.pushState(null, '', targetUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleSubcategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, parentSlug: string, childName: string) => {
    if (onCategorySelect) {
      e.preventDefault();
      onCategorySelect(toCategorySlug(childName));
      return;
    }
    e.preventDefault();
    setExpandedParentId(null);
    const targetUrl = toSubcategoryHref(parentSlug, childName);
    window.history.pushState(null, '', targetUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const normalizedCategories = useMemo(() => {
    return SHOP_CATEGORY_DATA.map((shopCat) => {
      const matched = categories?.find(
        (c) => c.slug === shopCat.slug || normalizeSlug(c.name) === shopCat.slug || c.id === shopCat.id
      );
      return {
        ...shopCat,
        children: matched?.children && matched.children.length > 0 ? matched.children : shopCat.children,
      };
    });
  }, [categories]);

  if (variant === 'filters') {
    return (
      <div className="course-category-filter-bar" aria-label="Course categories">
        {normalizedCategories.map((cat) => {
          const slug = cat.slug || 'all';
          const isActive = selectedSlug === slug;

          return (
            <button
              key={cat.id || slug}
              className={`course-category-filter${isActive ? ' active' : ''}`}
              type="button"
              onClick={() => onCategorySelect?.(slug)}
              aria-pressed={isActive}
            >
              <img src={cat.iconUrl || DEFAULT_CATEGORY_IMAGE} alt="" loading="lazy" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="elementor-element elementor-element-1438c1b e-flex e-con-boxed e-con e-parent">
      <div className="e-con-inner">
        <div className="vyapaar-pkg-grid">
          {normalizedCategories.map((cat) => {
            const slug = cat.slug || 'all';
            const hasChildren = Boolean(cat.children && cat.children.length > 0);
            const isExpanded = expandedParentId === cat.id;

            return (
              <div
                key={cat.id}
                className={`vyapaar-pkg-card vyapaar-pkg-card--${cat.id}${cat.isPopular ? ' is-popular' : ''}`}
              >
                {/* Badge if Popular */}
                {cat.badge && (
                  <div className="vyapaar-pkg-badge">
                    {cat.badge}
                  </div>
                )}

                {/* Top Category Icon */}
                <div className="vyapaar-pkg-icon-wrapper">
                  <div className={`vyapaar-pkg-top-icon icon--${cat.id}`}>
                    {cat.id === 'business-plans' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="4" />
                        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                        <line x1="2" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="22" y2="12" />
                        <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
                        <path d="M9 18h6" />
                        <path d="M10 21h4" />
                        <path d="M12 5a5 5 0 0 0-5 5c0 1.93 1.09 3.6 2.69 4.47.38.21.61.62.61 1.06V16h5.4v-.47c0-.44.23-.85.61-1.06A5.003 5.003 0 0 0 17 10a5 5 0 0 0-5-5z" fill="#ffffff" />
                      </svg>
                    )}
                    {cat.id === 'business-in-the-box' && (
                      <svg width="26" height="26" viewBox="0 0 24 24">
                        <path d="M12 2L20.5 7L12 12L3.5 7L12 2Z" fill="#0d1117" stroke="#ffd000" strokeWidth="1.2" strokeLinejoin="round" />
                        <path d="M3.5 7V17L12 22V12L3.5 7Z" fill="#05080d" stroke="#ffd000" strokeWidth="1.2" strokeLinejoin="round" />
                        <path d="M12 12V22L20.5 17V7L12 12Z" fill="#0d1117" stroke="#ffd000" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    )}
                    {cat.id === 'business-tools' && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="#000000">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="vyapaar-pkg-title">
                  {cat.titleLines ? (
                    <>
                      <span>{cat.titleLines[0]}</span>
                      <span>{cat.titleLines[1]}</span>
                    </>
                  ) : (
                    <span>{cat.name}</span>
                  )}
                </h3>

                {/* Subtitle */}
                <p className="vyapaar-pkg-subtitle">{cat.subtitle}</p>

                {/* 3D Product Mockup Image */}
                <div
                  className="vyapaar-pkg-image-box"
                  onClick={() => hasChildren && setExpandedParentId((curr) => (curr === cat.id ? null : cat.id))}
                  style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                  title={hasChildren ? 'Click to browse categories' : undefined}
                >
                  <img
                    src={cat.productImage}
                    alt={cat.name}
                    loading="lazy"
                    className="vyapaar-pkg-product-img"
                  />
                </div>

                {/* Features Checklist */}
                <div className="vyapaar-pkg-features">
                  {cat.features?.map((feat, fIdx) => (
                    <div key={fIdx} className="vyapaar-pkg-feature-item">
                      <span className={`vyapaar-pkg-check check--${cat.id}`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className="vyapaar-pkg-feature-text">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="vyapaar-pkg-price">
                  ₹{cat.price}
                </div>

                {/* Call to action button */}
                <a
                  href={toCategoryHref(slug)}
                  className={`vyapaar-pkg-btn btn--${cat.id}`}
                  onClick={(e) => handleCategoryClick(e, slug)}
                >
                  <span>{cat.buttonText || `Get ${cat.name}`}</span>
                  <span className="vyapaar-pkg-btn-arrow">→</span>
                </a>

                {/* Subcategory Popover Dropdown (if triggered) */}
                {hasChildren && isExpanded && (
                  <>
                    <div
                      className="category-popover-backdrop"
                      onClick={() => setExpandedParentId(null)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 80,
                      }}
                    />
                    <div
                      className="category-popover-dropdown"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'max-content',
                        minWidth: '240px',
                        maxWidth: '320px',
                        maxHeight: '380px',
                        overflowY: 'auto',
                        zIndex: 90,
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 20px 45px rgba(11, 24, 44, 0.22), 0 6px 16px rgba(11, 124, 255, 0.12)',
                        border: '1px solid rgba(11, 124, 255, 0.25)',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ padding: '6px 12px 6px', fontSize: '11px', fontWeight: 800, color: '#0b7cff', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #eef2ff', background: '#f8fafc', borderRadius: '6px', marginBottom: '4px' }}>
                        Select Category
                      </div>
                      {cat.children!.map((child, childIndex) => (
                        <a
                          key={`${cat.id}-${child}-${childIndex}`}
                          href={toSubcategoryHref(slug, child)}
                          className="category-popover-item"
                          onClick={(e) => handleSubcategoryClick(e, slug, child)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            color: '#0b1220',
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            background: 'transparent',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(11, 124, 255, 0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span>{child}</span>
                          <span style={{ fontSize: '13px', color: '#0b7cff', fontWeight: 700, marginLeft: '8px' }}>→</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoriesSection;
