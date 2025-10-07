'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { protectElement, showProtectionWarning } from '../../utils/materialProtection';
import '../../styles/materialProtection.css';

interface ProtectedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  watermarkText?: string;
  fill?: boolean;
  priority?: boolean;
}

export default function ProtectedImage({
  src,
  alt,
  width,
  height,
  className = '',
  watermarkText,
  fill = false,
  priority = false
}: ProtectedImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = protectElement(container);

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2000);
      showProtectionWarning();
      return false;
    };

    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      cleanup && cleanup();
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`protected-image-container ${className}`}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
        return false;
      }}
    >
      {/* Warning message */}
      {showWarning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm whitespace-nowrap">
          ⚠️ Images are protected
        </div>
      )}

      {/* Watermark overlay */}
      {watermarkText && (
        <div className="watermark-overlay">
          {watermarkText}
        </div>
      )}

      {/* Transparent overlay to block right-clicks */}
      <div className="protected-image-overlay" />

      {/* The actual image */}
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="protected-image object-cover"
          priority={priority}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width || 800}
          height={height || 600}
          className="protected-image"
          priority={priority}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
}
