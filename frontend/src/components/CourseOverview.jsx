import React from 'react';

const CourseOverview = ({ course }) => {
  return (
    <section className="course-overview">
      <div className="overview-grid">
        <div>
          <h2>What you'll learn</h2>
          <div className="overview-highlights">
            {course.learningHighlights.map((item) => (
              <div key={item} className="overview-highlight-card">
                <span>✓</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2>Course description</h2>
          {course.description.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <div className="overview-keypoints">
            {course.keyPoints.map((point) => (
              <p key={point}>
                <span>•</span>
                {point}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="skills-panel">
        <h3>Skills you'll gain</h3>
        <div className="skills-list">
          {course.skills.map((skill) => (
            <span key={skill} className="skill-pill">{skill}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseOverview;
