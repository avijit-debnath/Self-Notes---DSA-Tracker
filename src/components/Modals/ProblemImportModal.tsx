import React, { useState } from 'react';
import { X, Download, Link2, Sparkles, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';
import { api } from '../../services/api';
import { Difficulty, ImportedProblem } from '../../types';

interface ProblemImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProblemImportModal: React.FC<ProblemImportModalProps> = ({ isOpen, onClose }) => {
  const { branches, activeBranchId, createQuestion } = useTreeStore();
  const [url, setUrl] = useState('');
  const [targetBranchId, setTargetBranchId] = useState<string>(activeBranchId || (branches[0]?.id || ''));
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Editable preview fields after extraction
  const [importedData, setImportedData] = useState<ImportedProblem | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!url.trim()) return;
    setIsImporting(true);
    setErrorMsg('');

    try {
      const result = await api.importProblem(url.trim());
      if (result.success && result.data) {
        setImportedData(result.data);
      } else {
        setErrorMsg(result.error || 'Unable to automatically extract problem. You can enter details manually.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Extraction failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async () => {
    if (!importedData || !targetBranchId) return;

    const newQ = await createQuestion(targetBranchId, importedData.title);
    await api.saveQuestion({
      ...newQ,
      title: importedData.title,
      url: importedData.url,
      difficulty: importedData.difficulty,
      problemStatement: importedData.statement,
      tags: importedData.tags || []
    });

    onClose();
    // Reset state
    setUrl('');
    setImportedData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl flex flex-col rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Import DSA Problem</h2>
              <p className="text-[11px] text-slate-400">Extract problem statement & details from LeetCode or GFG</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#21262d] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Target Branch Selector */}
          <div className="flex flex-col gap-1.5 text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Save to Branch</label>
            <select
              value={targetBranchId}
              onChange={(e) => setTargetBranchId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* URL Input Bar */}
          <div className="flex flex-col gap-1.5 text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Paste Problem Link</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://leetcode.com/problems/two-sum/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleExtract(); }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleExtract}
                disabled={isImporting || !url.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-sm transition shrink-0"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Extracted preview - Fully editable before saving */}
          {importedData && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Problem Extracted Successfully (Editable)</span>
                </span>

                <select
                  value={importedData.difficulty}
                  onChange={(e) => setImportedData({ ...importedData, difficulty: e.target.value as Difficulty })}
                  className="px-2 py-0.5 text-xs font-semibold rounded bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-slate-500 font-medium">Title:</label>
                <input
                  type="text"
                  value={importedData.title}
                  onChange={(e) => setImportedData({ ...importedData, title: e.target.value })}
                  className="px-2.5 py-1.5 text-xs rounded bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Problem Statement */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-slate-500 font-medium">Problem Statement:</label>
                <textarea
                  value={importedData.statement}
                  onChange={(e) => setImportedData({ ...importedData, statement: e.target.value })}
                  rows={6}
                  className="w-full p-2.5 text-xs rounded bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#1c2128]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#282e37] rounded-lg transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!importedData}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-sm transition"
          >
            Save to Branch
          </button>
        </div>
      </div>
    </div>
  );
};
