'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { env } from '@/config/env';

interface CustomPDFViewerProps {
  src: string;
  className?: string;
}

export default function CustomPDFViewer({ src, className = '' }: CustomPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [pdfComponents, setPdfComponents] = useState<any>(null);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [useDirectLoad, setUseDirectLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate responsive width with immediate initialization
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        if (containerWidth > 0) {
          // Set appropriate width based on screen size
          // Mobile: full container width minus small padding
          // Desktop: max 900px
          const isMobile = window.innerWidth < 768;
          const padding = isMobile ? 20 : 40;
          const calculatedWidth = isMobile ? containerWidth - padding : Math.min(containerWidth - padding, 900);
          setPageWidth(calculatedWidth);
        }
      }
    };

    // Immediate initial calculation
    updateWidth();

    // Multiple delayed recalculations to ensure container is fully rendered
    const timer1 = setTimeout(updateWidth, 100);
    const timer2 = setTimeout(updateWidth, 300);

    window.addEventListener('resize', updateWidth);
    window.addEventListener('orientationchange', updateWidth);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('orientationchange', updateWidth);
    };
  }, []);

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
    setLoading(true);
  }, [src]);

  useEffect(() => {
    // Disable right-click globally when component is mounted
    const handleContextMenu = (e: MouseEvent) => {
      const container = containerRef.current;
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

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  // Don't render until components are loaded
  if (!mounted || !pdfComponents) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 text-sm">Loading PDF viewer...</p>
        </div>
      </div>
    );
  }

  const { Document, Page } = pdfComponents;

  return (
    <div
      ref={containerRef}
      className={`protected-content ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toast.error('⚠️ PDF content is protected');
        return false;
      }}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      {loading && (
        <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg border border-slate-200">
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
        className="flex flex-col items-center w-full"
      >
        {numPages > 0 && (
          <Page
            pageNumber={pageNumber}
            width={pageWidth || undefined}
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
                ref.style.maxWidth = '100%';
                ref.style.height = 'auto';
              }
            }}
          />
        )}
      </Document>

      {/* Navigation Controls */}
      {numPages > 0 && (
        <div className="flex items-center justify-between gap-2 sm:gap-3 mt-4 bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200 w-full max-w-full">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 bg-indigo-600 text-white rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition text-xs sm:text-sm font-medium min-h-[44px] min-w-[44px] flex-shrink-0"
          >
            <ChevronLeftIcon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center justify-center flex-1 min-w-0 px-1 sm:px-2">
            <span className="text-slate-700 font-medium text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">Page </span>{pageNumber} <span className="hidden sm:inline">of</span><span className="sm:hidden">/</span> {numPages}
            </span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 bg-indigo-600 text-white rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition text-xs sm:text-sm font-medium min-h-[44px] min-w-[44px] flex-shrink-0"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRightIcon className="w-5 h-5 flex-shrink-0" />
          </button>
        </div>
      )}

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
          max-width: 100% !important;
          height: auto !important;
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
