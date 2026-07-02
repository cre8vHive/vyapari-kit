export interface CourseDetailData {
  id: string;
  title: string;
  subtitle: string;
  routePath: string;
  category: string;
  level: string;
  duration: string;
  rating: number;
  totalRatings: number;
  students: number;
  instructor: string;
  instructorTitle: string;
  instructorBio: string;
  instructorStudents: number;
  instructorRating: number;
  instructorCourses: number;
  lastUpdated: string;
  language: string;
  tags: string[];
  price: number;
  oldPrice: number;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  whatYoullLearn: string[];
  skills: string[];
  requirements: string[];
  audience: string[];
  content: Array<{ title: string; lectures: Array<{ title: string; duration: string }> }>;
  includes: string[];
  reviews: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    rating: number;
    date: string;
    review: string;
  }>;
  faqs: Array<{ question: string; answer: string }>;
  relatedCourses: Array<{
    id: string;
    title: string;
    slug: string;
    price: number;
    oldPrice?: number;
    imageUrl: string;
    rating: number;
  }>;
}

const createCourseDetail = (overrides: Partial<CourseDetailData> & Pick<CourseDetailData, 'title' | 'routePath' | 'subtitle' | 'category' | 'level' | 'duration' | 'rating' | 'totalRatings' | 'students' | 'instructor' | 'instructorTitle' | 'instructorBio' | 'price' | 'oldPrice' | 'imageUrl' | 'thumbnailUrl' | 'description' | 'whatYoullLearn' | 'skills' | 'requirements' | 'audience' | 'content' | 'includes' | 'reviews' | 'faqs' | 'relatedCourses'>): CourseDetailData => ({
  id: overrides.routePath,
  instructorStudents: 12000,
  instructorRating: 4.8,
  instructorCourses: 8,
  lastUpdated: 'May 2026',
  language: 'English',
  tags: ['Growth', 'Practical Skills', 'Career Boost'],
  ...overrides,
});

