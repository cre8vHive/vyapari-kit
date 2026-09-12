import React from 'react';

const RelatedCourses = ({ courses }) => {
  if (!courses || courses.length === 0) return null;

  return (
    <section className="related-courses" aria-label="Related courses">
      <h2>Related courses</h2>
      <div className="related-courses-banners">
        {courses.map((item) => (
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/courses/${item.slug}`}
            key={item.id}
            className="related-course-banner"
          >
            <div className="related-banner-media">
              <img
                className="related-banner-img"
                src={item.imageUrl || item.thumbnail}
                alt={item.title}
                loading="lazy"
              />
            </div>
            <div className="related-banner-body">
              <div className="related-banner-info">
                <span className="related-banner-tag">{item.category}</span>
                <h3 className="related-banner-title">{item.title}</h3>
              </div>
              <div className="related-banner-action">
                <span className="related-banner-price">{item.price}</span>
                <span className="related-banner-btn">
                  View Course
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default RelatedCourses;
