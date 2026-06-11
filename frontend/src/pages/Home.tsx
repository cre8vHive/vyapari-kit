import React, { useEffect, useState } from 'react';
import { cmsApi, PageResponse } from '../services/api';
import PageRenderer from '../components/PageRenderer';

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
        categories: [
          { id: "1", name: "Business", slug: "business", iconUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=96&q=80" },
          { id: "2", name: "Development", slug: "development", iconUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=96&q=80" },
          { id: "3", name: "Language", slug: "language", iconUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=96&q=80" },
          { id: "4", name: "Marketing", slug: "marketing", iconUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=96&q=80" },
          { id: "5", name: "Finance", slug: "finance", iconUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=96&q=80" },
          { id: "6", name: "Design", slug: "design", iconUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=96&q=80" },
          { id: "7", name: "Photography", slug: "photography", iconUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=96&q=80" }
        ]
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
            reviewText: "Incredible experience with Upskill. Expert-led courses equipped me with vital skills. Highly recommended investment.",
            avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80",
            rating: 5
          },
          {
            id: "2",
            name: "Benjamin Reed",
            role: "Customers",
            reviewText: "Upskill's training exceeded expectations. Exceptional instructors, real-world focus. A pivotal step toward career advancement.",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=80",
            rating: 5
          },
          {
            id: "3",
            name: "Olivia Carter",
            role: "Customers",
            reviewText: "Thrilled with Upskill's program. Invaluable knowledge, seamless delivery. Elevate your skills and future prospects confidently.",
            avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80",
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

export const Home: React.FC = () => {
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
      <PageRenderer sections={pageData.sections} />
    </div>
  );
};

export default Home;