export const courseDetailsData: CourseDetailData[] = [
  createCourseDetail({
    title: 'Photography Masterclass: A Complete Guide to Photography',
    routePath: 'photography-masterclass-guide',
    subtitle: 'Learn composition, light, editing, and storytelling with a practical creative workflow.',
    category: 'Photography',
    level: 'Beginner',
    duration: '12 hours',
    rating: 4.8,
    totalRatings: 1840,
    students: 12350,
    instructor: 'Mina Alvarez',
    instructorTitle: 'Visual storyteller and photography mentor',
    instructorBio: 'Mina has spent over a decade creating imagery for editorial, commercial, and educational projects. She makes advanced concepts approachable for aspiring photographers.',
    lastUpdated: 'April 2025',
    language: 'English',
    tags: ['Photography', 'Editing', 'Composition', 'Creative Workflow'],
    price: 59,
    oldPrice: 129,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    description: 'Build a confident photography practice from the ground up with hands-on guidance that blends technique, artistic decision-making, and practical editing. You will move from camera basics to confident storytelling in a structure designed for real-world growth.',
    whatYoullLearn: ['Understand exposure, aperture, shutter speed, and ISO in a practical way.', 'Capture polished portraits, landscapes, travel shots, and event moments.', 'Develop a repeatable editing workflow for color, contrast, and mood.', 'Create stronger compositions with better framing, leading lines, and balance.'],
    skills: ['Camera Settings', 'Storytelling', 'Post-Processing', 'Composition'],
    requirements: ['A camera or smartphone', 'Basic curiosity about photography', 'Willingness to practice regularly'],
    audience: ['Beginners seeking a structured foundation', 'Creators who want better everyday images', 'Small business owners wanting stronger visual content'],
    content: [{ title: 'Foundation', lectures: [{ title: 'Introduction to the course', duration: '06:42' }, { title: 'Camera basics and gear overview', duration: '12:08' }, { title: 'Understanding light and exposure', duration: '14:22' }] }, { title: 'Composition and Storytelling', lectures: [{ title: 'Framing and composition', duration: '10:15' }, { title: 'Lighting for portraits', duration: '13:07' }, { title: 'Creating narrative with your images', duration: '09:40' }] }, { title: 'Editing and Delivery', lectures: [{ title: 'Editing workflow in Lightroom', duration: '16:04' }, { title: 'Color grading and finishing touches', duration: '11:53' }, { title: 'Sharing your work online', duration: '07:21' }] }],
    includes: ['20 hours on-demand video', 'Downloadable resources', 'Certificate of completion', 'Lifetime access', 'Mobile and desktop access'],
    reviews: [{ id: '1', name: 'Alicia R.', role: 'Marketing Designer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', rating: 5, date: 'March 2025', review: 'The course gave me a clear structure for understanding light and composition. I finally feel confident shooting in different situations.' }, { id: '2', name: 'Jordan K.', role: 'Content Creator', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', rating: 5, date: 'January 2025', review: 'Excellent pacing and practical examples. The editing lessons alone transformed the quality of my work.' }, { id: '3', name: 'Sofia T.', role: 'Travel Blogger', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80', rating: 4, date: 'December 2024', review: 'A bright and encouraging course that balances creativity with practical habits. It feels very approachable.' }],
    faqs: [{ question: 'Do I need prior experience?', answer: 'No. The course is designed for beginners and intermediate learners alike.' }, { question: 'Will I get a certificate?', answer: 'Yes. You will receive a certificate of completion after finishing the course.' }],
    relatedCourses: [{ id: 'related-1', title: 'Visual Storytelling for Brands', slug: 'visual-storytelling-brands', price: 39, oldPrice: 79, imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80', rating: 4.7 }, { id: 'related-2', title: 'Creative Editing in Lightroom', slug: 'creative-editing-lightroom', price: 29, oldPrice: 69, imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80', rating: 4.6 }, { id: 'related-3', title: 'Mobile Photography Essentials', slug: 'mobile-photography-essentials', price: 24, oldPrice: 49, imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80', rating: 4.8 }, { id: 'related-4', title: 'Creative Lighting Lab', slug: 'creative-lighting-lab', price: 34, oldPrice: 89, imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80', rating: 4.9 }]
  }),
  createCourseDetail({
    title: 'Complete WordPress Developer Course 2024',
    routePath: 'wordpress-developer-course',
    subtitle: 'Master WordPress design, plugins, custom themes, and publishing workflows.',
    category: 'Development',
    level: 'Intermediate',
    duration: '18 hours',
    rating: 4.8,
    totalRatings: 1210,
    students: 9200,
    instructor: 'Ava Brooks',
    instructorTitle: 'WordPress architect and educator',
    instructorBio: 'Ava has built productized WordPress experiences for studios and startups and enjoys translating technical steps into clear lessons.',
    price: 49,
    oldPrice: 99,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    description: 'Learn how to build and scale modern WordPress sites with solid foundations in themes, plugins, performance, and publishing strategy.',
    whatYoullLearn: ['Structure a WordPress site from scratch.', 'Create custom blocks and templates.', 'Integrate plugins and optimize performance.'],
    skills: ['WordPress', 'Theme Development', 'Plugin Development', 'Performance'],
    requirements: ['Basic HTML and CSS', 'A text editor', 'A local development environment'],
    audience: ['Developers exploring WordPress', 'Freelancers building client sites', 'Designers who want more control'],
    content: [{ title: 'Setup', lectures: [{ title: 'Installing WordPress locally', duration: '09:12' }, { title: 'Choosing a theme stack', duration: '08:03' }] }, { title: 'Theme Building', lectures: [{ title: 'Creating custom templates', duration: '11:15' }, { title: 'Styling with custom CSS', duration: '10:08' }] }, { title: 'Plugins and Launch', lectures: [{ title: 'Adding plugin-based features', duration: '07:23' }, { title: 'Preparing a site for launch', duration: '09:41' }] }],
    includes: ['Full HD videos', 'Code resources', 'Lifetime access', 'Quizzes and assignments'],
    reviews: [{ id: '4', name: 'Chris M.', role: 'Freelance Developer', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', rating: 5, date: 'February 2025', review: 'The course made WordPress feel much more approachable for me as a developer.' }],
    faqs: [{ question: 'Is this suitable for complete beginners?', answer: 'Yes, though some familiarity with HTML and CSS helps.' }],
    relatedCourses: [{ id: 'related-5', title: 'Modern React UI Patterns', slug: 'modern-react-ui-patterns', price: 39, oldPrice: 79, imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80', rating: 4.7 }]
  }),
  createCourseDetail({
    title: 'The Complete Personal Finance Course',
    routePath: 'personal-finance-course',
    subtitle: 'Build confidence around budgeting, saving, investing, and money habits.',
    category: 'Finance',
    level: 'Beginner',
    duration: '9 hours',
    rating: 4.8,
    totalRatings: 980,
    students: 7600,
    instructor: 'Nadia Ortiz',
    instructorTitle: 'Finance educator and planner',
    instructorBio: 'Nadia helps learners simplify finance concepts with practical strategies that fit everyday life.',
    price: 29,
    oldPrice: 79,
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    description: 'Create a practical financial roadmap that helps you budget smarter, reduce debt, and invest with confidence.',
    whatYoullLearn: ['Build a realistic budget.', 'Understand credit and debt management.', 'Create simple long-term investment goals.'],
    skills: ['Budgeting', 'Investing', 'Planning', 'Money Management'],
    requirements: ['A notebook or spreadsheet', 'Willingness to review your finances'],
    audience: ['New earners', 'Families planning budgets', 'Anyone who wants better habits'],
    content: [{ title: 'Foundations', lectures: [{ title: 'Your financial baseline', duration: '08:04' }, { title: 'Tracking income and expenses', duration: '06:20' }] }, { title: 'Strategy', lectures: [{ title: 'Debt and savings plans', duration: '09:41' }, { title: 'Growth and investing paths', duration: '07:52' }] }],
    includes: ['Lifetime access', 'Templates', 'Mobile access', 'Downloadable resources'],
    reviews: [{ id: '5', name: 'Riley P.', role: 'Operations Lead', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', rating: 5, date: 'March 2025', review: 'I finally understand how to organize my finances without getting overwhelmed.' }],
    faqs: [{ question: 'Can I take this on mobile?', answer: 'Yes. The course is designed for both desktop and mobile study.' }],
    relatedCourses: [{ id: 'related-6', title: 'Investing Basics for Beginners', slug: 'investing-basics-for-beginners', price: 24, oldPrice: 59, imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80', rating: 4.6 }]
  }),
  createCourseDetail({
    title: 'The Complete Digital Marketing Course',
    routePath: 'digital-marketing-course',
    subtitle: 'Learn strategy, content, ads, and analytics for modern digital growth.',
    category: 'Marketing',
    level: 'Beginner',
    duration: '14 hours',
    rating: 4.6,
    totalRatings: 1100,
    students: 8400,
    instructor: 'Samir Khan',
    instructorTitle: 'Growth marketer and strategist',
    instructorBio: 'Samir helps teams build effective funnels and campaigns with clear, practical frameworks.',
    price: 39,
    oldPrice: 89,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
    description: 'Explore the core disciplines of digital marketing, from audience research to campaign measurement and content strategy.',
    whatYoullLearn: ['Build campaigns around a target audience.', 'Create stronger content and email flows.', 'Measure performance with analytics.'],
    skills: ['Digital Marketing', 'Analytics', 'Email Marketing', 'Advertising'],
    requirements: ['No prior experience required', 'A laptop or phone', 'Comfort with basic online tools'],
    audience: ['Small business owners', 'Recent graduates', 'Aspiring marketers'],
    content: [{ title: 'Strategy', lectures: [{ title: 'Understanding your audience', duration: '08:42' }, { title: 'Campaign planning', duration: '07:06' }] }, { title: 'Execution', lectures: [{ title: 'Content and email workflows', duration: '10:14' }, { title: 'Ad campaign setup', duration: '09:22' }] }],
    includes: ['Lifetime access', 'Marketing templates', 'Downloadable resources', 'Certificate'],
    reviews: [{ id: '6', name: 'Tina J.', role: 'Brand Consultant', avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=200&q=80', rating: 4, date: 'January 2025', review: 'Clear explanations and actionable strategies. It helped me create a better client plan.' }],
    faqs: [{ question: 'Is there any ad spend required?', answer: 'No. The course focuses on strategy and execution without requiring paid experiments.' }],
    relatedCourses: [{ id: 'related-7', title: 'Content Strategy Essentials', slug: 'content-strategy-essentials', price: 26, oldPrice: 69, imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80', rating: 4.5 }]
  }),
  createCourseDetail({
    title: 'The Business Startup Guide to Become an Entrepreneur',
    routePath: 'business-startup-guide',
    subtitle: 'Turn your business idea into a clear action plan with focus, strategy, and confidence.',
    category: 'Business',
    level: 'Beginner',
    duration: '10 hours',
    rating: 4.8,
    totalRatings: 890,
    students: 6400,
    instructor: 'Lina Moreno',
    instructorTitle: 'Business mentor and founder',
    instructorBio: 'Lina has helped founders turn ideas into launch-ready plans through structured coaching and product thinking.',
    price: 34,
    oldPrice: 79,
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
    description: 'Build a lean business roadmap with focused lessons on positioning, validation, operations, and growth.',
    whatYoullLearn: ['Define your product and audience.', 'Create an actionable launch plan.', 'Understand the basics of operations and growth.'],
    skills: ['Entrepreneurship', 'Business Strategy', 'Planning', 'Positioning'],
    requirements: ['A business idea', 'Basic goal-setting mindset'],
    audience: ['Aspiring founders', 'Creative professionals', 'Solopreneurs'],
    content: [{ title: 'Planning', lectures: [{ title: 'Identifying your market', duration: '08:37' }, { title: 'Building a business model', duration: '09:11' }] }, { title: 'Launch', lectures: [{ title: 'Creating your first offer', duration: '07:54' }, { title: 'Preparing for early customers', duration: '08:20' }] }],
    includes: ['Downloadable resources', 'Lifetime access', 'Certificate', 'Mobile access'],
    reviews: [{ id: '7', name: 'Owen L.', role: 'Founder', avatar: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80', rating: 5, date: 'December 2024', review: 'The course helped me stop overthinking and start building a clearer offer.' }],
    faqs: [{ question: 'Is this good for first-time founders?', answer: 'Yes. It is designed for people who are at the beginning of their entrepreneurial journey.' }],
    relatedCourses: [{ id: 'related-8', title: 'Lean Startup Essentials', slug: 'lean-startup-essentials', price: 22, oldPrice: 54, imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80', rating: 4.7 }]
  }),
  createCourseDetail({
    title: 'Best Way to Learn German Language: Full Beginner',
    routePath: 'german-language-course',
    subtitle: 'Develop your German speaking, listening, and grammar foundation with practical lessons.',
    category: 'Language',
    level: 'Beginner',
    duration: '11 hours',
    rating: 4.9,
    totalRatings: 1420,
    students: 10800,
    instructor: 'Elena Weber',
    instructorTitle: 'Language coach and tutor',
    instructorBio: 'Elena teaches language in a way that is structured, encouraging, and easy to apply in everyday conversation.',
    price: 29,
    oldPrice: 69,
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
    description: 'A practical path to learning German from the basics of pronunciation and grammar to easy conversation.',
    whatYoullLearn: ['Build a working German vocabulary.', 'Understand core grammar patterns.', 'Practice everyday conversation phrases.'],
    skills: ['German', 'Pronunciation', 'Grammar', 'Conversation'],
    requirements: ['No prior experience required', 'A notebook and willingness to practice'],
    audience: ['Absolute beginners', 'Travelers', 'Professionals learning German'],
    content: [{ title: 'Basics', lectures: [{ title: 'Pronunciation and greetings', duration: '07:18' }, { title: 'Numbers and everyday words', duration: '08:09' }] }, { title: 'Conversation', lectures: [{ title: 'Asking for directions', duration: '06:40' }, { title: 'Ordering food and travel phrases', duration: '07:56' }] }],
    includes: ['Lifetime access', 'Practice sheets', 'Mobile access', 'Certificate'],
    reviews: [{ id: '8', name: 'Hugo B.', role: 'Travel Enthusiast', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', rating: 5, date: 'February 2025', review: 'The lessons are clear and practical. I am already feeling more confident speaking German.' }],
    faqs: [{ question: 'Do I need to speak any German already?', answer: 'No. The course is structured for complete beginners.' }],
    relatedCourses: [{ id: 'related-9', title: 'Spanish for Everyday Travel', slug: 'spanish-for-everyday-travel', price: 24, oldPrice: 49, imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80', rating: 4.7 }]
  })
];

export const getCourseDetailsByPath = (routePath: string) => {
  const found = courseDetailsData.find((course) => course.routePath === routePath);
  if (found) return found;

  const title = routePath
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

  return createCourseDetail({
    title,
    routePath,
    subtitle: 'A polished learning experience tailored to this topic with structured lessons and practical takeaways.',
    category: 'Featured',
    level: 'Beginner',
    duration: '8 hours',
    rating: 4.7,
    totalRatings: 320,
    students: 1800,
    instructor: 'Vyapari Learning Team',
    instructorTitle: 'Creative educator',
    instructorBio: 'The Vyapari learning team designs practical courses with clear structure and modern teaching techniques.',
    price: 29,
    oldPrice: 69,
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    description: 'This course page is dynamically generated so your catalog can expand without extra route setup.',
    whatYoullLearn: ['Learn the core concepts quickly.', 'Follow a structured path from beginner to confident.', 'Apply the lessons in real projects.'],
    skills: ['Practice', 'Structure', 'Confidence', 'Applied Learning'],
    requirements: ['A curious mindset', 'A device to learn on'],
    audience: ['Learners exploring a new skill', 'Professionals seeking refreshers', 'Anyone wanting guided instruction'],
    content: [{ title: 'Start Strong', lectures: [{ title: 'Welcome and course overview', duration: '06:30' }, { title: 'Core lessons', duration: '10:45' }] }],
    includes: ['Lifetime access', 'Project guidance', 'Certificate', 'Mobile access'],
    reviews: [{ id: 'fallback', name: 'Learner', role: 'Student', avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80', rating: 5, date: 'Now available', review: 'A clean and structured learning experience built for growth.' }],
    faqs: [{ question: 'Is this course ready to learn?', answer: 'Yes. The page is built to work for any slug added to the catalog.' }],
    relatedCourses: []
  });
};
