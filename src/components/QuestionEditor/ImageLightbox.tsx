import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { PhotoNote } from '../../types';

interface ImageLightboxProps {
  image: PhotoNote | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ image, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 4));
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const imgSrc = image.dataUrl || image.filePath;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm select-none"
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Toolbar */}
      <div className="absolute top-4 inset-x-6 flex items-center justify-between z-10">
        <div className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-md backdrop-blur border border-white/10">
          {image.caption || 'Handwritten Photo Note'} • {Math.round(scale * 100)}%
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.min(s + 0.25, 4))}
            title="Zoom In (+)"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
            title="Zoom Out (-)"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={resetZoom}
            title="Reset Zoom"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-12"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <img
          src={imgSrc}
          alt={image.caption || 'DSA Diagram'}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Caption footer */}
      {image.caption && (
        <div className="absolute bottom-6 max-w-lg px-4 py-2 rounded-lg bg-black/60 backdrop-blur border border-white/10 text-white text-xs text-center">
          {image.caption}
        </div>
      )}
    </div>
  );
};
