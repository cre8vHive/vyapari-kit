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
import { paymentApi } from '../services/api';

const CourseDetails = ({ onBack }) => {
  const handlePurchase = async () => {
    try {
      // In a real scenario, use the actual dynamic course ID, e.g. courseDetails.id
      // We will fallback to a default id if not present for the demo
      const courseId = courseDetails.id || 'demo-course-id';
      
      const order = await paymentApi.createOrder(courseId);
      
      const options = {
        key: 'RAZORPAY_KEY_ID_PLACEHOLDER', // This is handled by Razorpay script usually via key or we can fetch it, but usually the frontend needs the public key. We can leave it as a placeholder.
        amount: order.amount,
        currency: order.currency,
        name: 'Vyapari Kit',
        description: `Purchase ${courseDetails.title}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await paymentApi.verifyPayment(courseId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            alert('Payment successful and enrolled!');
          } catch (err) {
            alert('Payment verification failed.');
          }
        },
        theme: {
          color: '#0b6cff'
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
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
          <button type="button" className="details-back" onClick={onBack}>
            ← Back to Courses
          </button>
          <div className="details-actions">
            <span className="details-pill">{courseDetails.category}</span>
            <button type="button" className="details-action">♡ Wishlist</button>
            <button type="button" className="details-action">↗ Share</button>
          </div>
        </div>

        <CourseHero course={courseDetails} onPurchase={handlePurchase} />

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
            <StickyPurchaseCard course={courseDetails} onPurchase={handlePurchase} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
