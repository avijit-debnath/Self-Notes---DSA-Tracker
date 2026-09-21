import React, { useState } from 'react';
import { FileCode, Star, MoreVertical, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Question } from '../../types';
import { useTreeStore } from '../../stores/useTreeStore';
import { TreeContextMenu, ContextMenuPosition } from './TreeContextMenu';

interface QuestionNodeProps {
  question: Question;
  depth: number;
  onOpenMoveModal: (id: string, type: 'question') => void;
  onOpenRenameModal: (id: string, currentName: string, type: 'question') => void;
  onOpenDeleteConfirm: (id: string, name: string, type: 'question') => void;
}

export const QuestionNode: React.FC<QuestionNodeProps> = ({
  question,
  depth,
  onOpenMoveModal,
  onOpenRenameModal,
  onOpenDeleteConfirm
}) => {
  const {
    activeQuestionId,
    setActiveQuestion,
    toggleImportantQuestion,
    duplicateQuestion
  } = useTreeStore();

  const [contextPos, setContextPos] = useState<ContextMenuPosition | null>(null);
  const isActive = activeQuestionId === question.id;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextPos({ x: e.clientX, y: e.clientY });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-emerald-500';
      case 'Hard': return 'bg-rose-500';
      default: return 'bg-amber-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'solved':
        return <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />;
      case 'in_progress':
        return <Clock className="w-2.5 h-2.5 text-indigo-400" />;
      case 'need_revision':
        return <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div
        onClick={() => setActiveQuestion(question.id)}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'question', id: question.id }));
        }}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`group relative flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer transition select-none text-xs ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Difficulty dot */}
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDifficultyColor(question.difficulty)}`}
            title={`Difficulty: ${question.difficulty}`}
          />

          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />

          <span className="truncate flex-1">{question.title}</span>

          {getStatusIcon(question.status)}

          {question.isImportant && (
            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
          )}
        </div>

        {/* Hover action menu trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setContextPos({ x: rect.right, y: rect.bottom });
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      </div>

      <TreeContextMenu
        type="question"
        id={question.id}
        position={contextPos}
        isImportant={question.isImportant}
        onClose={() => setContextPos(null)}
        onRename={() => onOpenRenameModal(question.id, question.title, 'question')}
        onMoveTo={() => onOpenMoveModal(question.id, 'question')}
        onDuplicate={() => duplicateQuestion(question.id)}
        onToggleImportant={() => toggleImportantQuestion(question.id)}
        onDelete={() => onOpenDeleteConfirm(question.id, question.title, 'question')}
      />
    </>
  );
};
