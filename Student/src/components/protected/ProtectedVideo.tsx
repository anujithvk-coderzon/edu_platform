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
  const stageRef = useRef<HTMLDivElement>(null);
  // CSS-rotation fallback, used where the platform cannot rotate for us.
  const [rotated, setRotated] = useState(false);
  const [canRotate, setCanRotate] = useState(false);

  // The API resolves VIDEO materials to a Stream embed URL; its presence is
  // what distinguishes a streamed video from a plain uploaded file.
  const isStreamVideo = Boolean(embedUrl);

  // Rotating only makes sense on a phone-sized, portrait viewport.
  useEffect(() => {
    if (!isStreamVideo || typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setCanRotate(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [isStreamVideo]);

  // Escape leaves the rotated view, and the page behind it must not scroll.
  useEffect(() => {
    if (!rotated) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRotated(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [rotated]);

  const enterLandscape = async () => {
    const stage = stageRef.current;
    const orientation: any =
      typeof screen !== 'undefined' ? (screen as any).orientation : undefined;

    // Where the platform can genuinely rotate -- Android Chrome, desktop --
    // real fullscreen plus an orientation lock is the better experience.
    if (stage?.requestFullscreen && orientation?.lock) {
      try {
        await stage.requestFullscreen();
        await orientation.lock('landscape');
        return;
      } catch {
        // Lock refused (iPad, desktop, or the user's rotation lock is on).
        // Fall through to rotating it ourselves.
        if (document.fullscreenElement) {
          try { await document.exitFullscreen(); } catch {}
        }
      }
    }

    // iPhone Safari supports neither Element.requestFullscreen nor the Screen
    // Orientation API, so the only way to give it a landscape view is to draw
    // one: a full-viewport layer with the player turned 90 degrees.
    setRotated(true);
  };

  const exitLandscape = async () => {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }
    const orientation: any =
      typeof screen !== 'undefined' ? (screen as any).orientation : undefined;
    try { orientation?.unlock?.(); } catch {}
    setRotated(false);
  };

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
        /* Bunny Stream iframe embed. The stage keeps a 16:9 box in the page and
           becomes a full-viewport layer when rotated; the iframe itself is never
           re-parented, so toggling never reloads or restarts the video. */
        <div
          ref={stageRef}
          className={
            rotated
              ? 'fixed inset-0 z-[9999] bg-black'
              : 'relative w-full rounded-lg overflow-hidden bg-black'
          }
          style={rotated ? undefined : { paddingBottom: '56.25%' }}
        >
          <div
            style={
              rotated
                ? {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100dvh',
                    height: '100dvw',
                    transform: 'translate(-50%, -50%) rotate(90deg)',
                  }
                : { position: 'absolute', inset: 0 }
            }
          >
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
              className={rotated ? '' : 'rounded-lg'}
              allowFullScreen
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              onContextMenu={(e) => {
                e.preventDefault();
                setShowWarning(true);
                setTimeout(() => setShowWarning(false), 2000);
                return false;
              }}
            />
          </div>

          {canRotate && (
            <button
              type="button"
              onClick={rotated ? exitLandscape : enterLandscape}
              aria-label={rotated ? 'Exit landscape view' : 'Watch in landscape'}
              className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-[4px] bg-black/65 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M2 12a10 10 0 0 1 10-10v4" strokeLinecap="round" />
                <path d="M22 12a10 10 0 0 1-10 10v-4" strokeLinecap="round" />
                <path d="M12 2 9 5m3-3 3 3M12 22l3-3m-3 3-3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {rotated ? 'Exit' : 'Rotate'}
            </button>
          )}
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
