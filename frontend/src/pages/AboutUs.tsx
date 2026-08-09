import React, { useEffect } from 'react';

const benefits = [
  '45-Day Launch Framework',
  'Designed for the Indian Market',
  'Profit-Focused Business Plans',
  'Step-by-Step Execution',
  'No Guesswork. Just Action.',
];

const planContents = [
  'Estimated startup investment',
  'Business model explanation',
  'Revenue and profit potential',
  'Product and supplier sourcing',
  'Pricing strategy',
  'Marketing ideas',
  'Sales strategy',
  'Customer acquisition methods',
  'Operations planning',
  'Business scaling roadmap',
  'Basic GST and compliance guidance',
  'Step-by-step execution plan',
];

const kitFeatures = [
  {
    title: 'Business Model',
    description: 'Understand how the business works, where revenue comes from, and how profits are generated.',
  },
  {
    title: 'Investment & Cost Analysis',
    description: 'Know the expected startup investment, operating expenses, and estimated profit margins before you begin.',
  },
  {
    title: 'Supplier & Vendor Information',
    description: 'Learn where and how to source products, raw materials, or services for your business.',
  },
  {
    title: 'Pricing Strategy',
    description: 'Discover practical pricing methods that help you stay competitive while maintaining healthy margins.',
  },
  {
    title: 'Marketing & Customer Acquisition',
    description: 'Learn different online and offline marketing approaches to attract customers and generate sales.',
  },
  {
    title: 'Business Operations',
    description: 'Understand daily operations, workflows, and systems required to run the business efficiently.',
  },
  {
    title: 'Growth & Expansion Strategy',
    description: 'Explore ways to scale your business through automation, additional products, new markets, and expansion opportunities.',
  },
];

const audiences = [
  'First-time entrepreneurs',
  'Working professionals planning a side business',
  'Students exploring business opportunities',
  'Small business owners looking to diversify',
  'Investors evaluating business ideas',
  'Anyone who wants a structured business roadmap before investing',
];

const entrepreneurReasons = [
  'Reduce costly mistakes',
  'Save research time',
  'Understand business economics',
  'Plan investments wisely',
  'Launch with greater confidence',
  'Follow a proven execution framework',
];

const categories = ['Agriculture', 'Commerce', 'Food & Beverage', 'Manufacturing', 'Service Businesses', 'Technology'];

