import { Branch, Question, PhotoNote, AppStats, GitHubSettings, SearchResult, ImportedProblem } from '../types';
import { INITIAL_SEED } from '../../electron/database/seed';

// Fallback in-memory storage for web browser preview mode
let localBranches: Branch[] = INITIAL_SEED.branches.map(b => ({
  id: b.id,
  parentId: b.parent_id,
  name: b.name,
  orderIndex: b.order_index,
  isStarred: Boolean(b.is_starred),
  isDeleted: Boolean(b.is_deleted),
  createdAt: b.created_at,
  updatedAt: b.updated_at
}));

let localQuestions: Question[] = INITIAL_SEED.questions.map(q => ({
  id: q.id,
  branchId: q.branch_id,
  title: q.title,
  url: q.url,
  difficulty: q.difficulty as any,
  status: q.status as any,
  problemStatement: q.problem_statement,
  solutionApproach: q.solution_approach,
  solutionCode: q.solution_code,
  solutionLanguage: q.solution_language,
  timeComplexity: q.time_complexity,
  spaceComplexity: q.space_complexity,
  specialNotes: q.special_notes,
  isImportant: Boolean(q.is_important),
  isDeleted: Boolean(q.is_deleted),
  tags: JSON.parse(q.tags || '[]'),
  createdAt: q.created_at,
  updatedAt: q.updated_at
}));

let localImages: PhotoNote[] = [];

// Check if running inside Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

