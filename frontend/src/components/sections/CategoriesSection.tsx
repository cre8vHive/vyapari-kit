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

function toCategorySlug(value: string | undefined | null) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
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
              >
                <div className="elementor-element jkit-equal-height-disable elementor-widget elementor-widget-jkit_icon_box">
                  <div className="elementor-widget-container">
                    <div className="jeg-elementor-kit jkit-icon-box icon-position- elementor-animation-">
                      {hasChildren ? (
                        <button
                          type="button"
                          className="icon-box-link"
                          aria-label={cat.name}
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedParentId((current) => (current === cat.id ? null : cat.id))}
                          style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                        >
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
                        <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.875rem' }}>
                          {cat.children!.map((child, childIndex) => {
                            const childSlug = toCategorySlug(child);
                            return (
                              <a
                                key={`${cat.id}-${child}-${childIndex}`}
                                href={toCategoryHref(childSlug)}
                                className="icon-box-link"
                                aria-label={child}
                                style={{
                                  display: 'block',
                                  padding: '0.55rem 0.7rem',
                                  borderRadius: '999px',
                                  background: 'rgba(11, 18, 32, 0.05)',
                                  color: '#0b1220',
                                  fontSize: '0.95rem',
                                  fontWeight: 500,
                                  textDecoration: 'none',
                                }}
                              >
                                {child}
                              </a>
                            );
                          })}
                        </div>
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
