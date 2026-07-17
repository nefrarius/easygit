const Store = require('electron-store');

const store = new Store({
  name: 'easygit-data',
  schema: {
    history: { type: 'object', default: {} },
    favorites: { type: 'array', default: [] },
    githubToken: { type: 'string', default: '' },
    githubUser: { type: 'object', default: {} },
  },
});

let idCounter = Date.now();

function init() {}

function addHistory(entry) {
  const history = store.get('history', {});
  const repoKey = entry.repoPath;
  if (!history[repoKey]) history[repoKey] = [];
  history[repoKey].unshift({
    id: ++idCounter,
    ...entry,
    args: entry.args || [],
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  if (history[repoKey].length > 500) history[repoKey] = history[repoKey].slice(0, 500);
  store.set('history', history);
}

function getHistory(repoPath, limit = 200) {
  const history = store.get('history', {});
  const entries = history[repoPath] || [];
  return entries.slice(0, limit);
}

function getFavorites() {
  return store.get('favorites', []);
}

function addFavorite(repoPath, label) {
  const favorites = store.get('favorites', []);
  const exists = favorites.find((f) => f.repoPath === repoPath);
  if (!exists) {
    favorites.unshift({ repoPath, label: label || null, addedAt: new Date().toISOString() });
    store.set('favorites', favorites);
  }
}

function removeFavorite(repoPath) {
  const favorites = store.get('favorites', []);
  store.set('favorites', favorites.filter((f) => f.repoPath !== repoPath));
}

function getGithubToken() {
  return store.get('githubToken', '');
}

function setGithubToken(token) {
  store.set('githubToken', token);
}

function getGithubUser() {
  const user = store.get('githubUser', {});
  return user && user.login ? user : null;
}

function setGithubUser(user) {
  store.set('githubUser', user || {});
}

module.exports = {
  init,
  addHistory,
  getHistory,
  getFavorites,
  addFavorite,
  removeFavorite,
  getGithubToken,
  setGithubToken,
  getGithubUser,
  setGithubUser,
};
