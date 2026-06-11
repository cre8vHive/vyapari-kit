import React from 'react';
import heroBannerUrl from '../../assets/hero-banner.png';

export interface HeroSectionProps {
  headline: string;
  subheading?: string;
  backgroundType?: 'image' | 'gradient' | 'solid';
  backgroundValue?: string;
  primaryButton?: {
    text: string;
    link: string;
  };
  secondaryButton?: {
    text: string;
    link: string;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  headline,
  subheading,
  backgroundType = 'gradient',
  backgroundValue,
  primaryButton,
  secondaryButton,
}) => {
  const heroStyle: React.CSSProperties = {
    backgroundImage: `url(${backgroundType === 'image' && backgroundValue ? backgroundValue : heroBannerUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div className="elementor-element elementor-element-4fbeb70 e-flex e-con-boxed e-con e-parent">
      <div className="e-con-inner">
        <div className="elementor-element elementor-element-5fd5b9f elementor-widget elementor-widget-spacer">
          <div className="elementor-widget-container">
            <div className="elementor-spacer">
              <div className="elementor-spacer-inner"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="elementor-element elementor-element-a9afbb7 e-con-full e-flex e-con e-parent" 
        style={heroStyle}
        data-element_type="container"
      >
        <div className="elementor-element elementor-element-680904b e-flex e-con-boxed e-con e-child">
          <div className="e-con-inner">
            <div className="elementor-element elementor-element-a20064c e-con-full e-flex e-con e-child">
              {/* Headline */}
              <div className="elementor-element elementor-element-2529a31 elementor-widget elementor-widget-heading">
                <div className="elementor-widget-container">
                  <h2 className="elementor-heading-title elementor-size-default">
                    {headline}
                  </h2>
                </div>
              </div>

              {subheading && (
                <div className="elementor-element elementor-element-subheading elementor-widget elementor-widget-heading">
                  <div className="elementor-widget-container">
                    <h5 className="elementor-heading-title elementor-size-default" style={{ color: 'rgba(255, 255, 255, 0.88)' }}>
                      {subheading}
                    </h5>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="elementor-element elementor-element-5a24cb2 e-con-full e-flex e-con e-child">
                {primaryButton && (
                  <div className="elementor-element elementor-element-fa80f49 elementor-widget elementor-widget-button">
                    <div className="elementor-widget-container">
                      <div className="elementor-button-wrapper">
                        <a 
                          className="elementor-button elementor-button-link elementor-size-sm" 
                          href={primaryButton.link}
                        >
                          <span className="elementor-button-content-wrapper">
                            <span className="elementor-button-text">{primaryButton.text}</span>
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {secondaryButton && (
                  <div className="elementor-element elementor-element-861cb64 elementor-widget elementor-widget-button">
                    <div className="elementor-widget-container">
                      <div className="elementor-button-wrapper">
                        <a 
                          className="elementor-button elementor-button-link elementor-size-sm" 
                          href={secondaryButton.link}
                        >
                          <span className="elementor-button-content-wrapper">
                            <span className="elementor-button-text">{secondaryButton.text}</span>
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="elementor-element elementor-element-8d8b2d5 e-con-full e-flex e-con e-child">
              {/* Optional right-side graphic container */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
