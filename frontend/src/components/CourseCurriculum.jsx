import React, { useState } from 'react';

const CourseCurriculum = ({ curriculum }) => {
  const [openSection, setOpenSection] = useState(0);

  return (
    <section className="course-curriculum">
      <div className="section-heading">
        <h2>Course curriculum</h2>
      </div>
      <div className="curriculum-list">
        {curriculum.map((section, index) => {
          const isOpen = openSection === index;
          return (
            <div key={section.title} className="curriculum-item">
              <button type="button" className="curriculum-toggle" onClick={() => setOpenSection(isOpen ? -1 : index)}>
                <div>
                  <p>{section.title}</p>
                  <span>{section.lessons.length} lessons</span>
                </div>
                <span className={isOpen ? 'toggle-icon open' : 'toggle-icon'}>+</span>
              </button>
              <div className={isOpen ? 'curriculum-body open' : 'curriculum-body'}>
                {section.lessons.map((lesson) => (
                  <div key={lesson.title} className="lesson-row">
                    <div>
                      <strong>{lesson.title}</strong>
                      <p>{lesson.preview ? 'Preview available' : 'Full lesson'}</p>
                    </div>
                    <span>{lesson.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CourseCurriculum;
