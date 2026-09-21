import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Edit2, MoveRight } from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';
import { Branch } from '../../types';

export type BranchModalMode = 'create' | 'rename' | 'move';

interface BranchModalProps {
  isOpen: boolean;
  mode: BranchModalMode;
  targetId?: string | null;
  initialName?: string;
  initialParentId?: string | null;
  onClose: () => void;
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  mode,
  targetId,
  initialName = '',
  initialParentId = null,
  onClose
}) => {
  const { branches, createBranch, renameBranch, moveBranch } = useTreeStore();
  const [name, setName] = useState(initialName);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(initialParentId);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setSelectedParentId(initialParentId || null);
    }
  }, [isOpen, initialName, initialParentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      await createBranch(name || 'Untitled Branch', selectedParentId);
    } else if (mode === 'rename' && targetId) {
      await renameBranch(targetId, name);
    } else if (mode === 'move' && targetId) {
      await moveBranch(targetId, selectedParentId);
    }
    onClose();
  };

  // Filter out self and descendants when moving to prevent cyclic parent loops
  const eligibleParents = branches.filter(b => {
    if (!targetId) return true;
    if (b.id === targetId) return false;
    let curr = b.parentId;
    while (curr) {
      if (curr === targetId) return false;
      curr = branches.find(item => item.id === curr)?.parentId || null;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-md flex flex-col rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {mode === 'create' && <FolderPlus className="w-4 h-4 text-indigo-500" />}
            {mode === 'rename' && <Edit2 className="w-4 h-4 text-indigo-500" />}
            {mode === 'move' && <MoveRight className="w-4 h-4 text-indigo-500" />}
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {mode === 'create' && (selectedParentId ? 'New Sub Branch' : 'New Main Branch')}
              {mode === 'rename' && 'Rename Branch'}
              {mode === 'move' && 'Move Branch'}
            </h2>
          </div>

          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {mode !== 'move' && (
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Branch Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dynamic Programming, Sliding Window..."
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {(mode === 'create' || mode === 'move') && (
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Parent Branch</label>
              <select
                value={selectedParentId || ''}
                onChange={(e) => setSelectedParentId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">(None - Root Branch)</option>
                {eligibleParents.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              {mode === 'create' ? 'Create' : mode === 'rename' ? 'Rename' : 'Move'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
