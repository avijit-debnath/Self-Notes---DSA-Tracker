import React, { useEffect, useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { QuestionEditorView } from './components/QuestionEditor/QuestionEditorView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ImportantView } from './components/Dashboard/ImportantView';
import { TrashView } from './components/Trash/TrashView';
import { ProblemImportModal } from './components/Modals/ProblemImportModal';
import { GlobalSearchModal } from './components/Modals/GlobalSearchModal';
import { BranchModal, BranchModalMode } from './components/Modals/BranchModal';
import { MoveModal } from './components/Modals/MoveModal';
import { RenameModal } from './components/Modals/RenameModal';
import { ConfirmModal } from './components/Modals/ConfirmModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { useTreeStore } from './stores/useTreeStore';
import { useQuestionStore } from './stores/useQuestionStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { useSearchStore } from './stores/useSearchStore';

export const App: React.FC = () => {
  const {
    activeView,
    branches,
    questions,
    loadInitialData,
    createQuestion,
    deleteBranch,
    deleteQuestion,
    toggleImportantQuestion,
    activeQuestionId
  } = useTreeStore();

  const { forceSave } = useQuestionStore();
  const { theme, setTheme, runBackupNow } = useSettingsStore();
  const { openSearch } = useSearchStore();

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [branchModalState, setBranchModalState] = useState<{
    isOpen: boolean;
    mode: BranchModalMode;
    targetId?: string | null;
    initialName?: string;
    initialParentId?: string | null;
  }>({ isOpen: false, mode: 'create' });

  const [moveModalState, setMoveModalState] = useState<{
    isOpen: boolean;
    id: string | null;
    title: string;
    type: 'question' | 'branch';
    currentBranchId?: string | null;
  }>({
    isOpen: false,
    id: null,
    title: '',
    type: 'question',
    currentBranchId: null
  });

  const [renameModalState, setRenameModalState] = useState<{
    isOpen: boolean;
    id: string | null;
    currentName: string;
    type: 'question' | 'branch';
  }>({
    isOpen: false,
    id: null,
    currentName: '',
    type: 'question'
  });

  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Initialize theme and load data
  useEffect(() => {
    setTheme(theme);
    loadInitialData();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K: Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }

      // Ctrl + N: New Question
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (branches.length > 0) {
          createQuestion(branches[0].id, 'New Problem');
        }
      }

      // Ctrl + Shift + N: New Branch
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setBranchModalState({
          isOpen: true,
          mode: 'create',
          initialParentId: null
        });
      }

      // Ctrl + S: Force Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        forceSave();
      }

      // Ctrl + Shift + I: Toggle Important
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (activeQuestionId) {
          toggleImportantQuestion(activeQuestionId);
        }
      }

      // Ctrl + Shift + B: Backup Now
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        runBackupNow();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [branches, activeQuestionId, openSearch, createQuestion, forceSave, toggleImportantQuestion, runBackupNow]);

  // Handlers for branch actions
  const handleOpenNewBranchModal = (parentId?: string) => {
    setBranchModalState({
      isOpen: true,
      mode: 'create',
      initialParentId: parentId || null
    });
  };

  const handleOpenRenameModal = (id: string, currentName: string, type: 'branch' | 'question') => {
    setRenameModalState({
      isOpen: true,
      id,
      currentName,
      type
    });
  };

  const handleOpenMoveModal = (id: string, type: 'branch' | 'question') => {
    if (type === 'question') {
      const q = questions.find(item => item.id === id);
      setMoveModalState({
        isOpen: true,
        id,
        title: q?.title || 'Problem',
        type: 'question',
        currentBranchId: q?.branchId || null
      });
    } else {
      const b = branches.find(item => item.id === id);
      setMoveModalState({
        isOpen: true,
        id,
        title: b?.name || 'Branch',
        type: 'branch',
        currentBranchId: b?.parentId || null
      });
    }
  };

  const handleOpenDeleteConfirm = (id: string, name: string, type: 'branch' | 'question') => {
    if (type === 'branch') {
      const questionsInBranch = useTreeStore.getState().questions.filter(q => q.branchId === id);
      setConfirmModalState({
        isOpen: true,
        title: 'Move Branch to Trash',
        message: questionsInBranch.length > 0
          ? `This branch contains ${questionsInBranch.length} question(s).\n\nMove "${name}" and all its questions to Trash?`
          : `Move branch "${name}" to Trash?`,
        onConfirm: () => deleteBranch(id)
      });
    } else {
      setConfirmModalState({
        isOpen: true,
        title: 'Move Question to Trash',
        message: `Move "${name}" to Trash? You can restore it anytime from the Trash section.`,
        onConfirm: () => deleteQuestion(id)
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Application Header */}
      <Header
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenNewBranch={() => handleOpenNewBranchModal()}
      />

      {/* Main App Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Resizable Sidebar */}
        <Sidebar
          onOpenNewBranchModal={handleOpenNewBranchModal}
          onOpenNewQuestion={(branchId) => createQuestion(branchId, 'New Problem')}
          onOpenRenameModal={handleOpenRenameModal}
          onOpenMoveModal={handleOpenMoveModal}
          onOpenDeleteConfirm={handleOpenDeleteConfirm}
        />

        {/* Center Main Viewport */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'important' && <ImportantView />}
          {activeView === 'trash' && <TrashView />}
          {activeView === 'question' && (
            <QuestionEditorView
              onOpenDeleteConfirm={(id, title) => handleOpenDeleteConfirm(id, title, 'question')}
              onOpenMoveModal={(id) => handleOpenMoveModal(id, 'question')}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ProblemImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <GlobalSearchModal />

      <BranchModal
        isOpen={branchModalState.isOpen}
        mode={branchModalState.mode}
        targetId={branchModalState.targetId}
        initialName={branchModalState.initialName}
        initialParentId={branchModalState.initialParentId}
        onClose={() => setBranchModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <MoveModal
        isOpen={moveModalState.isOpen}
        itemId={moveModalState.id}
        itemTitle={moveModalState.title}
        itemType={moveModalState.type}
        currentBranchId={moveModalState.currentBranchId}
        onClose={() => setMoveModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <RenameModal
        isOpen={renameModalState.isOpen}
        itemId={renameModalState.id}
        currentName={renameModalState.currentName}
        type={renameModalState.type}
        onClose={() => setRenameModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <SettingsModal />
    </div>
  );
};
