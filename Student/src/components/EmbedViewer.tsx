'use client';

import { useState, useEffect } from 'react';
import { getEmbedInfo, getPlatformName, type EmbedInfo } from '@/utils/embedUtils';
import {
  LinkIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface EmbedViewerProps {
  url: string;
  title?: string;
  className?: string;
}

export default function EmbedViewer({ url, title, className = '' }: EmbedViewerProps) {
  const [embedInfo, setEmbedInfo] = useState<EmbedInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (url) {
      const info = getEmbedInfo(url);
      setEmbedInfo(info);
      setLoading(false);
    }
  }, [url]);

  const handleIframeError = () => {
    setError(true);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  if (!embedInfo) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="text-center text-slate-500">
          <LinkIcon className="h-12 w-12 mx-auto mb-3 text-slate-400" />
          <p className="text-sm">Invalid URL</p>
        </div>
      </div>
    );
  }

  // If not embeddable or error occurred, show fallback
  if (!embedInfo.isEmbeddable || error) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="text-center">
          {error ? (
            <>
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-3 text-orange-500" />
              <h3 className="text-base font-semibold mb-2 text-slate-900">
                Unable to Embed Content
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                This content cannot be embedded. Please open it in a new tab.
              </p>
            </>
          ) : (
            <>
              <LinkIcon className="h-12 w-12 mx-auto mb-3 text-indigo-600" />
              <h3 className="text-base font-semibold mb-2 text-slate-900">
                External Resource
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {getPlatformName(embedInfo.platform)} content
              </p>
            </>
          )}
          <a
            href={embedInfo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-md"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
            Open in New Tab
          </a>
        </div>
      </div>
    );
  }

  // Calculate padding for aspect ratio
  const aspectRatioPadding = embedInfo.aspectRatio === '16:9' ? '56.25%' :
                             embedInfo.aspectRatio === '4:3' ? '75%' :
                             '56.25%'; // default to 16:9

  return (
    <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {/* Platform Badge */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {embedInfo.platform === 'youtube' || embedInfo.platform === 'vimeo' || embedInfo.platform === 'loom' ? (
              <VideoCameraIcon className="h-4 w-4 text-indigo-600" />
            ) : (
              <DocumentTextIcon className="h-4 w-4 text-indigo-600" />
            )}
            <span className="text-sm font-medium text-slate-700">
              {getPlatformName(embedInfo.platform)}
            </span>
          </div>
          <a
            href={embedInfo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:underline"
          >
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            Open Original
          </a>
        </div>
      </div>

      {/* Iframe Container with Aspect Ratio */}
      <div className="relative w-full" style={{ paddingBottom: aspectRatioPadding }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm text-slate-600">Loading content...</p>
            </div>
          </div>
        )}

        <iframe
          src={embedInfo.embedUrl!}
          title={title || 'Embedded content'}
          className="absolute top-0 left-0 w-full h-full pointer-events-auto"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={handleIframeError}
          onLoad={handleIframeLoad}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
          loading="lazy"
        />
      </div>

      {/* Info Footer */}
      {title && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-700 font-medium truncate">{title}</p>
        </div>
      )}
    </div>
  );
}
