import React from 'react';

export interface CTASectionProps {
  title: string;
  buttonText: string;
  buttonLink: string;
  illustrationUrl?: string;
}

export const CTASection: React.FC<CTASectionProps> = ({
  title,
  buttonText,
  buttonLink,
  illustrationUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
}) => {
  return (
    <div className="elementor-element elementor-element-15a0cc1 e-flex e-con-boxed e-con e-parent">
      <div className="e-con-inner">
        <div 
          className="elementor-element elementor-element-a4dec13 e-con-full e-flex e-con e-child" 
          data-element_type="container"
          style={{ background: '#eaf4ff', borderRadius: '16px', overflow: 'hidden' }}
        >
          <div 
            className="elementor-element elementor-element-b509800 e-con-full e-flex e-con e-child"
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', padding: '40px' }}
          >
            {/* Text & Button Column */}
            <div className="elementor-element elementor-element-fec6fc0 e-con-full e-flex e-con e-child" style={{ flex: '1 1 400px' }}>
              <div className="elementor-element elementor-element-23d023a elementor-widget elementor-widget-jkit_heading">
                <div className="elementor-widget-container">
                  <div className="jeg-elementor-kit jkit-heading align- align-tablet-left align-mobile-center">
                    <div className="heading-section-title display-inline-block">
                      <h4 className="heading-title" style={{ fontSize: '28px', color: '#0b1220', fontWeight: 'bold', lineHeight: '1.4' }}>
                        {title}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="elementor-element elementor-element-3259d99 elementor-widget elementor-widget-button" style={{ marginTop: '20px' }}>
                <div className="elementor-widget-container">
                  <div className="elementor-button-wrapper">
                    <a className="elementor-button elementor-button-link elementor-size-sm" href={buttonLink}>
                      <span className="elementor-button-content-wrapper">
                        <span className="elementor-button-text">{buttonText}</span>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Illustration Graphic Column */}
            {illustrationUrl && (
              <div className="elementor-element elementor-element-549f5ec e-con-full e-flex e-con e-child" style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
                <div className="elementor-element elementor-element-ac4321e elementor-widget elementor-widget-image">
                  <div className="elementor-widget-container">
                    <img 
                      src={illustrationUrl} 
                      className="attachment-full size-full" 
                      alt="CTA Illustration" 
                      loading="lazy" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;
