import React, { useState } from 'react';
import { Branch, Question } from '../../types';
import { BranchNode } from './BranchNode';
import { Search, FolderPlus, ChevronsUpDown, ChevronDown } from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';

interface BranchTreeProps {
  onOpenNewBranchModal: (parentId?: string) => void;
  onOpenNewQuestion: (branchId: string) => void;
  onOpenRenameModal: (id: string, currentName: string, type: 'branch' | 'question') => void;
  onOpenMoveModal: (id: string, type: 'branch' | 'question') => void;
  onOpenDeleteConfirm: (id: string, name: string, type: 'branch' | 'question') => void;
}

export const BranchTree: React.FC<BranchTreeProps> = ({
  onOpenNewBranchModal,
  onOpenNewQuestion,
  onOpenRenameModal,
  onOpenMoveModal,
  onOpenDeleteConfirm
}) => {
  const {
    branches,
    questions,
    expandAll,
    collapseAll
  } = useTreeStore();

  const [filterText, setFilterText] = useState('');

  // Filter root branches or filtered matches
  const rootBranches = branches.filter(b => b.parentId === null);

  const filteredBranches = filterText.trim()
    ? branches.filter(b => b.name.toLowerCase().includes(filterText.toLowerCase()))
    : rootBranches;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Quick Search inside Tree & Tree Actions */}
      <div className="px-3 py-2 flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="relative flex-1">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter tree..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs rounded bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={expandAll}
          title="Expand All Branches"
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#21262d] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={collapseAll}
          title="Collapse All Branches"
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#21262d] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onOpenNewBranchModal()}
          title="New Main Branch"
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#21262d] text-slate-400 hover:text-indigo-500 transition"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tree Content Area */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5 select-none">
        {filteredBranches.length > 0 ? (
          filteredBranches.map(branch => (
            <BranchNode
              key={branch.id}
              branch={branch}
              depth={0}
              allBranches={branches}
              allQuestions={questions}
              onOpenNewBranchModal={onOpenNewBranchModal}
              onOpenNewQuestion={onOpenNewQuestion}
              onOpenRenameModal={onOpenRenameModal}
              onOpenMoveModal={onOpenMoveModal}
              onOpenDeleteConfirm={onOpenDeleteConfirm}
            />
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {filterText ? 'No matching branches' : 'No branches created yet.'}
          </div>
        )}
      </div>
    </div>
  );
};
