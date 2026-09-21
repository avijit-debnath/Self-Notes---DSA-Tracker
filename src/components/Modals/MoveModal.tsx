import React, { useState, useMemo } from 'react';
import { X, Folder, FolderOpen, Search, MoveRight, Check } from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';
import { useQuestionStore } from '../../stores/useQuestionStore';
import { Branch } from '../../types';

interface MoveModalProps {
  isOpen: boolean;
  itemId: string | null;
  itemTitle: string;
  itemType: 'question' | 'branch';
  currentBranchId?: string | null;
  onClose: () => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  itemId,
  itemTitle,
  itemType,
  currentBranchId = null,
  onClose
}) => {
  const { branches, questions, moveQuestion, moveBranch } = useTreeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state on open
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedDestId(null);
      setIsSubmitting(false);
    }
  }, [isOpen, itemId]);

  // Compute hierarchical representation of branches
  const branchTree = useMemo(() => {
    // For moving a branch, prevent selecting self or descendants to avoid cycles
    const isExcluded = (bId: string): boolean => {
      if (itemType !== 'branch' || !itemId) return false;
      if (bId === itemId) return true;
      let curr = branches.find(b => b.id === bId)?.parentId;
      while (curr) {
        if (curr === itemId) return true;
        curr = branches.find(b => b.id === curr)?.parentId;
      }
      return false;
    };

    const getBranchPath = (bId: string): string => {
      const parts: string[] = [];
      let curr: string | null | undefined = bId;
      while (curr) {
        const found = branches.find(b => b.id === curr);
        if (!found) break;
        parts.unshift(found.name);
        curr = found.parentId;
      }
      return parts.join(' / ');
    };

    const list: Array<{
      branch: Branch;
      depth: number;
      path: string;
      disabled: boolean;
      isCurrent: boolean;
      questionCount: number;
    }> = [];

    const traverse = (parentId: string | null, depth: number) => {
      const children = branches
        .filter(b => b.parentId === parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      for (const b of children) {
        const disabled = isExcluded(b.id);
        const isCurrent = itemType === 'question' ? b.id === currentBranchId : b.id === currentBranchId;
        const qCount = questions.filter(q => q.branchId === b.id).length;

        list.push({
          branch: b,
          depth,
          path: getBranchPath(b.id),
          disabled,
          isCurrent,
          questionCount: qCount
        });

        traverse(b.id, depth + 1);
      }
    };

    traverse(null, 0);
    return list;
  }, [branches, questions, itemId, itemType, currentBranchId]);

  // Filtered branches by search
  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branchTree;
    const q = searchQuery.toLowerCase().trim();
    return branchTree.filter(
      item => item.branch.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)
    );
  }, [branchTree, searchQuery]);

  if (!isOpen || !itemId) return null;

  const handleConfirmMove = async () => {
    if (selectedDestId === null) return;
    setIsSubmitting(true);

    try {
      if (itemType === 'question') {
        await moveQuestion(itemId, selectedDestId);
        // If this question is currently open in editor, update its branchId in Question store
        const curQ = useQuestionStore.getState().currentQuestion;
        if (curQ && curQ.id === itemId) {
          useQuestionStore.setState({
            currentQuestion: { ...curQ, branchId: selectedDestId }
          });
        }
      } else {
        // Moving branch to another branch (or root if root option)
        const newParentId = selectedDestId === '__ROOT__' ? null : selectedDestId;
        await moveBranch(itemId, newParentId);
      }
      onClose();
    } catch (err) {
      console.error('Failed to move:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBranchName = selectedDestId === '__ROOT__'
    ? 'Root Level'
    : branches.find(b => b.id === selectedDestId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-lg flex flex-col rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <MoveRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Move {itemType === 'question' ? 'Problem' : 'Branch'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                "{itemTitle}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0d1117]/30">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination branch..."
              autoFocus
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Branch Selection Tree List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 min-h-[160px] max-h-[380px]">
          {/* Root option for moving branches */}
          {itemType === 'branch' && (
            <div
              onClick={() => setSelectedDestId('__ROOT__')}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border text-xs ${
                selectedDestId === '__ROOT__'
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'border-transparent hover:bg-slate-100 dark:hover:bg-[#21262d] text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>(Root Level - No Parent)</span>
              </div>
              {selectedDestId === '__ROOT__' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </div>
          )}

          {filteredBranches.length > 0 ? (
            filteredBranches.map(item => {
              const isSelected = selectedDestId === item.branch.id;

              return (
                <div
                  key={item.branch.id}
                  onClick={() => {
                    if (!item.disabled && !item.isCurrent) {
                      setSelectedDestId(item.branch.id);
                    }
                  }}
                  style={{ paddingLeft: `${Math.min(item.depth * 16 + 8, 80)}px` }}
                  className={`flex items-center justify-between py-2 pr-3 rounded-lg transition border text-xs ${
                    item.disabled || item.isCurrent
                      ? 'opacity-50 cursor-not-allowed border-transparent bg-slate-50/50 dark:bg-slate-900/20 text-slate-400'
                      : isSelected
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium shadow-xs'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-[#21262d] text-slate-700 dark:text-slate-200 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isSelected ? (
                      <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-indigo-400/80 shrink-0" />
                    )}

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{item.branch.name}</span>
                        {item.isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            Current Location
                          </span>
                        )}
                      </div>

                      {searchQuery && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {item.path}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.questionCount} {item.questionCount === 1 ? 'prob' : 'probs'}
                    </span>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching branches found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0d1117]/50">
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
            {selectedDestId ? (
              <span>Move to: <strong className="text-slate-800 dark:text-slate-200">{selectedBranchName}</strong></span>
            ) : (
              <span>Select a destination branch</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#282e37] rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedDestId || isSubmitting}
              onClick={handleConfirmMove}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-sm transition flex items-center gap-1.5"
            >
              <MoveRight className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Moving...' : 'Move'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
