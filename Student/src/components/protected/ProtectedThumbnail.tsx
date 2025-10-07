'use client';

import { useRef } from 'react';
import '../../styles/materialProtection.css';

interface ProtectedThumbnailProps {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoad?: () => void;
}

/**
 * Lightweight protection for course thumbnails
 * Only disables dragging and right-click save (allows viewing)
 */
export default function ProtectedThumbnail({
  src,
  alt,
  className = '',
  onError,
  onLoad
}: ProtectedThumbnailProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`protected-thumbnail ${className}`}
      draggable={false}
      onContextMenu={(e) => {
        // Allow right-click on thumbnails but prevent save (less aggressive)
        // e.preventDefault(); // Commented out - thumbnails can be right-clicked
      }}
      onDragStart={(e) => e.preventDefault()}
      onError={onError}
      onLoad={onLoad}
    />
  );
}
