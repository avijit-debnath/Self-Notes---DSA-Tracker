import React, { useState, useEffect } from 'react';
import { X, Edit2, FileCode, Folder } from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';
import { useQuestionStore } from '../../stores/useQuestionStore';

interface RenameModalProps {
  isOpen: boolean;
  itemId: string | null;
  currentName: string;
  type: 'question' | 'branch';
  onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  itemId,
  currentName,
  type,
  onClose
}) => {
  const { renameBranch, renameQuestion } = useTreeStore();
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setIsSubmitting(false);
    }
  }, [isOpen, currentName]);

  if (!isOpen || !itemId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (type === 'question') {
        await renameQuestion(itemId, name.trim());
        const curQ = useQuestionStore.getState().currentQuestion;
        if (curQ && curQ.id === itemId) {
          useQuestionStore.setState({
            currentQuestion: { ...curQ, title: name.trim() }
          });
        }
      } else {
        await renameBranch(itemId, name.trim());
      }
      onClose();
    } catch (err) {
      console.error('Failed to rename:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-md flex flex-col rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {type === 'question' ? (
              <FileCode className="w-4 h-4 text-indigo-500" />
            ) : (
              <Folder className="w-4 h-4 text-indigo-500" />
            )}
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Rename {type === 'question' ? 'Problem' : 'Branch'}
            </h2>
          </div>

          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              {type === 'question' ? 'Problem Title' : 'Branch Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter title..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#282e37] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-sm transition"
            >
              {isSubmitting ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
