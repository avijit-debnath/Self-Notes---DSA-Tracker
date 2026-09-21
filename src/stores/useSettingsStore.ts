import { create } from 'zustand';
import { GitHubSettings, AppStats } from '../types';
import { api } from '../services/api';

export type ThemeMode = 'dark' | 'light' | 'system';
export type SettingsTab = 'appearance' | 'backup' | 'data' | 'about';

interface SettingsState {
  theme: ThemeMode;
  isSettingsOpen: boolean;
  activeTab: SettingsTab;
  githubConfig: GitHubSettings;
  stats: AppStats | null;
  syncMessage: string;
  isSyncing: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  loadSettings: () => Promise<void>;
  updateGitHubConfig: (config: Partial<GitHubSettings>) => Promise<void>;
  runBackupNow: () => Promise<{ success: boolean; message: string }>;
  loadStats: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: (localStorage.getItem('selfnote_theme') as ThemeMode) || 'dark',
  isSettingsOpen: false,
  activeTab: 'appearance',
  githubConfig: {
    token: '',
    username: '',
    repo: 'SelfNote-Backup',
    branch: 'main',
    backupFolder: 'SelfNote-Backup',
    autoBackup: true,
    lastBackupTime: null,
    lastBackupStatus: 'idle'
  },
  stats: null,
  syncMessage: '',
  isSyncing: false,

  setTheme: (theme) => {
    localStorage.setItem('selfnote_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    set({ theme });
  },

  openSettings: (tab = 'appearance') => {
    set({ isSettingsOpen: true, activeTab: tab });
    get().loadSettings();
    get().loadStats();
  },

  closeSettings: () => {
    set({ isSettingsOpen: false });
  },

  loadSettings: async () => {
    try {
      const config = await api.getGitHubConfig();
      set({ githubConfig: config });
    } catch (err) {
      console.error('Failed to load GitHub settings:', err);
    }
  },

  updateGitHubConfig: async (partial) => {
    const updated = { ...get().githubConfig, ...partial };
    set({ githubConfig: updated });
    await api.saveGitHubConfig(updated);
  },

  runBackupNow: async () => {
    set({ isSyncing: true, syncMessage: 'Backing up to GitHub...' });
    try {
      const result = await api.runGitHubBackup();
      set({
        isSyncing: false,
        syncMessage: result.message,
        githubConfig: {
          ...get().githubConfig,
          lastBackupTime: result.timestamp,
          lastBackupStatus: result.success ? 'success' : 'error'
        }
      });
      return result;
    } catch (err: any) {
      const msg = err.message || 'Backup failed';
      set({ isSyncing: false, syncMessage: msg });
      return { success: false, message: msg };
    }
  },

  loadStats: async () => {
    try {
      const stats = await api.getStats();
      set({ stats });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }
}));
