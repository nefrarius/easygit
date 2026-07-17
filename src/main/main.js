const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const gitService = require('./gitService');
const storeService = require('./storeService');
const githubService = require('./githubService');

let mainWindow;

function createWindow() {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0e14',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }
}

app.whenReady().then(() => {
  storeService.init();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleccionar repositorio Git',
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('git:init', async (_event, folderPath) => {
  return gitService.execCommand(folderPath, ['init']);
});

ipcMain.handle('git:status', async (_event, folderPath) => {
  return gitService.getStatus(folderPath);
});

ipcMain.handle('git:branches', async (_event, folderPath) => {
  return gitService.getBranches(folderPath);
});

ipcMain.handle('git:log', async (_event, folderPath, maxCount) => {
  return gitService.getLog(folderPath, maxCount);
});

ipcMain.handle('git:remotes', async (_event, folderPath) => {
  return gitService.getRemotes(folderPath);
});

ipcMain.handle('git:exec', async (_event, folderPath, command, args) => {
  return gitService.execCommand(folderPath, [command, ...args]);
});

ipcMain.handle('git:execWithResult', async (_event, folderPath, args, timeoutMs) => {
  const result = await gitService.execCommand(folderPath, args, timeoutMs);
  return result;
});

ipcMain.handle('git:diff', async (_event, folderPath) => {
  return gitService.getDiff(folderPath);
});

ipcMain.handle('store:getHistory', async (_event, repoPath) => {
  return storeService.getHistory(repoPath);
});

ipcMain.handle('store:addHistory', async (_event, entry) => {
  return storeService.addHistory(entry);
});

ipcMain.handle('store:getFavorites', async () => {
  return storeService.getFavorites();
});

ipcMain.handle('store:addFavorite', async (_event, repoPath) => {
  return storeService.addFavorite(repoPath);
});

ipcMain.handle('store:removeFavorite', async (_event, repoPath) => {
  return storeService.removeFavorite(repoPath);
});

// GitHub handlers

ipcMain.handle('github:setToken', async (_event, token) => {
  storeService.setGithubToken(token);
  githubService.setToken(token);
  if (token) {
    try {
      const user = await githubService.getUser();
      storeService.setGithubUser(user);
      return { success: true, user };
    } catch (err) {
      storeService.setGithubUser(null);
      return { success: false, error: err.message, detail: err.detail || err.raw || '' };
    }
  }
  storeService.setGithubUser(null);
  return { success: true, user: null };
});

ipcMain.handle('github:getToken', async () => {
  return storeService.getGithubToken();
});

ipcMain.handle('github:getUser', async () => {
  return storeService.getGithubUser();
});

ipcMain.handle('github:listRepos', async () => {
  try {
    const repos = await githubService.listRepos();
    return { success: true, data: repos };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:getRepo', async (_event, owner, repo) => {
  try {
    const data = await githubService.getRepo(owner, repo);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:createFork', async (_event, owner, repo) => {
  try {
    const data = await githubService.createFork(owner, repo);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:createPR', async (_event, owner, repo, head, base, title, body) => {
  try {
    const data = await githubService.createPR(owner, repo, head, base, title, body);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:mergePR', async (_event, owner, repo, pullNumber) => {
  try {
    const data = await githubService.mergePR(owner, repo, pullNumber);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:listPRs', async (_event, owner, repo, state) => {
  try {
    const data = await githubService.listPRs(owner, repo, state);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:createRepo', async (_event, name, description, isPrivate, autoInit, gitignoreTemplate, licenseTemplate) => {
  try {
    const data = await githubService.createRepo(name, description, isPrivate, autoInit, gitignoreTemplate, licenseTemplate);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:deleteRepo', async (_event, owner, repo) => {
  try {
    const data = await githubService.deleteRepo(owner, repo);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:updateRepo', async (_event, owner, repo, settings) => {
  try {
    const data = await githubService.updateRepo(owner, repo, settings);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, detail: err.detail || err.raw || '' };
  }
});

ipcMain.handle('github:getReadme', async (_event, owner, repo) => {
  try {
    const data = await githubService.getReadme(owner, repo);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github:getContents', async (_event, owner, repo, path) => {
  try {
    const data = await githubService.getContents(owner, repo, path);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github:searchRepos', async (_event, query, perPage) => {
  try {
    const data = await githubService.searchRepos(query, perPage);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github:getTrending', async () => {
  try {
    const data = await githubService.getTrending();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github:getCommits', async (_event, owner, repo, perPage) => {
  try {
    const data = await githubService.getCommits(owner, repo, perPage);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
