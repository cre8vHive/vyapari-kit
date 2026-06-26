import React from 'react';

export interface CourseItem {
  id: string;
  slug: string;
  title: string;
  instructorName: string;
  categoryName: string;
  difficulty: string;
  price: number;
  oldPrice?: number;
  rating: number;
  imageUrl: string;
  hasPdf?: boolean;
}

export interface CourseGridSectionProps {
  sectionTitle?: string;
  courses: CourseItem[];
  layout?: 'grid' | 'carousel';
  embedded?: boolean;
}

function courseCategorySlug(categoryName: string) {
  return categoryName.trim().toLowerCase().replace(/\s+/g, '-');
}

export const CourseGridSection: React.FC<CourseGridSectionProps> = ({
  sectionTitle = "Popular classes",
  courses,
  layout = 'grid',
  embedded = false,
}) => {
  // Star rendering helper based on Mongoose rating floating points
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      let widthPercentage = "0%";
      if (i <= fullStars) {
        widthPercentage = "100%";
      } else if (i === fullStars + 1 && hasHalfStar) {
        // Calculate the remainder percentage width for partial stars
        widthPercentage = `${(rating % 1) * 100}%`;
      }

      stars.push(
        <div key={i} className="e-icon">
          <div 
            className="e-icon-wrapper e-icon-marked" 
            style={{ '--e-rating-icon-marked-width': widthPercentage } as React.CSSProperties}
          >
            <i aria-hidden="true" className="jki jki-star-solid"></i>
          </div>
          <div className="e-icon-wrapper e-icon-unmarked">
            <i aria-hidden="true" className="jki jki-star-solid"></i>
          </div>
        </div>
      );
    }
    return stars;
  };

  const courseGrid = (
    <div className={`course-list-container layout-${layout}`}>
      {courses.map((course, index) => {
        const courseUrl = course.hasPdf ? `/courses/${course.id}/viewer` : `/courses/${course.slug}`;
        const actionText = course.hasPdf ? 'View Material' : 'Start Learning';

        return (
          <div
            key={course.id || index}
            className="elementor-element e-con-full e-flex e-con e-child course-card-wrapper"
            style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden' }}
          >
          {/* Image Hotspot (Difficulty Badge overlay) */}
          <div className="elementor-element elementor-element-hotspot-container elementor-widget elementor-widget-hotspot">
            <div className="elementor-widget-container">
              <img
                src={course.imageUrl}
                className="attachment-full size-full"
                alt={course.title}
                loading="lazy"
              />
              <div className="e-hotspot elementor-repeater-item-d6856d8 e-hotspot--position-left e-hotspot--position-top">
                <div className="e-hotspot__button">
                  <div className="e-hotspot__label">{course.difficulty}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="elementor-element e-con-full e-flex e-con e-child course-card-body" style={{ padding: '20px' }}>
            {/* Course Title */}
            <div className="elementor-element elementor-widget elementor-widget-heading">
              <div className="elementor-widget-container">
                <h4 className="elementor-heading-title elementor-size-default">
                  <a href={courseUrl}>{course.title}</a>
                </h4>
              </div>
            </div>

            {/* Meta Attributes */}
            <div className="elementor-element e-con-full e-flex e-con e-child course-meta-row" style={{ display: 'flex', gap: '10px' }}>
              <div className="elementor-element elementor-widget elementor-widget-heading">
                <div className="elementor-widget-container">
                  <h5 className="elementor-heading-title elementor-size-default" style={{ opacity: 0.8 }}>
                    By {course.instructorName}
                  </h5>
                </div>
              </div>
              <div className="elementor-element elementor-widget elementor-widget-heading">
                <div className="elementor-widget-container">
                  <h5 className="elementor-heading-title elementor-size-default">
                    <a href={`/courses?tab=available&category=${courseCategorySlug(course.categoryName)}`} style={{ color: '#0b7cff' }}>
                      in {course.categoryName}
                    </a>
                  </h5>
                </div>
              </div>
            </div>

            {/* Rating Stars */}
            <div className="elementor-element e-con-full e-flex e-con e-child rating-container-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="elementor-element elementor-widget elementor-widget-rating">
                <div className="elementor-widget-container">
                  <div className="e-rating">
                    <div className="e-rating-wrapper">
                      {renderStars(course.rating)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="elementor-element elementor-widget elementor-widget-heading">
                <div className="elementor-widget-container">
                  <h4 className="elementor-heading-title elementor-size-default">
                    <b>{course.rating.toFixed(1)}</b>
                  </h4>
                </div>
              </div>
            </div>

            {/* Pricing and Action Button */}
            <div className="elementor-element e-con-full e-flex e-con e-child price-button-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
              <div className="price-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="price-new" style={{ color: '#0b1220', fontSize: '18px', fontWeight: 'bold' }}>
                  ${course.price.toFixed(2)}
                </span>
                {course.oldPrice && (
                  <span className="price-old" style={{ textDecoration: 'line-through', opacity: 0.5 }}>
                    ${course.oldPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="elementor-element elementor-widget elementor-widget-button">
                <div className="elementor-widget-container">
                  <div className="elementor-button-wrapper">
                    <a
                      className="elementor-button elementor-button-link elementor-size-sm"
                      href={courseUrl}
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      <span className="elementor-button-content-wrapper">
                        <span className="elementor-button-text">{actionText}</span>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>

          </div>
        );
      })}
    </div>
  );

  if (embedded) {
    return (
      <div className="course-grid-section-embedded">
        {sectionTitle && (
          <div className="course-grid-heading-row">
            <h2>{sectionTitle}</h2>
          </div>
        )}
        {courseGrid}
      </div>
    );
  }

  return (
    <div className="elementor-element elementor-element-c96ecd5 e-flex e-con-boxed e-con e-parent">
      <div className="e-con-inner">
        
        {/* Section Heading */}
        <div className="elementor-element elementor-element-e25d111 e-con-full e-flex e-con e-child">
          <div className="elementor-element elementor-element-fdacc00 elementor-widget__width-initial elementor-widget elementor-widget-heading">
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                {sectionTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Courses Listing Container */}
        {courseGrid}

      </div>
    </div>
  );
};

export default CourseGridSection;
