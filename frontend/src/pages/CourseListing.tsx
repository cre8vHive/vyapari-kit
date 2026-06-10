import React, { useEffect, useState } from 'react';
import { cmsApi } from '../services/api';
import CourseGridSection, { CourseItem } from '../components/sections/CourseGridSection';

interface CategoryFilterItem {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
}

const MOCK_CATEGORIES: CategoryFilterItem[] = [
  { id: "all", name: "All Categories", slug: "", iconUrl: "../wp-content/uploads/2023/12/Asset-014.png" },
  { id: "1", name: "Business", slug: "business", iconUrl: "../wp-content/uploads/2023/12/Asset-08.png" },
  { id: "2", name: "Development", slug: "development", iconUrl: "../wp-content/uploads/2023/12/Asset-09.png" },
  { id: "3", name: "Language", slug: "language", iconUrl: "../wp-content/uploads/2023/12/Asset-06-1.png" },
  { id: "4", name: "Marketing", slug: "marketing", iconUrl: "../wp-content/uploads/2023/12/Asset-07.png" },
  { id: "5", name: "Finance", slug: "finance", iconUrl: "../wp-content/uploads/2023/12/Asset-010.png" },
  { id: "6", name: "Design", slug: "design", iconUrl: "../wp-content/uploads/2023/12/Asset-011.png" },
  { id: "7", name: "Photography", slug: "photography", iconUrl: "../wp-content/uploads/2023/12/Asset-012.png" }
];

const MOCK_COURSES: CourseItem[] = [
  {
    id: "1",
    slug: "photography-masterclass-guide",
    title: "Photography Masterclass: A Complete Guide to Photography",
    instructorName: "Onecontributor",
    categoryName: "Photography",
    difficulty: "Beginner",
    price: 18.99,
    oldPrice: 30.99,
    rating: 4.8,
    imageUrl: "../wp-content/uploads/2023/12/upskilljpg-011.jpg"
  },
  {
    id: "2",
    slug: "wordpress-developer-course",
    title: "Complete WordPress Developer Course 2024",
    instructorName: "Onecontributor",
    categoryName: "Development",
    difficulty: "Beginner",
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.8,
    imageUrl: "../wp-content/uploads/2023/12/upskilljpg-06.jpg"
  },
  {
    id: "3",
    slug: "personal-finance-course",
    title: "The Complete Personal Finance Course",
    instructorName: "Onecontributor",
    categoryName: "Finance",
    difficulty: "Beginner",
    price: 17.99,
    oldPrice: 40.99,
    rating: 4.8,
    imageUrl: "../wp-content/uploads/2023/12/upskilljpg-012.jpg"
  },
  {
    id: "4",
    slug: "digital-marketing-course",
    title: "The Complete Digital Marketing Course",
    instructorName: "Onecontributor",
    categoryName: "Marketing",
    difficulty: "Beginner",
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.6,
    imageUrl: "../wp-content/uploads/2023/12/upskilljpg-01.jpg"
  },
  {
    id: "5",
    slug: "business-startup-guide",
    title: "The Business Startup Guide to Become an Entrepreneur",
    instructorName: "Onecontributor",
    categoryName: "Business",
    difficulty: "Beginner",
    price: 18.99,
    oldPrice: 30.99,
    rating: 4.8,
    imageUrl: "../wp-content/uploads/2023/12/upskilljpg-05.jpg"
  },
  {
    id: "6",
    slug: "german-language-course",
    title: "Best Way to Learn German Language: Full Beginner",
    instructorName: "Onecontributor",
    categoryName: "Language",
    difficulty: "Beginner",
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.9,
    imageUrl: "../wp-content/uploads/2023/12/upskilljpg-02.jpg"
  }
];

