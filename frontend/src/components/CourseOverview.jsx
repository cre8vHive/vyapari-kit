import React, { useState } from 'react';

const CourseOverview = ({ course }) => {
  const [openLearn, setOpenLearn] = useState(true);
  const [openDesc, setOpenDesc] = useState(true);
  const [openSkills, setOpenSkills] = useState(true);

  const learningHighlights = course.learningHighlights || [];
  const description = Array.isArray(course.description)
    ? course.description
    : (course.description ? [course.description] : []);
  const keyPoints = course.keyPoints || [];
  const skills = course.skills || [];

  return (
    <section className="course-overview">
      <div className="overview-grid">
        <div className="overview-section-card">
          <button
            type="button"
            className="mobile-accordion-toggle"
            onClick={() => setOpenLearn((prev) => !prev)}
            aria-expanded={openLearn}
          >
            <h2>What you'll learn</h2>
            <span className={`mobile-collapse-chevron ${openLearn ? 'open' : ''}`} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          <div className={`mobile-accordion-body ${openLearn ? 'open' : 'collapsed'}`}>
            <div className="overview-highlights">
              {learningHighlights.map((item) => (
                <div key={item} className="overview-highlight-card">
                  <span>✓</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overview-section-card">
          <button
            type="button"
            className="mobile-accordion-toggle"
            onClick={() => setOpenDesc((prev) => !prev)}
            aria-expanded={openDesc}
          >
            <h2>Solution description</h2>
            <span className={`mobile-collapse-chevron ${openDesc ? 'open' : ''}`} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          <div className={`mobile-accordion-body ${openDesc ? 'open' : 'collapsed'}`}>
            {description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {keyPoints.length > 0 && (
              <div className="overview-keypoints">
                {keyPoints.map((point) => (
                  <p key={point}>
                    <span>•</span>
                    {point}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="skills-panel overview-section-card">
          <button
            type="button"
            className="mobile-accordion-toggle"
            onClick={() => setOpenSkills((prev) => !prev)}
            aria-expanded={openSkills}
          >
            <h3>Skills you'll gain</h3>
            <span className={`mobile-collapse-chevron ${openSkills ? 'open' : ''}`} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          <div className={`mobile-accordion-body ${openSkills ? 'open' : 'collapsed'}`}>
            <div className="skills-list">
              {skills.map((skill) => (
                <span key={skill} className="skill-pill">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CourseOverview;
