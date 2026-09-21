import { create } from 'zustand';
import { Branch, Question } from '../types';
import { api } from '../services/api';

export type ActiveView = 'dashboard' | 'question' | 'important' | 'trash';

interface TreeState {
  branches: Branch[];
  questions: Question[];
  expandedBranchIds: Set<string>;
  activeView: ActiveView;
  activeBranchId: string | null;
  activeQuestionId: string | null;
  isLoading: boolean;

  // Actions
  loadInitialData: () => Promise<void>;
  setActiveView: (view: ActiveView) => void;
  setActiveQuestion: (id: string | null) => void;
  setActiveBranch: (id: string | null) => void;
  toggleExpandBranch: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Branch CRUD
  createBranch: (name: string, parentId?: string | null) => Promise<Branch>;
  renameBranch: (id: string, newName: string) => Promise<void>;
  toggleStarBranch: (id: string) => Promise<void>;
  duplicateBranch: (id: string) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  moveBranch: (id: string, newParentId: string | null) => Promise<void>;

  // Question CRUD
  createQuestion: (branchId: string, title?: string) => Promise<Question>;
  deleteQuestion: (id: string) => Promise<void>;
  toggleImportantQuestion: (id: string) => Promise<void>;
  duplicateQuestion: (id: string) => Promise<void>;
  moveQuestion: (id: string, newBranchId: string) => Promise<void>;
  renameQuestion: (id: string, newTitle: string) => Promise<void>;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  branches: [],
  questions: [],
  expandedBranchIds: new Set<string>(['b_arrays', 'b_two_ptr', 'b_sliding_win']),
  activeView: 'dashboard',
  activeBranchId: null,
  activeQuestionId: null,
  isLoading: true,

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const [branches, questions] = await Promise.all([
        api.getBranches(),
        api.getQuestions()
      ]);
      set({ branches, questions, isLoading: false });
    } catch (err) {
      console.error('Failed to load tree data:', err);
      set({ isLoading: false });
    }
  },

  setActiveView: (view) => {
    set({ activeView: view });
  },

  setActiveQuestion: (id) => {
    if (id) {
      const q = get().questions.find(x => x.id === id);
      set({
        activeView: 'question',
        activeQuestionId: id,
        activeBranchId: q ? q.branchId : get().activeBranchId
      });
      // Expand branch containing this question
      if (q) {
        const next = new Set(get().expandedBranchIds);
        next.add(q.branchId);
        set({ expandedBranchIds: next });
      }
    } else {
      set({ activeQuestionId: null });
    }
  },

  setActiveBranch: (id) => {
    set({ activeBranchId: id });
    if (id) {
      const next = new Set(get().expandedBranchIds);
      next.add(id);
      set({ expandedBranchIds: next });
    }
  },

  toggleExpandBranch: (id) => {
    const next = new Set(get().expandedBranchIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ expandedBranchIds: next });
  },

  expandAll: () => {
    const allIds = get().branches.map(b => b.id);
    set({ expandedBranchIds: new Set(allIds) });
  },

  collapseAll: () => {
    set({ expandedBranchIds: new Set() });
  },

  createBranch: async (name, parentId = null) => {
    const id = 'b_' + Math.random().toString(36).substring(2, 9);
    const newBranch: Branch = {
      id,
      parentId: parentId || null,
      name: name.trim() || 'Untitled Branch',
      orderIndex: get().branches.length,
      isStarred: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await api.saveBranch(newBranch);
    set(state => {
      const nextExpanded = new Set(state.expandedBranchIds);
      if (parentId) nextExpanded.add(parentId);
      return {
        branches: [...state.branches, saved],
        expandedBranchIds: nextExpanded,
        activeBranchId: saved.id
      };
    });
    return saved;
  },

  renameBranch: async (id, newName) => {
    const branch = get().branches.find(b => b.id === id);
    if (!branch) return;
    const updated = { ...branch, name: newName.trim() || branch.name };
    await api.saveBranch(updated);
    set(state => ({
      branches: state.branches.map(b => b.id === id ? updated : b)
    }));
  },

  toggleStarBranch: async (id) => {
    const branch = get().branches.find(b => b.id === id);
    if (!branch) return;
    const updated = { ...branch, isStarred: !branch.isStarred };
    await api.saveBranch(updated);
    set(state => ({
      branches: state.branches.map(b => b.id === id ? updated : b)
    }));
  },

  duplicateBranch: async (id) => {
    const branch = get().branches.find(b => b.id === id);
    if (!branch) return;
    const newBranch = await get().createBranch(`${branch.name} (Copy)`, branch.parentId);
    // Copy questions in branch
    const branchQuestions = get().questions.filter(q => q.branchId === id);
    for (const q of branchQuestions) {
      const newQ = await get().createQuestion(newBranch.id, `${q.title} (Copy)`);
      await api.saveQuestion({
        ...q,
        id: newQ.id,
        branchId: newBranch.id,
        title: `${q.title} (Copy)`
      });
    }
  },

  deleteBranch: async (id) => {
    await api.deleteBranch(id, true);
    set(state => ({
      branches: state.branches.filter(b => b.id !== id),
      questions: state.questions.filter(q => q.branchId !== id),
      activeBranchId: state.activeBranchId === id ? null : state.activeBranchId,
      activeQuestionId: state.questions.find(q => q.id === state.activeQuestionId && q.branchId === id) ? null : state.activeQuestionId,
      activeView: state.activeBranchId === id ? 'dashboard' : state.activeView
    }));
  },

  moveBranch: async (id, newParentId) => {
    if (id === newParentId) return; // cannot be parent of self
    const branch = get().branches.find(b => b.id === id);
    if (!branch) return;
    const updated = { ...branch, parentId: newParentId };
    await api.saveBranch(updated);
    set(state => ({
      branches: state.branches.map(b => b.id === id ? updated : b)
    }));
  },

  createQuestion: async (branchId, title = 'Untitled Problem') => {
    const id = 'q_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newQuestion: Question = {
      id,
      branchId,
      title: title.trim(),
      url: '',
      difficulty: 'Medium',
      status: 'not_started',
      problemStatement: '',
      solutionApproach: '',
      solutionCode: '',
      solutionLanguage: 'cpp',
      timeComplexity: '',
      spaceComplexity: '',
      specialNotes: '',
      isImportant: false,
      isDeleted: false,
      tags: [],
      createdAt: now,
      updatedAt: now
    };

    const saved = await api.saveQuestion(newQuestion);
    set(state => {
      const nextExpanded = new Set(state.expandedBranchIds);
      nextExpanded.add(branchId);
      return {
        questions: [saved, ...state.questions],
        expandedBranchIds: nextExpanded,
        activeView: 'question',
        activeQuestionId: saved.id,
        activeBranchId: branchId
      };
    });
    return saved;
  },

  deleteQuestion: async (id) => {
    await api.deleteQuestion(id, true);
    set(state => ({
      questions: state.questions.filter(q => q.id !== id),
      activeQuestionId: state.activeQuestionId === id ? null : state.activeQuestionId,
      activeView: state.activeQuestionId === id ? 'dashboard' : state.activeView
    }));
  },

  toggleImportantQuestion: async (id) => {
    const q = get().questions.find(x => x.id === id);
    if (!q) return;
    const updated = { ...q, isImportant: !q.isImportant };
    await api.saveQuestion(updated);
    set(state => ({
      questions: state.questions.map(item => item.id === id ? updated : item)
    }));
  },

  duplicateQuestion: async (id) => {
    const q = get().questions.find(x => x.id === id);
    if (!q) return;
    const newQ = await get().createQuestion(q.branchId, `${q.title} (Copy)`);
    const duplicated = {
      ...q,
      id: newQ.id,
      title: `${q.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await api.saveQuestion(duplicated);
    set(state => ({
      questions: state.questions.map(x => x.id === newQ.id ? duplicated : x),
      activeQuestionId: newQ.id,
      activeView: 'question'
    }));
  },

  moveQuestion: async (id, newBranchId) => {
    const q = get().questions.find(x => x.id === id);
    if (!q) return;
    const updated = { ...q, branchId: newBranchId, updatedAt: new Date().toISOString() };
    await api.saveQuestion(updated);
    const nextExpanded = new Set(get().expandedBranchIds);
    nextExpanded.add(newBranchId);
    set(state => ({
      questions: state.questions.map(x => x.id === id ? updated : x),
      expandedBranchIds: nextExpanded,
      activeBranchId: state.activeQuestionId === id ? newBranchId : state.activeBranchId
    }));
  },

  renameQuestion: async (id, newTitle) => {
    const q = get().questions.find(x => x.id === id);
    if (!q || !newTitle.trim()) return;
    const updated = { ...q, title: newTitle.trim(), updatedAt: new Date().toISOString() };
    await api.saveQuestion(updated);
    set(state => ({
      questions: state.questions.map(x => x.id === id ? updated : x)
    }));
  }
}));
