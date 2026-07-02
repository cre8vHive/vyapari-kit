import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import HeroSection from '../components/course-details/HeroSection';
import CourseOverview from '../components/course-details/CourseOverview';
import CourseContent from '../components/course-details/CourseContent';
import InstructorSection from '../components/course-details/InstructorSection';
import ReviewSection from '../components/course-details/ReviewSection';
import FAQSection from '../components/course-details/FAQSection';
import RelatedCourses from '../components/course-details/RelatedCourses';
import StickySidebar from '../components/course-details/StickySidebar';
import { getCourseDetailsByPath } from '../data/courses';

const CourseDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const course = useMemo(() => getCourseDetailsByPath(slug || ''), [slug]);

  useEffect(() => {
    document.title = course ? `${course.title} | Vyapari Kit` : 'Course Details | Vyapari Kit';
  }, [course]);

  if (!course) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6 py-20 text-center text-slate-600">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Course not found</h1>
          <p className="mt-3">This course is not available right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-10">
      <Helmet>
        <title>{`${course.title} | Vyapari Kit`}</title>
        <meta name="description" content={course.subtitle} />
      </Helmet>
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <HeroSection
          title={course.title}
          subtitle={course.subtitle}
          rating={course.rating}
          totalRatings={course.totalRatings}
          students={course.students}
          instructor={course.instructor}
          lastUpdated={course.lastUpdated}
          language={course.language}
          category={course.category}
          level={course.level}
          duration={course.duration}
          tags={course.tags}
          price={course.price}
          oldPrice={course.oldPrice}
          imageUrl={course.imageUrl}
          thumbnailUrl={course.thumbnailUrl}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4 }}>
              <CourseOverview
              description={course.description}
              whatYoullLearn={course.whatYoullLearn}
              skills={course.skills}
              requirements={course.requirements}
              audience={course.audience}
            />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }}>
              <CourseContent content={course.content} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4 }}>
              <InstructorSection
              instructor={course.instructor}
              instructorTitle={course.instructorTitle}
              instructorBio={course.instructorBio}
              instructorStudents={course.instructorStudents}
              instructorRating={course.instructorRating}
              instructorCourses={course.instructorCourses}
            />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
              <ReviewSection reviews={course.reviews} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }}>
              <FAQSection faqs={course.faqs} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.4 }}>
              <RelatedCourses relatedCourses={course.relatedCourses} />
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.4 }}>
            <StickySidebar price={course.price} oldPrice={course.oldPrice} includes={course.includes} />
          </motion.div>
        </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CourseDetails;
