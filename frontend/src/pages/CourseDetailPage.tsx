import React, { useEffect, useMemo, useState } from 'react';
import CourseDetails from '../components/CourseDetails';
import { CourseSummary, courseApi } from '../services/api';

interface CourseDetailPageProps {
  courseIdOrSlug: string;
}

type CourseDetailViewModel = Record<string, any>;

const DEFAULT_LANGUAGE = 'English';
const DEFAULT_STUDENTS = 'Available now';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';

function formatCurrency(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return '';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function formatUpdatedDate(value?: string) {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function listOrFallback<T>(value: T[] | undefined, fallback: T[]) {
  return Array.isArray(value) && value.length > 0 ? value : fallback;
}

function descriptionOrFallback(course: CourseSummary) {
  if (Array.isArray(course.description) && course.description.length > 0) {
    return course.description;
  }

  if (typeof course.description === 'string' && course.description.trim()) {
    return [course.description.trim()];
  }

  return [
    `${course.title} is available in the ${course.categoryName} category. This page is generated from the live MongoDB course record and uses the same learning experience layout as the reference course page.`,
    `Review the course details, pricing, instructor, and access options before enrolling.`,
  ];
}

function toCurriculum(course: CourseSummary, highlights: string[], skills: string[]) {
  const foundationLessons = highlights.slice(0, 4).map((title, index) => ({
    title,
    duration: `${6 + index * 2}m`,
    preview: index === 0,
  }));

  const skillLessons = skills.slice(0, 4).map((title, index) => ({
    title,
    duration: `${8 + index * 2}m`,
    preview: false,
  }));

  return [
    {
      title: 'Section 1 - Course overview',
      lessons: foundationLessons.length > 0
        ? foundationLessons
        : [{ title: `Introduction to ${course.title}`, duration: '8m', preview: true }],
    },
    {
      title: 'Section 2 - Practical learning',
      lessons: skillLessons.length > 0
        ? skillLessons
        : [{ title: `${course.categoryName} implementation guide`, duration: '12m', preview: false }],
    },
  ];
}

function toCourseDetailViewModel(course: CourseSummary): CourseDetailViewModel {
  const category = course.categoryName || 'Course';
  const currentPrice = formatCurrency(course.price);
  const oldPrice = formatCurrency(course.oldPrice);
  const highlights = listOrFallback(course.learningOutcomes || course.learningHighlights || course.whatYouWillLearn, [
    `Understand the fundamentals of ${category}`,
    `Learn how to apply ${course.title} in a practical way`,
    'Build confidence with structured lessons',
    'Review the key decisions before getting started',
  ]);
  const skills = listOrFallback(course.skills, [
    category,
    'Business planning',
    'Decision making',
    'Execution readiness',
  ]);
  const requirements = listOrFallback(course.requirements, [
    'No prior experience required',
    'Interest in learning this topic',
    'Willingness to follow the course material',
  ]);
  const audience = listOrFallback(course.audience, [
    'Students',
    'Working professionals',
    'Entrepreneurs',
    'Anyone interested in this course topic',
  ]);
  const includes = listOrFallback(course.includes, [
    'Lifetime access',
    'Mobile access',
    course.hasPdf ? 'Course PDF material' : 'Structured course content',
    'Beginner friendly',
  ]);

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.shortDescription || course.subtitle || `Learn ${course.title} with a structured ${category} course experience.`,
    category,
    rating: Number(course.rating || 0),
    students: course.students ? course.students.toLocaleString('en-IN') : DEFAULT_STUDENTS,
    instructorName: course.instructor?.name || course.instructorName,
    language: course.language || DEFAULT_LANGUAGE,
    lastUpdated: formatUpdatedDate(course.updatedAt || course.createdAt),
    difficulty: course.difficulty || 'Beginner',
    price: {
      current: currentPrice || 'Free',
      old: oldPrice,
    },
    thumbnail: course.bannerImage || course.thumbnail || course.imageUrl,
    includes,
    learningHighlights: highlights,
    description: descriptionOrFallback(course),
    keyPoints: listOrFallback(course.keyPoints, highlights.slice(0, 3)),
    skills,
    curriculum: course.curriculum?.length
      ? course.curriculum.map((section) => ({
          title: section.sectionTitle,
          lessons: section.lessons.map((lesson) => ({
            title: lesson.title,
            duration: lesson.duration || '',
            preview: Boolean(lesson.preview),
          })),
        }))
      : toCurriculum(course, highlights, skills),
    requirements,
    audience,
    instructor: {
      name: course.instructor?.name || course.instructorName,
      bio: course.instructor?.bio || `${course.instructorName} is the instructor for ${course.title}.`,
      experience: course.instructor?.title || category,
      courses: course.instructor?.courses ?? 1,
      students: course.instructor?.students?.toLocaleString('en-IN') || DEFAULT_STUDENTS,
      rating: Number(course.instructor?.rating ?? course.rating ?? 0),
      avatar: course.instructor?.image || DEFAULT_AVATAR,
    },
    reviews: course.reviews?.length ? course.reviews.map((review) => ({
      ...review,
      avatar: review.avatar || DEFAULT_AVATAR,
      title: review.title || 'Student review',
      date: review.date || formatUpdatedDate(course.updatedAt || course.createdAt),
    })) : [
      {
        name: 'Course learner',
        avatar: DEFAULT_AVATAR,
        rating: Number(course.rating || 0),
        title: `${course.title} overview`,
        comment: 'This course is loaded dynamically from MongoDB and rendered with the reusable detail page experience.',
        date: formatUpdatedDate(course.updatedAt || course.createdAt),
      },
    ],
    faqs: listOrFallback(course.faqs, [
      {
        question: `Is ${course.title} available now?`,
        answer: 'Yes. This course record is available from MongoDB.',
      },
      {
        question: 'Is this a dynamic course page?',
        answer: 'Yes. The page is fetched by slug or id and rendered through one reusable detail component.',
      },
    ]),
    relatedCourses: (course.relatedCourses || []).map((related) => ({
      id: related.id,
      slug: related.slug,
      title: related.title,
      category: related.categoryName,
      price: formatCurrency(related.price),
      imageUrl: related.thumbnail || related.imageUrl,
    })),
  };
}

const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ courseIdOrSlug }) => {
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError('');
        const nextCourse = await courseApi.getCourse(courseIdOrSlug);
        if (!cancelled) setCourse(nextCourse);
      } catch {
        if (!cancelled) {
          setCourse(null);
          setError('Course not found');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourse();

    return () => {
      cancelled = true;
    };
  }, [courseIdOrSlug]);

  const detailCourse = useMemo(() => course ? toCourseDetailViewModel(course) : null, [course]);

  useEffect(() => {
    if (detailCourse?.title) {
      document.title = `${detailCourse.title} - VyaparKit`;
      const description = String(detailCourse.subtitle || detailCourse.description?.[0] || '');
      const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
        let element = document.head.querySelector<HTMLMetaElement>(selector);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attribute, key);
          document.head.appendChild(element);
        }
        element.content = content;
      };
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:title"]', 'property', 'og:title', detailCourse.title);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
      setMeta('meta[property="og:image"]', 'property', 'og:image', detailCourse.thumbnail);
    }
  }, [detailCourse]);

  if (loading && !detailCourse) {
    return (
      <div className="page-renderer course-listing-template">
        <section className="course-page-hero">
          <div className="e-con-inner course-detail-skeleton" aria-busy="true" aria-label="Loading course">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-copy" />
            <div className="skeleton-card" />
          </div>
        </section>
      </div>
    );
  }

  if (!detailCourse || error) {
    return (
      <div className="page-renderer course-listing-template">
        <section className="course-page-hero">
          <div className="e-con-inner">
            <nav className="course-breadcrumbs" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span>/</span>
              <a href="/courses?tab=available&category=all">Course</a>
              <span>/</span>
              <span>Not Found</span>
            </nav>
            <h1>Course Not Found</h1>
            <p className="course-hub-status">We could not find a published course for this URL.</p>
          </div>
        </section>
      </div>
    );
  }

  return <CourseDetails course={detailCourse} />;
};

export default CourseDetailPage;
