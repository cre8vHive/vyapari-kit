import React from 'react';

const CourseHero = ({ course, onPurchase }) => {
  return (
    <section className="course-hero">
      <div className="course-hero-left">
        <div className="hero-tags">
          <span className="hero-chip hero-chip-accent">{course.category}</span>
          <span className="hero-chip">{course.difficulty}</span>
        </div>
        <h1 className="hero-title">{course.title}</h1>
        <p className="hero-copy">{course.subtitle}</p>
        <div className="hero-cards">
          <article className="hero-card">
            <span>Rating</span>
            <strong>{course.rating} ★</strong>
          </article>
          <article className="hero-card">
            <span>Students</span>
            <strong>{course.students}</strong>
          </article>
          <article className="hero-card">
            <span>Instructor</span>
            <strong>{course.instructorName}</strong>
          </article>
        </div>
        <div className="hero-details-grid">
          <article className="hero-detail">
            <span>Language</span>
            <strong>{course.language}</strong>
          </article>
          <article className="hero-detail">
            <span>Last updated</span>
            <strong>{course.lastUpdated}</strong>
          </article>
          <article className="hero-detail">
            <span>Category</span>
            <strong>{course.category}</strong>
          </article>
        </div>
      </div>

      <aside className="course-hero-right">
        <div className="hero-media-card">
          <img src={course.thumbnail} alt={course.title} />
        </div>
        <div className="hero-purchase-card">
          <div className="hero-price-row">
            <div>
              <p>Price</p>
              <strong>{course.price.current}</strong>
            </div>
            <span>{course.price.old}</span>
          </div>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onPurchase}>Enroll Now</button>
            <button type="button" className="btn btn-secondary" onClick={onPurchase}>Buy Now</button>
          </div>
          <div className="hero-include-list">
            <h3>Course includes</h3>
            <ul>
              {course.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </section>
  );
};

export default CourseHero;
