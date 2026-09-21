import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  // Database Branch operations
  getBranches: () => ipcRenderer.invoke('db:getBranches'),
  saveBranch: (branch: any) => ipcRenderer.invoke('db:saveBranch', branch),
  deleteBranch: (id: string, softDelete = true) => ipcRenderer.invoke('db:deleteBranch', id, softDelete),

  // Database Question operations
  getQuestions: (branchId?: string) => ipcRenderer.invoke('db:getQuestions', branchId),
  getQuestion: (id: string) => ipcRenderer.invoke('db:getQuestion', id),
  saveQuestion: (question: any) => ipcRenderer.invoke('db:saveQuestion', question),
  deleteQuestion: (id: string, softDelete = true) => ipcRenderer.invoke('db:deleteQuestion', id, softDelete),

  // Image operations
  getImages: (questionId: string) => ipcRenderer.invoke('db:getImages', questionId),
  saveImage: (img: any) => ipcRenderer.invoke('db:saveImage', img),
  deleteImage: (id: string) => ipcRenderer.invoke('db:deleteImage', id),
  storeImage: (dataUrl: string, name?: string) => ipcRenderer.invoke('fs:storeImage', dataUrl, name),

  // Voice Note operations
  getVoiceNotes: (questionId: string) => ipcRenderer.invoke('db:getVoiceNotes', questionId),
  saveVoiceNote: (note: any) => ipcRenderer.invoke('db:saveVoiceNote', note),
  deleteVoiceNote: (id: string) => ipcRenderer.invoke('db:deleteVoiceNote', id),
  storeAudio: (dataUrl: string, name?: string) => ipcRenderer.invoke('fs:storeAudio', dataUrl, name),

  // Special views
  getImportantQuestions: () => ipcRenderer.invoke('db:getImportantQuestions'),
  getTrashItems: () => ipcRenderer.invoke('db:getTrashItems'),
  restoreItem: (type: 'branch' | 'question', id: string) => ipcRenderer.invoke('db:restoreItem', type, id),
  emptyTrash: () => ipcRenderer.invoke('db:emptyTrash'),
  searchAll: (query: string) => ipcRenderer.invoke('db:searchAll', query),
  getStats: () => ipcRenderer.invoke('db:getStats'),

  // Settings
  getSetting: (key: string, defaultValue = '') => ipcRenderer.invoke('db:getSetting', key, defaultValue),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('db:setSetting', key, value),

  // DSA Importer
  importProblem: (url: string) => ipcRenderer.invoke('dsa:importProblem', url),

  // GitHub Backup
  getGitHubConfig: () => ipcRenderer.invoke('github:getConfig'),
  saveGitHubConfig: (config: any) => ipcRenderer.invoke('github:saveConfig', config),
  runGitHubBackup: () => ipcRenderer.invoke('github:runBackup'),

  // Export / Import
  exportZip: () => ipcRenderer.invoke('data:exportZip'),
  importZip: (mode: 'merge' | 'replace') => ipcRenderer.invoke('data:importZip', mode),

  // External Links
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
