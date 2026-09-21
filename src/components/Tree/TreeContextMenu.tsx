import React, { useEffect, useRef } from 'react';
import {
  Edit2,
  FolderPlus,
  FilePlus,
  MoveRight,
  Copy,
  Star,
  Trash2,
  ExternalLink
} from 'lucide-react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export type MenuType = 'branch' | 'question';

interface TreeContextMenuProps {
  type: MenuType;
  id: string;
  position: ContextMenuPosition | null;
  isStarred?: boolean;
  isImportant?: boolean;
  onClose: () => void;
  onRename: (id: string) => void;
  onNewSubBranch?: (id: string) => void;
  onNewQuestion?: (id: string) => void;
  onMoveTo: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onToggleImportant?: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TreeContextMenu: React.FC<TreeContextMenuProps> = ({
  type,
  id,
  position,
  isStarred,
  isImportant,
  onClose,
  onRename,
  onNewSubBranch,
  onNewQuestion,
  onMoveTo,
  onDuplicate,
  onToggleStar,
  onToggleImportant,
  onDelete
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!position) return null;

  // Prevent menu from overflowing screen edges
  const style = {
    top: Math.min(position.y, window.innerHeight - 280),
    left: Math.min(position.x, window.innerWidth - 220),
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 w-52 py-1 bg-white dark:bg-[#1c2128] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {type === 'branch' ? (
        <>
          <button
            onClick={() => { onRename(id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Rename Branch</span>
          </button>

          {onNewSubBranch && (
            <button
              onClick={() => { onNewSubBranch(id); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-500" />
              <span>New Sub Branch</span>
            </button>
          )}

          {onNewQuestion && (
            <button
              onClick={() => { onNewQuestion(id); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-500" />
              <span>New Question</span>
            </button>
          )}

          <button
            onClick={() => { onMoveTo(id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
          >
            <MoveRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Move to...</span>
          </button>

          <button
            onClick={() => { onDuplicate(id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate Branch</span>
          </button>

          {onToggleStar && (
            <button
              onClick={() => { onToggleStar(id); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
            >
              <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-500'}`} />
              <span>{isStarred ? 'Remove from Starred' : 'Add to Starred'}</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            onClick={() => { onDelete(id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to Trash</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => { onRename(id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Rename Problem</span>
          </button>

          <button
            onClick={() => { onMoveTo(id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
          >
            <MoveRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Move to Branch...</span>
          </button>

          <button
            onClick={() => { onDuplicate(id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate</span>
          </button>

          {onToggleImportant && (
            <button
              onClick={() => { onToggleImportant(id); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-[#282e37] transition text-left"
            >
              <Star className={`w-3.5 h-3.5 ${isImportant ? 'text-amber-500 fill-amber-500' : 'text-slate-500'}`} />
              <span>{isImportant ? 'Remove Important' : 'Mark Important ⭐'}</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            onClick={() => { onDelete(id); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to Trash</span>
          </button>
        </>
      )}
    </div>
  );
};
