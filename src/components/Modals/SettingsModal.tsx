import React, { useState } from 'react';
import {
  X,
  Palette,
  Cloud,
  HardDrive,
  Info,
  Sun,
  Moon,
  Laptop,
  Check,
  RefreshCw,
  Download,
  Upload,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSettingsStore, SettingsTab, ThemeMode } from '../../stores/useSettingsStore';
import { useTreeStore } from '../../stores/useTreeStore';
import { api } from '../../services/api';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    activeTab,
    closeSettings,
    openSettings,
    theme,
    setTheme,
    githubConfig,
    updateGitHubConfig,
    runBackupNow,
    isSyncing,
    syncMessage
  } = useSettingsStore();

  const { loadInitialData } = useTreeStore();

  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState(githubConfig.token);
  const [usernameInput, setUsernameInput] = useState(githubConfig.username);
  const [repoInput, setRepoInput] = useState(githubConfig.repo);
  const [branchInput, setBranchInput] = useState(githubConfig.branch);
  const [folderInput, setFolderInput] = useState(githubConfig.backupFolder);
  const [importStatus, setImportStatus] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  if (!isSettingsOpen) return null;

  const handleSaveGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGitHubConfig({
      token: tokenInput,
      username: usernameInput,
      repo: repoInput,
      branch: branchInput,
      backupFolder: folderInput
    });
    alert('GitHub settings saved securely!');
  };

  const handleExportZip = async () => {
    setExportStatus('Exporting ZIP archive...');
    try {
      const res = await api.exportZip();
      if (res.success) {
        setExportStatus('Export completed successfully!');
      } else {
        setExportStatus('Export cancelled');
      }
    } catch (err: any) {
      setExportStatus(`Export failed: ${err.message}`);
    }
  };

  const handleImportZip = async (mode: 'merge' | 'replace') => {
    setImportStatus('Importing archive...');
    try {
      const res = await api.importZip(mode);
      if (res.success) {
        setImportStatus(`Successfully restored ${res.count || 0} questions!`);
        await loadInitialData();
      } else {
        setImportStatus('Import cancelled or failed');
      }
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-2xl h-[560px] flex rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Settings Navigation Sidebar */}
        <div className="w-48 bg-slate-50 dark:bg-[#0d1117] border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-1 shrink-0">
          <div className="px-2 py-2 mb-1">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Settings
            </h2>
          </div>

          <button
            onClick={() => openSettings('appearance')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'appearance'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#161b22]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => openSettings('backup')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'backup'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#161b22]'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>GitHub Backup</span>
          </button>

          <button
            onClick={() => openSettings('data')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'data'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#161b22]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Export & Import</span>
          </button>

          <button
            onClick={() => openSettings('about')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition mt-auto ${
              activeTab === 'about'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#161b22]'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {activeTab === 'appearance' && 'Appearance & Themes'}
              {activeTab === 'backup' && 'Automatic GitHub Backup'}
              {activeTab === 'data' && 'Data Management & Backups'}
              {activeTab === 'about' && 'About SelfNote'}
            </h3>
            <button
              onClick={closeSettings}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#21262d] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">Color Theme</span>
                  <p className="text-slate-400 text-[11px]">
                    Choose the interface theme for your coding sessions.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition ${
                        theme === 'light'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <Sun className="w-5 h-5" />
                      <span className="font-medium">Light</span>
                    </button>

                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition ${
                        theme === 'dark'
                          ? 'border-indigo-500 bg-indigo-950/50 text-indigo-400'
                          : 'border-slate-800 hover:border-slate-700 bg-[#0d1117] text-slate-300'
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                      <span className="font-medium">Dark</span>
                    </button>

                    <button
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition ${
                        theme === 'system'
                          ? 'border-indigo-500 bg-indigo-950/50 text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1117] text-slate-400'
                      }`}
                    >
                      <Laptop className="w-5 h-5" />
                      <span className="font-medium">System</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GitHub Backup Tab */}
            {activeTab === 'backup' && (
              <form onSubmit={handleSaveGitHub} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span className="text-[11px] leading-relaxed">
                    Credentials are saved securely via OS-level encryption. Your Personal Access Token is never transmitted anywhere except directly to GitHub's REST API.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-900 dark:text-white">GitHub Username</label>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="e.g. octocat"
                      className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-900 dark:text-white">Repository Name</label>
                    <input
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="SelfNote-Backup"
                      className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-900 dark:text-white">Personal Access Token (classic: repo scope)</label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-3 pr-10 py-1.5 font-mono rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-900 dark:text-white">Branch</label>
                    <input
                      type="text"
                      value={branchInput}
                      onChange={(e) => setBranchInput(e.target.value)}
                      placeholder="main"
                      className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-900 dark:text-white">Backup Folder in Repo</label>
                    <input
                      type="text"
                      value={folderInput}
                      onChange={(e) => setFolderInput(e.target.value)}
                      placeholder="SelfNote-Backup"
                      className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] text-slate-800 dark:text-slate-200 font-medium"
                    >
                      Save Settings
                    </button>

                    <button
                      type="button"
                      onClick={runBackupNow}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Backup Now'}</span>
                    </button>
                  </div>

                  {githubConfig.lastBackupTime && (
                    <span className="text-[11px] text-slate-400">
                      Last backup: {new Date(githubConfig.lastBackupTime).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {syncMessage && (
                  <p className="text-[11px] text-indigo-500 font-mono mt-1">{syncMessage}</p>
                )}
              </form>
            )}

            {/* Data Export & Import Tab */}
            {activeTab === 'data' && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1117]">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-500" />
                    <span>Export Everything as ZIP</span>
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Packages all your branches, solved questions, handwritten photo notes, and metadata into a clean, portable ZIP archive.
                  </p>
                  <div>
                    <button
                      onClick={handleExportZip}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                    >
                      Export Full ZIP Archive
                    </button>
                  </div>
                  {exportStatus && <p className="text-[11px] text-indigo-400 font-mono">{exportStatus}</p>}
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1117]">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span>Restore / Import from ZIP</span>
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Restore a previously exported SelfNote ZIP archive.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImportZip('merge')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 dark:bg-[#21262d] hover:bg-slate-300 dark:hover:bg-[#30363d] text-slate-800 dark:text-slate-200 transition"
                    >
                      Merge with Existing Data
                    </button>
                    <button
                      onClick={() => handleImportZip('replace')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      Replace All Data
                    </button>
                  </div>
                  {importStatus && <p className="text-[11px] text-indigo-400 font-mono">{importStatus}</p>}
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="flex flex-col gap-3 py-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">SelfNote — Personal DSA Tracker</h4>
                <p className="text-slate-400 text-xs">Version 1.0.0 (Desktop Edition)</p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs mt-2">
                  Built specifically for developers tackling Data Structures and Algorithms. Combines the speed of a local SQLite database, a file explorer tree hierarchy, Notion-style notes, LeetCode link extraction, handwritten diagram photo galleries, and offline-first GitHub cloud backups.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
