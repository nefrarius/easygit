const https = require('https');

const API_BASE = 'https://api.github.com';

let _token = '';

function _headers() {
  return {
    'User-Agent': 'EasyGit/1.0',
    Accept: 'application/vnd.github.v3+json',
    ...(_token ? { Authorization: `token ${_token}` } : {}),
  };
}

function _request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: _headers(),
    };
    if (body) {
      const data = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(opts, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(raw || `HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function setToken(token) {
  _token = token || '';
}

function getToken() {
  return _token;
}

async function getUser() {
  return _request('GET', '/user');
}

async function listRepos() {
  return _request('GET', '/user/repos?per_page=50&sort=updated');
}

async function getRepo(owner, repo) {
  return _request('GET', `/repos/${owner}/${repo}`);
}

async function createFork(owner, repo) {
  return _request('POST', `/repos/${owner}/${repo}/forks`);
}

async function createPR(owner, repo, head, base, title, body) {
  return _request('POST', `/repos/${owner}/${repo}/pulls`, { title, head, base, body });
}

async function mergePR(owner, repo, pullNumber) {
  return _request('PUT', `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`);
}

async function listPRs(owner, repo, state = 'open') {
  return _request('GET', `/repos/${owner}/${repo}/pulls?state=${state}&per_page=50`);
}

async function createRepo(name, description, isPrivate = false, autoInit = true, gitignoreTemplate = '', licenseTemplate = '') {
  const body = { name, description, private: isPrivate, auto_init: autoInit };
  if (gitignoreTemplate) body.gitignore_template = gitignoreTemplate;
  if (licenseTemplate) body.license_template = licenseTemplate;
  return _request('POST', '/user/repos', body);
}

module.exports = {
  setToken,
  getToken,
  getUser,
  listRepos,
  getRepo,
  createFork,
  createPR,
  mergePR,
  listPRs,
  createRepo,
};
