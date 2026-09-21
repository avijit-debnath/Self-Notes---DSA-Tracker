import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, ArrowLeft, AlertTriangle, Folder, FileCode } from 'lucide-react';
import { Branch, Question } from '../../types';
import { api } from '../../services/api';
import { useTreeStore } from '../../stores/useTreeStore';

export const TrashView: React.FC = () => {
  const { setActiveView, loadInitialData } = useTreeStore();
  const [deletedBranches, setDeletedBranches] = useState<Branch[]>([]);
  const [deletedQuestions, setDeletedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrash = async () => {
    setIsLoading(true);
    try {
      const items = await api.getTrashItems();
      setDeletedBranches(items.branches);
      setDeletedQuestions(items.questions);
    } catch (err) {
      console.error('Failed to load trash items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (type: 'branch' | 'question', id: string) => {
    await api.restoreItem(type, id);
    await fetchTrash();
    await loadInitialData();
  };

  const handleEmptyTrash = async () => {
    if (window.confirm('Are you sure you want to permanently delete all items in Trash? This cannot be undone.')) {
      await api.emptyTrash();
      await fetchTrash();
      await loadInitialData();
    }
  };

  const totalTrashCount = deletedBranches.length + deletedQuestions.length;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-[#0d1117] p-6 sm:p-10 select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('dashboard')}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-[#21262d] text-slate-500 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Trash</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Items in trash can be restored or permanently removed
              </p>
            </div>
          </div>

          {totalTrashCount > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          )}
        </div>

        {totalTrashCount === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Trash2 className="w-12 h-12 stroke-[1.2] text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Trash is empty</p>
            <p className="text-xs text-slate-400 mt-1">Deleted branches and questions will appear here.</p>
          </div>
        )}

        {/* Deleted Branches */}
        {deletedBranches.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Deleted Branches ({deletedBranches.length})
            </h3>

            <div className="flex flex-col gap-2">
              {deletedBranches.map(b => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{b.name}</span>
                  </div>

                  <button
                    onClick={() => handleRestore('branch', b.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deleted Questions */}
        {deletedQuestions.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Deleted Questions ({deletedQuestions.length})
            </h3>

            <div className="flex flex-col gap-2">
              {deletedQuestions.map(q => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <FileCode className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{q.title}</span>
                  </div>

                  <button
                    onClick={() => handleRestore('question', q.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
