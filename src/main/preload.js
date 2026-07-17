const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('easygit', {
  // Git
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  gitInit: (folderPath) => ipcRenderer.invoke('git:init', folderPath),
  gitStatus: (folderPath) => ipcRenderer.invoke('git:status', folderPath),
  gitBranches: (folderPath) => ipcRenderer.invoke('git:branches', folderPath),
  gitLog: (folderPath, maxCount) => ipcRenderer.invoke('git:log', folderPath, maxCount),
  gitRemotes: (folderPath) => ipcRenderer.invoke('git:remotes', folderPath),
  gitExec: (folderPath, command, args) => ipcRenderer.invoke('git:exec', folderPath, command, args),
  gitExecWithResult: (folderPath, args, timeoutMs) => ipcRenderer.invoke('git:execWithResult', folderPath, args, timeoutMs),
  gitDiff: (folderPath) => ipcRenderer.invoke('git:diff', folderPath),

  // Store
  storeGetHistory: (repoPath) => ipcRenderer.invoke('store:getHistory', repoPath),
  storeAddHistory: (entry) => ipcRenderer.invoke('store:addHistory', entry),
  storeGetFavorites: () => ipcRenderer.invoke('store:getFavorites'),
  storeAddFavorite: (repoPath) => ipcRenderer.invoke('store:addFavorite', repoPath),
  storeRemoveFavorite: (repoPath) => ipcRenderer.invoke('store:removeFavorite', repoPath),

  // GitHub
  githubSetToken: (token) => ipcRenderer.invoke('github:setToken', token),
  githubGetToken: () => ipcRenderer.invoke('github:getToken'),
  githubGetUser: () => ipcRenderer.invoke('github:getUser'),
  githubListRepos: () => ipcRenderer.invoke('github:listRepos'),
  githubGetRepo: (owner, repo) => ipcRenderer.invoke('github:getRepo', owner, repo),
  githubCreateFork: (owner, repo) => ipcRenderer.invoke('github:createFork', owner, repo),
  githubCreatePR: (owner, repo, head, base, title, body) =>
    ipcRenderer.invoke('github:createPR', owner, repo, head, base, title, body),
  githubMergePR: (owner, repo, pullNumber) =>
    ipcRenderer.invoke('github:mergePR', owner, repo, pullNumber),
  githubListPRs: (owner, repo, state) =>
    ipcRenderer.invoke('github:listPRs', owner, repo, state),
  githubCreateRepo: (name, description, isPrivate, autoInit, gitignoreTemplate, licenseTemplate) =>
    ipcRenderer.invoke('github:createRepo', name, description, isPrivate, autoInit, gitignoreTemplate, licenseTemplate),
  githubDeleteRepo: (owner, repo) =>
    ipcRenderer.invoke('github:deleteRepo', owner, repo),
  githubUpdateRepo: (owner, repo, settings) =>
    ipcRenderer.invoke('github:updateRepo', owner, repo, settings),
  githubGetReadme: (owner, repo) =>
    ipcRenderer.invoke('github:getReadme', owner, repo),
  githubGetContents: (owner, repo, path) =>
    ipcRenderer.invoke('github:getContents', owner, repo, path),
  githubSearchRepos: (query, perPage) =>
    ipcRenderer.invoke('github:searchRepos', query, perPage),
  githubGetTrending: () =>
    ipcRenderer.invoke('github:getTrending'),
  githubGetCommits: (owner, repo, perPage) =>
    ipcRenderer.invoke('github:getCommits', owner, repo, perPage),
});
