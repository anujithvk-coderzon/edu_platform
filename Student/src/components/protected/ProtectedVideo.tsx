'use client';

import { useEffect, useRef, useState } from 'react';
import { disableVideoDownload, showProtectionWarning } from '../../utils/materialProtection';
import '../../styles/materialProtection.css';

interface ProtectedVideoProps {
  src: string;
  /** Bunny Stream embed URL, supplied by the API for VIDEO materials. */
  embedUrl?: string;
  poster?: string;
  className?: string;
  watermarkText?: string;
  onEnded?: () => void;
}

export default function ProtectedVideo({
  src,
  embedUrl,
  poster,
  className = '',
  watermarkText,
  onEnded
}: ProtectedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWarning, setShowWarning] = useState(false);

  // The API resolves VIDEO materials to a Stream embed URL; its presence is
  // what distinguishes a streamed video from a plain uploaded file.
  const isStreamVideo = Boolean(embedUrl);

  useEffect(() => {
    // Only apply video protection for non-stream videos (regular video tag)
    if (isStreamVideo) return;

    const video = videoRef.current;
    if (!video) return;

    // Apply video protection
    disableVideoDownload(video);
  }, [src, isStreamVideo]);

  useEffect(() => {
    // Disable right-click on container for both stream and regular videos
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
  }, []);

  return (
    <div
      ref={containerRef}
      className={`protected-content protected-video relative ${className}`}
    >
      {/* Watermark overlay */}
      {watermarkText && !isStreamVideo && (
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

      {isStreamVideo ? (
        /* Bunny Stream iframe embed with proper aspect ratio container */
        <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            loading="lazy"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0
            }}
            className="rounded-lg"
            allowFullScreen
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            onContextMenu={(e) => {
              e.preventDefault();
              setShowWarning(true);
              setTimeout(() => setShowWarning(false), 2000);
              return false;
            }}
          />
        </div>
      ) : (
        /* Regular video tag for non-stream videos */
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
      )}

      {/* Transparent overlay to catch some download attempts */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      />
    </div>
  );
}
