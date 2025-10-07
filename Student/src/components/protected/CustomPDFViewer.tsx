'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

interface CustomPDFViewerProps {
  src: string;
  className?: string;
}

export default function CustomPDFViewer({ src, className = '' }: CustomPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Proxy PDF URL through backend to avoid CORS issues
  const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/student/proxy/pdf?url=${encodeURIComponent(src)}`;

  // Memoize options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/standard_fonts/',
  }), []);

  // Calculate responsive width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Set max width for PDF, with padding
        setPageWidth(Math.min(width - 40, 900));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, [mounted]);

  // Initialize PDF.js worker on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-pdf').then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      });
      setMounted(true);
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
    console.error('Error loading PDF:', error);
    toast.error('Failed to load PDF');
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  // Don't render until client-side is mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-center h-96 bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}

      <Document
        file={proxyUrl}
        options={pdfOptions}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading=""
        className="flex flex-col items-center w-full"
      >
        <Page
          pageNumber={pageNumber}
          width={pageWidth || undefined}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="shadow-lg !max-w-full"
          canvasRef={(ref) => {
            if (ref) {
              // Disable right-click on canvas
              ref.oncontextmenu = (e) => {
                e.preventDefault();
                toast.error('⚠️ PDF content is protected');
                return false;
              };
              // Disable dragging
              ref.ondragstart = (e) => {
                e.preventDefault();
                return false;
              };
              // Make canvas non-selectable
              ref.style.userSelect = 'none';
              ref.style.webkitUserSelect = 'none';
              ref.style.maxWidth = '100%';
              ref.style.height = 'auto';
            }
          }}
        />
      </Document>

      {/* Navigation Controls */}
      {numPages > 0 && (
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-4 bg-white p-3 sm:p-4 rounded-lg shadow flex-wrap">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition text-sm sm:text-base"
          >
            <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <span className="text-gray-700 font-medium text-sm sm:text-base whitespace-nowrap">
            Page {pageNumber} of {numPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition text-sm sm:text-base"
          >
            <span className="sm:hidden">Next</span>
            <span className="hidden sm:inline">Next</span>
            <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      <style jsx global>{`
        .react-pdf__Page {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
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
