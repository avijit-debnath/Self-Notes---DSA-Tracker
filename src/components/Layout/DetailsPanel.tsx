import React, { useState } from 'react';
import {
  Tag,
  Calendar,
  FolderTree,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Command,
  Hash
} from 'lucide-react';
import { useQuestionStore } from '../../stores/useQuestionStore';
import { useTreeStore } from '../../stores/useTreeStore';

const COMMON_TAGS = ['Array', 'String', 'HashMap', 'Two Pointer', 'Sliding Window', 'Dynamic Programming', 'Graph', 'Stack', 'Greedy', 'Binary Search', 'Recursion', 'Tree'];

export const DetailsPanel: React.FC = () => {
  const { currentQuestion, updateField } = useQuestionStore();
  const { branches } = useTreeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  if (!currentQuestion) return null;

  const currentBranch = branches.find(b => b.id === currentQuestion.branchId);

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    const currentTags = currentQuestion.tags || [];
    if (!currentTags.includes(trimmed)) {
      updateField('tags', [...currentTags, trimmed]);
    }
    setNewTagInput('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = currentQuestion.tags || [];
    updateField('tags', currentTags.filter(t => t !== tagToRemove));
  };

  if (isCollapsed) {
    return (
      <div className="border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-1 select-none shrink-0 flex flex-col items-center">
        <button
          onClick={() => setIsCollapsed(false)}
          title="Expand Details Panel"
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#21262d] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const tags = currentQuestion.tags || [];

  return (
    <aside className="w-64 border-l border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-4 flex flex-col gap-5 select-none shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Problem Details</span>
        <button
          onClick={() => setIsCollapsed(true)}
          title="Collapse Panel"
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#21262d] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Branch Location */}
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
          <span>Branch</span>
        </div>
        <div className="px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium truncate">
          {currentBranch ? currentBranch.name : 'Unknown Branch'}
        </div>
      </div>

      {/* Tags Management */}
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tags ({tags.length})</span>
          </div>
        </div>

        {/* Existing Tag Chips */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
            >
              <Hash className="w-2.5 h-2.5 opacity-60" />
              {t}
              <button
                onClick={() => handleRemoveTag(t)}
                className="hover:text-rose-500 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Add Tag input */}
        <div className="relative mt-1">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
              onFocus={() => setShowTagSuggestions(true)}
              placeholder="Add tag (e.g. Array)..."
              className="flex-1 px-2 py-1 text-xs rounded bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleAddTag(newTagInput)}
              className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Suggestions dropdown */}
          {showTagSuggestions && (
            <div
              className="absolute top-8 left-0 right-0 z-10 p-1.5 bg-white dark:bg-[#1c2128] rounded-md shadow-lg border border-slate-200 dark:border-slate-700 flex flex-wrap gap-1 max-h-36 overflow-y-auto"
              onMouseLeave={() => setShowTagSuggestions(false)}
            >
              {COMMON_TAGS.filter(t => !tags.includes(t)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-1.5 py-0.5 text-[10px] rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-300 transition"
                >
                  +{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dates Metadata */}
      <div className="flex flex-col gap-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Timeline</span>
        </div>

        <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Created:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {new Date(currentQuestion.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last Modified:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {new Date(currentQuestion.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts summary */}
      <div className="flex flex-col gap-1.5 text-[11px] text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="flex items-center gap-1 text-slate-500 font-medium">
          <Command className="w-3 h-3" />
          <span>Shortcuts</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Search</span>
            <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-[#0d1117] rounded font-mono text-[10px]">Ctrl+K</kbd>
          </div>
          <div className="flex justify-between">
            <span>Force Save</span>
            <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-[#0d1117] rounded font-mono text-[10px]">Ctrl+S</kbd>
          </div>
          <div className="flex justify-between">
            <span>Important</span>
            <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-[#0d1117] rounded font-mono text-[10px]">Ctrl+Shift+I</kbd>
          </div>
          <div className="flex justify-between">
            <span>Paste Screenshot</span>
            <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-[#0d1117] rounded font-mono text-[10px]">Ctrl+V</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
};
