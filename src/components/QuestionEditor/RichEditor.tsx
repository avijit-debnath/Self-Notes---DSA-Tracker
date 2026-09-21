import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Eye,
  Edit3,
  Highlighter,
  Palette
} from 'lucide-react';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minRows?: number;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', class: 'bg-yellow-200 dark:bg-yellow-900/60 text-yellow-950 dark:text-yellow-200 px-1 rounded', color: '#fef08a' },
  { name: 'Green', class: 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200 px-1 rounded', color: '#a7f3d0' },
  { name: 'Blue', class: 'bg-sky-200 dark:bg-sky-900/60 text-sky-950 dark:text-sky-200 px-1 rounded', color: '#bae6fd' },
  { name: 'Pink', class: 'bg-rose-200 dark:bg-rose-900/60 text-rose-950 dark:text-rose-200 px-1 rounded', color: '#fecdd3' },
  { name: 'Purple', class: 'bg-purple-200 dark:bg-purple-900/60 text-purple-950 dark:text-purple-200 px-1 rounded', color: '#e9d5ff' },
];

const TEXT_COLORS = [
  { name: 'Emerald', class: 'text-emerald-600 dark:text-emerald-400 font-semibold', color: '#10b981' },
  { name: 'Blue', class: 'text-sky-600 dark:text-sky-400 font-semibold', color: '#0ea5e9' },
  { name: 'Indigo', class: 'text-indigo-600 dark:text-indigo-400 font-semibold', color: '#6366f1' },
  { name: 'Amber', class: 'text-amber-600 dark:text-amber-400 font-semibold', color: '#f59e0b' },
  { name: 'Rose', class: 'text-rose-600 dark:text-rose-400 font-semibold', color: '#f43f5e' },
  { name: 'Purple', class: 'text-purple-600 dark:text-purple-400 font-semibold', color: '#a855f7' },
];

export const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write problem details or approach...',
  minRows = 6
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const updated = value.substring(0, start) + replacement + value.substring(end);
    onChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4)
      );
    }, 0);
  };

  const applyHighlight = (colorClass: string) => {
    insertFormat(`<mark class="${colorClass}">`, '</mark>');
    setShowHighlightPicker(false);
  };

  const applyTextColor = (colorClass: string) => {
    insertFormat(`<span class="${colorClass}">`, '</span>');
    setShowColorPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertFormat('**', '**');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertFormat('*', '*');
      } else if (e.key === '`') {
        e.preventDefault();
        insertFormat('`', '`');
      }
    }
  };

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] overflow-hidden focus-within:border-indigo-500/70 transition shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#1c2128]">
        <div className="flex items-center gap-0.5 flex-wrap">
          <button
            type="button"
            onClick={() => insertFormat('**', '**')}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('*', '*')}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('`', '`')}
            title="Inline Code"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Highlight Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              title="Highlight Text"
              className="flex items-center gap-1 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-500 transition"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>

            {showHighlightPicker && (
              <div className="absolute top-8 left-0 z-30 p-1.5 bg-white dark:bg-[#1c2128] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 animate-in fade-in zoom-in-95">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => applyHighlight(c.class)}
                    title={`Highlight ${c.name}`}
                    style={{ backgroundColor: c.color }}
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition shadow-sm"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Text Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              title="Text Color"
              className="flex items-center gap-1 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-500 transition"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div className="absolute top-8 left-0 z-30 p-1.5 bg-white dark:bg-[#1c2128] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 animate-in fade-in zoom-in-95">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => applyTextColor(c.class)}
                    title={`Color ${c.name}`}
                    style={{ backgroundColor: c.color }}
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition shadow-sm"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertFormat('### ')}
            title="Heading 2"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('#### ')}
            title="Heading 3"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertFormat('- ')}
            title="Bullet List"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('1. ')}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormat('> ')}
            title="Blockquote"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toggle Edit / Preview */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-1.5 px-2 py-0.5 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
        >
          {isPreview ? (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Content Area */}
      {isPreview ? (
        <div
          className="p-3.5 text-xs text-slate-800 dark:text-slate-200 min-h-[140px] whitespace-pre-wrap leading-relaxed select-text"
          dangerouslySetInnerHTML={{ __html: formatHtmlPreview(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={minRows}
          className="w-full p-3.5 bg-transparent text-xs leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none resize-y font-sans selection:bg-indigo-500/20"
        />
      )}
    </div>
  );
};

// Helper to render markdown and HTML tags safely in preview
function formatHtmlPreview(text: string): string {
  if (!text) return '<span class="italic text-slate-400">Nothing to preview.</span>';

  // Basic markdown conversions
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold my-2 text-slate-900 dark:text-white">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 class="text-xs font-bold my-1 text-slate-800 dark:text-slate-200">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-500 font-mono text-[11px]">$1</code>');

  return html;
}
