export const categories = [
  {
    id: '1',
    name: 'BUSINESS TOOLS',
    slug: 'business-tools',
    iconUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=96&q=80',
    children: ['Technology', 'Food & Beverage', 'Manufacturing', 'Service', 'Commerce', 'Agriculture'],
  },
  {
    id: '2',
    name: 'BUSINESS PLANS',
    slug: 'business-plans',
    iconUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=96&q=80',
    children: ['Technology', 'Food & Beverage', 'Manufacturing', 'Service', 'Commerce', 'Agriculture'],
  },
  {
    id: '3',
    name: 'BUSINESS IN THE BOX',
    slug: 'business-in-the-box',
    iconUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=96&q=80',
    children: ['Technology', 'Food & Beverage', 'Manufacturing', 'Service', 'Commerce', 'Agriculture'],
  },
  { id: '4', name: 'Technology', slug: 'technology', iconUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=96&q=80' },
  { id: '5', name: 'Food & Beverage', slug: 'food-and-beverage', iconUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=96&q=80' },
  { id: '6', name: 'Manufacturing', slug: 'manufacturing', iconUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=96&q=80' },
  { id: '7', name: 'Service', slug: 'service', iconUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=96&q=80' },
  { id: '8', name: 'Commerce', slug: 'commerce', iconUrl: 'https://images.unsplash.com/photo-1556742049-0a67dd60f9a2?auto=format&fit=crop&w=96&q=80' },
  { id: '9', name: 'Agriculture', slug: 'agriculture', iconUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=96&q=80' },
  { id: '10', name: 'Business', slug: 'business', iconUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=96&q=80' },
  { id: '11', name: 'Development', slug: 'development', iconUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=96&q=80' },
  { id: '12', name: 'Language', slug: 'language', iconUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=96&q=80' },
  { id: '13', name: 'Marketing', slug: 'marketing', iconUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=96&q=80' },
  { id: '14', name: 'Finance', slug: 'finance', iconUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=96&q=80' },
  { id: '15', name: 'Design', slug: 'design', iconUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=96&q=80' },
  { id: '16', name: 'Photography', slug: 'photography', iconUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=96&q=80' }
];

export const courses = [
  {
    id: '1',
    slug: 'business-in-a-box-complete-entrepreneur',
    title: 'Business-in-a-Box | The Complete Entrepreneur Toolkit',
    instructorName: 'VyapaarKit Experts',
    categoryName: 'Business in the Box',
    difficulty: 'Beginner' as const,
    price: 49.99,
    oldPrice: 99.99,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '2',
    slug: 'manufacturing-supply-chain-masterclass',
    title: 'Manufacturing & Supply Chain Management Masterclass',
    instructorName: 'Rajesh Sharma',
    categoryName: 'Manufacturing',
    difficulty: 'Intermediate' as const,
    price: 29.99,
    oldPrice: 49.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '3',
    slug: 'technology-automation-small-business',
    title: 'Modern Technology & Automation for Small Business',
    instructorName: 'Ananya Verma',
    categoryName: 'Technology',
    difficulty: 'Beginner' as const,
    price: 24.99,
    oldPrice: 39.99,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '4',
    slug: 'food-beverage-startup-guide',
    title: 'Food & Beverage Business Startup & Operations Guide',
    instructorName: 'Chef Vikas Kapoor',
    categoryName: 'Food & Beverage',
    difficulty: 'Beginner' as const,
    price: 27.99,
    oldPrice: 45.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '5',
    slug: 'service-business-high-ticket-client-acquisition',
    title: 'Service Business Strategy & High-Ticket Client Acquisition',
    instructorName: 'Priya Mehta',
    categoryName: 'Service',
    difficulty: 'Intermediate' as const,
    price: 34.99,
    oldPrice: 59.99,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '6',
    slug: 'ecommerce-retail-mastery',
    title: 'E-Commerce & Commercial Retail Mastery',
    instructorName: 'Amit Patel',
    categoryName: 'Commerce',
    difficulty: 'Beginner' as const,
    price: 22.99,
    oldPrice: 38.99,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67dd60f9a2?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '7',
    slug: 'agri-business-smart-farming',
    title: 'Agri-Business & Smart Agriculture Management',
    instructorName: 'Dr. Suresh Kumar',
    categoryName: 'Agriculture',
    difficulty: 'Beginner' as const,
    price: 19.99,
    oldPrice: 34.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '8',
    slug: 'essential-business-tools-stack',
    title: 'Essential Business Tools & Productivity Tech Stack',
    instructorName: 'Onecontributor',
    categoryName: 'Business Tools',
    difficulty: 'Beginner' as const,
    price: 18.99,
    oldPrice: 29.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '9',
    slug: 'business-plan-financial-model-writing',
    title: 'Business Plan Writing & Financial Modeling Masterclass',
    instructorName: 'Onecontributor',
    categoryName: 'Business Plans',
    difficulty: 'Intermediate' as const,
    price: 28.99,
    oldPrice: 49.99,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '10',
    slug: 'photography-masterclass-guide',
    title: 'Photography Masterclass: A Complete Guide to Photography',
    instructorName: 'Onecontributor',
    categoryName: 'Photography',
    difficulty: 'Beginner' as const,
    price: 18.99,
    oldPrice: 30.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '11',
    slug: 'wordpress-developer-course',
    title: 'Complete WordPress Developer Course 2024',
    instructorName: 'Onecontributor',
    categoryName: 'Development',
    difficulty: 'Beginner' as const,
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '12',
    slug: 'personal-finance-course',
    title: 'The Complete Personal Finance Course',
    instructorName: 'Onecontributor',
    categoryName: 'Finance',
    difficulty: 'Beginner' as const,
    price: 17.99,
    oldPrice: 40.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '13',
    slug: 'digital-marketing-course',
    title: 'The Complete Digital Marketing Course',
    instructorName: 'Onecontributor',
    categoryName: 'Marketing',
    difficulty: 'Beginner' as const,
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '14',
    slug: 'business-startup-guide',
    title: 'The Business Startup Guide to Become an Entrepreneur',
    instructorName: 'Onecontributor',
    categoryName: 'Business',
    difficulty: 'Beginner' as const,
    price: 18.99,
    oldPrice: 30.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '15',
    slug: 'german-language-course',
    title: 'Best Way to Learn German Language: Full Beginner',
    instructorName: 'Onecontributor',
    categoryName: 'Language',
    difficulty: 'Beginner' as const,
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80'
  }
];

export const homePage = {
  title: 'VyapaarKit - Online Course',
  slug: 'home',
  seo: {
    metaTitle: 'VyapaarKit - Online Courses, Bootcamp & Lessons',
    metaDescription: 'VyapaarKit is a learning platform providing courses in business, tech, language, and marketing.',
    noIndex: false
  },
  sections: [
    {
      type: 'hero',
      order: 1,
      config: {
        headline: 'Faster Way For Your Grow & VyapaarKit',
        subheading: 'Gain access to practical courses taught by expert instructors.',
        backgroundType: 'gradient',
        primaryButton: { text: 'Subscribe', link: '/register' },
        secondaryButton: { text: 'Learn Now', link: '/courses' }
      }
    },
    { type: 'categories', order: 2, config: { sectionTitle: 'All Categories', categories } },
    { type: 'course-grid', order: 3, config: { sectionTitle: 'Popular classes', courses: courses.slice(0, 3) } },
    {
      type: 'testimonials',
      order: 4,
      config: {
        sectionTitle: 'What Our Students Say',
        testimonials: [
          { id: '1', name: 'Sophia Morgan', role: 'Student', reviewText: 'Expert-led courses helped me build practical skills quickly.', rating: 5 },
          { id: '2', name: 'Benjamin Reed', role: 'Student', reviewText: 'The lessons are focused, clear, and easy to apply at work.', rating: 5 },
          { id: '3', name: 'Olivia Carter', role: 'Student', reviewText: 'A smooth learning experience with useful projects and guidance.', rating: 5 }
        ]
      }
    },
    {
      type: 'cta',
      order: 5,
      config: {
        title: 'Launch Your Career Journey through VyapaarKit.',
        buttonText: 'Register Now',
        buttonLink: '/register'
      }
    }
  ]
};
