import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Sparkles,
  Link2,
  Columns2,
  Rows2
} from 'lucide-react';
import { Difficulty, QuestionStatus } from '../../types';
import { useQuestionStore } from '../../stores/useQuestionStore';
import { useTreeStore } from '../../stores/useTreeStore';
import { api } from '../../services/api';

interface EditorHeaderProps {
  onOpenDeleteConfirm: (id: string, title: string) => void;
  layoutMode?: 'split' | 'stacked';
  onToggleLayout?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  onOpenDeleteConfirm,
  layoutMode = 'stacked',
  onToggleLayout
}) => {
  const { currentQuestion, updateField, forceSave } = useQuestionStore();
  const { setActiveView } = useTreeStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  if (!currentQuestion) return null;

  const handleOpenExternal = () => {
    if (currentQuestion.url) {
      api.openExternal(currentQuestion.url);
    }
  };

  const handleSyncUrl = async (urlToSync?: string) => {
    const targetUrl = (urlToSync || currentQuestion.url || '').trim();
    if (!targetUrl || !targetUrl.startsWith('http')) return;

    setIsSyncing(true);
    setSyncStatusMsg('Fetching problem...');

    try {
      const res = await api.importProblem(targetUrl);
      if (res.success && res.data) {
        // Update problem statement
        if (res.data.statement) {
          updateField('problemStatement', res.data.statement);
        }

        // Update title if it's default or requested
        if (
          !currentQuestion.title ||
          currentQuestion.title === 'New Problem' ||
          currentQuestion.title === 'Untitled Problem'
        ) {
          if (res.data.title) {
            updateField('title', res.data.title);
          }
        }

        // Update difficulty if extracted
        if (res.data.difficulty) {
          updateField('difficulty', res.data.difficulty);
        }

        // Update tags
        if (res.data.tags && res.data.tags.length > 0) {
          const mergedTags = Array.from(new Set([...(currentQuestion.tags || []), ...res.data.tags]));
          updateField('tags', mergedTags);
        }

        updateField('url', targetUrl);
        await forceSave();

        setSyncStatusMsg('Problem Synced ✓');
        setTimeout(() => setSyncStatusMsg(''), 3000);
      } else {
        setSyncStatusMsg(res.error || 'Failed to sync');
        setTimeout(() => setSyncStatusMsg(''), 4000);
      }
    } catch (err: any) {
      setSyncStatusMsg(err.message || 'Sync failed');
      setTimeout(() => setSyncStatusMsg(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePasteUrl = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.trim().startsWith('http')) {
      updateField('url', pastedText.trim());
      // Automatically trigger sync right after pasting!
      setTimeout(() => {
        handleSyncUrl(pastedText.trim());
      }, 50);
    }
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'solved': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'in_progress': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800';
      case 'need_revision': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      default: return 'text-slate-500 bg-slate-100 dark:bg-[#21262d] border-slate-200 dark:border-slate-700';
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'Hard': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
      default: return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      {/* Top row: Back button, URL open, Difficulty, Status, Star Important, Delete */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* External Problem Link */}
          {currentQuestion.url && (
            <button
              onClick={handleOpenExternal}
              className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open on Platform</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Difficulty Dropdown */}
          <select
            value={currentQuestion.difficulty}
            onChange={(e) => updateField('difficulty', e.target.value as Difficulty)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border cursor-pointer focus:outline-none ${getDifficultyColor(
              currentQuestion.difficulty
            )}`}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={currentQuestion.status}
            onChange={(e) => updateField('status', e.target.value as QuestionStatus)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer focus:outline-none ${getStatusColor(
              currentQuestion.status
            )}`}
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="solved">Solved</option>
            <option value="need_revision">Need Revision</option>
          </select>

          {/* Important Star Toggle */}
          <button
            onClick={() => updateField('isImportant', !currentQuestion.isImportant)}
            title={currentQuestion.isImportant ? 'Remove from Important' : 'Mark as Important (Ctrl+Shift+I)'}
            className={`p-1.5 rounded-md transition border ${
              currentQuestion.isImportant
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
            }`}
          >
            <Star className={`w-4 h-4 ${currentQuestion.isImportant ? 'fill-current' : ''}`} />
          </button>

          {/* Side-by-Side LeetCode Layout Toggle */}
          {onToggleLayout && (
            <button
              onClick={onToggleLayout}
              title={layoutMode === 'split' ? 'Switch to Stacked View' : 'Side-by-side View (LeetCode mode)'}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition border ${
                layoutMode === 'split'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {layoutMode === 'split' ? (
                <>
                  <Rows2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Stacked</span>
                </>
              ) : (
                <>
                  <Columns2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline text-[11px]">Side-by-Side</span>
                </>
              )}
            </button>
          )}

          {/* Delete Question */}
          <button
            onClick={() => onOpenDeleteConfirm(currentQuestion.id, currentQuestion.title)}
            title="Move to Trash"
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-900 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Problem Title Input */}
      <input
        type="text"
        value={currentQuestion.title}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="Enter problem title..."
        className="w-full text-2xl font-bold tracking-tight bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
      />

      {/* Problem Link URL field with Auto-Sync and Sync Button on Right */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Link2 className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            type="url"
            value={currentQuestion.url}
            onChange={(e) => updateField('url', e.target.value)}
            onPaste={handlePasteUrl}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSyncUrl();
              }
            }}
            placeholder="Paste problem link (auto-syncs on paste, e.g. https://leetcode.com/problems/assign-cookies/)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Sync / Fetch Statement Button on Right Side */}
        <button
          type="button"
          onClick={() => handleSyncUrl()}
          disabled={isSyncing || !currentQuestion.url}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm transition shrink-0"
          title="Fetch and sync problem statement from link"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Problem</span>
            </>
          )}
        </button>

        {syncStatusMsg && (
          <span className={`text-[11px] font-medium shrink-0 animate-in fade-in duration-150 ${
            syncStatusMsg.includes('Synced') ? 'text-emerald-500' : 'text-amber-500'
          }`}>
            {syncStatusMsg}
          </span>
        )}
      </div>
    </div>
  );
};
