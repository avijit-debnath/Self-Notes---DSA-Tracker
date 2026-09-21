import React, { useEffect, useRef } from 'react';
import { Search, X, Folder, FileCode, CornerDownLeft, Sparkles } from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore';
import { useTreeStore } from '../../stores/useTreeStore';
import { SearchResult } from '../../types';

export const GlobalSearchModal: React.FC = () => {
  const { isOpen, closeSearch, query, setQuery, results, selectedIndex, setSelectedIndex, isLoading } = useSearchStore();
  const { setActiveQuestion, setActiveBranch, setActiveView } = useTreeStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) closeSearch();
        else useSearchStore.getState().openSearch();
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        closeSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, closeSearch, setSelectedIndex]);

  if (!isOpen) return null;

  const handleSelectResult = (item: SearchResult) => {
    if (item.type === 'question') {
      setActiveQuestion(item.id);
    } else {
      setActiveBranch(item.id);
      setActiveView('dashboard');
    }
    closeSearch();
  };

  // Helper to highlight matching text
  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-semibold rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/60 backdrop-blur-sm select-none p-4 animate-in fade-in duration-100"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-2xl flex flex-col rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems, statements, code approaches, notes, or branches..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-[#21262d] text-slate-400 border border-slate-200 dark:border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Searching your notes...</div>
          ) : results.length > 0 ? (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.type}_${item.id}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800'
                      : 'hover:bg-slate-100 dark:hover:bg-[#21262d] border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'branch' ? (
                        <Folder className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <FileCode className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {renderHighlighted(item.title, query)}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#21262d]">
                          {item.subtitle}
                        </span>
                      </div>

                      {item.snippet && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {renderHighlighted(item.snippet, query)}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-indigo-500 shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          ) : query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="py-6 px-4 text-xs text-slate-400 flex flex-col gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Quick Tips</span>
              <p>Type keywords like <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500 font-mono">hashmap</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500 font-mono">sliding window</code>, or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500 font-mono">monotonic</code> to instantly find matched problems and notes.</p>
            </div>
          )}
        </div>

        {/* Search Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1c2128]">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono">↑↓</kbd> to navigate</span>
            <span><kbd className="font-mono">↵</kbd> to select</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
};
