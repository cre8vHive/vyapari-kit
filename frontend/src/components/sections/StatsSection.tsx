import React from 'react';

export interface StatItem {
  number: string;
  label: string;
  iconUrl?: string;
}

export interface StatsSectionProps {
  items: StatItem[];
  columnsCount?: number; // 2 | 3 | 4
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  items,
  columnsCount = 4,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="elementor-element elementor-element-stats-section e-flex e-con-boxed e-con e-parent" style={{ margin: '40px 0' }}>
      <div className="e-con-inner">
        <div 
          className="stats-grid-container" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, 
            gap: '20px', 
            width: '100%' 
          }}
        >
          {items.map((item, index) => (
            <div 
              key={index} 
              className="stat-box-item elementor-widget" 
              style={{ 
                background: '#ffffff', 
                borderRadius: '12px', 
                padding: '30px 20px', 
                textAlign: 'center',
                border: '1px solid #dbe7f5',
                boxShadow: '0 18px 38px rgba(15, 52, 92, 0.08)'
              }}
            >
              <div className="elementor-widget-container">
                <div className="jeg-elementor-kit jkit-fun-fact">
                  {item.iconUrl && (
                    <div className="icon-wrapper" style={{ marginBottom: '15px' }}>
                      <img 
                        src={item.iconUrl} 
                        alt={item.label} 
                        style={{ width: '45px', height: '45px', objectFit: 'contain' }} 
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="number-wrapper" style={{ fontSize: '36px', fontWeight: 'bold', color: '#0b7cff', marginBottom: '10px' }}>
                    {item.number}
                  </div>
                  <div className="label-wrapper" style={{ fontSize: '15px', color: '#4b5563', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.label}
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

export default StatsSection;