export const api = {
  isElectron,

  // Branches
  async getBranches(): Promise<Branch[]> {
    if (isElectron) {
      return await (window as any).electronAPI.getBranches();
    }
    return [...localBranches.filter(b => !b.isDeleted)];
  },

  async saveBranch(branch: Partial<Branch> & { id: string; name: string }): Promise<Branch> {
    if (isElectron) {
      return await (window as any).electronAPI.saveBranch(branch);
    }
    const idx = localBranches.findIndex(b => b.id === branch.id);
    const now = new Date().toISOString();
    const updated: Branch = {
      id: branch.id,
      parentId: branch.parentId !== undefined ? branch.parentId : null,
      name: branch.name,
      orderIndex: branch.orderIndex || 0,
      isStarred: branch.isStarred || false,
      isDeleted: branch.isDeleted || false,
      createdAt: branch.createdAt || now,
      updatedAt: now
    };
    if (idx >= 0) {
      localBranches[idx] = updated;
    } else {
      localBranches.push(updated);
    }
    return updated;
  },

  async deleteBranch(id: string, softDelete = true): Promise<boolean> {
    if (isElectron) {
      return await (window as any).electronAPI.deleteBranch(id, softDelete);
    }
    if (softDelete) {
      localBranches = localBranches.map(b => b.id === id ? { ...b, isDeleted: true } : b);
      localQuestions = localQuestions.map(q => q.branchId === id ? { ...q, isDeleted: true } : q);
    } else {
      localBranches = localBranches.filter(b => b.id !== id);
      localQuestions = localQuestions.filter(q => q.branchId !== id);
    }
    return true;
  },

  // Questions
  async getQuestions(branchId?: string): Promise<Question[]> {
    if (isElectron) {
      return await (window as any).electronAPI.getQuestions(branchId);
    }
    return localQuestions.filter(q => !q.isDeleted && (!branchId || q.branchId === branchId));
  },

  async getQuestion(id: string): Promise<Question | null> {
    if (isElectron) {
      return await (window as any).electronAPI.getQuestion(id);
    }
    return localQuestions.find(q => q.id === id) || null;
  },

  async saveQuestion(q: Question): Promise<Question> {
    if (isElectron) {
      return await (window as any).electronAPI.saveQuestion(q);
    }
    const idx = localQuestions.findIndex(x => x.id === q.id);
    const now = new Date().toISOString();
    const updated = { ...q, updatedAt: now };
    if (idx >= 0) {
      localQuestions[idx] = updated;
    } else {
      localQuestions.push(updated);
    }
    return updated;
  },

  async deleteQuestion(id: string, softDelete = true): Promise<boolean> {
    if (isElectron) {
      return await (window as any).electronAPI.deleteQuestion(id, softDelete);
    }
    if (softDelete) {
      localQuestions = localQuestions.map(q => q.id === id ? { ...q, isDeleted: true } : q);
    } else {
      localQuestions = localQuestions.filter(q => q.id !== id);
    }
    return true;
  },

  // Images
  async getImages(questionId: string): Promise<PhotoNote[]> {
    if (isElectron) {
      return await (window as any).electronAPI.getImages(questionId);
    }
    return localImages.filter(img => img.questionId === questionId);
  },

  async saveImage(img: PhotoNote): Promise<PhotoNote> {
    if (isElectron) {
      return await (window as any).electronAPI.saveImage(img);
    }
    const idx = localImages.findIndex(x => x.id === img.id);
    if (idx >= 0) {
      localImages[idx] = img;
    } else {
      localImages.push(img);
    }
    return img;
  },

  async deleteImage(id: string): Promise<boolean> {
    if (isElectron) {
      return await (window as any).electronAPI.deleteImage(id);
    }
    localImages = localImages.filter(x => x.id !== id);
    return true;
  },

  async storeImage(dataUrl: string, name?: string): Promise<{ id: string; filePath: string; dataUrl: string }> {
    if (isElectron) {
      return await (window as any).electronAPI.storeImage(dataUrl, name);
    }
    const id = 'img_' + Math.random().toString(36).substring(2, 9);
    return {
      id,
      filePath: id + '.png',
      dataUrl
    };
  },

  // Voice Notes
  async getVoiceNotes(questionId: string): Promise<any[]> {
    if (isElectron && typeof (window as any).electronAPI?.getVoiceNotes === 'function') {
      try {
        return await (window as any).electronAPI.getVoiceNotes(questionId);
      } catch (e) {
        console.warn('Electron getVoiceNotes fallback:', e);
      }
    }
    const stored = localStorage.getItem(`selfnote_voice_${questionId}`);
    return stored ? JSON.parse(stored) : [];
  },

  async saveVoiceNote(note: any): Promise<any> {
    if (isElectron && typeof (window as any).electronAPI?.saveVoiceNote === 'function') {
      try {
        return await (window as any).electronAPI.saveVoiceNote(note);
      } catch (e) {
        console.warn('Electron saveVoiceNote fallback:', e);
      }
    }
    const existing = await this.getVoiceNotes(note.questionId);
    const updated = [...existing.filter(n => n.id !== note.id), note];
    localStorage.setItem(`selfnote_voice_${note.questionId}`, JSON.stringify(updated));
    return note;
  },

  async deleteVoiceNote(id: string, questionId?: string): Promise<boolean> {
    if (isElectron && typeof (window as any).electronAPI?.deleteVoiceNote === 'function') {
      try {
        return await (window as any).electronAPI.deleteVoiceNote(id);
      } catch (e) {
        console.warn('Electron deleteVoiceNote fallback:', e);
      }
    }
    if (questionId) {
      const existing = await this.getVoiceNotes(questionId);
      const updated = existing.filter(n => n.id !== id);
      localStorage.setItem(`selfnote_voice_${questionId}`, JSON.stringify(updated));
    }
    return true;
  },

  async storeAudio(dataUrl: string, name?: string): Promise<{ id: string; filePath: string; dataUrl: string }> {
    if (isElectron && typeof (window as any).electronAPI?.storeAudio === 'function') {
      try {
        return await (window as any).electronAPI.storeAudio(dataUrl, name);
      } catch (e) {
        console.warn('Electron storeAudio fallback to dataUrl:', e);
      }
    }
    const id = 'voice_' + Math.random().toString(36).substring(2, 9);
    return {
      id,
      filePath: id + '.webm',
      dataUrl
    };
  },

  // Special views
  async getImportantQuestions(): Promise<Question[]> {
    if (isElectron) {
      return await (window as any).electronAPI.getImportantQuestions();
    }
    return localQuestions.filter(q => q.isImportant && !q.isDeleted);
  },

  async getTrashItems(): Promise<{ branches: Branch[]; questions: Question[] }> {
    if (isElectron) {
      return await (window as any).electronAPI.getTrashItems();
    }
    return {
      branches: localBranches.filter(b => b.isDeleted),
      questions: localQuestions.filter(q => q.isDeleted)
    };
  },

  async restoreItem(type: 'branch' | 'question', id: string): Promise<boolean> {
    if (isElectron) {
      return await (window as any).electronAPI.restoreItem(type, id);
    }
    if (type === 'branch') {
      localBranches = localBranches.map(b => b.id === id ? { ...b, isDeleted: false } : b);
      localQuestions = localQuestions.map(q => q.branchId === id ? { ...q, isDeleted: false } : q);
    } else {
      localQuestions = localQuestions.map(q => q.id === id ? { ...q, isDeleted: false } : q);
    }
    return true;
  },

  async emptyTrash(): Promise<boolean> {
    if (isElectron) {
      return await (window as any).electronAPI.emptyTrash();
    }
    localBranches = localBranches.filter(b => !b.isDeleted);
    localQuestions = localQuestions.filter(q => !q.isDeleted);
    return true;
  },

  async searchAll(query: string): Promise<SearchResult[]> {
    if (isElectron) {
      return await (window as any).electronAPI.searchAll(query);
    }
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: SearchResult[] = [];

    for (const b of localBranches.filter(x => !x.isDeleted)) {
      if (b.name.toLowerCase().includes(q)) {
        results.push({
          type: 'branch',
          id: b.id,
          title: b.name,
          subtitle: 'Branch',
          matchField: 'branch',
          snippet: b.name
        });
      }
    }

    for (const qItem of localQuestions.filter(x => !x.isDeleted)) {
      if (
        qItem.title.toLowerCase().includes(q) ||
        qItem.problemStatement.toLowerCase().includes(q) ||
        qItem.solutionApproach.toLowerCase().includes(q) ||
        qItem.specialNotes.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'question',
          id: qItem.id,
          branchId: qItem.branchId,
          title: qItem.title,
          subtitle: `${qItem.difficulty} • ${qItem.status}`,
          matchField: 'title',
          snippet: qItem.problemStatement.substring(0, 80)
        });
      }
    }

    return results;
  },

  async getStats(): Promise<AppStats> {
    if (isElectron) {
      return await (window as any).electronAPI.getStats();
    }
    const activeQ = localQuestions.filter(q => !q.isDeleted);
    return {
      totalQuestions: activeQ.length,
      solvedQuestions: activeQ.filter(q => q.status === 'solved').length,
      inProgressQuestions: activeQ.filter(q => q.status === 'in_progress').length,
      needRevisionQuestions: activeQ.filter(q => q.status === 'need_revision').length,
      importantQuestions: activeQ.filter(q => q.isImportant).length,
      totalBranches: localBranches.filter(b => !b.isDeleted).length,
      solvedThisWeek: 4
    };
  },

  // Problem Importer
  async importProblem(url: string): Promise<{ success: boolean; data?: ImportedProblem; error?: string }> {
    if (isElectron) {
      return await (window as any).electronAPI.importProblem(url);
    }
    // Browser mock fallback
    return {
      success: true,
      data: {
        title: 'Two Sum (Preview)',
        url,
        difficulty: 'Easy',
        statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        tags: ['Array', 'HashMap']
      }
    };
  },

  // Settings & GitHub
  async getGitHubConfig(): Promise<GitHubSettings> {
    if (isElectron) {
      return await (window as any).electronAPI.getGitHubConfig();
    }
    return {
      token: '',
      username: '',
      repo: 'SelfNote-Backup',
      branch: 'main',
      backupFolder: 'SelfNote-Backup',
      autoBackup: true,
      lastBackupTime: null,
      lastBackupStatus: 'idle'
    };
  },

  async saveGitHubConfig(config: GitHubSettings): Promise<boolean> {
    if (isElectron) {
      return await (window as any).electronAPI.saveGitHubConfig(config);
    }
    return true;
  },

  async runGitHubBackup(): Promise<{ success: boolean; message: string; timestamp: string }> {
    if (isElectron) {
      return await (window as any).electronAPI.runGitHubBackup();
    }
    return {
      success: true,
      message: 'Browser simulation: GitHub sync completed',
      timestamp: new Date().toISOString()
    };
  },

  async exportZip(): Promise<{ success: boolean; filePath?: string }> {
    if (isElectron) {
      return await (window as any).electronAPI.exportZip();
    }
    return { success: true };
  },

  async importZip(mode: 'merge' | 'replace'): Promise<{ success: boolean; count?: number; error?: string }> {
    if (isElectron) {
      return await (window as any).electronAPI.importZip(mode);
    }
    return { success: true, count: 5 };
  },

  async openExternal(url: string): Promise<void> {
    if (isElectron) {
      await (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }
};
