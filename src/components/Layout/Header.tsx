import React from 'react';
import {
  Search,
  Settings,
  Notebook,
  Sun,
  Moon,
  Star,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Plus,
  Download
} from 'lucide-react';
import { useTreeStore } from '../../stores/useTreeStore';
import { useQuestionStore } from '../../stores/useQuestionStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useSearchStore } from '../../stores/useSearchStore';

interface HeaderProps {
  onOpenImport: () => void;
  onOpenNewBranch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenImport, onOpenNewBranch }) => {
  const { activeView, activeQuestionId, activeBranchId, branches, questions, setActiveView, createQuestion } = useTreeStore();
  const { saveStatus, lastSavedAt } = useQuestionStore();
  const { theme, setTheme, openSettings, githubConfig } = useSettingsStore();
  const { openSearch } = useSearchStore();

  const activeQuestion = questions.find(q => q.id === activeQuestionId);

  // Compute breadcrumbs
  const breadcrumbs: string[] = [];
  if (activeQuestion) {
    let currBranch = branches.find(b => b.id === activeQuestion.branchId);
    while (currBranch) {
      breadcrumbs.unshift(currBranch.name);
      currBranch = branches.find(b => b.id === currBranch?.parentId);
    }
  } else if (activeBranchId) {
    let currBranch = branches.find(b => b.id === activeBranchId);
    while (currBranch) {
      breadcrumbs.unshift(currBranch.name);
      currBranch = branches.find(b => b.id === currBranch?.parentId);
    }
  }

  const handleCreateNewQuestion = async () => {
    const targetBranchId = activeBranchId || (branches.length > 0 ? branches[0].id : null);
    if (!targetBranchId) {
      onOpenNewBranch();
      return;
    }
    await createQuestion(targetBranchId, 'New Problem');
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] px-4 flex items-center justify-between select-none shrink-0 z-10">
      {/* Left: App Logo & Breadcrumb navigation */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2 font-bold text-slate-900 dark:text-white hover:opacity-80 transition group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-500/30 transition">
            <Notebook className="w-4 h-4" />
          </div>
          <span className="text-base tracking-tight font-semibold">SelfNote</span>
        </button>

        {breadcrumbs.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate pl-3 border-l border-slate-200 dark:border-slate-800">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-400 dark:text-slate-600">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]' : 'truncate max-w-[120px]'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Center: Global Search Bar trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={openSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-[#0d1117] hover:bg-slate-200/70 dark:hover:bg-[#21262d] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search problems, notes, solutions...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 text-slate-400">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Quick actions, Auto-save status, Theme & Settings */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Action buttons */}
        <button
          onClick={handleCreateNewQuestion}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-sm transition"
          title="Create New Problem (Ctrl + N)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Problem</span>
        </button>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 transition"
          title="Import problem from LeetCode / GeeksforGeeks"
        >
          <Download className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline">Import</span>
        </button>

        {/* Auto Save Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0d1117] rounded-md border border-slate-200/60 dark:border-slate-800">
          {saveStatus === 'saving' && (
            <>
              <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
              <span className="text-amber-500 font-medium">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-rose-500" />
              <span className="text-rose-500 font-medium">Save Error</span>
            </>
          )}
        </div>

        {/* Starred shortcut */}
        <button
          onClick={() => setActiveView('important')}
          className={`p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#21262d] transition ${
            activeView === 'important' ? 'text-amber-500 bg-amber-500/10' : ''
          }`}
          title="Important Problems"
        >
          <Star className="w-4 h-4 fill-current" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#21262d] transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings button */}
        <button
          onClick={() => openSettings('appearance')}
          className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#21262d] transition"
          title="Application Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
