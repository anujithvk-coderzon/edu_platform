/**
 * Utility functions for detecting and converting URLs to embeddable formats
 */

export interface EmbedInfo {
  platform: 'youtube' | 'vimeo' | 'google-drive' | 'loom' | 'codepen' | 'codesandbox' | 'figma' | 'unsupported';
  embedUrl: string | null;
  isEmbeddable: boolean;
  aspectRatio: string; // e.g., "16:9", "4:3", "1:1"
  originalUrl: string;
}

/**
 * Detect platform and convert URL to embeddable format
 */
export function getEmbedInfo(url: string): EmbedInfo {
  if (!url) {
    return {
      platform: 'unsupported',
      embedUrl: null,
      isEmbeddable: false,
      aspectRatio: '16:9',
      originalUrl: url
    };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return getYouTubeEmbed(url);
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      return getVimeoEmbed(url);
    }

    // Google Drive
    if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) {
      return getGoogleDriveEmbed(url);
    }

    // Loom
    if (hostname.includes('loom.com')) {
      return getLoomEmbed(url);
    }

    // CodePen
    if (hostname.includes('codepen.io')) {
      return getCodePenEmbed(url);
    }

    // CodeSandbox
    if (hostname.includes('codesandbox.io')) {
      return getCodeSandboxEmbed(url);
    }

    // Figma
    if (hostname.includes('figma.com')) {
      return getFigmaEmbed(url);
    }

    // Unsupported - return with fallback
    return {
      platform: 'unsupported',
      embedUrl: null,
      isEmbeddable: false,
      aspectRatio: '16:9',
      originalUrl: url
    };
  } catch (error) {
    return {
      platform: 'unsupported',
      embedUrl: null,
      isEmbeddable: false,
      aspectRatio: '16:9',
      originalUrl: url
    };
  }
}

/**
 * YouTube URL converter
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
function getYouTubeEmbed(url: string): EmbedInfo {
  try {
    const urlObj = new URL(url);
    let videoId = '';

    if (urlObj.hostname.includes('youtu.be')) {
      // Format: youtu.be/VIDEO_ID
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.pathname.includes('/embed/')) {
      // Already embed format
      videoId = urlObj.pathname.split('/embed/')[1];
    } else {
      // Format: youtube.com/watch?v=VIDEO_ID
      videoId = urlObj.searchParams.get('v') || '';
    }

    if (videoId) {
      // Extract timestamp if exists
      const timestamp = urlObj.searchParams.get('t') || '';

      // Build embed URL with parameters to minimize YouTube branding
      const params = new URLSearchParams({
        // Core parameters
        ...(timestamp && { start: timestamp.replace('s', '') }),

        // Minimize YouTube branding and distractions
        modestbranding: '1',      // Reduced YouTube branding
        rel: '0',                  // Don't show related videos from other channels
        iv_load_policy: '3',      // Hide video annotations
        color: 'white',           // Use white progress bar (cleaner look)

        // Enable essential features
        enablejsapi: '1',         // Enable JavaScript API for future tracking
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      });

      const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

      return {
        platform: 'youtube',
        embedUrl,
        isEmbeddable: true,
        aspectRatio: '16:9',
        originalUrl: url
      };
    }
  } catch (error) {
    // Invalid URL
  }

  return {
    platform: 'youtube',
    embedUrl: null,
    isEmbeddable: false,
    aspectRatio: '16:9',
    originalUrl: url
  };
}

/**
 * Vimeo URL converter
 * Supports: vimeo.com/VIDEO_ID, player.vimeo.com/video/VIDEO_ID
 */
function getVimeoEmbed(url: string): EmbedInfo {
  try {
    const urlObj = new URL(url);
    let videoId = '';

    if (urlObj.hostname.includes('player.vimeo.com')) {
      // Already embed format
      videoId = urlObj.pathname.split('/video/')[1];
    } else {
      // Format: vimeo.com/VIDEO_ID
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      videoId = pathParts[0];
    }

    if (videoId) {
      // Build embed URL with parameters to minimize Vimeo branding
      const params = new URLSearchParams({
        // Minimize Vimeo branding and distractions
        title: '0',              // Hide video title
        byline: '0',            // Hide author byline
        portrait: '0',          // Hide author portrait
        badge: '0',             // Hide Vimeo badge
        color: '6366f1',        // Use indigo color (matches your theme)
      });

      const embedUrl = `https://player.vimeo.com/video/${videoId}?${params.toString()}`;

      return {
        platform: 'vimeo',
        embedUrl,
        isEmbeddable: true,
        aspectRatio: '16:9',
        originalUrl: url
      };
    }
  } catch (error) {
    // Invalid URL
  }

  return {
    platform: 'vimeo',
    embedUrl: null,
    isEmbeddable: false,
    aspectRatio: '16:9',
    originalUrl: url
  };
}

/**
 * Google Drive URL converter
 * Supports: Google Docs, Sheets, Slides, PDFs
 */
