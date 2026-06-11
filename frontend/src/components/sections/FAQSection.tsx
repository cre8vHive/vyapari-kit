import React, { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  sectionTitle?: string;
  items: FAQItem[];
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  sectionTitle = "Frequently Asked Questions",
  items,
}) => {
  // Track open state for individual items
  const [openIndexes, setOpenIndexes] = useState<Record<number, boolean>>({});

  const toggleIndex = (index: number) => {
    setOpenIndexes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="elementor-element elementor-element-faq-section e-flex e-con-boxed e-con e-parent" style={{ margin: '40px 0' }}>
      <div className="e-con-inner">
        {sectionTitle && (
          <div className="elementor-element elementor-widget elementor-widget-heading" style={{ marginBottom: '25px', width: '100%' }}>
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default" style={{ color: '#0b1220', fontSize: '28px', margin: 0 }}>
                {sectionTitle}
              </h2>
            </div>
          </div>
        )}

        <div className="elementor-element elementor-widget elementor-widget-jkit_accordion" style={{ width: '100%' }}>
          <div className="elementor-widget-container">
            <div className="jeg-elementor-kit jkit-accordion style-default">
              {items.map((item, index) => {
                const isOpen = !!openIndexes[index];
                return (
                  <div key={index} className={`card-wrapper ${isOpen ? 'active' : ''}`} style={{ marginBottom: '15px', background: '#ffffff', borderRadius: '8px', border: '1px solid #dbe7f5', boxShadow: '0 12px 28px rgba(15, 52, 92, 0.06)' }}>
                    <div className="card-header" style={{ padding: '15px 20px', cursor: 'pointer' }} onClick={() => toggleIndex(index)}>
                      <a 
                        href={`#expand-${index}`} 
                        className="card-header-button" 
                        aria-expanded={isOpen}
                        onClick={(e) => e.preventDefault()}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textDecoration: 'none', color: '#0b1220' }}
                      >
                        <span className="title" style={{ fontWeight: '600', fontSize: '16px' }}>{item.question}</span>
                        <div className="right-icon-group" style={{ fontSize: '14px', color: '#0b7cff' }}>
                          <i aria-hidden="true" className={`jki ${isOpen ? 'jki-up-arrow1-light' : 'jki-down-arrow1-light'}`}></i>
                        </div>
                      </a>
                    </div>
                    
                    {isOpen && (
                      <div className="card-expand" id={`expand-${index}`} style={{ borderTop: '1px solid #dbe7f5' }}>
                        <div className="card-body" style={{ padding: '20px', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: item.answer }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
