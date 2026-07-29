import React from 'react';
import CourseHero from './CourseHero';
import CourseOverview from './CourseOverview';
import CourseCurriculum from './CourseCurriculum';
import InstructorSection from './InstructorSection';
import ReviewSection from './ReviewSection';
import FAQSection from './FAQSection';
import RelatedCourses from './RelatedCourses';
import StickyPurchaseCard from './StickyPurchaseCard';
import { paymentApi } from '../services/api';

const CourseDetails = ({ course, onBack }) => {
  const goBack = onBack || (() => {
    window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/courses`;
  });

  const handlePurchase = async () => {
    try {
      const courseId = course.id;

      const order = await paymentApi.createOrder(courseId);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'Vyapari Kit',
        description: `Purchase ${course.title}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await paymentApi.verifyPayment(courseId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            alert('Payment successful and enrolled!');
            window.location.href = '/courses';
          } catch (err) {
            alert('Payment verification failed.');
          }
        },
        theme: {
          color: '#0b6cff'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (err) {
      alert('Failed to initiate payment. Please try again.');
    }
  };
  return (
    <div className="course-details-page">
      <div className="course-details-shell">
        <div className="details-header">
          <button type="button" className="details-back" onClick={goBack}>
            ← Back to Courses
          </button>
          <div className="details-actions">
            <span className="details-pill">{course.category}</span>
            <button type="button" className="details-action">♡ Wishlist</button>
            <button type="button" className="details-action">↗ Share</button>
          </div>
        </div>

        <CourseHero course={course} onPurchase={handlePurchase} />

        <div className="course-details-layout">
          <main className="course-details-main">
            <CourseOverview course={course} />
            <CourseCurriculum curriculum={course.curriculum} />
            <div className="details-grid-two">
              <section className="info-panel">
                <h2>Requirements</h2>
                <ul>
                  {course.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="info-panel">
                <h2>Who this course is for</h2>
                <ul>
                  {course.audience.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
            <InstructorSection instructor={course.instructor} />
            <ReviewSection reviews={course.reviews} rating={course.rating} />
            <FAQSection faqs={course.faqs} />
            <RelatedCourses courses={course.relatedCourses} />
          </main>
          <aside className="course-details-aside">
            <StickyPurchaseCard course={course} onPurchase={handlePurchase} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
