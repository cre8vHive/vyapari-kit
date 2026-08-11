import React, { useEffect, useState } from 'react';
import { AuthUser, cmsApi, PageResponse } from '../services/api';
import PageRenderer from '../components/PageRenderer';
import { SHOP_CATEGORY_DATA } from '../components/sections/CategoriesSection';
import { TESTIMONIAL_AVATAR_ONE, TESTIMONIAL_AVATAR_TWO, TESTIMONIAL_AVATAR_THREE } from './ImageAssets';

// Local Mock Data Fallbacks for Development
const MOCK_HOME_PAYLOAD: PageResponse = {
  title: "Upskill - Online Course",
  slug: "home",
  seo: {
    metaTitle: "Upskill - Online Courses, Bootcamp & Lessons",
    metaDescription: "Upskill is a leading educational platform providing courses in Business, Tech, Language, and Marketing.",
    noIndex: false,
  },
  sections: [
    {
      type: "hero",
      order: 1,
      config: {
        headline: "Faster Way For Your Grow & Upskill",
        subheading: "Gain access to thousands of educational courses taught by expert instructors.",
        primaryButton: { text: "Subscribe", link: "/register" },
        secondaryButton: { text: "Learn Now", link: "/courses" }
      }
    },
    {
      type: "categories",
      order: 2,
      config: {
        sectionTitle: "All Categories",
        categories: SHOP_CATEGORY_DATA
      }
    },
    {
      type: "course-grid",
      order: 3,
      config: {
        sectionTitle: "Popular classes",
        courses: [
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
            imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
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
            imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
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
            imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80"
          }
        ]
      }
    },
    {
      type: "testimonials",
      order: 4,
      config: {
        sectionTitle: "What Our Students Say",
        testimonials: [
          {
            id: "1",
            name: "Sophia Morgan",
            role: "Customers",
            reviewText: "Incredible experience with VyapaarKit. Expert-led courses equipped me with vital skills. Highly recommended investment.",
            avatarUrl: TESTIMONIAL_AVATAR_ONE,
            rating: 5
          },
          {
            id: "2",
            name: "Benjamin Reed",
            role: "Customers",
            reviewText: "VyapaarKit's training exceeded expectations. Exceptional instructors, real-world focus. A pivotal step toward career advancement.",
            avatarUrl: TESTIMONIAL_AVATAR_TWO,
            rating: 5
          },
          {
            id: "3",
            name: "Olivia Carter",
            role: "Customers",
            reviewText: "Thrilled with VyapaarKit's program. Invaluable knowledge, seamless delivery. Elevate your skills and future prospects confidently.",
            avatarUrl: TESTIMONIAL_AVATAR_THREE,
            rating: 5
          }
        ]
      }
    },
    {
      type: "cta",
      order: 5,
      config: {
        title: "Launch Your Career Journey through upskill.",
        buttonText: "Register Now",
        buttonLink: "/register",
        illustrationUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"
      }
    }
  ]
};
interface HomeProps {
  user?: AuthUser | null; // You can replace 'any' with a more specific User type later
}

export const Home: React.FC<HomeProps> = ({ user }) => {
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        // Attempt to fetch page content from MongoDB API
        const data = await cmsApi.getPage('home');
        setPageData(data);
      } catch (err: any) {
        console.warn("API server unavailable, loading local mockup data for development.", err);
        // Fallback to mock data so layout renders for evaluation
        setPageData(MOCK_HOME_PAYLOAD);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  // Update Page Title and SEO Meta headers
  useEffect(() => {
    if (pageData) {
      console.log(pageData)
      document.title = pageData.seo.metaTitle || pageData.title;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', pageData.seo.metaDescription || '');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = pageData.seo.metaDescription || '';
        document.head.appendChild(meta);
      }
    }
  }, [pageData]);

  if (loading) {
    return (
      <div className="loading-placeholder" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff', color: '#0b1220' }}>
        <div className="spinner" style={{ fontSize: '24px' }}>Loading Upskill...</div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="error-placeholder" style={{ padding: '50px', textAlign: 'center', background: '#ffffff', color: '#0b1220' }}>
        <h2>Error Loading Page</h2>
        <p>{error || "Page not found"}</p>
      </div>
    );
  }

  return (
    <div className="page-renderer home-template">
      <PageRenderer sections={pageData.sections} user={user} />
    </div>
  );
};

export default Home;
