import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import apiClient, { guestAccessApi, PdfViewerManifest } from '../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface GuestCourseAccessProps {
  accessToken: string;
}

type PdfDocument = Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;

const blockedKeys = new Set(['p', 's', 'u']);

const SecurePdfPage: React.FC<{
  pdfDocument: PdfDocument;
  pageNumber: number;
  watermarkText: string;
}> = ({ pdfDocument, pageNumber, watermarkText }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderError, setRenderError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 1.45 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

        renderTask = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
      } catch (error: any) {
        if (!cancelled && error?.name !== 'RenderingCancelledException') {
          setRenderError('This page could not be rendered.');
        }
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pageNumber, pdfDocument]);

  return (
    <section className="secure-pdf-page" aria-label={`Page ${pageNumber}`}>
      {renderError ? (
        <div className="secure-pdf-page-error">{renderError}</div>
      ) : (
        <>
          <canvas ref={canvasRef} className="secure-pdf-canvas" />
          <div className="secure-pdf-watermark" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => (
              <span key={index}>{watermarkText}</span>
            ))}
          </div>
        </>
      )}
      <div className="secure-pdf-page-number">Page {pageNumber}</div>
    </section>
  );
};

const LOADING_QUOTES = [
  "📖 Preparing your course material...",
  "🔐 Verifying access...",
  "📄 Loading secure content...",
  "✨ Almost ready...",
];

export const GuestCourseAccess: React.FC<GuestCourseAccessProps> = ({ accessToken }) => {
  const [manifest, setManifest] = useState<PdfViewerManifest | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PdfDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shieldReason, setShieldReason] = useState('');
  const shieldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const watermarkText = useMemo(() => {
    if (!manifest) return '';
    const { name, email, userId, issuedAt, courseName } = manifest.watermark;
    return `${name} | ${email} | ${userId} | ${courseName} | ${new Date(issuedAt).toLocaleString()}`;
  }, [manifest]);

  // Security protections
  useEffect(() => {
    const preventDefault = (event: Event) => event.preventDefault();
    const activateTemporaryShield = (reason: string) => {
      setShieldReason(reason);
      if (shieldTimerRef.current) {
        clearTimeout(shieldTimerRef.current);
      }
      shieldTimerRef.current = setTimeout(() => {
        if (document.visibilityState === 'visible' && document.hasFocus()) {
          setShieldReason('');
        }
      }, 4500);
    };
    const preventKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && blockedKeys.has(key)) {
        event.preventDefault();
      }
      if (key === 'printscreen') {
        event.preventDefault();
        activateTemporaryShield('Screen capture attempt detected. Protected material is hidden temporarily.');
      }
    };
    const handleBlur = () => setShieldReason('Protected material is hidden while this window is not active.');
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        setShieldReason('');
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setShieldReason('Protected material is hidden while this tab is not visible.');
      } else if (document.hasFocus()) {
        setShieldReason('');
      }
    };

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('keydown', preventKeys);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeprint', preventDefault);

    return () => {
      if (shieldTimerRef.current) {
        clearTimeout(shieldTimerRef.current);
      }
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('keydown', preventKeys);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeprint', preventDefault);
    };
  }, []);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError('');
        const nextManifest = await guestAccessApi.getManifest(accessToken);
        if (cancelled) return;

        setManifest(nextManifest);

        const baseUrl = String(apiClient.defaults.baseURL || window.location.origin);
        const streamUrl = new URL(nextManifest.pdf.streamUrl, baseUrl).toString();

        loadingTask = pdfjsLib.getDocument({
          url: streamUrl,
          withCredentials: false,
          disableAutoFetch: true,
          disableRange: true,
          disableStream: true,
        });

        const doc = await loadingTask.promise;
        if (!cancelled) {
          setPdfDocument(doc);
        }
      } catch (err: any) {
        if (!cancelled) {
          let errorMessage = err.response?.data?.message || err.message || 'Unable to access this course material.';
          if (errorMessage.includes('Unexpected server response')) {
            errorMessage = 'The secure PDF could not be loaded at this time. Please check your connection or try again later.';
          }
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPdf();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [accessToken]);

  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setQuoteIndex(Math.floor(Math.random() * LOADING_QUOTES.length));
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <section className="secure-pdf-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ position: 'relative', width: '64px', height: '64px' }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid #e5e7eb', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#111827', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Opening protected material...</h3>
            <p style={{ color: '#6b7280', fontSize: '1rem', fontStyle: 'italic', transition: 'opacity 0.5s ease-in-out' }}>
              "{LOADING_QUOTES[quoteIndex]}"
            </p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </section>
    );
  }

  if (error || !manifest || !pdfDocument) {
    return (
      <section className="secure-pdf-shell">
        <div className="secure-pdf-error" role="alert" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1.5rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h1>Access Unavailable</h1>
          <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>{error || 'This access link is invalid or has been revoked.'}</p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/courses" className="btn btn-primary" style={{ textDecoration: 'none' }}>Browse Courses</a>
            <a href="/contact-us" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Contact Support</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="secure-pdf-shell" onContextMenu={(event) => event.preventDefault()}>
      <header className="secure-pdf-toolbar">
        <div>
          <span className="secure-pdf-kicker">Protected material</span>
          <h1>{manifest.course.title}</h1>
        </div>
        <div className="secure-pdf-meta">
          <span>{pdfDocument.numPages} pages</span>
          <span>{manifest.pdf.filename}</span>
        </div>
      </header>

      <div className="secure-pdf-pages" aria-label="Protected PDF pages">
        {Array.from({ length: pdfDocument.numPages }).map((_, index) => (
          <SecurePdfPage
            key={index + 1}
            pdfDocument={pdfDocument}
            pageNumber={index + 1}
            watermarkText={watermarkText}
          />
        ))}
      </div>
      {shieldReason && (
        <div className="secure-pdf-privacy-shield" role="alert">
          <div>
            <h2>Protected View Paused</h2>
            <p>{shieldReason}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default GuestCourseAccess;
