import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CategoriesSection, { CategoryItem } from '../components/sections/CategoriesSection';
import CourseGridSection, { CourseItem } from '../components/sections/CourseGridSection';
import { cmsApi, courseApi } from '../services/api';

type CourseTab = 'available' | 'my';

interface CourseListingState {
  tab: CourseTab;
  category: string;
  searchQuery: string;
}

const ALL_CATEGORY = 'all';

const MOCK_CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All', slug: ALL_CATEGORY, iconUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=96&q=80' },
  { id: '1', name: 'Business', slug: 'business', iconUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=96&q=80' },
  { id: '2', name: 'Design', slug: 'design', iconUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=96&q=80' },
  { id: '3', name: 'Development', slug: 'development', iconUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=96&q=80' },
  { id: '4', name: 'Finance', slug: 'finance', iconUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=96&q=80' },
  { id: '5', name: 'Language', slug: 'language', iconUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=96&q=80' },
  { id: '6', name: 'Marketing', slug: 'marketing', iconUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=96&q=80' },
  { id: '7', name: 'Photography', slug: 'photography', iconUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=96&q=80' },
];

const MOCK_COURSES: CourseItem[] = [
  {
    id: '1',
    slug: 'photography-masterclass-guide',
    title: 'Photography Masterclass: A Complete Guide to Photography',
    instructorName: 'Onecontributor',
    categoryName: 'Photography',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 30.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '2',
    slug: 'wordpress-developer-course',
    title: 'Complete WordPress Developer Course 2024',
    instructorName: 'Onecontributor',
    categoryName: 'Development',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '3',
    slug: 'personal-finance-course',
    title: 'The Complete Personal Finance Course',
    instructorName: 'Onecontributor',
    categoryName: 'Finance',
    difficulty: 'Beginner',
    price: 17.99,
    oldPrice: 40.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '4',
    slug: 'digital-marketing-course',
    title: 'The Complete Digital Marketing Course',
    instructorName: 'Onecontributor',
    categoryName: 'Marketing',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '5',
    slug: 'business-startup-guide',
    title: 'The Business Startup Guide to Become an Entrepreneur',
    instructorName: 'Onecontributor',
    categoryName: 'Business',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 30.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '6',
    slug: 'german-language-course',
    title: 'Best Way to Learn German Language: Full Beginner',
    instructorName: 'Onecontributor',
    categoryName: 'Language',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
  },
];

function normalizeSlug(value: string | null | undefined) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
  return normalized || ALL_CATEGORY;
}

function readCourseListingState(): CourseListingState {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') === 'my' ? 'my' : 'available';

  return {
    tab,
    category: normalizeSlug(params.get('category')),
    searchQuery: params.get('search') || '',
  };
}

function writeCourseListingState(nextState: CourseListingState, replace = false) {
  const params = new URLSearchParams();
  params.set('tab', nextState.tab);
  params.set('category', nextState.category);
  if (nextState.searchQuery) {
    params.set('search', nextState.searchQuery);
  }

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  if (`${window.location.pathname}${window.location.search}` === nextUrl) return;

  if (replace) {
    window.history.replaceState(null, '', nextUrl);
  } else {
    window.history.pushState(null, '', nextUrl);
  }
}

function matchesCategory(course: CourseItem, category: string) {
  if (category === ALL_CATEGORY) return true;
  return normalizeSlug(course.categoryName) === category;
}

function withAllCategory(categories: CategoryItem[]): CategoryItem[] {
  const normalizedCategories = categories.map((category) => ({
    ...category,
    slug: normalizeSlug(category.slug || category.name),
  }));

  return [
    MOCK_CATEGORIES[0],
    ...normalizedCategories.filter((category) => category.slug !== ALL_CATEGORY),
  ];
}

export const CourseListing: React.FC = () => {
  const [listingState, setListingState] = useState<CourseListingState>(() => readCourseListingState());
  const listingStateRef = useRef(listingState);
  const [availableCourses, setAvailableCourses] = useState<CourseItem[]>([]);
  const [myCourses, setMyCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [myCoursesLoaded, setMyCoursesLoaded] = useState(false);

  const activeCourses = listingState.tab === 'my' 
    ? myCourses 
    : availableCourses.filter(ac => !myCourses.some(mc => mc.id === ac.id));
    
  const filteredCourses = useMemo(
    () => {
      let result = activeCourses.filter((course) => matchesCategory(course, listingState.category));
      if (listingState.searchQuery) {
        const query = listingState.searchQuery.toLowerCase();
        result = result.filter(course => 
          course.title.toLowerCase().includes(query) || 
          (course.instructorName && course.instructorName.toLowerCase().includes(query)) ||
          (course.categoryName && course.categoryName.toLowerCase().includes(query))
        );
      }
      return result;
    },
    [activeCourses, listingState.category, listingState.searchQuery]
  );
  const activeTabLabel = listingState.tab === 'my' ? 'My Courses' : 'Available Courses';

  const updateListingState = useCallback((nextState: Partial<CourseListingState>, replace = false) => {
    const merged = { ...listingStateRef.current, ...nextState };
    listingStateRef.current = merged;
    writeCourseListingState(merged, replace);
    setListingState(merged);
  }, []);

  useEffect(() => {
    document.title = 'Course - Upskill';
    const initialState = readCourseListingState();
    listingStateRef.current = initialState;
    writeCourseListingState(initialState, true);
    setListingState(initialState);

    const handlePopState = () => {
      const nextState = readCourseListingState();
      listingStateRef.current = nextState;
      setListingState(nextState);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const fetchListingData = async () => {
      try {
        setLoading(true);
        const [catsData, coursesData] = await Promise.all([
          cmsApi.getCategories(),
          cmsApi.getCourses(),
        ]);

        setCategories(withAllCategory(catsData));
        setAvailableCourses(coursesData);
        
        // Always try to fetch my courses so we can filter them out of available courses
        try {
          const myCoursesData = await courseApi.getMyCourses();
          setMyCourses(myCoursesData);
        } catch {
          setMyCourses([]);
        }
        setMyCoursesLoaded(true);
        
      } catch (err) {
        console.warn('API server not running, using static listing assets.');
        setCategories(MOCK_CATEGORIES);
        setAvailableCourses(MOCK_COURSES);
        setMyCourses([]);
        setMyCoursesLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, []);

  return (
    <div className="page-renderer course-listing-template">
      <section className="course-page-hero">
        <div className="e-con-inner">
          <nav className="course-breadcrumbs" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span>/</span>
            <span>Course</span>
          </nav>
          <h1>Course Program</h1>
        </div>
      </section>

      <section className="course-hub-section">
        <div className="course-hub-card">
          <div className="course-hub-tabs" role="tablist" aria-label="Course views">
            <button
              className={`course-hub-tab${listingState.tab === 'my' ? ' active' : ''}`}
              type="button"
              role="tab"
              aria-selected={listingState.tab === 'my'}
              onClick={() => updateListingState({ tab: 'my' })}
            >
              My Courses
            </button>
            <button
              className={`course-hub-tab${listingState.tab === 'available' ? ' active' : ''}`}
              type="button"
              role="tab"
              aria-selected={listingState.tab === 'available'}
              onClick={() => updateListingState({ tab: 'available' })}
            >
              Available Courses
            </button>
          </div>

          <div style={{ padding: '0 2rem', marginTop: '1.5rem', maxWidth: '800px', width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ position: 'absolute', left: '16px', color: '#6b7280' }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="search"
                placeholder="Search courses by title, instructor, or category..."
                value={listingState.searchQuery}
                onChange={(e) => updateListingState({ searchQuery: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem 1rem 1rem 3rem',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  color: '#111827',
                  fontSize: '1.05rem',
                  outline: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              />
            </div>
          </div>

          <CategoriesSection
            categories={categories}
            variant="filters"
            selectedSlug={listingState.category}
            onCategorySelect={(category) => updateListingState({ category })}
          />

          <div className="course-hub-content" role="tabpanel" aria-label={activeTabLabel}>
            <div className="course-hub-heading">
              <div>
                <span className="course-hub-kicker">{activeTabLabel}</span>
                <h2>{activeTabLabel}</h2>
              </div>
              <span className="course-hub-count">
                {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
              </span>
            </div>

            {loading || (listingState.tab === 'my' && !myCoursesLoaded) ? (
              <div className="course-hub-status">Loading courses...</div>
            ) : filteredCourses.length > 0 ? (
              <CourseGridSection sectionTitle="" courses={filteredCourses} layout="grid" embedded mode={listingState.tab} />
            ) : (
              <div className="course-empty-state">
                <h3>No courses found</h3>
                <p>
                  {listingState.tab === 'my'
                    ? 'Your enrolled courses will appear here once they match this category.'
                    : 'No published courses match this category yet.'}
                </p>
                {listingState.tab === 'my' && (
                  <button
                    className="course-empty-cta"
                    type="button"
                    onClick={() => updateListingState({ tab: 'available' })}
                  >
                    Browse More Courses
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseListing;