function getGoogleDriveEmbed(url: string): EmbedInfo {
  try {
    const urlObj = new URL(url);

    // Extract file ID
    let fileId = '';

    if (url.includes('/file/d/')) {
      fileId = url.split('/file/d/')[1].split('/')[0];
    } else if (url.includes('id=')) {
      fileId = urlObj.searchParams.get('id') || '';
    } else if (url.includes('/document/d/')) {
      fileId = url.split('/document/d/')[1].split('/')[0];
    } else if (url.includes('/presentation/d/')) {
      fileId = url.split('/presentation/d/')[1].split('/')[0];
    } else if (url.includes('/spreadsheets/d/')) {
      fileId = url.split('/spreadsheets/d/')[1].split('/')[0];
    }

    if (fileId) {
      let embedUrl = '';

      // Determine type and create appropriate embed URL
      if (url.includes('/document/') || url.includes('docs.google.com')) {
        embedUrl = `https://docs.google.com/document/d/${fileId}/preview`;
      } else if (url.includes('/presentation/')) {
        embedUrl = `https://docs.google.com/presentation/d/${fileId}/embed`;
      } else if (url.includes('/spreadsheets/')) {
        embedUrl = `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
      } else {
        // Default to file preview (works for PDFs, images, etc.)
        embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      }

      return {
        platform: 'google-drive',
        embedUrl,
        isEmbeddable: true,
        aspectRatio: '4:3',
        originalUrl: url
      };
    }
  } catch (error) {
    // Invalid URL
  }

  return {
    platform: 'google-drive',
    embedUrl: null,
    isEmbeddable: false,
    aspectRatio: '4:3',
    originalUrl: url
  };
}

/**
 * Loom URL converter
 * Supports: loom.com/share/VIDEO_ID
 */
function getLoomEmbed(url: string): EmbedInfo {
  try {
    const urlObj = new URL(url);

    if (urlObj.pathname.includes('/share/')) {
      const videoId = urlObj.pathname.split('/share/')[1];

      if (videoId) {
        // Build embed URL with parameters to minimize Loom branding
        const params = new URLSearchParams({
          hide_owner: 'true',      // Hide owner info
          hide_share: 'true',      // Hide share button
          hide_title: 'true',      // Hide video title
          hideEmbedTopBar: 'true', // Hide top bar
        });

        const embedUrl = `https://www.loom.com/embed/${videoId}?${params.toString()}`;

        return {
          platform: 'loom',
          embedUrl,
          isEmbeddable: true,
          aspectRatio: '16:9',
          originalUrl: url
        };
      }
    }
  } catch (error) {
    // Invalid URL
  }

  return {
    platform: 'loom',
    embedUrl: null,
    isEmbeddable: false,
    aspectRatio: '16:9',
    originalUrl: url
  };
}

/**
 * CodePen URL converter
 * Supports: codepen.io/USER/pen/PEN_ID
 */
function getCodePenEmbed(url: string): EmbedInfo {
  try {
    const urlObj = new URL(url);

    if (urlObj.pathname.includes('/pen/')) {
      // Extract user and pen ID
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const userIndex = pathParts.indexOf('pen') - 1;
      const user = pathParts[userIndex];
      const penId = pathParts[pathParts.indexOf('pen') + 1];

      if (user && penId) {
        const embedUrl = `https://codepen.io/${user}/embed/${penId}?default-tab=result`;

        return {
          platform: 'codepen',
          embedUrl,
          isEmbeddable: true,
          aspectRatio: '16:9',
          originalUrl: url
        };
      }
    }
  } catch (error) {
    // Invalid URL
  }

  return {
    platform: 'codepen',
    embedUrl: null,
    isEmbeddable: false,
    aspectRatio: '16:9',
    originalUrl: url
  };
}

/**
 * CodeSandbox URL converter
 * Supports: codesandbox.io/s/SANDBOX_ID
 */
function getCodeSandboxEmbed(url: string): EmbedInfo {
  try {
    const urlObj = new URL(url);

    if (urlObj.pathname.includes('/s/')) {
      const sandboxId = urlObj.pathname.split('/s/')[1].split('/')[0];

      if (sandboxId) {
        const embedUrl = `https://codesandbox.io/embed/${sandboxId}`;

        return {
          platform: 'codesandbox',
          embedUrl,
          isEmbeddable: true,
          aspectRatio: '16:9',
          originalUrl: url
        };
      }
    }
  } catch (error) {
    // Invalid URL
  }

  return {
    platform: 'codesandbox',
    embedUrl: null,
    isEmbeddable: false,
    aspectRatio: '16:9',
    originalUrl: url
  };
}

/**
 * Figma URL converter
 * Supports: figma.com/file/FILE_ID or figma.com/proto/FILE_ID
 */
function getFigmaEmbed(url: string): EmbedInfo {
  try {
    const urlObj = new URL(url);

    if (urlObj.pathname.includes('/file/') || urlObj.pathname.includes('/proto/')) {
      const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;

      return {
        platform: 'figma',
        embedUrl,
        isEmbeddable: true,
        aspectRatio: '16:9',
        originalUrl: url
      };
    }
  } catch (error) {
    // Invalid URL
  }

  return {
    platform: 'figma',
    embedUrl: null,
    isEmbeddable: false,
    aspectRatio: '16:9',
    originalUrl: url
  };
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: EmbedInfo['platform']): string {
  const names: Record<EmbedInfo['platform'], string> = {
    'youtube': 'YouTube',
    'vimeo': 'Vimeo',
    'google-drive': 'Google Drive',
    'loom': 'Loom',
    'codepen': 'CodePen',
    'codesandbox': 'CodeSandbox',
    'figma': 'Figma',
    'unsupported': 'External Link'
  };

  return names[platform];
}

/**
 * Get platform icon component name
 */
export function getPlatformIcon(platform: EmbedInfo['platform']): string {
  const icons: Record<EmbedInfo['platform'], string> = {
    'youtube': 'VideoCameraIcon',
    'vimeo': 'VideoCameraIcon',
    'google-drive': 'DocumentTextIcon',
    'loom': 'VideoCameraIcon',
    'codepen': 'CodeBracketIcon',
    'codesandbox': 'CodeBracketIcon',
    'figma': 'PaintBrushIcon',
    'unsupported': 'LinkIcon'
  };

  return icons[platform];
}
