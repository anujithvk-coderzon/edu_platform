/**
 * Material Protection Utilities
 * Prevents downloading, copying, and screenshotting of course materials
 */

/**
 * Disable right-click context menu on an element
 */
export const disableContextMenu = (element: HTMLElement | null) => {
  if (!element) return;

  const handler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  element.addEventListener('contextmenu', handler);

  // Return cleanup function
  return () => element.removeEventListener('contextmenu', handler);
};

/**
 * Disable keyboard shortcuts that could be used to save/download
 */
export const disableSaveShortcuts = () => {
  const handler = (e: KeyboardEvent) => {
    // Ctrl+S or Cmd+S (Save)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }

    // Ctrl+P or Cmd+P (Print)
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      return false;
    }

    // Ctrl+U or Cmd+U (View Source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      return false;
    }

    // F12 (Developer Tools) - optional, might annoy developers
    // if (e.key === 'F12') {
    //   e.preventDefault();
    //   return false;
    // }
  };

  document.addEventListener('keydown', handler);

  // Return cleanup function
  return () => document.removeEventListener('keydown', handler);
};

/**
 * Disable text selection on an element
 */
export const disableSelection = (element: HTMLElement | null) => {
  if (!element) return;

  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
  (element.style as any).mozUserSelect = 'none';
  (element.style as any).msUserSelect = 'none';
};

/**
 * Disable dragging on an element
 */
export const disableDragging = (element: HTMLElement | null) => {
  if (!element) return;

  const handler = (e: DragEvent) => {
    e.preventDefault();
    return false;
  };

  element.addEventListener('dragstart', handler);

  // Return cleanup function
  return () => element.removeEventListener('dragstart', handler);
};

/**
 * Apply all protections to an element
 */
export const protectElement = (element: HTMLElement | null) => {
  if (!element) return null;

  const cleanupFunctions = [
    disableContextMenu(element),
    disableDragging(element),
  ];

  disableSelection(element);

  // Return cleanup function that calls all cleanups
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup && cleanup());
  };
};

/**
 * Detect if user is trying to screenshot (partial detection only)
 * This is VERY limited - can't fully prevent screenshots
 */
export const detectScreenshotAttempt = (callback: () => void) => {
  // Detect Print Screen key (limited browser support)
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'PrintScreen') {
      callback();
    }
  };

  document.addEventListener('keyup', handler);

  return () => document.removeEventListener('keyup', handler);
};

/**
 * Show a warning message when user tries to right-click
 */
export const showProtectionWarning = () => {
  // You can integrate with your toast system
  console.log('⚠️ Course materials are protected and cannot be downloaded');
};

/**
 * Create a watermark element for videos/images
 */
export const createWatermark = (text: string): HTMLDivElement => {
  const watermark = document.createElement('div');
  watermark.className = 'watermark-overlay';
  watermark.textContent = text;
  watermark.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 3rem;
    color: rgba(255, 255, 255, 0.1);
    pointer-events: none;
    user-select: none;
    z-index: 1;
    white-space: nowrap;
    font-weight: bold;
  `;
  return watermark;
};

/**
 * React hook for material protection
 */
export const useMaterialProtection = () => {
  if (typeof window === 'undefined') return;

  const enableProtection = () => {
    const cleanupShortcuts = disableSaveShortcuts();

    return () => {
      cleanupShortcuts();
    };
  };

  return { enableProtection };
};

/**
 * Disable video download button in HTML5 video controls
 */
export const disableVideoDownload = (videoElement: HTMLVideoElement | null) => {
  if (!videoElement) return;

  // Set controlsList attribute to remove download button
  videoElement.setAttribute('controlsList', 'nodownload');

  // Disable right-click
  videoElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Prevent downloading via keyboard
  videoElement.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }
  });
};
