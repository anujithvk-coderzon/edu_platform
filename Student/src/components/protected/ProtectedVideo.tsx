'use client';

import { useEffect, useRef, useState } from 'react';
import { disableVideoDownload, showProtectionWarning } from '../../utils/materialProtection';
import { env } from '../../config/env';
import { getCdnUrl } from '../../utils/cdn';
import '../../styles/materialProtection.css';

interface ProtectedVideoProps {
  src: string;
  poster?: string;
  className?: string;
  watermarkText?: string;
  onEnded?: () => void;
}

/**
 * Check if the src is a Bunny Stream GUID (format: 8-4-4-4-12 hex characters)
 */
const isBunnyStreamGuid = (src: string): boolean => {
  if (!src) return false;
  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidPattern.test(src);
};

export default function ProtectedVideo({
  src,
  poster,
  className = '',
  watermarkText,
  onEnded
}: ProtectedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isStreamVideo, setIsStreamVideo] = useState(false);

  useEffect(() => {
    // Check if the src is a Bunny Stream GUID
    setIsStreamVideo(isBunnyStreamGuid(src));
  }, [src]);

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
            src={`https://iframe.mediadelivery.net/embed/${env.BUNNY_STREAM_LIBRARY_ID}/${src}`}
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
          <source src={getCdnUrl(src) || src} type="video/mp4" />
          <source src={getCdnUrl(src) || src} type="video/webm" />
          <source src={getCdnUrl(src) || src} type="video/ogg" />
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
