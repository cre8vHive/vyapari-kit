import React, { Component, ErrorInfo, ReactNode } from 'react';
import SectionRegistry from './sections/SectionRegistry';

// Section level skeleton loading placeholder
const SectionSkeleton: React.FC<{ type: string }> = ({ type }) => {
  return (
    <div 
      className="section-skeleton-placeholder" 
      style={{ 
        padding: '50px 20px', 
        textAlign: 'center', 
        background: '#1F233E', 
        borderRadius: '8px', 
        color: 'rgba(255,255,255,0.4)',
        margin: '20px 0',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px dashed rgba(255,255,255,0.1)'
      }}
    >
      <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeft: '4px solid #4caf50', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', marginBottom: '10px' }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <span>Loading {type.toUpperCase()} block...</span>
    </div>
  );
};

// Error Boundary for isolating section-level javascript crashes
interface ErrorBoundaryProps {
  children: ReactNode;
  sectionType: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in section '${this.props.sectionType}':`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // In production, we gracefully hide it, but in dev/staging we show a fallback container
      const isDev = import.meta.env.DEV;
      
      if (!isDev) {
        return null; // Gracefully degrade by returning nothing
      }

      return (
        <div 
          className="section-error-fallback" 
          style={{ 
            padding: '20px', 
            background: '#3a1f28', 
            border: '2px solid #cf2e2e', 
            borderRadius: '8px', 
            color: '#ffcdd2',
            margin: '20px 0'
          }}
        >
          <h4 style={{ margin: '0 0 10px 0' }}>Error Rendering Section: '{this.props.sectionType}'</h4>
          <p style={{ margin: 0, fontSize: '13px' }}>A runtime error occurred in this section component. Check browser console logs for details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback component for unregistered section types
const FallbackDebugSection: React.FC<{ type: string; config: any }> = ({ type, config }) => {
  const isDev = import.meta.env.DEV;

  if (!isDev) {
    console.warn(`Ignoring unregistered section type: '${type}' in production.`);
    return null;
  }

  return (
    <div 
      className="fallback-debug-section" 
      style={{ 
        padding: '30px 20px', 
        background: '#2b2a24', 
        border: '2px dashed #fcb900', 
        borderRadius: '8px', 
        color: '#ffe082',
        margin: '20px 0',
        fontFamily: 'monospace'
      }}
    >
      <h4 style={{ margin: '0 0 10px 0', color: '#fcb900' }}>⚠️ Debug: Unregistered Section Type '{type}'</h4>
      <p style={{ margin: '0 0 15px 0', fontSize: '13px' }}>This component does not exist in the React Section Registry yet. Code must be deployed to support it.</p>
      <details>
        <summary style={{ cursor: 'pointer', fontSize: '13px' }}>View Configuration Payload</summary>
        <pre style={{ margin: '10px 0 0 0', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px', overflowX: 'auto' }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export interface PageSectionData {
  type: string;
  order: number;
  config: any;
}

export interface PageRendererProps {
  sections: PageSectionData[];
  pageTitle?: string;
}

export const PageRenderer: React.FC<PageRendererProps> = ({
  sections,
}) => {
  if (!sections || sections.length === 0) {
    return (
      <div className="empty-page-placeholder" style={{ padding: '60px 20px', textAlign: 'center', background: '#191B2E', color: '#fff' }}>
        <p>No content sections configured for this page.</p>
      </div>
    );
  }

  // Sort sections dynamically based on their configured order index
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="page-renderer-container">
      {sortedSections.map((section, index) => {
        const SectionComponent = SectionRegistry[section.type];

        if (!SectionComponent) {
          return (
            <FallbackDebugSection 
              key={`fallback-${index}`} 
              type={section.type} 
              config={section.config} 
            />
          );
        }

        return (
          <SectionErrorBoundary 
            key={`section-${section.type}-${index}`} 
            sectionType={section.type}
          >
            <React.Suspense fallback={<SectionSkeleton type={section.type} />}>
              <SectionComponent {...section.config} />
            </React.Suspense>
          </SectionErrorBoundary>
        );
      })}
    </div>
  );
};

export default PageRenderer;
