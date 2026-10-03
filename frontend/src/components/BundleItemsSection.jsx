import React, { useState } from 'react';

const BundleItemsSection = ({ course }) => {
  const [expanded, setExpanded] = useState(false);

  const isBusinessInABox =
    course.isBusinessInABox ||
    course.packageType === 'business-in-the-box' ||
    course.slug?.includes('business-in-the-box');

  if (!isBusinessInABox) {
    return null;
  }

  const bundledTools = course.bundledTools || [];

  const cleanTitle = course.title
    .replace(/\s*\(Business in a Box Bundle\)/i, '')
    .replace(/\s*Business in a Box Bundle/i, '')
    .replace(/\s*-\s*Business in a Box/i, '')
    .replace(/\s*Business in a Box/i, '')
    .replace(/\s*Bundle/i, '')
    .trim();

  const basePlanTitle =
    course.basePlan?.title &&
    course.basePlan.title.toLowerCase().includes(cleanTitle.slice(0, 12).toLowerCase())
      ? course.basePlan.title
      : cleanTitle;

  const planValue = 399;
  const toolValue = 299;
  const totalToolsCount = bundledTools.length || 10;
  const totalOriginalValue = planValue + totalToolsCount * toolValue;

  const displayedTools = expanded ? bundledTools : bundledTools.slice(0, 6);

  return (
    <section className="bundle-items-section" aria-label="Bundle items included" style={{ marginBottom: '40px' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '2px solid #f59e0b',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              📦 ALL-IN-ONE BUNDLE BREAKDOWN
            </span>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', color: '#78350f', fontWeight: 800, lineHeight: 1.25 }}>
              Everything Included In This Box
            </h2>
            <p style={{ margin: 0, fontSize: '0.98rem', color: '#92400e', maxWidth: '720px', lineHeight: 1.5 }}>
              Purchasing this <strong>Business in a Box</strong> gives you the complete blueprint plus <strong>ALL {totalToolsCount}</strong> industry-specific playbooks, calculators, and operational tools in <strong>{course.category}</strong>.
            </p>
          </div>

          {/* Value Badge Box */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '14px 20px',
            border: '1px solid #fde68a',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)',
            minWidth: '180px'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700, letterSpacing: '0.5px' }}>
              Combined Value
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#94a3b8', textDecoration: 'line-through', margin: '2px 0' }}>
              ₹{totalOriginalValue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px' }}>
              You Pay Only {course.price?.current || '₹899'}
            </div>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(245, 158, 11, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#78350f' }}>
            <span style={{ color: '#059669', fontSize: '16px' }}>✓</span>
            <span>1 Master Business Blueprint</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#78350f' }}>
            <span style={{ color: '#059669', fontSize: '16px' }}>✓</span>
            <span>{totalToolsCount} Subcategory Tools & Playbooks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#78350f' }}>
            <span style={{ color: '#059669', fontSize: '16px' }}>✓</span>
            <span>Instant Digital Access to All Items</span>
          </div>
        </div>
      </div>

      {/* 2. Core Business Plan Item */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Item 1: Core Startup Blueprint
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '2px solid #3b82f6',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              📋
            </div>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Business Plan
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  in {course.category}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {basePlanTitle}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                Full India setup guide, legal registrations, financial models, vendor sourcing, and marketing blueprint.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹399</span>
            <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}>
              ✓ INCLUDED
            </span>
          </div>
        </div>
      </div>

      {/* 3. Included Tools & Playbooks List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
            Item 2 to {totalToolsCount + 1}: All {course.category} Business Tools & Playbooks ({totalToolsCount} Tools)
          </div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
            All Included Free in this Box
          </span>
        </div>

        {bundledTools.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '12px'
          }}>
            {displayedTools.map((tool, index) => (
              <div
                key={tool.id || index}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#0284c7',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    🛠️
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }} title={tool.title}>
                      {tool.title}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Playbook & Tool • {tool.difficulty || 'All Levels'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹299</span>
                  <span style={{ background: '#ecfdf5', color: '#059669', fontWeight: 800, fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
                    FREE
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            color: '#64748b',
            fontSize: '0.9rem'
          }}>
            All industry-specific playbooks and practical tools in the {course.category} category are automatically fulfilled upon purchase.
          </div>
        )}

        {bundledTools.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {expanded ? (
                <>Show Fewer Tools ▲</>
              ) : (
                <>View All {bundledTools.length} Included Tools ▼</>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BundleItemsSection;
