import React, { useCallback, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Controls */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'p-2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors',
          )}
        >
          <Download size={20} />
        </a>
        <button
          onClick={onClose}
          className="p-2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Image */}
      <img
        src={src}
        alt={alt ?? ''}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
