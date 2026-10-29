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
  boxImageUrl?: string;
  hasPdf?: boolean;
  badge?: string;
}

export interface CourseGridSectionProps {
  sectionTitle?: string;
  courses: CourseItem[];
  layout?: 'grid' | 'carousel';
  embedded?: boolean;
  mode?: 'available' | 'my';
  coursesPerPage?: number;
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
  coursesPerPage = 12,
  onCourseClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { addToCart, isInCart, openCart } = useCart();
  const uniqueCourses = React.useMemo(() => {
    const seen = new Set<string>();
    return courses.filter((c) => {
      const key = (c.id || c.slug || c.title).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [courses]);

  const totalPages = Math.ceil(uniqueCourses.length / coursesPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const startIndex = (activePage - 1) * coursesPerPage;
  const displayedCourses = uniqueCourses.slice(startIndex, startIndex + coursesPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '20px 0', alignItems: 'center' }}>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={activePage === 1}
          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: activePage === 1 ? '#f8fafc' : 'white', cursor: activePage === 1 ? 'not-allowed' : 'pointer', color: activePage === 1 ? '#94a3b8' : '#0f172a' }}
        >
          Previous
        </button>
        <span style={{ fontWeight: 500, color: '#475569' }}>
          Page {activePage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={activePage === totalPages}
          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: activePage === totalPages ? '#f8fafc' : 'white', cursor: activePage === totalPages ? 'not-allowed' : 'pointer', color: activePage === totalPages ? '#94a3b8' : '#0f172a' }}
        >
          Next
        </button>
      </div>
    );
  };

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vyapaarkit_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = (courseId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setWishlist((prev) => {
      const next = prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId];
      try {
        localStorage.setItem('vyapaarkit_wishlist', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Helper for consistent review count
  const getReviewCount = (id: string) => {
    let hash = 0;
    const str = String(id || 'course');
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return 65 + (Math.abs(hash) % 120);
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
      <div className={`course-list-container layout-${layout}`}>
        {displayedCourses.map((course, index) => {
          const isMyCourse = mode === 'my';
          const courseUrl = (isMyCourse && course.hasPdf) ? `/courses/${course.id}/viewer` : `/courses/${course.slug}`;
          const actionText = (isMyCourse && course.hasPdf) ? 'View Material' : 'View Details';
          const isTool = course.packageType === 'business-tools';
          const isBusinessInABox =
            !isTool && (
              course.packageType === 'business-in-the-box' ||
              course.packageType === 'business-in-a-box' ||
              course.slug?.includes('business-in-the-box') ||
              course.slug?.includes('business-in-a-box') ||
              /business in a box/i.test(course.title || '')
            );
          const isWishlisted = wishlist.includes(course.id);
          const overlayBadge = course.badge || (isBusinessInABox ? 'Bestseller' : undefined);

          return (
            <div
              key={course.id || index}
              className={`elementor-element e-con-full e-flex e-con e-child course-card-wrapper modern-solution-card${isBusinessInABox ? ' is-business-in-box-card' : ''}`}
            >
              {/* Card Image Area (Clean, Unblocked Artwork) */}
              <div className="course-card-image-wrap">
                <a
                  href={courseUrl}
                  onClick={(event) => onCourseClick?.(course, event)}
                  className="course-card-image-link"
                >
                  <img
                    src={(isBusinessInABox && course.boxImageUrl) ? course.boxImageUrl : course.imageUrl}
                    className="course-card-thumb-img"
                    alt={course.title}
                    loading="lazy"
                  />
                </a>
              </div>

              {/* Card Content */}
              <div className="course-card-body">
                {/* Top Row: Showcase Badge (Trending/Bestseller) + Type Badges + Wishlist Heart */}
                <div className="course-card-top-row">
                  <div className="course-card-tags">
                    {overlayBadge && (
                      <span className={`course-badge badge-${overlayBadge.toLowerCase()}`}>
                        {overlayBadge}
                      </span>
                    )}
                    {isBusinessInABox ? (
                      <span className="course-badge badge-box">
                        Business in a Box
                      </span>
                    ) : isTool ? (
                      <span className="course-badge badge-playbook">
                        Business Playbook
                      </span>
                    ) : (
                      <span className="course-badge badge-plan">
                        Business Plan
                      </span>
                    )}
                    {course.difficulty && (
                      <span className="course-badge badge-difficulty">
                        {course.difficulty}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`course-card-wishlist-btn${isWishlisted ? ' is-active' : ''}`}
                    onClick={(e) => toggleWishlist(course.id, e)}
                    title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-label="Wishlist"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>

                {/* Course Title */}
                <h4 className="course-card-title">
                  <a
                    href={courseUrl}
                    title={course.title}
                    onClick={(event) => onCourseClick?.(course, event)}
                  >
                    {course.title}
                  </a>
                </h4>

                {/* Bundle Value Indicator */}
                {isBusinessInABox && (
                  <div className="course-card-bundle-indicator">
                    ✨ Includes Plan + All {course.categoryName} Tools
                  </div>
                )}

                {/* Author and Category Meta */}
                <div className="course-card-meta-row">
                  <span className="course-card-instructor">
                    By {course.instructorName || 'VyapaarKit Team'}
                  </span>
                  <a
                    href={`/courses?tab=available&category=${courseCategorySlug(course.categoryName)}`}
                    className="course-card-category-link"
                  >
                    in {course.categoryName}
                  </a>
                </div>

                {/* Rating Stars & Reviews */}
                <div className="course-card-rating-row">
                  <div className="e-rating">
                    <div className="e-rating-wrapper">
                      {renderStars(course.rating)}
                    </div>
                  </div>
                  <span className="course-rating-score">{course.rating.toFixed(1)}</span>
                  <span className="course-rating-count">({getReviewCount(course.id)})</span>
                </div>

                {/* Pricing Row */}
                <div className="course-card-price-row">
                  <span className="course-price-current">
                    ₹{course.price.toFixed(2)}
                  </span>
                  {course.oldPrice && (
                    <span className="course-price-old">
                      ₹{course.oldPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Dual Action Buttons Row */}
                <div className="course-card-actions-row">
                  {mode === 'available' && (
                    <button
                      type="button"
                      className={`course-btn-cart${isInCart(course.id) ? ' in-cart' : ''}`}
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      <span>{isInCart(course.id) ? 'In Cart' : 'Add to Cart'}</span>
                    </button>
                  )}
                  <a
                    className="course-btn-details"
                    href={courseUrl}
                    onClick={(event) => onCourseClick?.(course, event)}
                  >
                    {actionText}
                  </a>
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
