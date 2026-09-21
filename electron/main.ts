import { app, BrowserWindow, ipcMain, shell, dialog, session } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  initDatabase,
  getBranches,
  saveBranch,
  deleteBranch,
  getQuestions,
  getQuestionById,
  saveQuestion,
  deleteQuestion,
  getImages,
  saveImage,
  deleteImage,
  getVoiceNotes,
  saveVoiceNote,
  deleteVoiceNote,
  getImportantQuestions,
  getTrashItems,
  restoreItem,
  emptyTrash,
  searchAll,
  getStats,
  getSetting,
  setSetting
} from './database/db';
import { saveImageFile, removeImageFile, saveAudioFile } from './services/fileStorage';
import { importDSAProblem } from './services/dsaImporter';
import { getGitHubConfig, saveGitHubConfig, runGitHubBackup } from './services/githubBackup';
import { createExportZip, importFromZip } from './services/exportImport';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

async function createWindow() {
  await initDatabase();

  const appIcon = process.platform === 'win32'
    ? path.join(__dirname, '../public/icon.ico')
    : path.join(__dirname, '../public/icon.png');

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 680,
    title: 'Self Notes',
    icon: fs.existsSync(appIcon) ? appIcon : undefined,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    await mainWindow.loadURL(devUrl);
  } else {
    const distPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Allow microphone and audio media access
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(false);
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media') {
      return true;
    }
    return false;
  });

  setupIPCHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIPCHandlers() {
  // Database Branch Handlers
  ipcMain.handle('db:getBranches', async () => {
    return getBranches();
  });

  ipcMain.handle('db:saveBranch', async (_, branch) => {
    return saveBranch(branch);
  });

  ipcMain.handle('db:deleteBranch', async (_, id, softDelete) => {
    return deleteBranch(id, softDelete);
  });

  // Database Question Handlers
  ipcMain.handle('db:getQuestions', async (_, branchId) => {
    return getQuestions(branchId);
  });

  ipcMain.handle('db:getQuestion', async (_, id) => {
    return getQuestionById(id);
  });

  ipcMain.handle('db:saveQuestion', async (_, question) => {
    return saveQuestion(question);
  });

  ipcMain.handle('db:deleteQuestion', async (_, id, softDelete) => {
    return deleteQuestion(id, softDelete);
  });

  // Images
  ipcMain.handle('db:getImages', async (_, questionId) => {
    return getImages(questionId);
  });

  ipcMain.handle('db:saveImage', async (_, img) => {
    return saveImage(img);
  });

  ipcMain.handle('db:deleteImage', async (_, id) => {
    return deleteImage(id);
  });

  ipcMain.handle('fs:storeImage', async (_, dataUrl, name) => {
    return saveImageFile(dataUrl, name);
  });

  // Voice Notes
  ipcMain.handle('db:getVoiceNotes', async (_, questionId) => {
    return getVoiceNotes(questionId);
  });

  ipcMain.handle('db:saveVoiceNote', async (_, note) => {
    return saveVoiceNote(note);
  });

  ipcMain.handle('db:deleteVoiceNote', async (_, id) => {
    return deleteVoiceNote(id);
  });

  ipcMain.handle('fs:storeAudio', async (_, dataUrl, name) => {
    return saveAudioFile(dataUrl, name);
  });

  // Special views
  ipcMain.handle('db:getImportantQuestions', async () => {
    return getImportantQuestions();
  });

  ipcMain.handle('db:getTrashItems', async () => {
    return getTrashItems();
  });

  ipcMain.handle('db:restoreItem', async (_, type, id) => {
    return restoreItem(type, id);
  });

  ipcMain.handle('db:emptyTrash', async () => {
    return emptyTrash();
  });

  ipcMain.handle('db:searchAll', async (_, query) => {
    return searchAll(query);
  });

  ipcMain.handle('db:getStats', async () => {
    return getStats();
  });

  // Settings
  ipcMain.handle('db:getSetting', async (_, key, defaultValue) => {
    return getSetting(key, defaultValue);
  });

  ipcMain.handle('db:setSetting', async (_, key, value) => {
    return setSetting(key, value);
  });

  // DSA Importer
  ipcMain.handle('dsa:importProblem', async (_, url) => {
    return await importDSAProblem(url);
  });

  // GitHub Backup
  ipcMain.handle('github:getConfig', async () => {
    return getGitHubConfig();
  });

  ipcMain.handle('github:saveConfig', async (_, config) => {
    saveGitHubConfig(config);
    return true;
  });

  ipcMain.handle('github:runBackup', async () => {
    return await runGitHubBackup();
  });

  // Export / Import
  ipcMain.handle('data:exportZip', async () => {
    if (!mainWindow) return { success: false };
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export SelfNote Archive',
      defaultPath: `SelfNote_Backup_${new Date().toISOString().slice(0, 10)}.zip`,
      filters: [{ name: 'ZIP Archives', extensions: ['zip'] }]
    });

    if (!filePath) return { success: false };

    const zipBuffer = await createExportZip();
    fs.writeFileSync(filePath, zipBuffer);
    return { success: true, filePath };
  });

  ipcMain.handle('data:importZip', async (_, mode) => {
    if (!mainWindow) return { success: false };
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select SelfNote Backup ZIP',
      filters: [{ name: 'ZIP Archives', extensions: ['zip'] }],
      properties: ['openFile']
    });

    if (!filePaths || filePaths.length === 0) return { success: false };

    const zipBuffer = fs.readFileSync(filePaths[0]);
    const result = await importFromZip(zipBuffer, mode);
    return result;
  });

  // Shell
  ipcMain.handle('shell:openExternal', async (_, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
    }
  });
}
