'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import '../../styles/materialProtection.css';

interface ProtectedPDFProps {
  src: string;
  className?: string;
}

export default function ProtectedPDF({
  src,
  className = ''
}: ProtectedPDFProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('⚠️ PDF content is protected');
      return false;
    };

    container.addEventListener('contextmenu', handleContextMenu);

    // Disable right-click on the entire document when PDF is focused
    const disableContextMenuGlobally = (e: MouseEvent) => {
      if (document.activeElement === iframeRef.current) {
        e.preventDefault();
        toast.error('⚠️ PDF content is protected');
        return false;
      }
    };

    document.addEventListener('contextmenu', disableContextMenuGlobally);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('contextmenu', disableContextMenuGlobally);
    };
  }, []);

  // Add parameters to PDF URL to disable toolbar and download button
  const pdfUrl = `${src}#toolbar=0&navpanes=0&scrollbar=1&statusbar=1&zoom=1&view=FitH`;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        toast.error('⚠️ PDF content is protected');
        return false;
      }}
    >
      <iframe
        ref={iframeRef}
        src={pdfUrl}
        className={className}
        title="PDF Viewer"
        style={{ border: 'none' }}
      />
    </div>
  );
}
