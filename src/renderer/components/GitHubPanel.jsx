import React, { useState, useEffect } from 'react';

const GITIGNORE_TEMPLATES = [
  { value: '', label: 'Ninguno' },
  { value: 'Node', label: 'Node' },
  { value: 'Python', label: 'Python' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Go', label: 'Go' },
  { value: 'C++', label: 'C++' },
  { value: 'Java', label: 'Java' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'React', label: 'React' },
  { value: 'Next.js', label: 'Next.js' },
  { value: 'Vue', label: 'Vue' },
  { value: 'Angular', label: 'Angular' },
  { value: 'Swift', label: 'Swift' },
  { value: 'Kotlin', label: 'Kotlin' },
  { value: 'Dart', label: 'Dart' },
  { value: 'Flutter', label: 'Flutter' },
  { value: 'Terraform', label: 'Terraform' },
  { value: 'Docker', label: 'Docker' },
  { value: 'VisualStudio', label: 'VisualStudio' },
  { value: 'Xcode', label: 'Xcode' },
  { value: 'Elixir', label: 'Elixir' },
  { value: 'Haskell', label: 'Haskell' },
];

const LICENSE_TEMPLATES = [
  { value: '', label: 'Ninguna' },
  { value: 'mit', label: 'MIT' },
  { value: 'apache-2.0', label: 'Apache 2.0' },
  { value: 'gpl-3.0', label: 'GPL 3.0' },
  { value: 'lgpl-3.0', label: 'LGPL 3.0' },
  { value: 'bsd-2-clause', label: 'BSD 2-Clause' },
  { value: 'bsd-3-clause', label: 'BSD 3-Clause' },
  { value: 'mpl-2.0', label: 'Mozilla 2.0' },
  { value: 'agpl-3.0', label: 'AGPL 3.0' },
  { value: 'unlicense', label: 'Unlicense' },
  { value: 'gpl-2.0', label: 'GPL 2.0' },
];

const VISIBILITY_OPTIONS = [
  { value: false, label: 'Público', icon: '○' },
  { value: true, label: 'Privado', icon: '🔒' },
];

export default function GitHubPanel({
  repoPath,
  status,
  githubUser,
  onLogin,
  onLogout,
  onRefresh,
}) {
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [prs, setPrs] = useState([]);
  const [prsLoading, setPrsLoading] = useState(false);
  const [prState, setPrState] = useState('open');
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [prBase, setPrBase] = useState('main');
  const [prHead, setPrHead] = useState('');
  const [showPRForm, setShowPRForm] = useState(false);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [result, setResult] = useState(null);

  const [newRepo, setNewRepo] = useState({
    name: '',
    description: '',
    isPrivate: false,
    autoInit: true,
    gitignoreTemplate: 'Node',
    licenseTemplate: 'mit',
  });

  const parseRemote = () => {
    if (!status?.tracking) return null;
    const match = status.tracking.match(/github\.com[:/](.+?)\/(.+?)\.git/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace('.git', '') };
  };

  const remote = parseRemote();
  const repoFullName = remote ? `${remote.owner}/${remote.repo}` : null;

  useEffect(() => {
    if (githubUser && repoFullName) {
      loadRepos();
    }
  }, [githubUser]);

  const loadRepos = async () => {
    setReposLoading(true);
    const r = await window.easygit.githubListRepos();
    if (r.success) setRepos(r.data);
    setReposLoading(false);
  };

  const loadPRs = async (state) => {
    if (!remote) return;
    setPrsLoading(true);
    const r = await window.easygit.githubListPRs(remote.owner, remote.repo, state);
    if (r.success) setPrs(r.data);
    setPrsLoading(false);
  };

  const handleLogin = async () => {
    const result = await onLogin(tokenInput.trim());
    if (result.success) {
      setShowTokenInput(false);
      setTokenInput('');
    } else {
      setResult({ type: 'error', text: `Error: ${result.error}` });
    }
  };

  const handleLogout = async () => {
    await onLogout();
    setRepos([]);
    setPrs([]);
  };

  const handleFork = async () => {
    if (!remote) return;
    setResult({ type: 'info', text: 'Creando fork...' });
    const r = await window.easygit.githubCreateFork(remote.owner, remote.repo);
    if (r.success) {
      setResult({ type: 'success', text: `Fork creado: ${r.data.full_name}` });
    } else {
      setResult({ type: 'error', text: `Error: ${r.error}` });
    }
  };

  const handleCreatePR = async () => {
    if (!remote || !prHead) return;
    setResult({ type: 'info', text: 'Creando PR...' });
    const r = await window.easygit.githubCreatePR(remote.owner, remote.repo, prHead, prBase, prTitle || `PR desde ${prHead}`, prBody);
    if (r.success) {
      setResult({ type: 'success', text: `PR #${r.data.number} creado: ${r.data.html_url}` });
      setShowPRForm(false);
      setPrTitle('');
      setPrBody('');
    } else {
      setResult({ type: 'error', text: `Error: ${r.error}` });
    }
  };

  const handleMergePR = async (prNumber) => {
    if (!remote) return;
    setResult({ type: 'info', text: `Mergeando PR #${prNumber}...` });
    const r = await window.easygit.githubMergePR(remote.owner, remote.repo, prNumber);
    if (r.success) {
      setResult({ type: 'success', text: `PR #${prNumber} mergeado` });
      loadPRs(prState);
    } else {
      setResult({ type: 'error', text: `Error: ${r.error}` });
    }
  };

  const handleCreateRepo = async () => {
    if (!newRepo.name) return;
    setResult({ type: 'info', text: 'Creando repositorio en GitHub...' });
    const r = await window.easygit.githubCreateRepo(
      newRepo.name,
      newRepo.description,
      newRepo.isPrivate,
      newRepo.autoInit,
      newRepo.gitignoreTemplate,
      newRepo.licenseTemplate
    );
    if (r.success) {
      const data = r.data;
      let msg = `Repo creado: ${data.html_url}`;

      // Si hay un repo local abierto, ofrecer push
      if (repoPath) {
        setResult({ type: 'info', text: 'Repo creado. Configurando remote y subiendo código...' });

        // Add remote
        const addResult = await window.easygit.gitExecWithResult(repoPath, ['remote', 'add', 'origin', data.clone_url]);
        if (!addResult.success) {
          // Try set-url if remote already exists
          await window.easygit.gitExecWithResult(repoPath, ['remote', 'set-url', 'origin', data.clone_url]);
        }

        // Push
        const pushResult = await window.easygit.gitExecWithResult(repoPath, ['push', '-u', 'origin', status?.current || 'main']);
        if (pushResult.success) {
          msg = `Repo creado y código subido: ${data.html_url}`;
        } else {
          msg = `Repo creado: ${data.html_url}. Push manual: git push -u origin ${status?.current || 'main'}`;
        }
        onRefresh();
      }

      setResult({ type: 'success', text: msg });
      setShowCreateRepo(false);
      setNewRepo({
        name: '',
        description: '',
        isPrivate: false,
        autoInit: true,
        gitignoreTemplate: 'Node',
        licenseTemplate: 'mit',
      });
      loadRepos();
    } else {
      setResult({ type: 'error', text: `Error: ${r.error}` });
    }
  };

  const handlePush = async () => {
    if (!repoPath) return;
    setResult({ type: 'info', text: 'Haciendo push...' });
    const r = await window.easygit.gitExecWithResult(repoPath, ['push']);
    setResult({ type: r.success ? 'success' : 'error', text: r.success ? 'Push exitoso' : `Push error: ${r.stderr}` });
    onRefresh();
  };

  const handlePull = async () => {
    if (!repoPath) return;
    setResult({ type: 'info', text: 'Haciendo pull...' });
    const r = await window.easygit.gitExecWithResult(repoPath, ['pull']);
    setResult({ type: r.success ? 'success' : 'error', text: r.success ? 'Pull exitoso' : `Pull error: ${r.stderr}` });
    onRefresh();
  };

  if (!githubUser) {
    return (
      <div className="p-6">
        <h2 className="text-sm font-bold text-terminal-cyan mb-4">$ GitHub</h2>
        {!showTokenInput ? (
          <div>
            <p className="text-xs text-terminal-dim mb-4">
              Conecta con GitHub para push, fork, PRs, crear repos y más.
            </p>
            <button
              onClick={() => setShowTokenInput(true)}
              className="px-4 py-2 text-xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 transition-colors"
            >
              $ Conectar con GitHub
            </button>
            <div className="mt-4 text-2xs text-terminal-dim space-y-1">
              <p>1. Crea un token en GitHub:</p>
              <p className="text-terminal-cyan">Settings → Developer settings → Personal access tokens → Fine-grained tokens</p>
              <p className="mt-2">2. Permisos necesarios:</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>Repositorios: Read y Write</li>
                <li>Pull requests: Read y Write</li>
                <li>Contents: Read y Write</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="password"
              placeholder="ghp_... o github_pat_..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-terminal-highlight/50 border border-terminal-dim/30 rounded px-3 py-2 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-cyan/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleLogin}
                disabled={!tokenInput.trim()}
                className="px-3 py-1.5 text-xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 disabled:opacity-40 transition-colors"
              >
                $ Conectar
              </button>
              <button
                onClick={() => setShowTokenInput(false)}
                className="px-3 py-1.5 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* User header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {githubUser.avatar_url && (
            <img src={githubUser.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-terminal-cyan/30" />
          )}
          <div>
            <h2 className="text-sm font-bold text-terminal-cyan">@{githubUser.login}</h2>
            <span className="text-2xs text-terminal-dim">{githubUser.name || ''}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-2xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-red hover:border-terminal-red/50 transition-colors"
        >
          $ logout
        </button>
      </div>

      {/* Remote info */}
      <div>
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">Repositorio remoto</h3>
        {remote ? (
          <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded p-3">
            <div className="text-xs text-terminal-green">{repoFullName}</div>
            <div className="text-2xs text-terminal-dim mt-1">{status?.tracking}</div>
          </div>
        ) : (
          <div className="text-xs text-terminal-dim bg-terminal-highlight/30 border border-terminal-dim/20 rounded p-3">
            No hay remote configurado o no es GitHub.
            <br />
            Crea un repo abajo y se configurará automáticamente.
          </div>
        )}
      </div>

      {/* Acciones push/pull */}
      <div>
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-3">Sync</h3>
        <div className="flex gap-3">
          <ActionBtn label="Push" sub="git push" onClick={handlePush} color="cyan" />
          <ActionBtn label="Pull" sub="git pull" onClick={handlePull} color="green" />
          <ActionBtn label="Fork" sub="fork en GitHub" onClick={handleFork} color="yellow" disabled={!remote} />
          <ActionBtn label="New PR" sub="crear pull request" onClick={() => setShowPRForm(true)} color="blue" disabled={!remote} />
        </div>
      </div>

      {/* Create PR form */}
      {showPRForm && (
        <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded p-4 space-y-3">
          <h4 className="text-xs font-bold text-terminal-cyan">Nuevo Pull Request</h4>
          <input type="text" placeholder="Título" value={prTitle} onChange={(e) => setPrTitle(e.target.value)}
            className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1 text-xs text-terminal-fg placeholder-terminal-dim outline-none focus:border-terminal-cyan/50" />
          <div className="flex gap-2">
            <input type="text" placeholder="base (ej: main)" value={prBase} onChange={(e) => setPrBase(e.target.value)}
              className="flex-1 bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1 text-xs text-terminal-fg placeholder-terminal-dim outline-none focus:border-terminal-cyan/50" />
            <input type="text" placeholder="head (ej: feature-x)" value={prHead} onChange={(e) => setPrHead(e.target.value)}
              className="flex-1 bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1 text-xs text-terminal-fg placeholder-terminal-dim outline-none focus:border-terminal-cyan/50" />
          </div>
          <textarea placeholder="Descripción (opcional)" value={prBody} onChange={(e) => setPrBody(e.target.value)} rows={3}
            className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1 text-xs text-terminal-fg placeholder-terminal-dim outline-none focus:border-terminal-cyan/50 resize-none" />
          <div className="flex gap-2">
            <button onClick={handleCreatePR} disabled={!prHead}
              className="px-3 py-1.5 text-xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 disabled:opacity-40 transition-colors">$ Crear PR</button>
            <button onClick={() => setShowPRForm(false)}
              className="px-3 py-1.5 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* Result message */}
      {result && (
        <div className={`px-3 py-2 rounded text-xs border flex items-start justify-between ${
          result.type === 'success' ? 'bg-terminal-green/10 border-terminal-green/30 text-terminal-green' :
          result.type === 'error' ? 'bg-terminal-red/10 border-terminal-red/30 text-terminal-red' :
          'bg-terminal-cyan/10 border-terminal-cyan/30 text-terminal-cyan'
        }`}>
          <span className="whitespace-pre-wrap break-all">{result.text}</span>
          <button onClick={() => setResult(null)} className="ml-2 text-terminal-dim hover:text-terminal-fg shrink-0">x</button>
        </div>
      )}

      {/* Crear repo en GitHub */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider">Crear repositorio en GitHub</h3>
        </div>

        {!showCreateRepo ? (
          <button onClick={() => setShowCreateRepo(true)}
            className="px-4 py-2 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 transition-colors">
            $ Nuevo repositorio
          </button>
        ) : (
          <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded p-4 space-y-3">
            {/* Nombre */}
            <div>
              <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Nombre *</label>
              <input type="text" placeholder="mi-proyecto" value={newRepo.name}
                onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-green/50" />
            </div>

            {/* Descripción */}
            <div>
              <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Descripción</label>
              <input type="text" placeholder="Una breve descripción del proyecto" value={newRepo.description}
                onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-green/50" />
            </div>

            {/* Visibilidad */}
            <div>
              <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Visibilidad</label>
              <div className="flex gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button key={opt.label}
                    onClick={() => setNewRepo({ ...newRepo, isPrivate: opt.value })}
                    className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                      newRepo.isPrivate === opt.value
                        ? 'bg-terminal-highlight border-terminal-green/50 text-terminal-green'
                        : 'border-terminal-dim/30 text-terminal-dim hover:text-terminal-fg'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inicializar con README */}
            <label className="flex items-center gap-2 text-xs text-terminal-dim cursor-pointer">
              <input type="checkbox" checked={newRepo.autoInit}
                onChange={(e) => setNewRepo({ ...newRepo, autoInit: e.target.checked })}
                className="accent-terminal-green" />
              Inicializar con README.md
            </label>

            {/* .gitignore */}
            {newRepo.autoInit && (
              <div>
                <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">.gitignore</label>
                <select value={newRepo.gitignoreTemplate}
                  onChange={(e) => setNewRepo({ ...newRepo, gitignoreTemplate: e.target.value })}
                  className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg font-mono outline-none focus:border-terminal-green/50">
                  {GITIGNORE_TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Licencia */}
            {newRepo.autoInit && (
              <div>
                <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Licencia</label>
                <select value={newRepo.licenseTemplate}
                  onChange={(e) => setNewRepo({ ...newRepo, licenseTemplate: e.target.value })}
                  className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg font-mono outline-none focus:border-terminal-green/50">
                  {LICENSE_TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <button onClick={handleCreateRepo} disabled={!newRepo.name}
                className="px-4 py-2 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 disabled:opacity-40 transition-colors font-bold">
                $ Crear repo{repoPath ? ' y subir código' : ''}
              </button>
              <button onClick={() => setShowCreateRepo(false)}
                className="px-4 py-2 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg transition-colors">
                Cancelar
              </button>
            </div>

            {/* Info */}
            {repoPath && (
              <div className="text-2xs text-terminal-dim bg-terminal-bg/50 rounded p-2">
                Al crear el repo se configurará el remote y se hará push automáticamente.
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRs */}
      {remote && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider">Pull Requests</h3>
            <div className="flex gap-1">
              {['open', 'closed', 'all'].map((s) => (
                <button key={s} onClick={() => { setPrState(s); loadPRs(s); }}
                  className={`text-2xs px-2 py-0.5 rounded ${
                    prState === s ? 'bg-terminal-highlight text-terminal-green' : 'text-terminal-dim hover:text-terminal-fg'
                  }`}>{s}</button>
              ))}
              <button onClick={() => loadPRs(prState)} className="text-2xs text-terminal-dim hover:text-terminal-fg px-1">↻</button>
            </div>
          </div>
          <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded max-h-48 overflow-auto">
            {prsLoading ? (
              <div className="text-xs text-terminal-dim p-3">Cargando...</div>
            ) : prs.length === 0 ? (
              <div className="text-xs text-terminal-dim p-3">Sin PRs {prState}</div>
            ) : (
              prs.map((pr) => (
                <div key={pr.number} className="flex items-center gap-2 px-3 py-2 border-b border-terminal-dim/10 last:border-0 text-xs hover:bg-terminal-highlight/30">
                  <span className={pr.state === 'open' ? 'text-terminal-green' : 'text-terminal-dim'}>{pr.state === 'open' ? '●' : '○'}</span>
                  <span className="text-terminal-dim font-mono">#{pr.number}</span>
                  <span className="flex-1 truncate text-terminal-fg">{pr.title}</span>
                  <span className="text-2xs text-terminal-dim">{pr.user?.login}</span>
                  {pr.state === 'open' && (
                    <button onClick={() => handleMergePR(pr.number)}
                      className="text-2xs px-2 py-0.5 border border-terminal-dim/30 text-terminal-dim rounded hover:border-terminal-green/50 hover:text-terminal-green transition-colors">merge</button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tus repositorios */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider">Tus repositorios</h3>
          <button onClick={loadRepos} className="text-2xs text-terminal-dim hover:text-terminal-fg">↻ refrescar</button>
        </div>
        <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded max-h-48 overflow-auto">
          {reposLoading ? (
            <div className="text-xs text-terminal-dim p-3">Cargando...</div>
          ) : repos.length === 0 ? (
            <div className="text-xs text-terminal-dim p-3">Sin repositorios. Crea uno arriba.</div>
          ) : (
            repos.map((repo) => (
              <div key={repo.id}
                className="flex items-center gap-2 px-3 py-1.5 border-b border-terminal-dim/10 last:border-0 text-xs hover:bg-terminal-highlight/30 cursor-pointer"
                onClick={() => setResult({ type: 'info', text: `URL: ${repo.html_url}\nClone: ${repo.clone_url}` })}>
                <span className="shrink-0">{repo.private ? '🔒' : '○'}</span>
                <span className="flex-1 truncate text-terminal-fg">{repo.full_name}</span>
                <span className="text-2xs text-terminal-dim">{repo.language || ''}</span>
                <span className="text-2xs text-terminal-dim">{repo.license?.spdx_id || ''}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ label, sub, onClick, color, disabled }) {
  const colors = {
    cyan: 'border-terminal-cyan/50 text-terminal-cyan hover:bg-terminal-cyan/10',
    green: 'border-terminal-green/50 text-terminal-green hover:bg-terminal-green/10',
    yellow: 'border-terminal-yellow/50 text-terminal-yellow hover:bg-terminal-yellow/10',
    blue: 'border-terminal-blue/50 text-terminal-blue hover:bg-terminal-blue/10',
    red: 'border-terminal-red/50 text-terminal-red hover:bg-terminal-red/10',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-2 text-left border rounded text-xs transition-colors ${colors[color] || colors.cyan} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="font-bold">$ {label}</div>
      <div className="text-terminal-dim text-2xs mt-0.5">{sub}</div>
    </button>
  );
}
