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

        // 204 No Content = success, no body
        if (res.statusCode === 204) {
          return resolve({ deleted: true });
        }

        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400) {
            const err = new Error(parsed.message || `HTTP ${res.statusCode}`);
            err.statusCode = res.statusCode;
            err.detail = parsed.errors ? parsed.errors.map((e) => e.message).join('; ') : '';
            err.raw = raw;
            reject(err);
          } else {
            resolve(parsed);
          }
        } catch {
          // Si raw está vacío y status es 2xx, es éxito sin body
          if (!raw.trim() && res.statusCode >= 200 && res.statusCode < 300) {
            return resolve({ success: true });
          }
          const err = new Error(raw || `HTTP ${res.statusCode}`);
          err.raw = raw;
          reject(err);
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
  return _request('GET', '/user/repos?per_page=100&sort=updated');
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

async function deleteRepo(owner, repo) {
  return _request('DELETE', `/repos/${owner}/${repo}`);
}

async function updateRepo(owner, repo, settings) {
  return _request('PATCH', `/repos/${owner}/${repo}`, settings);
}

// Repo Explorer API calls

async function getReadme(owner, repo) {
  const data = await _request('GET', `/repos/${owner}/${repo}/readme`);
  // Content viene en base64
  if (data.content) {
    data.content_decoded = Buffer.from(data.content, 'base64').toString('utf-8');
  }
  return data;
}

async function getContents(owner, repo, path = '') {
  const p = path ? `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}` : `/repos/${owner}/${repo}/contents`;
  const data = await _request('GET', p);
  // Si es array, es lista de directorio
  if (Array.isArray(data)) {
    return data.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type, // 'file' | 'dir'
      size: item.size,
      url: item.html_url,
    }));
  }
  // Si es objeto single file, decodificar
  if (data.content) {
    data.content_decoded = Buffer.from(data.content, 'base64').toString('utf-8');
  }
  return data;
}

async function getCommits(owner, repo, perPage = 20) {
  return _request('GET', `/repos/${owner}/${repo}/commits?per_page=${perPage}`);
}

async function searchRepos(query, perPage = 30) {
  return _request('GET', `/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}&sort=stars&order=desc`);
}

async function getTrending() {
  // Search repos created in the last week, sorted by stars
  const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return _request('GET', `/search/repositories?q=created:>${date}&sort=stars&order=desc&per_page=15`);
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
  deleteRepo,
  updateRepo,
  getReadme,
  getContents,
  getCommits,
  searchRepos,
  getTrending,
};
