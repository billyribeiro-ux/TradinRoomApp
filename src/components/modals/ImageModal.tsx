// ============================================================================
// IMAGE MODAL COMPONENT - Competitor Pattern
// Microsoft Enterprise Standard
// ============================================================================
import { X, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

import { downloadImage } from '../../utils/imageModal';

interface ImageModalData {
  url: string;
  imageName: string;
}

export function ImageModal() {
  const [imageData, setImageData] = useState<ImageModalData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const customEvent = event as CustomEvent<ImageModalData>;
      setImageData(customEvent.detail);
    };

    window.addEventListener('openImageModal', handleOpenModal);
    return () => window.removeEventListener('openImageModal', handleOpenModal);
  }, []);

  const handleClose = () => {
    setImageData(null);
  };

  const handleDownload = async () => {
    if (!imageData) return;
    setIsDownloading(true);
    try {
      await downloadImage(imageData.url, imageData.imageName);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!imageData) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="relative max-w-[95vw] sm:max-w-7xl max-h-[90vh] w-full">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Image */}
        <div className="flex items-center justify-center max-h-[70vh] sm:max-h-[80vh]">
          <img
            src={imageData.url}
            alt={imageData.imageName}
            className="max-w-full max-h-[70vh] sm:max-h-[80vh] object-contain rounded-lg shadow-2xl"
            loading="lazy"
          />
        </div>

        {/* Footer with Download Button */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 sm:justify-between bg-slate-800/80 backdrop-blur rounded-lg p-3 sm:p-4">
          <span className="text-white text-xs sm:text-sm truncate w-full sm:flex-1 sm:mr-4">
            {imageData.imageName}
          </span>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm sm:text-base font-semibold rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {isDownloading ? 'Downloading...' : 'Download Image'}
          </button>
        </div>

        {/* Keyboard Hint */}
        <div className="mt-2 text-center text-slate-400 text-xs">
          Press ESC to close • Shift/Alt/Ctrl + Click to open in new window
        </div>
      </div>
    </div>
  );
}
