import React from 'react';
import CourseHero from './CourseHero';
import CourseOverview from './CourseOverview';
import CourseCurriculum from './CourseCurriculum';
import InstructorSection from './InstructorSection';
import ReviewSection from './ReviewSection';
import FAQSection from './FAQSection';
import RelatedCourses from './RelatedCourses';
import StickyPurchaseCard from './StickyPurchaseCard';
import courseDetails from '../data/courseDetails';

const CourseDetails = ({ onBack }) => {
  return (
    <div className="course-details-page">
      <div className="course-details-shell">
        <div className="details-header">
          <button type="button" className="details-back" onClick={onBack}>
            ← Back to Courses
          </button>
          <div className="details-actions">
            <span className="details-pill">{courseDetails.category}</span>
            <button type="button" className="details-action">♡ Wishlist</button>
            <button type="button" className="details-action">↗ Share</button>
          </div>
        </div>

        <CourseHero course={courseDetails} />

        <div className="course-details-layout">
          <main className="course-details-main">
            <CourseOverview course={courseDetails} />
            <CourseCurriculum curriculum={courseDetails.curriculum} />
            <div className="details-grid-two">
              <section className="info-panel">
                <h2>Requirements</h2>
                <ul>
                  {courseDetails.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="info-panel">
                <h2>Who this course is for</h2>
                <ul>
                  {courseDetails.audience.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
            <InstructorSection instructor={courseDetails.instructor} />
            <ReviewSection reviews={courseDetails.reviews} rating={courseDetails.rating} />
            <FAQSection faqs={courseDetails.faqs} />
            <RelatedCourses courses={courseDetails.relatedCourses} />
          </main>
          <aside className="course-details-aside">
            <StickyPurchaseCard course={courseDetails} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
