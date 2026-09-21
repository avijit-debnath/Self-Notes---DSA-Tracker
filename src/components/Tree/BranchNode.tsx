import React, { useState } from 'react';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Star,
  Plus,
  MoreVertical
} from 'lucide-react';
import { Branch, Question } from '../../types';
import { useTreeStore } from '../../stores/useTreeStore';
import { QuestionNode } from './QuestionNode';
import { TreeContextMenu, ContextMenuPosition } from './TreeContextMenu';

interface BranchNodeProps {
  branch: Branch;
  depth: number;
  allBranches: Branch[];
  allQuestions: Question[];
  onOpenNewBranchModal: (parentId: string) => void;
  onOpenNewQuestion: (branchId: string) => void;
  onOpenRenameModal: (id: string, currentName: string, type: 'branch' | 'question') => void;
  onOpenMoveModal: (id: string, type: 'branch' | 'question') => void;
  onOpenDeleteConfirm: (id: string, name: string, type: 'branch' | 'question') => void;
}

export const BranchNode: React.FC<BranchNodeProps> = ({
  branch,
  depth,
  allBranches,
  allQuestions,
  onOpenNewBranchModal,
  onOpenNewQuestion,
  onOpenRenameModal,
  onOpenMoveModal,
  onOpenDeleteConfirm
}) => {
  const {
    expandedBranchIds,
    toggleExpandBranch,
    activeBranchId,
    setActiveBranch,
    toggleStarBranch,
    duplicateBranch,
    moveBranch,
    moveQuestion
  } = useTreeStore();

  const [contextPos, setContextPos] = useState<ContextMenuPosition | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isExpanded = expandedBranchIds.has(branch.id);
  const isActive = activeBranchId === branch.id;

  // Direct child sub-branches
  const childBranches = allBranches.filter(b => b.parentId === branch.id);
  // Direct questions inside this branch
  const childQuestions = allQuestions.filter(q => q.branchId === branch.id);

  const totalQuestionsCount = allQuestions.filter(q => {
    if (q.branchId === branch.id) return true;
    // Check if q.branchId is a descendant of branch.id
    let curr = allBranches.find(b => b.id === q.branchId);
    while (curr) {
      if (curr.parentId === branch.id) return true;
      curr = allBranches.find(b => b.id === curr?.parentId);
    }
    return false;
  }).length;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const { type, id } = JSON.parse(dataStr);
      if (type === 'question') {
        await moveQuestion(id, branch.id);
      } else if (type === 'branch' && id !== branch.id) {
        await moveBranch(id, branch.id);
      }
    } catch (err) {
      console.error('Failed to handle drop:', err);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Branch Row */}
      <div
        onClick={() => {
          setActiveBranch(branch.id);
          toggleExpandBranch(branch.id);
        }}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'branch', id: branch.id }));
        }}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`group relative flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer transition select-none text-xs font-medium ${
          isDragOver ? 'bg-indigo-100/70 dark:bg-indigo-900/40 border border-dashed border-indigo-500' : ''
        } ${
          isActive
            ? 'bg-slate-200/70 dark:bg-[#21262d] text-slate-900 dark:text-white'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c2128]'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Chevron */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpandBranch(branch.id);
            }}
            className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>

          {/* Folder Icon */}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-indigo-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
          )}

          {/* Branch Name */}
          <span className="truncate flex-1">{branch.name}</span>

          {/* Star indicator */}
          {branch.isStarred && (
            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
          )}

          {/* Question count badge */}
          {totalQuestionsCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-100 dark:bg-[#282e37] text-slate-400 font-mono">
              {totalQuestionsCount}
            </span>
          )}
        </div>

        {/* Action icons shown on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 pl-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenNewQuestion(branch.id);
            }}
            title="Add Question to this branch"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500 transition"
          >
            <Plus className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setContextPos({ x: rect.right, y: rect.bottom });
            }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Children: Sub-branches and Questions (Recursive) */}
      {isExpanded && (
        <div className="flex flex-col relative mt-0.5">
          {/* Render Child Sub-Branches */}
          {childBranches.map(subBranch => (
            <BranchNode
              key={subBranch.id}
              branch={subBranch}
              depth={depth + 1}
              allBranches={allBranches}
              allQuestions={allQuestions}
              onOpenNewBranchModal={onOpenNewBranchModal}
              onOpenNewQuestion={onOpenNewQuestion}
              onOpenRenameModal={onOpenRenameModal}
              onOpenMoveModal={onOpenMoveModal}
              onOpenDeleteConfirm={onOpenDeleteConfirm}
            />
          ))}

          {/* Render Child Questions */}
          {childQuestions.map(q => (
            <QuestionNode
              key={q.id}
              question={q}
              depth={depth + 1}
              onOpenMoveModal={onOpenMoveModal}
              onOpenRenameModal={onOpenRenameModal}
              onOpenDeleteConfirm={onOpenDeleteConfirm}
            />
          ))}

          {childBranches.length === 0 && childQuestions.length === 0 && (
            <div
              style={{ paddingLeft: `${(depth + 1) * 14 + 14}px` }}
              className="py-1 text-[11px] italic text-slate-400 dark:text-slate-500"
            >
              Empty branch
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      <TreeContextMenu
        type="branch"
        id={branch.id}
        position={contextPos}
        isStarred={branch.isStarred}
        onClose={() => setContextPos(null)}
        onRename={() => onOpenRenameModal(branch.id, branch.name, 'branch')}
        onNewSubBranch={() => onOpenNewBranchModal(branch.id)}
        onNewQuestion={() => onOpenNewQuestion(branch.id)}
        onMoveTo={() => onOpenMoveModal(branch.id, 'branch')}
        onDuplicate={() => duplicateBranch(branch.id)}
        onToggleStar={() => toggleStarBranch(branch.id)}
        onDelete={() => onOpenDeleteConfirm(branch.id, branch.name, 'branch')}
      />
    </div>
  );
};
