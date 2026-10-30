import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CategoriesSection, { CategoryItem, SHOP_CATEGORY_DATA } from '../components/sections/CategoriesSection';
import CourseGridSection, { CourseItem } from '../components/sections/CourseGridSection';
import { cmsApi, courseApi } from '../services/api';

type CourseTab = 'available' | 'my';

interface CourseListingState {
  tab: CourseTab;
  type: string;
  category: string;
  searchQuery: string;
  sortBy: string;
}

const ALL_CATEGORY = 'all';

const MOCK_CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All', slug: ALL_CATEGORY, iconUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=96&q=80' },
  { id: 'agriculture', name: 'Agriculture', slug: 'agriculture' },
  { id: 'commerce', name: 'Commerce', slug: 'commerce' },
  { id: 'digital', name: 'Digital', slug: 'digital' },
  { id: 'f-and-b', name: 'F&B', slug: 'f-and-b' },
  { id: 'manufacturing', name: 'Manufacturing', slug: 'manufacturing' },
  { id: 'services', name: 'Services', slug: 'services' },
];

function normalizeSlug(value: string | null | undefined) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || ALL_CATEGORY;
}

function readCourseListingState(): CourseListingState {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') === 'my' ? 'my' : 'available';

  return {
    tab,
    type: params.get('type') || '',
    category: normalizeSlug(params.get('category')),
    searchQuery: params.get('search') || '',
    sortBy: params.get('sort') || 'newest',
  };
}

function writeCourseListingState(nextState: CourseListingState, replace = false) {
  const params = new URLSearchParams();
  params.set('tab', nextState.tab);
  if (nextState.type) {
    params.set('type', nextState.type);
  }
  params.set('category', nextState.category);
  if (nextState.searchQuery) {
    params.set('search', nextState.searchQuery);
  }
  if (nextState.sortBy && nextState.sortBy !== 'newest') {
    params.set('sort', nextState.sortBy);
  }

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  if (`${window.location.pathname}${window.location.search}` === nextUrl) return;

  if (replace) {
    window.history.replaceState(null, '', nextUrl);
  } else {
    window.history.pushState(null, '', nextUrl);
  }
}

function matchesCategory(course: CourseItem, categorySlug: string) {
  if (!categorySlug || categorySlug === ALL_CATEGORY) return true;
  const courseCatSlug = normalizeSlug(course.categoryName);
  return courseCatSlug === categorySlug;
}

function withAllCategory(categories: CategoryItem[], activeCategorySlug?: string): CategoryItem[] {
  const map = new Map<string, CategoryItem>();
  map.set(ALL_CATEGORY, { id: 'all', name: 'All', slug: ALL_CATEGORY });

  MOCK_CATEGORIES.forEach((cat) => {
    if (cat.slug) map.set(cat.slug, cat);
  });

  (categories || []).forEach((category) => {
    const slug = normalizeSlug(category.slug || category.name);
    map.set(slug, {
      ...category,
      slug,
      name: category.name || slug,
    });
  });

  if (activeCategorySlug && activeCategorySlug !== ALL_CATEGORY && !map.has(activeCategorySlug)) {
    const formattedName = activeCategorySlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    map.set(activeCategorySlug, { id: activeCategorySlug, name: formattedName, slug: activeCategorySlug });
  }

  return Array.from(map.values());
}

