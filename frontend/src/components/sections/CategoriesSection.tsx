import React from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
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

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  sectionTitle = "All Categories",
  categories,
  onAllCategoriesClick,
  variant = 'tiles',
  selectedSlug,
  onCategorySelect,
}) => {
  if (variant === 'filters') {
    return (
      <div className="course-category-filter-bar" aria-label="Course categories">
        {categories.map((cat) => {
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
              <img src={cat.iconUrl} alt="" loading="lazy" />
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
          
          {/* Main Category Overlay Card (All Categories Trigger) */}
          <div className="elementor-element elementor-element-cd04a4f e-con-full e-flex e-con e-child">
            <div className="elementor-element elementor-element-1a3cd91 elementor-widget elementor-widget-image">
              <div className="elementor-widget-container">
                <a 
                  href="#all-categories-popup" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onAllCategoriesClick) onAllCategoriesClick();
                  }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=96&q=80" 
                    className="attachment-full size-full" 
                    alt={sectionTitle} 
                  />
                </a>
              </div>
            </div>
            <div className="elementor-element elementor-element-1fc5d94 elementor-widget elementor-widget-heading">
              <div className="elementor-widget-container">
                <h4 className="elementor-heading-title elementor-size-default">
                  <a 
                    href="#all-categories-popup"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onAllCategoriesClick) onAllCategoriesClick();
                    }}
                  >
                    {sectionTitle}
                  </a>
                </h4>
              </div>
            </div>
          </div>

          {/* List of Custom Categories */}
          {categories.map((cat, index) => (
            <div 
              key={cat.id || index}
              className="elementor-element e-con-full e-flex e-con e-child category-tile-wrapper"
            >
              <div className="elementor-element jkit-equal-height-disable elementor-widget elementor-widget-jkit_icon_box">
                <div className="elementor-widget-container">
                  <div className="jeg-elementor-kit jkit-icon-box icon-position- elementor-animation-">
                    <a href={`/courses?category=${cat.slug}`} className="icon-box-link" aria-label={cat.name}>
                      <div className="jkit-icon-box-wrapper hover-from-left">
                        <div className="icon-box icon-box-header elementor-animation-">
                          <div className="icon style-color">
                            <img 
                              src={cat.iconUrl} 
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
                  </div>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default CategoriesSection;
