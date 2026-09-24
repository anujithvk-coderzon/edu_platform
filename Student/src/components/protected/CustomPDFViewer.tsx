'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowsRightLeftIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { env } from '@/config/env';

interface CustomPDFViewerProps {
  src: string;
  className?: string;
}

/** Gutter around the rendered page inside the scroll viewport. */
const GUTTER = 32;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

type FitMode = 'page' | 'width';

export default function CustomPDFViewer({ src, className = '' }: CustomPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [pdfComponents, setPdfComponents] = useState<any>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [fitMode, setFitMode] = useState<FitMode>('page');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Proxy PDF URL through backend to avoid CORS issues
  // Memoize with src dependency to only change when PDF source changes
  const proxyUrl = useMemo(() =>
    `${env.API_BASE_URL}/student/proxy/pdf?url=${encodeURIComponent(src)}&t=${Date.now()}`,
    [src]
  );

  // Memoize options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/standard_fonts/',
  }), []);

  // Track the size of the scrolling viewport so the page can be fitted to it
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const measure = () => {
      setViewport({ width: element.clientWidth, height: element.clientHeight });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('orientationchange', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, [mounted]);

  // Initialize PDF.js worker and components on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-pdf').then((pdfModule) => {
        // Configure worker
        pdfModule.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

        // Wait for worker to be ready
        setTimeout(() => {
          setPdfComponents({
            Document: pdfModule.Document,
            Page: pdfModule.Page,
          });
          setMounted(true);
        }, 1000);
      });
    }
  }, []);

  // Reset page number when PDF source changes
  useEffect(() => {
    setPageNumber(1);
    setNumPages(0);
    setPageSize(null);
    setZoom(1);
    setLoading(true);
  }, [src]);

  useEffect(() => {
    // Disable right-click globally when component is mounted
    const handleContextMenu = (e: MouseEvent) => {
      const container = rootRef.current;
      if (container && container.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('⚠️ PDF content is protected');
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  // Keep local state in sync when the user leaves fullscreen with Esc
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
    viewportRef.current?.scrollTo({ top: 0 });
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => (numPages ? Math.min(prev + 1, numPages) : prev));
    viewportRef.current?.scrollTo({ top: 0 });
  }, [numPages]);

  // Arrow keys turn pages while the viewer has focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root || !root.contains(document.activeElement) && document.fullscreenElement !== root) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevPage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF Load Error:', error);
    console.error('Proxy URL:', proxyUrl);
    console.error('Original src:', src);
    toast.error('Failed to load PDF. Please check your connection.');
    setLoading(false);
  }

  // Capture the page's natural dimensions so it can be fitted to the viewport
  const onPageLoadSuccess = useCallback((page: any) => {
    try {
      const { width, height } = page.getViewport({ scale: 1 });
      setPageSize((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height }
      );
    } catch {
      // Fall back to width-only sizing if dimensions are unavailable
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const root = rootRef.current;
    if (!root) return;

    try {
      if (document.fullscreenElement === root) {
        await document.exitFullscreen();
      } else {
        await root.requestFullscreen();
      }
    } catch {
      toast.error('Fullscreen is not available in this browser');
    }
  }, []);

  // Width the page should be rendered at, honouring fit mode and zoom
  const renderWidth = useMemo(() => {
    const availableWidth = viewport.width - GUTTER;
    if (availableWidth <= 0) return 0;

    // Without natural dimensions we can only fit by width
    if (!pageSize) return availableWidth * zoom;

    const availableHeight = viewport.height - GUTTER;
    const widthScale = availableWidth / pageSize.width;
    const heightScale = availableHeight > 0 ? availableHeight / pageSize.height : widthScale;

    const baseScale = fitMode === 'page' ? Math.min(widthScale, heightScale) : widthScale;

    return pageSize.width * baseScale * zoom;
  }, [viewport, pageSize, fitMode, zoom]);

  const zoomIn = () => setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(2), MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(+(z - ZOOM_STEP).toFixed(2), MIN_ZOOM));

  const toggleFitMode = () => {
    setFitMode((mode) => (mode === 'page' ? 'width' : 'page'));
    setZoom(1);
  };

  // Don't render until components are loaded
  if (!mounted || !pdfComponents) {
    return (
      <div className={`flex items-center justify-center h-full min-h-[320px] bg-slate-50 rounded-lg border border-slate-200 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 text-sm">Loading PDF viewer...</p>
        </div>
      </div>
    );
  }

  const { Document, Page } = pdfComponents;

  const toolbarButton =
    'flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition h-10 w-10 flex-shrink-0';

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className={`protected-content flex flex-col min-h-0 bg-slate-100 outline-none ${isFullscreen ? 'h-screen' : ''} ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toast.error('⚠️ PDF content is protected');
        return false;
      }}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      {/* Sticky toolbar — stays reachable no matter how tall the page renders */}
      <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 bg-white border-b border-slate-200 px-2 sm:px-3 py-2">
        <button
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
          aria-label="Previous page"
          className={toolbarButton}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <span className="text-slate-700 font-medium text-xs sm:text-sm whitespace-nowrap tabular-nums px-1">
          {numPages ? (
            <>
              <span className="hidden sm:inline">Page </span>
              {pageNumber}
              <span className="hidden sm:inline"> of </span>
              <span className="sm:hidden">/</span>
              {numPages}
            </>
          ) : (
            '—'
          )}
        </span>

        <button
          onClick={goToNextPage}
          disabled={!numPages || pageNumber >= numPages}
          aria-label="Next page"
          className={toolbarButton}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" className={toolbarButton}>
          <MagnifyingGlassMinusIcon className="w-5 h-5" />
        </button>

        <span className="hidden sm:inline text-xs text-slate-600 font-medium tabular-nums w-11 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" className={toolbarButton}>
          <MagnifyingGlassPlusIcon className="w-5 h-5" />
        </button>

        <button
          onClick={toggleFitMode}
          aria-label={fitMode === 'page' ? 'Fit to width' : 'Fit whole page'}
          title={fitMode === 'page' ? 'Fit to width' : 'Fit whole page'}
          className={toolbarButton}
        >
          {fitMode === 'page' ? (
            <ArrowsRightLeftIcon className="w-5 h-5" />
          ) : (
            <DocumentIcon className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className={toolbarButton}
        >
          {isFullscreen ? (
            <ArrowsPointingInIcon className="w-5 h-5" />
          ) : (
            <ArrowsPointingOutIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Page viewport — the page is sized to fit this box */}
      <div
        ref={viewportRef}
        className="flex-1 min-h-0 overflow-auto flex items-start justify-center p-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading && (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-slate-600 text-sm">Loading PDF...</p>
            </div>
          </div>
        )}

        <Document
          key={src}
          file={proxyUrl}
          options={pdfOptions}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          className="flex flex-col items-center"
        >
          {numPages > 0 && renderWidth > 0 && (
            <Page
              pageNumber={pageNumber}
              width={renderWidth}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
              canvasRef={(ref: HTMLCanvasElement | null) => {
                if (ref) {
                  ref.oncontextmenu = (e) => {
                    e.preventDefault();
                    toast.error('⚠️ PDF content is protected');
                    return false;
                  };
                  ref.ondragstart = (e) => {
                    e.preventDefault();
                    return false;
                  };
                  ref.style.userSelect = 'none';
                  ref.style.webkitUserSelect = 'none';
                }
              }}
            />
          )}
        </Document>
      </div>

      <style jsx global>{`
        .react-pdf__Page {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .react-pdf__Page__canvas {
          user-select: none !important;
          -webkit-user-select: none !important;
          pointer-events: auto !important;
        }

        .react-pdf__Page__textContent {
          user-select: none !important;
          -webkit-user-select: none !important;
        }

        .react-pdf__Page__annotations {
          user-select: none !important;
          -webkit-user-select: none !important;
        }
      `}</style>
    </div>
  );
}
