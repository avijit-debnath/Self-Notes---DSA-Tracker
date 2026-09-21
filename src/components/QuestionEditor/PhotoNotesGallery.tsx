import React, { useState, useRef, useEffect } from 'react';
import { Camera, ImagePlus, Trash2, Maximize2, ClipboardPaste } from 'lucide-react';
import { PhotoNote } from '../../types';
import { useQuestionStore } from '../../stores/useQuestionStore';
import { ImageLightbox } from './ImageLightbox';

export const PhotoNotesGallery: React.FC = () => {
  const { images, addPhotoNote, deletePhotoNote, updatePhotoCaption } = useQuestionStore();
  const [activeLightboxImg, setActiveLightboxImg] = useState<PhotoNote | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener for direct Ctrl+V images!
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                addPhotoNote(dataUrl, 'Pasted diagram note');
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addPhotoNote]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          addPhotoNote(dataUrl, file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Photo Notes & Dry Runs</h3>
          <span className="text-xs text-slate-400">({images.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-[11px] text-slate-400">
            Tip: Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">Ctrl + V</kbd> to paste screenshot
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 transition"
          >
            <ImagePlus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map(img => {
            const imgSrc = img.dataUrl || img.filePath;
            return (
              <div
                key={img.id}
                className="group relative flex flex-col rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] hover:border-indigo-500/50 transition shadow-sm"
              >
                {/* Thumbnail image */}
                <div
                  onClick={() => setActiveLightboxImg(img)}
                  className="relative h-36 bg-slate-900/5 dark:bg-black/30 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  <img
                    src={imgSrc}
                    alt={img.caption || 'Photo note'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhotoNote(img.id);
                    }}
                    title="Delete image"
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-rose-600 text-white transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Caption input */}
                <div className="p-1.5 border-t border-slate-200 dark:border-slate-800">
                  <input
                    type="text"
                    value={img.caption}
                    onChange={(e) => updatePhotoCaption(img.id, e.target.value)}
                    placeholder="Add caption (e.g. Dry run diagram)..."
                    className="w-full px-1.5 py-0.5 text-[11px] bg-transparent focus:outline-none focus:bg-white dark:focus:bg-[#0d1117] rounded text-slate-700 dark:text-slate-300 placeholder:text-slate-400 border border-transparent focus:border-slate-300 dark:focus:border-slate-700"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-lg cursor-pointer bg-slate-50/50 dark:bg-[#161b22]/30 transition group"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <ClipboardPaste className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Upload handwritten notes or paste screenshot (<kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">Ctrl + V</kbd>)
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG</p>
        </div>
      )}

      {/* Lightbox */}
      <ImageLightbox
        image={activeLightboxImg}
        onClose={() => setActiveLightboxImg(null)}
      />
    </div>
  );
};
