import React, { useMemo, useState } from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  iconUrl?: string;
  children?: string[];
}

export interface CategoriesSectionProps {
  sectionTitle?: string;
  categories: CategoryItem[];
  allCategoriesPopupId?: string; // e.g. "338" to trigger modal
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
  return `/courses?category=${encodeURIComponent(slug)}`;
}

export const SHOP_CATEGORY_DATA: CategoryItem[] = [
  {
    id: 'business-tools',
    name: 'BUSINESS TOOLS',
    slug: 'business-tools',
    iconUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=96&q=80',
    children: ['Technology', 'Food & Beverage', 'Manufacturing', 'Service', 'Commerce', 'Agriculture'],
  },
  {
    id: 'business-plans',
    name: 'BUSINESS PLANS',
    slug: 'business-plans',
    iconUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=96&q=80',
    children: ['Technology', 'Food & Beverage', 'Manufacturing', 'Service', 'Commerce', 'Agriculture'],
  },
  {
    id: 'business-in-the-box',
    name: 'BUSINESS IN THE BOX',
    slug: 'business-in-the-box',
    iconUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=96&q=80',
    children: ['Technology', 'Food & Beverage', 'Manufacturing', 'Service', 'Commerce', 'Agriculture'],
  },
];

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  sectionTitle = 'All Categories',
  categories,
  variant = 'tiles',
  selectedSlug,
  onCategorySelect,
}) => {
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  const normalizedCategories = useMemo(() => {
    const source = categories && categories.length > 0 ? categories : SHOP_CATEGORY_DATA;

    return source.map((cat) => ({
      ...cat,
      slug: cat.slug || toCategorySlug(cat.name),
      children: cat.children || [],
    }));
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
        <div className="elementor-element elementor-element-c7c68fa e-con-full e-flex e-con e-child">
          {normalizedCategories.map((cat, index) => {
            const slug = cat.slug || 'all';
            const hasChildren = Boolean(cat.children && cat.children.length > 0);
            const isExpanded = expandedParentId === cat.id;

            return (
              <div
                key={cat.id || index}
                className="elementor-element e-con-full e-flex e-con e-child category-tile-wrapper"
                style={{ position: 'relative' }}
              >
                <div className="elementor-element jkit-equal-height-disable elementor-widget elementor-widget-jkit_icon_box" style={{ height: '100%' }}>
                  <div className="elementor-widget-container" style={{ height: '100%' }}>
                    <div className="jeg-elementor-kit jkit-icon-box icon-position- elementor-animation-" style={{ height: '100%' }}>
                      {hasChildren ? (
                        <button
                          type="button"
                          className="icon-box-link"
                          aria-label={cat.name}
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedParentId((current) => (current === cat.id ? null : cat.id))}
                          style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', height: '100%', textAlign: 'left', cursor: 'pointer' }}
                        >
                          <div className={`jkit-icon-box-wrapper hover-from-left${isExpanded ? ' expanded' : ''}`}>
                            <div className="icon-box icon-box-header elementor-animation-">
                              <div className="icon style-color">
                                <img
                                  src={cat.iconUrl || DEFAULT_CATEGORY_IMAGE}
                                  className="attachment-full size-full"
                                  alt={cat.name}
                                  loading="lazy"
                                />
                              </div>
                            </div>
                            <div className="icon-box icon-box-body">
                              <h4 className="title">{cat.name}</h4>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <a href={toCategoryHref(slug)} className="icon-box-link" aria-label={cat.name}>
                          <div className="jkit-icon-box-wrapper hover-from-left">
                            <div className="icon-box icon-box-header elementor-animation-">
                              <div className="icon style-color">
                                <img
                                  src={cat.iconUrl || DEFAULT_CATEGORY_IMAGE}
                                  className="attachment-full size-full"
                                  alt={cat.name}
                                  loading="lazy"
                                />
                              </div>
                            </div>
                            <div className="icon-box icon-box-body">
                              <h4 className="title">{cat.name}</h4>
                            </div>
                          </div>
                        </a>
                      )}

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
                              top: 'calc(100% + 8px)',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 'max-content',
                              minWidth: '200px',
                              maxWidth: '260px',
                              zIndex: 90,
                              background: '#ffffff',
                              borderRadius: '14px',
                              boxShadow: '0 16px 36px rgba(11, 24, 44, 0.16), 0 4px 12px rgba(11, 124, 255, 0.08)',
                              border: '1px solid rgba(11, 124, 255, 0.2)',
                              padding: '8px',
                              display: 'grid',
                              gap: '4px',
                            }}
                          >
                            <div style={{ padding: '4px 8px 4px', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f3f4f6', marginBottom: '2px' }}>
                              Select Subcategory
                            </div>
                            {cat.children!.map((child, childIndex) => {
                              const childSlug = toCategorySlug(child);
                              return (
                                <a
                                  key={`${cat.id}-${child}-${childIndex}`}
                                  href={toCategoryHref(childSlug)}
                                  className="category-popover-item"
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
                                  <span style={{ fontSize: '13px', color: '#0b7cff', fontWeight: 700 }}>→</span>
                                </a>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoriesSection;
