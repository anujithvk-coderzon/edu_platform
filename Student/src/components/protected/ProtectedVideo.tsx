'use client';

import { useEffect, useRef, useState } from 'react';
import { disableVideoDownload, showProtectionWarning } from '../../utils/materialProtection';
import '../../styles/materialProtection.css';

interface ProtectedVideoProps {
  src: string;
  poster?: string;
  className?: string;
  watermarkText?: string;
  onEnded?: () => void;
}

export default function ProtectedVideo({
  src,
  poster,
  className = '',
  watermarkText,
  onEnded
}: ProtectedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Apply video protection
    disableVideoDownload(video);

    // Disable right-click on container
    const container = containerRef.current;
    if (container) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
        showProtectionWarning();
        return false;
      };

      container.addEventListener('contextmenu', handleContextMenu);

      return () => {
        container.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={`protected-content protected-video relative ${className}`}
    >
      {/* Watermark overlay */}
      {watermarkText && (
        <div className="watermark-overlay">
          {watermarkText}
        </div>
      )}

      {/* Warning message */}
      {showWarning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          ⚠️ Course materials are protected
        </div>
      )}

      <video
        ref={videoRef}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        poster={poster}
        className="w-full h-auto rounded-lg"
        onContextMenu={(e) => {
          e.preventDefault();
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 2000);
          return false;
        }}
        onEnded={onEnded}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
        Your browser does not support the video tag.
      </video>

      {/* Transparent overlay to catch some download attempts */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      />
    </div>
  );
}