export const CourseListing: React.FC = () => {
  const [listingState, setListingState] = useState<CourseListingState>(() => readCourseListingState());
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showAllSolutions, setShowAllSolutions] = useState(false);
  const listingStateRef = useRef(listingState);
  const [availableCourses, setAvailableCourses] = useState<CourseItem[]>([]);
  const [popularCourses, setPopularCourses] = useState<CourseItem[]>([]);
  const [myCourses, setMyCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [myCoursesLoaded, setMyCoursesLoaded] = useState(false);

  const activeCourses = listingState.tab === 'my' ? myCourses : availableCourses;

  const filteredCourses = useMemo(
    () => {
      let result = listingState.tab === 'my'
        ? activeCourses.filter((course) => matchesCategory(course, listingState.category))
        : activeCourses;

      if (listingState.searchQuery) {
        const query = listingState.searchQuery.toLowerCase();
        result = result.filter(course =>
          course.title.toLowerCase().includes(query) ||
          (course.instructorName && course.instructorName.toLowerCase().includes(query)) ||
          (course.categoryName && course.categoryName.toLowerCase().includes(query))
        );
      }

      // Deduplicate courses so each unique business only appears once
      const isBoxType = listingState.type === 'business-in-the-box' || listingState.type === 'business-in-a-box';
      const seenBusinesses = new Set<string>();
      result = result.filter((course) => {
        // Normalize base business title
        const baseKey = course.title
          .replace(/\s*-\s*Business in a Box$/i, '')
          .trim()
          .toLowerCase();

        // If not browsing the dedicated business-in-the-box tab, skip bundle duplicate
        if (!isBoxType && (course.packageType === 'business-in-the-box' || course.packageType === 'business-in-a-box' || course.slug?.includes('business-in-a-box'))) {
          return false;
        }

        if (seenBusinesses.has(baseKey)) {
          return false;
        }
        seenBusinesses.add(baseKey);
        return true;
      });

      if (listingState.sortBy === 'price-low') {
        result.sort((a, b) => a.price - b.price);
      } else if (listingState.sortBy === 'price-high') {
        result.sort((a, b) => b.price - a.price);
      } else if (listingState.sortBy === 'rating') {
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
      return result;
    },
    [activeCourses, listingState.tab, listingState.type, listingState.category, listingState.searchQuery, listingState.sortBy]
  );

  // Trending courses sourced from popular business solutions on the landing page
  const trendingCourses = useMemo(() => {
    const list: CourseItem[] = [];
    const seenIds = new Set<string>();

    const addCourse = (c: CourseItem) => {
      if (!c || !c.id || seenIds.has(c.id)) return;
      seenIds.add(c.id);
      list.push(c);
    };

    popularCourses.forEach(addCourse);
    availableCourses.filter((c: any) => c.badge === 'Trending' || c.badge === 'Bestseller').forEach(addCourse);
    availableCourses.filter((c: any) => c.isPopular).forEach(addCourse);
    availableCourses.forEach(addCourse);

    return list.slice(0, 6);
  }, [popularCourses, availableCourses]);

  const activeTabLabel = listingState.tab === 'my' ? 'My Business Solutions' : 'Available Business Solutions';

  const updateListingState = useCallback((nextState: Partial<CourseListingState>, replace = false) => {
    const merged = { ...listingStateRef.current, ...nextState };
    listingStateRef.current = merged;
    writeCourseListingState(merged, replace);
    setListingState(merged);
  }, []);

  useEffect(() => {
    document.title = 'Business Solutions - VyapaarKit';
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
    const fetchCategories = async () => {
      try {
        const catsData = await cmsApi.getCategories();
        setCategories(withAllCategory(catsData, listingStateRef.current.category));
      } catch (err) {
        console.warn('Unable to load categories from the API:', err);
        setCategories(withAllCategory(MOCK_CATEGORIES, listingStateRef.current.category));
      }
    };

    const fetchMyCourses = async () => {
      try {
        const myCoursesData = await courseApi.getMyCourses();
        setMyCourses(myCoursesData);
      } catch (err) {
        console.warn('Unable to load my courses:', err);
        setMyCourses([]);
      } finally {
        setMyCoursesLoaded(true);
      }
    };

    const fetchPopular = async () => {
      try {
        const popularData = await cmsApi.getPopularCourses();
        if (Array.isArray(popularData) && popularData.length > 0) {
          setPopularCourses(popularData as any);
        }
      } catch (err) {
        console.warn('Unable to load popular courses from API:', err);
      }
    };

    fetchCategories();
    fetchMyCourses();
    fetchPopular();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchFilteredCourses = async () => {
      try {
        setLoading(true);

        const params: Record<string, string> = {};
        if (listingState.type) {
          params.type = listingState.type;
        }
        if (listingState.category && listingState.category !== ALL_CATEGORY) {
          params.category = listingState.category;
        }
        if (listingState.searchQuery) {
          params.search = listingState.searchQuery;
        }

        const coursesData = await cmsApi.getCourses(params);
        if (!isCancelled) {
          setAvailableCourses(coursesData);
        }
      } catch (err) {
        console.error('Failed to load courses from API:', err);
        if (!isCancelled) {
          setAvailableCourses([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchFilteredCourses();

    return () => {
      isCancelled = true;
    };
  }, [listingState.type, listingState.category, listingState.searchQuery]);

  const availableCategoryOptions = useMemo(() => {
    return [
      { id: 'all', name: 'All Categories', slug: ALL_CATEGORY },
      { id: 'agriculture', name: 'Agriculture', slug: 'agriculture' },
      { id: 'commerce', name: 'Commerce', slug: 'commerce' },
      { id: 'digital', name: 'Digital', slug: 'digital' },
      { id: 'f-and-b', name: 'F&B', slug: 'f-and-b' },
      { id: 'manufacturing', name: 'Manufacturing', slug: 'manufacturing' },
      { id: 'services', name: 'Services', slug: 'services' },
    ];
  }, []);

  const selectedCategoryValue = useMemo(() => {
    const target = listingState.category;
    if (!target || target === ALL_CATEGORY) return ALL_CATEGORY;
    const match = availableCategoryOptions.find(
      (c) => c.slug === target || (c.slug && (target.includes(c.slug) || c.slug.includes(target)))
    );
    return match ? match.slug || target : target;
  }, [availableCategoryOptions, listingState.category]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (listingState.type) count += 1;

    if (listingState.sortBy && listingState.sortBy !== 'newest') count += 1;
    return count;
  }, [listingState.type, listingState.sortBy]);

  // Quick category circles matching Screenshot reference
  const quickCategories = useMemo(() => [
    {
      id: 'agriculture',
      name: 'Agriculture',
      slug: 'agriculture',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 20h10" />
          <path d="M12 20v-8" />
          <path d="M12 12c-3.5 0-6-2.5-6-6 3.5 0 6 2.5 6 6z" />
          <path d="M12 8c3.5 0 6-2.5 6-6-3.5 0-6 2.5-6 6z" />
        </svg>
      ),
    },
    {
      id: 'commerce',
      name: 'Commerce',
      slug: 'commerce',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l1-5h16l1 5"></path>
          <path d="M3 9c0 1.66 1.34 3 3 3s3-1.34 3-3c0 1.66 1.34 3 3 3s3-1.34 3-3"></path>
          <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
          <line x1="9" y1="21" x2="9" y2="15"></line>
          <line x1="15" y1="21" x2="15" y2="15"></line>
        </svg>
      ),
    },
    {
      id: 'digital',
      name: 'Digital',
      slug: 'digital',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
    },
    {
      id: 'f-and-b',
      name: 'F&B',
      slug: 'f-and-b',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path>
          <path d="M15 2v18"></path>
          <path d="M7 2v7a2.5 2.5 0 0 0 5 0V2"></path>
          <path d="M9.5 9v11"></path>
        </svg>
      ),
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      slug: 'manufacturing',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4H2z"></path>
          <line x1="17" y1="18" x2="18" y2="18"></line>
          <line x1="12" y1="18" x2="13" y2="18"></line>
          <line x1="7" y1="18" x2="8" y2="18"></line>
        </svg>
      ),
    },
    {
      id: 'services',
      name: 'Services',
      slug: 'services',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
  ], []);

  const isFiltered = Boolean(
    listingState.searchQuery ||
    (selectedCategoryValue && selectedCategoryValue !== ALL_CATEGORY) ||
    listingState.type ||
    showAllSolutions
  );

  return (
    <div className="page-renderer course-listing-template">
      {/* 1. Full-width seamless hero section */}
      <section className="solutions-hero-header">
        <div className="solutions-hero-header-inner">
          <div className="solutions-hero-grid">
              <div className="solutions-hero-left">
                <span className="solutions-hero-tag">Digital Business Solutions</span>
                <h1 className="solutions-hero-title">
                  Turn Ideas Into <span className="title-accent">Real Businesses.</span>
                </h1>
                <p className="solutions-hero-subtitle">
                  Business plans, tools and complete kits to help you start, run and grow.
                </p>
              </div>
              <div className="solutions-hero-graphic">
                <div className="solutions-hero-graphic-bundle">
                  <div className="bundle-badge badge-plan">
                    <div className="badge-icon-wrap">💡</div>
                    <span className="badge-text">Plan</span>
                  </div>
                  <div className="bundle-badge badge-build">
                    <div className="badge-icon-wrap">⚙️</div>
                    <span className="badge-text">Build</span>
                  </div>
                  <div className="bundle-box-wrapper">
                    <img
                      src="https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/images/products/vyapaarkit-bundle-hero.jpg"
                      alt="VyapaarKit 3D Box"
                      className="bundle-box-img"
                      loading="eager"
                    />
                  </div>
                  <div className="bundle-badge badge-grow">
                    <div className="badge-icon-wrap">📊</div>
                    <span className="badge-text">Grow</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Search & Filters Bar */}
            <div className="solutions-search-row">
              <div className="solutions-search-input-wrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="solutions-search-icon"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="search"
                  placeholder="Search business ideas..."
                  value={listingState.searchQuery}
                  onChange={(e) => updateListingState({ searchQuery: e.target.value })}
                  className="solutions-search-input"
                />
              </div>

              <button
                type="button"
                className={`solutions-filter-btn${isFiltersOpen ? ' is-active' : ''}${activeFilterCount > 0 ? ' has-active' : ''}`}
                onClick={() => setIsFiltersOpen((prev) => !prev)}
                aria-expanded={isFiltersOpen}
                aria-label="Toggle filters"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="solutions-filter-count-badge">{activeFilterCount}</span>
                )}
              </button>
            </div>

            {/* Collapsible Advanced Filters Drawer */}
            {isFiltersOpen && (
              <div className="course-hub-filters-collapse">
                <div className="course-hub-filters-inner">
                  <div className="course-hub-filter-field">
                    <label htmlFor="filter-type">Type:</label>
                    <select
                      id="filter-type"
                      value={listingState.type}
                      onChange={(e) => updateListingState({ type: e.target.value })}
                    >
                      <option value="">All Types</option>
                      <option value="business-plans">Business Plans</option>
                      <option value="business-tools">Business Playbooks</option>
                      <option value="business-in-the-box">Business in a Box</option>
                    </select>
                  </div>

                  <div className="course-hub-filter-field">
                    <label htmlFor="filter-sort">Sort by:</label>
                    <select
                      id="filter-sort"
                      value={listingState.sortBy}
                      onChange={(e) => updateListingState({ sortBy: e.target.value })}
                    >
                      <option value="newest">Newest</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>

                  {activeFilterCount > 0 && (
                    <div className="course-hub-filter-reset-wrap">
                      <button
                        type="button"
                        className="course-hub-filter-reset-btn"
                        onClick={() => {
                          updateListingState({
                            type: '',
                            sortBy: 'newest',
                          });
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Circular Quick Category Bar matching Screenshot 1 */}
            <div className="solutions-categories-strip">
              {quickCategories.map((cat) => {
                const isSelected = selectedCategoryValue === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`solution-cat-btn${isSelected ? ' is-selected' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        updateListingState({ category: ALL_CATEGORY });
                      } else {
                        updateListingState({ category: cat.slug });
                      }
                    }}
                    title={cat.name}
                  >
                    <div className="solution-cat-circle">
                      {cat.icon}
                    </div>
                    <span className="solution-cat-label">{cat.name}</span>
                  </button>
                );
              })}
            </div>
        </div>
      </section>

      <section className="course-hub-section">
        <div className="course-hub-card">
          {/* 5. Content Section */}
          <div className="course-hub-content" role="tabpanel" aria-label={activeTabLabel}>
            {loading || (listingState.tab === 'my' && !myCoursesLoaded) ? (
              <div className="course-hub-status">Loading business solutions...</div>
            ) : listingState.tab === 'my' ? (
              // User's Purchased Courses
              <div>
                <div className="trending-header-row">
                  <h2 className="trending-title">My Purchased Solutions</h2>
                  <span className="course-hub-count">{filteredCourses.length} solutions</span>
                </div>
                {filteredCourses.length > 0 ? (
                  <CourseGridSection
                    key="my-courses-grid"
                    sectionTitle=""
                    courses={filteredCourses}
                    layout="grid"
                    embedded
                    mode="my"
                  />
                ) : (
                  <div className="course-empty-state">
                    <h3>No purchased solutions yet</h3>
                    <p>Your purchased business solutions will appear here.</p>
                    <button
                      className="course-empty-cta"
                      type="button"
                      onClick={() => updateListingState({ tab: 'available' })}
                    >
                      Browse Solutions
                    </button>
                  </div>
                )}
              </div>
            ) : !isFiltered ? (
              // Default view matching Screenshot 1: Trending Business Solutions powered by Popular courses from Home
              <div>
                <div className="trending-header-row">
                  <h2 className="trending-title">
                    <span>🔥</span> Trending Business Solutions
                  </h2>
                  <button
                    type="button"
                    className="trending-view-all-btn"
                    onClick={() => setShowAllSolutions(true)}
                  >
                    View All →
                  </button>
                </div>

                {trendingCourses.length > 0 ? (
                  <CourseGridSection
                    key="trending-courses-grid"
                    sectionTitle=""
                    courses={trendingCourses}
                    layout="grid"
                    embedded
                    mode="available"
                  />
                ) : (
                  <div className="course-empty-state">
                    <h3>No solutions available right now</h3>
                    <p>Business solutions will appear here shortly.</p>
                  </div>
                )}
              </div>
            ) : (
              // Filtered / All Solutions View
              <div>
                <div className="trending-header-row">
                  <h2 className="trending-title">
                    {listingState.searchQuery
                      ? `Search: "${listingState.searchQuery}"`
                      : selectedCategoryValue && selectedCategoryValue !== ALL_CATEGORY
                      ? `${quickCategories.find((c) => c.slug === selectedCategoryValue)?.name || 'Filtered'} Solutions`
                      : 'All Business Solutions'}
                  </h2>
                  <button
                    type="button"
                    className="trending-view-all-btn"
                    onClick={() => {
                      setShowAllSolutions(false);
                      updateListingState({ category: ALL_CATEGORY, searchQuery: '', type: '' });
                    }}
                  >
                    ← Back to Trending
                  </button>
                </div>

                {filteredCourses.length > 0 ? (
                  <CourseGridSection
                    key={`${listingState.tab}:${listingState.category}:${listingState.searchQuery}`}
                    sectionTitle=""
                    courses={filteredCourses}
                    layout="grid"
                    embedded
                    mode="available"
                  />
                ) : (
                  <div className="course-empty-state">
                    <h3>No business solutions available</h3>
                    <p>No solutions match your current filter criteria.</p>
                    <button
                      className="course-empty-cta"
                      type="button"
                      onClick={() => {
                        setShowAllSolutions(false);
                        updateListingState({ category: ALL_CATEGORY, searchQuery: '', type: '' });
                      }}
                    >
                      Reset Filters & View Trending
                    </button>
                  </div>
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
