import React from 'react';

// Central registry of lazy-loaded page sections to enable runtime code splitting
export const SectionRegistry: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'hero': React.lazy(() => import('./HeroSection')),
  'categories': React.lazy(() => import('./CategoriesSection')),
  'course-grid': React.lazy(() => import('./CourseGridSection')),
  'testimonials': React.lazy(() => import('./TestimonialsSection')),
  'cta': React.lazy(() => import('./CTASection')),
  'faq': React.lazy(() => import('./FAQSection')),
  'stats': React.lazy(() => import('./StatsSection')),
  'blog-grid': React.lazy(() => import('./BlogGridSection')),
};

export default SectionRegistry;