const AboutUs: React.FC = () => {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  useEffect(() => {
    document.title = 'About Us | Vyapaar Kit';
    const description = 'Vyapaarkit provides execution-ready business plan PDFs designed for the Indian market, helping aspiring entrepreneurs move from idea to execution.';

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let meta = document.head.querySelector<HTMLMetaElement>(selector);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, key);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', 'About Us | Vyapaar Kit');
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  }, []);

  return (
    <div className="about-page">
      <section className="about-hero about-reveal">
        <div className="about-container">
          <nav className="course-breadcrumbs" aria-label="Breadcrumb">
            <a href={`${basePath}/`}>Home</a>
            <span>/</span>
            <span>About Us</span>
          </nav>
          <span className="about-eyebrow">India&apos;s Business Launch Weapon</span>
          <h1>About Vyapaar Kit</h1>
          <p>
            Vyapaarkit provides execution-ready business plan PDFs that help aspiring entrepreneurs launch
            businesses with confidence.
          </p>
          <a className="about-primary-button" href={`${basePath}/courses`}>Explore Business Kits</a>
        </div>
      </section>

      <section className="about-section about-reveal">
        <div className="about-container about-copy-layout">
          <div>
            <span className="about-section-number">01</span>
            <h2>Who We Are</h2>
          </div>
          <div className="about-prose">
            <p className="about-lead">Stop guessing. Start building.</p>
            <p>
              Every business kit is designed specifically for the Indian market and includes practical strategies,
              financial planning, supplier information, pricing methods, and marketing guidance—everything you need
              to move from idea to execution.
            </p>
            <p>
              Whether you&apos;re starting your first business or exploring a new opportunity, Vyapaarkit gives you
              a clear roadmap without unnecessary complexity.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section about-section-tint about-reveal">
        <div className="about-container">
          <span className="about-section-number">02</span>
          <h2>Why Choose Vyapaarkit?</h2>
          <div className="about-card-grid about-benefit-grid">
            {benefits.map((benefit) => (
              <article className="about-card about-benefit-card" key={benefit}>
                <span aria-hidden="true">✓</span>
                <h3>{benefit}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-reveal">
        <div className="about-container">
          <span className="about-section-number">03</span>
          <h2>What We Offer</h2>
          <div className="about-intro">
            <p>
              Vyapaarkit is <strong>not an online course</strong>, <strong>not motivational content</strong>, and
              <strong> not business theory</strong>.
            </p>
            <p>
              We create professionally researched, downloadable Business Plan PDFs that work as complete business
              launch guides. Each plan provides practical information to help you understand the business before
              investing your time and money.
            </p>
          </div>
          <div className="about-card-grid about-offer-grid">
            {planContents.map((item, index) => (
              <article className="about-card about-offer-card" key={item}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{item}</h3>
              </article>
            ))}
          </div>
          <p className="about-closing-line">Our goal is simple—to help you make informed business decisions with confidence.</p>
        </div>
      </section>

      <section className="about-section about-section-dark about-reveal">
        <div className="about-container">
          <span className="about-section-number">04</span>
          <h2>What&apos;s Inside Every Vyapaarkit</h2>
          <p className="about-section-copy">
            Each Vyapaarkit Business Plan is carefully structured to give you practical knowledge that you can apply immediately.
          </p>
          <div className="about-card-grid about-feature-grid">
            {kitFeatures.map((feature, index) => (
              <article className="about-card about-feature-card" key={feature.title}>
                <span className="about-feature-icon" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-reveal">
        <div className="about-container">
          <span className="about-section-number">05</span>
          <h2>Who Is Vyapaarkit For?</h2>
          <p className="about-section-copy">Vyapaarkit is built for people who are ready to take action. Our business plans are ideal for:</p>
          <div className="about-card-grid about-audience-grid">
            {audiences.map((audience) => <article className="about-card about-audience-card" key={audience}>{audience}</article>)}
          </div>
          <p className="about-closing-line">If you value clarity, planning, and practical execution, Vyapaarkit is designed for you.</p>
        </div>
      </section>

      <section className="about-section about-section-tint about-reveal">
        <div className="about-container">
          <span className="about-section-number">06</span>
          <h2>Why Entrepreneurs Choose Vyapaarkit</h2>
          <p className="about-section-copy">Starting a business becomes much easier when you understand what to do before spending your money.</p>
          <div className="about-card-grid about-reason-grid">
            {entrepreneurReasons.map((reason) => (
              <article className="about-card about-reason-card" key={reason}><span>✓</span>{reason}</article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-reveal">
        <div className="about-container about-commitment">
          <span className="about-section-number">07</span>
          <h2>Our Commitment</h2>
          <p>At Vyapaarkit, we believe business education should be practical, transparent, and easy to understand.</p>
          <p>
            Every business plan is created with the objective of helping aspiring entrepreneurs make informed
            decisions and start businesses with greater confidence.
          </p>
          <strong>Your growth is our motivation.</strong>
        </div>
      </section>

      <section className="about-section about-details-section about-reveal">
        <div className="about-container about-details-grid">
          <article>
            <h2>Business Categories</h2>
            <div className="about-tag-list">{categories.map((category) => <span key={category}>{category}</span>)}</div>
          </article>
          <article>
            <h2>Accepted Payment Methods</h2>
            <p>We support secure online payments through trusted payment gateways, making your purchase safe, fast, and convenient.</p>
          </article>
          <article>
            <h2>Connect With Us</h2>
            <p>Follow Vyapaarkit for new business ideas, updates, and resources.</p>
            <p>Facebook · Instagram</p>
            <a href="mailto:contact@vyapaarkit.com">contact@vyapaarkit.com</a>
          </article>
        </div>
      </section>

      <section className="about-cta about-reveal">
        <div className="about-container">
          <span>Start Building Today</span>
          <h2>Ready to Start Your Business Journey?</h2>
          <p>Every successful business starts with a clear plan. Someone is launching a new business today using a Vyapaarkit blueprint. Now it&apos;s your turn.</p>
          <a className="about-primary-button about-primary-button-light" href={`${basePath}/courses`}>Explore Business Kits</a>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
