import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import apiClient, { coursePdfApi, getAuthHeaders, PdfViewerManifest } from '../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfViewerProps {
  courseId: string;
}

type PdfDocument = Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;

const blockedKeys = new Set(['p', 's', 'u']);

const SecurePdfPage: React.FC<{
  pdfDocument: PdfDocument;
  pageNumber: number;
  watermarkText: string;
  onRendered: (pageNumber: number) => void;
}> = ({ pdfDocument, pageNumber, watermarkText, onRendered }) => {
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

        if (!cancelled) {
          onRendered(pageNumber);
        }
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
  }, [onRendered, pageNumber, pdfDocument]);

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

export const PdfViewer: React.FC<PdfViewerProps> = ({ courseId }) => {
  const [manifest, setManifest] = useState<PdfViewerManifest | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PdfDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shieldReason, setShieldReason] = useState('');
  const loggedPagesRef = useRef<Set<number>>(new Set());
  const shieldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const watermarkText = useMemo(() => {
    if (!manifest) return '';
    const { name, email, userId, issuedAt, courseName } = manifest.watermark;
    return `${name} | ${email} | ${userId} | ${courseName} | ${new Date(issuedAt).toLocaleString()} | ${courseId}`;
  }, [manifest, courseId]);

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

  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError('');
        const nextManifest = await coursePdfApi.getManifest(courseId);
        if (cancelled) return;

        setManifest(nextManifest);

        const baseUrl = String(apiClient.defaults.baseURL || window.location.origin);
        const streamUrl = new URL(nextManifest.pdf.streamUrl, baseUrl).toString();

        loadingTask = pdfjsLib.getDocument({
          url: streamUrl,
          httpHeaders: getAuthHeaders(),
          withCredentials: false,
          disableAutoFetch: true,
          disableRange: true,
          disableStream: true,
        });

        const document = await loadingTask.promise;
        if (!cancelled) {
          setPdfDocument(document);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Unable to open this protected PDF.');
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
  }, [courseId]);

  const handlePageRendered = React.useCallback((pageNumber: number) => {
    if (loggedPagesRef.current.has(pageNumber)) return;
    loggedPagesRef.current.add(pageNumber);
    coursePdfApi.logPageView(courseId, pageNumber).catch(() => {
      loggedPagesRef.current.delete(pageNumber);
    });
  }, [courseId]);

  if (loading) {
    return (
      <section className="secure-pdf-shell">
        <div className="secure-pdf-status">Opening protected course material...</div>
      </section>
    );
  }

  if (error || !manifest || !pdfDocument) {
    return (
      <section className="secure-pdf-shell">
        <div className="secure-pdf-error" role="alert">
          <h1>PDF unavailable</h1>
          <p>{error || 'You do not have access to this course material.'}</p>
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
            onRendered={handlePageRendered}
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

export default PdfViewer;
