import React from 'react';

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  reviewText: string;
  avatarUrl: string;
  rating: number;
}

export interface TestimonialsSectionProps {
  sectionTitle?: string;
  testimonials: TestimonialItem[];
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  sectionTitle = "What Our Students Say",
  testimonials,
}) => {
  return (
    <div className="elementor-element e-flex e-con-boxed e-con e-parent testimonials-section-wrapper">
      <div className="e-con-inner">
        {sectionTitle && (
          <div className="elementor-element elementor-widget elementor-widget-heading" style={{ width: '100%', textAlign: 'center', marginBottom: '30px' }}>
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">{sectionTitle}</h2>
            </div>
          </div>
        )}

        <div className="testimonials-slider-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', width: '100%' }}>
          {testimonials.map((test, index) => (
            <div 
              key={test.id || index}
              className="testimonial-item elementor-repeater-item-b15e91d"
              style={{ background: '#1F233E', borderRadius: '12px', padding: '24px' }}
            >
              <div className="testimonial-box">
                <div className="testimonial-slider hover-from-left">
                  
                  {/* Bio details */}
                  <div className="comment-bio" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <div className="profile-image">
                      <img 
                        src={test.avatarUrl} 
                        className="source-url" 
                        alt={test.name} 
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <span className="profile-info" style={{ display: 'block' }}>
                        <strong className="profile-name" style={{ color: '#fff', fontSize: '16px' }}>{test.name}</strong>
                        <p className="profile-des" style={{ margin: 0, opacity: 0.7, fontSize: '13px' }}>{test.role}</p>
                      </span>
                      {/* Star Rating list */}
                      <ul className="rating-stars" style={{ display: 'flex', listStyle: 'none', padding: 0, margin: '5px 0 0 0', gap: '2px', color: '#ffc107' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <li key={i}>
                            <i aria-hidden="true" className={`jki jki-star-${i < test.rating ? 'solid' : 'light'}`}></i>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Comment text */}
                  <div className="comment-content">
                    <p style={{ fontStyle: 'italic', margin: 0, opacity: 0.9, color: '#eee', lineHeight: '1.6' }}>
                      "{test.reviewText}"
                    </p>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TestimonialsSection;
