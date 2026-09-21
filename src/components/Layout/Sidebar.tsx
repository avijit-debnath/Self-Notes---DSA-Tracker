import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Star,
  Trash2,
  Folder,
  ChevronRight} from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { BranchTree } from '../Tree/BranchTree';

interface SidebarProps {
  onOpenNewBranchModal: (parentId?: string) => void;
  onOpenNewQuestion: (branchId: string) => void;
  onOpenRenameModal: (id: string, currentName: string, type: 'branch' | 'question') => void;
  onOpenMoveModal: (id: string, type: 'branch' | 'question') => void;
  onOpenDeleteConfirm: (id: string, name: string, type: 'branch' | 'question') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewBranchModal,
  onOpenNewQuestion,
  onOpenRenameModal,
  onOpenMoveModal,
  onOpenDeleteConfirm
}) => {
  const {
    branches,
    questions,
    activeView,
    setActiveView,
    setActiveBranch,
    toggleExpandBranch
  } = useTreeStore();

  const { githubConfig, openSettings } = useSettingsStore();

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isStarredOpen, setIsStarredOpen] = useState(true);
  const isResizingRef = useRef(false);

  // Starred branches
  const starredBranches = branches.filter(b => b.isStarred);
  const importantCount = questions.filter(q => q.isImportant).length;

  // Handle resizer dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(220, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="relative flex flex-col h-full bg-slate-50 dark:bg-[#161b22] border-r border-slate-200 dark:border-[#21262d] select-none shrink-0"
    >
      {/* Top Section: Dashboard, Starred, Important */}
      <div className="p-2 space-y-0.5 border-b border-slate-200/70 dark:border-slate-800">
        {/* Dashboard link */}
        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeView === 'dashboard'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-indigo-500" />
          <span>Dashboard & Stats</span>
        </button>

        {/* Important Questions link */}
        <button
          onClick={() => setActiveView('important')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeView === 'important'
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Important Problems</span>
          </div>
          {importantCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              {importantCount}
            </span>
          )}
        </button>

        {/* Starred Branches Section */}
        {starredBranches.length > 0 && (
          <div className="pt-1.5">
            <button
              onClick={() => setIsStarredOpen(!isStarredOpen)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500" />
                <span>Starred Branches</span>
              </div>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${isStarredOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {isStarredOpen && (
              <div className="mt-0.5 space-y-0.5 pl-2">
                {starredBranches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBranch(b.id);
                      toggleExpandBranch(b.id);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#21262d] text-left truncate transition"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{b.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Branch Tree Navigation */}
      <div className="flex-1 flex flex-col min-h-0">
        <BranchTree
          onOpenNewBranchModal={onOpenNewBranchModal}
          onOpenNewQuestion={onOpenNewQuestion}
          onOpenRenameModal={onOpenRenameModal}
          onOpenMoveModal={onOpenMoveModal}
          onOpenDeleteConfirm={onOpenDeleteConfirm}
        />
      </div>

      {/* Bottom Section: Trash & Cloud Backup Status */}
      <div className="p-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
        {/* Trash */}
        <button
          onClick={() => setActiveView('trash')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
            activeView === 'trash'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#21262d]'
          }`}
        >
          <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
          <span>Trash</span>
        </button>

        {/* GitHub Backup Status Pill */}
        <button
          onClick={() => openSettings('backup')}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#21262d] transition group"
        >
          <div className="flex items-center gap-2 truncate">
            {githubConfig.lastBackupStatus === 'success' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            ) : githubConfig.lastBackupStatus === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            )}
            <span className="truncate">
              {githubConfig.token ? `GitHub: ${githubConfig.repo}` : 'GitHub Backup (Offline)'}
            </span>
          </div>
          <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition shrink-0">
            Sync
          </span>
        </button>
      </div>

      {/* Draggable Resizer Bar */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          isResizingRef.current = true;
          document.body.style.cursor = 'col-resize';
        }}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 active:bg-indigo-600 transition-colors"
      />
    </aside>
  );
};
