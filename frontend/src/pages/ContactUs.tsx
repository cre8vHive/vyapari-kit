import React, { FormEvent, useEffect, useRef, useState } from 'react';

type ContactFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ContactErrors = Partial<Record<keyof ContactFields, string>>;

const initialFields: ContactFields = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const contactReasons = [
  'Questions about our Business Plan PDFs',
  'Help choosing the right business category',
  'Product purchase assistance',
  'Download or access support',
  'General business plan inquiries',
  'Partnership and collaboration opportunities',
  'Feedback and suggestions',
];

const supportPoints = [
  'Which business category best matches your goals',
  'What each business plan includes',
  'How to access your purchased digital products',
  'General information about our business guides',
];

const socialChannels = ['Facebook', 'Instagram', 'YouTube', 'LinkedIn'];

function validateContactForm(fields: ContactFields): ContactErrors {
  const errors: ContactErrors = {};
  if (!fields.firstName.trim()) errors.firstName = 'First name is required.';
  if (!fields.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = 'Enter a valid email address.';
  if (!/^[+()\d\s-]{7,20}$/.test(fields.phone.trim())) errors.phone = 'Enter a valid phone number.';
  if (!fields.subject.trim()) errors.subject = 'Subject is required.';
  if (fields.message.trim().length < 10) errors.message = 'Please provide at least 10 characters.';
  return errors;
}

const ContactUs: React.FC = () => {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const formRef = useRef<HTMLDivElement>(null);
  const [fields, setFields] = useState<ContactFields>(initialFields);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    document.title = 'Contact Us | Vyapaar Kit';
    const description = 'Contact Vyapaarkit for help with business plan PDFs, purchases, downloads, business inquiries, partnerships, and feedback.';
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
    setMeta('meta[property="og:title"]', 'property', 'og:title', 'Contact Us | Vyapaar Kit');
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  }, []);

  const updateField = (field: keyof ContactFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus('idle');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateContactForm(fields);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStatus('error');
      return;
    }

    // API integration point: replace this success state with the contact endpoint when available.
    setStatus('success');
    setFields(initialFields);
    setErrors({});
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="contact-page">
      <section className="contact-hero about-reveal">
        <div className="about-container">
          <nav className="course-breadcrumbs" aria-label="Breadcrumb">
            <a href={`${basePath}/`}>Home</a><span>/</span><span>Contact Us</span>
          </nav>
          <span className="about-eyebrow">Get in Touch with Vyapaarkit</span>
          <h1>Contact Us</h1>
          <p>Have questions before starting your business journey? We&apos;re here to help.</p>
          <p className="contact-hero-description">
            Whether you&apos;re choosing the right business plan, need help understanding one of our business kits,
            or have questions before purchasing, our team is ready to assist you.
          </p>
          <div className="contact-hero-actions">
            <button className="about-primary-button" type="button" onClick={scrollToForm}>Contact Support</button>
            <a className="contact-secondary-button" href={`${basePath}/courses`}>Explore Business Kits</a>
          </div>
        </div>
      </section>

      <section className="contact-info-strip about-reveal">
        <div className="about-container contact-info-grid">
          <a className="contact-info-card" href="mailto:contact@vyapaarkit.com">
            <span aria-hidden="true">@</span><div><small>Email</small><strong>contact@vyapaarkit.com</strong></div>
          </a>
          <article className="contact-info-card">
            <span aria-hidden="true">✓</span><div><small>Business Support</small><strong>Professional Assistance</strong></div>
          </article>
          <article className="contact-info-card">
            <span aria-hidden="true">↗</span><div><small>Response Time</small><strong>Quick Response</strong></div>
          </article>
        </div>
      </section>

      <section className="about-section about-reveal" ref={formRef}>
        <div className="about-container contact-form-layout">
          <div className="contact-form-copy">
            <span className="about-section-number">SEND US A MESSAGE</span>
            <h2>Let&apos;s Build Your Business with Confidence</h2>
            <p>
              Starting a business can feel overwhelming when you don&apos;t know where to begin. Our execution-ready
              business plans are designed to simplify the process, but if you still need guidance, we&apos;re happy
              to point you in the right direction.
            </p>
            <p>Fill out the contact form, and our team will get back to you as soon as possible.</p>
          </div>
          <form className="contact-form-card" onSubmit={handleSubmit} noValidate>
            <div className="contact-form-grid">
              {([
                ['firstName', 'First Name', 'text'],
                ['lastName', 'Last Name', 'text'],
                ['email', 'Email Address', 'email'],
                ['phone', 'Phone Number', 'tel'],
              ] as Array<[keyof ContactFields, string, string]>).map(([field, label, type]) => (
                <label className="contact-field" key={field}>
                  <span>{label}</span>
                  <input
                    type={type}
                    value={fields[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    aria-invalid={Boolean(errors[field])}
                    aria-describedby={errors[field] ? `${field}-error` : undefined}
                  />
                  {errors[field] && <small id={`${field}-error`} className="contact-field-error">{errors[field]}</small>}
                </label>
              ))}
              <label className="contact-field contact-field-full">
                <span>Subject</span>
                <input
                  type="text"
                  value={fields.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  aria-invalid={Boolean(errors.subject)}
                />
                {errors.subject && <small className="contact-field-error">{errors.subject}</small>}
              </label>
              <label className="contact-field contact-field-full">
                <span>Your Message</span>
                <textarea
                  rows={6}
                  value={fields.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message && <small className="contact-field-error">{errors.message}</small>}
              </label>
            </div>
            {status === 'error' && <div className="contact-form-message error" role="alert">Please correct the highlighted fields.</div>}
            {status === 'success' && <div className="contact-form-message success" role="status">Your message has been submitted successfully.</div>}
            <button className="about-primary-button contact-submit" type="submit">Submit</button>
          </form>
        </div>
      </section>

      <section className="about-section about-section-tint about-reveal">
        <div className="about-container">
          <span className="about-section-number">WHY CONTACT VYAPAARKIT?</span>
          <h2>Practical Information and Reliable Support</h2>
          <p className="about-section-copy">
            We understand that starting a business is an important decision. Our goal is to help you make informed
            choices by providing practical business information and reliable support whenever you need it.
          </p>
          <div className="about-card-grid contact-reason-grid">
            {contactReasons.map((reason) => <article className="about-card contact-reason-card" key={reason}><span>✓</span>{reason}</article>)}
          </div>
          <p className="about-closing-line">
            Whether you&apos;re exploring your first business idea or expanding into a new opportunity, we&apos;re
            here to assist you throughout your journey.
          </p>
        </div>
      </section>

      <section className="about-section contact-support-section about-reveal">
        <div className="about-container contact-support-layout">
          <div>
            <span className="about-section-number">BUSINESS SUPPORT</span>
            <h2>Need help selecting the right business plan?</h2>
            <p className="about-section-copy">Our team can help you understand:</p>
          </div>
          <div className="contact-support-grid">
            {supportPoints.map((point) => <article className="about-card contact-support-card" key={point}>{point}</article>)}
          </div>
        </div>
        <div className="about-container">
          <p className="contact-advice-note">
            Please note that we provide support related to our products and services. We do not offer legal,
            financial, or investment advice.
          </p>
        </div>
      </section>

      <section className="about-section about-section-dark about-reveal">
        <div className="about-container contact-response-layout">
          <div>
            <span className="about-section-number">RESPONSE TIME</span>
            <h2>Helpful Support</h2>
          </div>
          <div>
            <p>We aim to respond to all inquiries as quickly as possible during our business hours.</p>
            <p>For faster assistance, please include as much detail as possible when submitting your message.</p>
          </div>
        </div>
      </section>

      <section className="about-section about-reveal">
        <div className="about-container contact-social-layout">
          <div>
            <span className="about-section-number">FOLLOW US</span>
            <h2>Stay Connected</h2>
            <p className="about-section-copy">Stay connected with us for the latest business opportunities, updates, and new product launches.</p>
          </div>
          <div className="contact-social-grid">
            {socialChannels.map((channel) => <a href="#" aria-label={channel} key={channel}><span aria-hidden="true">{channel.charAt(0)}</span>{channel}</a>)}
          </div>
        </div>
      </section>

      <section className="about-section about-section-tint about-reveal">
        <div className="about-container contact-commitment">
          <span className="about-section-number">OUR COMMITMENT</span>
          <h2>Every Message Matters</h2>
          <p>
            At Vyapaarkit, we are committed to providing practical, transparent, and reliable business resources
            that help entrepreneurs make better decisions.
          </p>
          <strong>Every message matters to us, and we appreciate the opportunity to support your business journey.</strong>
        </div>
      </section>

      <section className="about-section contact-map-section about-reveal">
        <div className="about-container">
          <span className="about-section-number">FIND US</span>
          <h2>Find Us</h2>
          {/* Replace this accessible placeholder with the approved Google Maps embed when a location is provided. */}
          <div className="contact-map-placeholder" role="img" aria-label="Google Maps location placeholder">
            <span>+</span><strong>Google Maps</strong><small>Location placeholder</small>
          </div>
        </div>
      </section>

      <section className="about-cta about-reveal">
        <div className="about-container">
          <span>LET&apos;S BUILD YOUR BUSINESS WITH CONFIDENCE</span>
          <h2>Ready to Start Your Business Journey?</h2>
          <p>Every successful business starts with the right information.</p>
          <a className="about-primary-button about-primary-button-light" href={`${basePath}/courses`}>Explore Business Kits</a>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