export const CourseListing: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<CategoryFilterItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize values on mount
  useEffect(() => {
    const fetchListingData = async () => {
      try {
        setLoading(true);
        // Attempt to fetch categories and courses from API endpoints
        const catsData = await cmsApi.getCategories();
        const coursesData = await cmsApi.getCourses();
        
        // Map all categories button to start
        setCategories([
          { id: "all", name: "All Categories", slug: "", iconUrl: "../wp-content/uploads/2023/12/Asset-014.png" },
          ...catsData
        ]);
        setCourses(coursesData);
      } catch (err) {
        console.warn("API server not running, using static listing assets.");
        setCategories(MOCK_CATEGORIES);
        setCourses(MOCK_COURSES);
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
    document.title = "Course – Upskill";
  }, []);

  // Sync course loading with selected category filters
  useEffect(() => {
    const fetchFilteredCourses = async () => {
      if (loading) return; // Prevent double trigger during initialization
      try {
        const params: Record<string, any> = {};
        if (selectedCategory) params.category = selectedCategory;
        if (searchQuery) params.search = searchQuery;

        const filtered = await cmsApi.getCourses(params);
        setCourses(filtered);
      } catch (err) {
        // Fallback filter locally if server is offline
        let filtered = MOCK_COURSES;
        if (selectedCategory) {
          filtered = filtered.filter(c => c.categoryName.toLowerCase() === selectedCategory.toLowerCase());
        }
        if (searchQuery) {
          filtered = filtered.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setCourses(filtered);
      }
    };

    fetchFilteredCourses();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="page-renderer course-listing-template">
      
      {/* Spacer */}
      <div className="elementor-element elementor-element-b948b48 e-flex e-con-boxed e-con e-parent">
        <div className="e-con-inner">
          <div className="elementor-element elementor-element-859c614 elementor-widget elementor-widget-spacer">
            <div className="elementor-widget-container">
              <div className="elementor-spacer">
                <div className="elementor-spacer-inner"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs & Page Header Section */}
      <div className="elementor-element elementor-element-a76cdd5 e-con-full e-flex e-con e-parent">
        <div className="elementor-element elementor-element-53962af e-flex e-con-boxed e-con e-child" style={{ background: '#191B2E', padding: '40px 20px', width: '100%' }}>
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-6b50a33 e-con-full e-flex e-con e-child">
              
              {/* Breadcrumb links */}
              <div className="elementor-element elementor-element-c13167a elementor-icon-list--layout-inline elementor-widget elementor-widget-icon-list">
                <div className="elementor-widget-container">
                  <ul className="elementor-icon-list-items elementor-inline-items" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0 }}>
                    <li className="elementor-icon-list-item elementor-inline-item">
                      <a href="/" style={{ color: '#fff', opacity: 0.7 }}>Home</a>
                    </li>
                    <li className="elementor-icon-list-item elementor-inline-item" style={{ color: '#fff', opacity: 0.7 }}>
                      /
                    </li>
                    <li className="elementor-icon-list-item elementor-inline-item">
                      <span className="elementor-icon-list-text" style={{ color: '#fff' }}>Course</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Title */}
              <div className="elementor-element elementor-element-e3310db elementor-widget elementor-widget-heading" style={{ marginTop: '10px' }}>
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default" style={{ fontSize: '32px', color: '#fff', margin: 0 }}>
                    Course Program
                  </h2>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Interactive Category Selector Grid */}
      <div className="elementor-element elementor-element-17260cd e-flex e-con-boxed e-con e-parent" style={{ margin: '40px 0' }}>
        <div className="e-con-inner">
          <div className="elementor-element elementor-element-c5eb83e e-con-full e-flex e-con e-child" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', width: '100%' }}>
            {categories.map((cat) => {
              const isActive = (selectedCategory === cat.slug);
              return (
                <div 
                  key={cat.id} 
                  className={`category-item-wrapper ${isActive ? 'active-filter' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedCategory(cat.slug)}
                >
                  <div className="elementor-widget-container" style={{ opacity: isActive ? 1 : 0.8 }}>
                    <div className="jeg-elementor-kit jkit-icon-box">
                      <div className="jkit-icon-box-wrapper" style={{ border: isActive ? '2px solid #4caf50' : '2px solid transparent', borderRadius: '8px', background: '#1F233E', padding: '15px 25px' }}>
                        <div className="icon-box icon-box-header" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img 
                            src={cat.iconUrl} 
                            alt={cat.name} 
                            style={{ width: '30px', height: '30px' }} 
                          />
                          <h4 className="title" style={{ margin: 0, fontSize: '15px', color: '#fff' }}>{cat.name}</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Course Listing Grid */}
      <div className="course-listing-grid-wrapper">
        <CourseGridSection 
          sectionTitle="Available Courses"
          courses={courses}
          layout="grid"
        />
      </div>

    </div>
  );
};

export default CourseListing;
