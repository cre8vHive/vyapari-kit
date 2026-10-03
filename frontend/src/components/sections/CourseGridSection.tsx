import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export interface CourseItem {
  id: string;
  slug: string;
  title: string;
  instructorName: string;
  categoryName: string;
  packageType?: string;
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
  mode?: 'available' | 'my';
  onCourseClick?: (course: CourseItem, event: React.MouseEvent<HTMLAnchorElement>) => void;
}

function courseCategorySlug(categoryName: string) {
  return categoryName.trim().toLowerCase().replace(/\s+/g, '-');
}

export const CourseGridSection: React.FC<CourseGridSectionProps> = ({
  sectionTitle = "Popular Business Solutions",
  courses,
  layout = 'grid',
  embedded = false,
  mode = 'available',
  onCourseClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { addToCart, isInCart, openCart } = useCart();
  const coursesPerPage = 10;
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const startIndex = (currentPage - 1) * coursesPerPage;
  const displayedCourses = courses.slice(startIndex, startIndex + coursesPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '20px 0', alignItems: 'center' }}>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#0f172a' }}
        >
          Previous
        </button>
        <span style={{ fontWeight: 500, color: '#475569' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: currentPage === totalPages ? '#f8fafc' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#94a3b8' : '#0f172a' }}
        >
          Next
        </button>
      </div>
    );
  };

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
    <>
      {renderPagination()}
      <div className={`course-list-container layout-${layout}`}>
        {displayedCourses.map((course, index) => {
          const isMyCourse = mode === 'my';
          const courseUrl = (isMyCourse && course.hasPdf) ? `/courses/${course.id}/viewer` : `/courses/${course.slug}`;
          const actionText = (isMyCourse && course.hasPdf) ? 'View Material' : 'View Details';
          const isBusinessInABox = course.packageType === 'business-in-the-box' || course.slug?.includes('business-in-the-box');
          const isTool = course.packageType === 'business-tools';

          return (
            <div
              key={course.id || index}
              className={`elementor-element e-con-full e-flex e-con e-child course-card-wrapper${isBusinessInABox ? ' is-business-in-box-card' : ''}`}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                overflow: 'hidden',
                border: isBusinessInABox ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                boxShadow: isBusinessInABox ? '0 10px 25px -5px rgba(245, 158, 11, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Image Hotspot with Business in a Box Badge overlay */}
              <div className="elementor-element elementor-element-hotspot-container elementor-widget elementor-widget-hotspot" style={{ position: 'relative' }}>
                <div className="elementor-widget-container">
                  <img
                    src={course.imageUrl}
                    className="attachment-full size-full"
                    alt={course.title}
                    loading="lazy"
                  />
                  {isBusinessInABox && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2,
                    }}>
                      📦 Business in a Box
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="elementor-element e-con-full e-flex e-con e-child course-card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {isBusinessInABox ? (
                    <span style={{
                      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      color: '#92400e',
                      border: '1px solid #f59e0b',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}>
                      All-In-One Bundle
                    </span>
                  ) : isTool ? (
                    <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Business Tool
                    </span>
                  ) : (
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                      Business Plan
                    </span>
                  )}
                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                    {course.difficulty}
                  </span>
                </div>

                {/* Course Title */}
                <div className="elementor-element elementor-widget elementor-widget-heading">
                  <div className="elementor-widget-container">
                    <h4 className="elementor-heading-title elementor-size-default">
                      <a
                        href={courseUrl}
                        onClick={(event) => {
                          if (onCourseClick) {
                            onCourseClick(course, event);
                          }
                        }}
                      >
                        {course.title}
                      </a>
                    </h4>
                  </div>
                </div>

                {/* Bundle Value Indicator */}
                {isBusinessInABox && (
                  <div style={{
                    margin: '6px 0 10px 0',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    fontSize: '11.5px',
                    color: '#92400e',
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}>
                    ✨ Includes Plan + All {course.categoryName} Tools
                  </div>
                )}

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
                      ₹{course.price.toFixed(2)}
                    </span>
                    {course.oldPrice && (
                      <span className="price-old" style={{ textDecoration: 'line-through', opacity: 0.5 }}>
                        ₹{course.oldPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="elementor-element elementor-widget elementor-widget-button">
                    <div className="elementor-widget-container">
                      <div className="elementor-button-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {mode === 'available' && (
                          <button
                            type="button"
                            className={`course-card-cart-btn${isInCart(course.id) ? ' in-cart' : ''}`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (isInCart(course.id)) {
                                openCart();
                              } else {
                                addToCart({
                                  id: course.id,
                                  slug: course.slug,
                                  title: course.title,
                                  price: course.price,
                                  oldPrice: course.oldPrice,
                                  imageUrl: course.imageUrl,
                                  categoryName: course.categoryName,
                                  packageType: course.packageType,
                                  instructorName: course.instructorName,
                                  difficulty: course.difficulty,
                                });
                              }
                            }}
                            title={isInCart(course.id) ? 'In Cart (Click to view)' : 'Add to Cart'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="21" r="1"></circle>
                              <circle cx="20" cy="21" r="1"></circle>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <span>{isInCart(course.id) ? 'In Cart' : '+ Cart'}</span>
                          </button>
                        )}
                        <a
                          className="elementor-button elementor-button-link elementor-size-sm"
                          href={courseUrl}
                          onClick={(event) => {
                            if (onCourseClick) {
                              onCourseClick(course, event);
                            }
                          }}
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
      {renderPagination()}
    </>
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
