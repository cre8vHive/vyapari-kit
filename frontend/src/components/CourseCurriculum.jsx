import React, { useState } from 'react';

const CourseCurriculum = ({ curriculum = [] }) => {
  const [openSection, setOpenSection] = useState(0);
  const [isOpenMobile, setIsOpenMobile] = useState(true);

  if (!curriculum || curriculum.length === 0) return null;

  return (
    <section className="course-curriculum">
      <div className="section-heading">
        <button
          type="button"
          className="mobile-accordion-toggle"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          aria-expanded={isOpenMobile}
        >
          <h2>Solution curriculum</h2>
          <span className={`mobile-collapse-chevron ${isOpenMobile ? 'open' : ''}`} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
      </div>

      <div className={`mobile-accordion-body ${isOpenMobile ? 'open' : 'collapsed'}`}>
        <div className="curriculum-list">
          {curriculum.map((section, index) => {
            const isOpen = openSection === index;
            return (
              <div key={section.title || index} className="curriculum-item">
                <button type="button" className="curriculum-toggle" onClick={() => setOpenSection(isOpen ? -1 : index)}>
                  <div>
                    <p>{section.title}</p>
                    <span>{section.lessons?.length || 0} lessons</span>
                  </div>
                  <span className={isOpen ? 'toggle-icon open' : 'toggle-icon'}>+</span>
                </button>
                <div className={isOpen ? 'curriculum-body open' : 'curriculum-body'}>
                  {(section.lessons || []).map((lesson, lIdx) => (
                    <div key={lesson.title || lIdx} className="lesson-row">
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
      </div>
    </section>
  );
};

export default CourseCurriculum;
