import React, { useState, useEffect } from 'react';
import RepoExplorer from './RepoExplorer';

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

export default function GitHubPanel({ repoPath, status, githubUser, onLogin, onLogout, onRefresh }) {
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
  const [confirmDeleteRepo, setConfirmDeleteRepo] = useState(null);
  const [result, setResult] = useState(null);
  const [creating, setCreating] = useState(false);

  // Repo explorer state
  const [explorerRepo, setExplorerRepo] = useState(null);
  const [explorerView, setExplorerView] = useState(null); // null = list, 'detail' = viewing repo

  const [newRepo, setNewRepo] = useState({
    name: '', description: '', isPrivate: false, autoInit: true,
    gitignoreTemplate: 'Node', licenseTemplate: 'mit',
  });

  // Remote config dialog after creating repo
  const [remoteDialogRepo, setRemoteDialogRepo] = useState(null);

  // Repo settings modal
  const [settingsRepo, setSettingsRepo] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ description: '', isPrivate: false, license: '' });

  // Credential popup
  const [showCredPopup, setShowCredPopup] = useState(false);

  const parseRemote = () => {
    if (!status?.tracking) return null;
    const m = status.tracking.match(/github\.com[:/](.+?)\/(.+?)\.git/);
    return m ? { owner: m[1], repo: m[2].replace('.git', '') } : null;
  };

  const remote = parseRemote();

  const loadRepos = async () => {
    setReposLoading(true);
    const r = await window.easygit.githubListRepos();
    if (r.success) setRepos(r.data);
    setReposLoading(false);
  };

  // Cargar repos siempre al tener usuario
  useEffect(() => {
    if (githubUser) loadRepos();
  }, [githubUser]);

  const loadPRs = async (state) => {
    if (!remote) return;
    setPrsLoading(true);
    const r = await window.easygit.githubListPRs(remote.owner, remote.repo, state);
    if (r.success) setPrs(r.data);
    setPrsLoading(false);
  };

  const handleLogin = async () => {
    const r = await onLogin(tokenInput.trim());
    if (r.success) {
      setShowTokenInput(false);
      setTokenInput('');
      loadRepos(); // Forzar carga de repos
    } else {
      setResult({ type: 'error', text: `Error: ${r.error}`, detail: r.detail || r.error });
    }
  };

  const handleLogout = async () => {
    await onLogout();
    setRepos([]);
    setPrs([]);
    setExplorerRepo(null);
    setExplorerView(null);
  };

  const handleFork = async () => {
    if (!remote) return;
    setResult({ type: 'info', text: 'Creando fork...' });
    const r = await window.easygit.githubCreateFork(remote.owner, remote.repo);
    if (r.success) {
      setResult({ type: 'success', text: `Fork creado: ${r.data.full_name}` });
      loadRepos();
    } else {
      setResult({ type: 'error', text: `Error: ${r.error}`, detail: r.detail || r.error });
    }
  };

  const handleCreatePR = async () => {
    if (!remote || !prHead) return;
    setResult({ type: 'info', text: 'Creando PR...' });
    const r = await window.easygit.githubCreatePR(remote.owner, remote.repo, prHead, prBase, prTitle || `PR desde ${prHead}`, prBody);
    if (r.success) {
      setResult({ type: 'success', text: `PR #${r.data.number} creado: ${r.data.html_url}` });
      setShowPRForm(false);
      setPrTitle(''); setPrBody('');
    } else {
      setResult({ type: 'error', text: `Error: ${r.error}`, detail: r.detail || r.error });
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
      setResult({ type: 'error', text: `Error: ${r.error}`, detail: r.detail || r.error });
    }
  };

  const getCurrentBranch = async (path) => {
    const r = await window.easygit.gitExecWithResult(path, ['rev-parse', '--abbrev-ref', 'HEAD']);
    return r.success ? r.stdout.trim() : 'main';
  };

  const hasLocalCommits = async (path) => {
    if (!path) return false;
    const r = await window.easygit.gitExecWithResult(path, ['rev-parse', '--verify', 'HEAD']);
    return r.success;
  };

  const embedTokenInUrl = (url, token) => {
    if (!token || !url) return url;
    try {
      const u = new URL(url);
      if (u.protocol === 'https:' || u.protocol === 'http:') {
        u.username = 'oauth2';
        u.password = token;
        return u.toString().replace(/\/$/, '');
      }
    } catch {}
    return url;
  };

  const setupCredentialRemote = async () => {
    if (!repoPath) return;
    const token = await window.easygit.githubGetToken();
    if (!token) {
      setResult({ type: 'error', text: 'No hay token de GitHub. Conéctate primero en la pestaña GitHub.' });
      return;
    }
    const remotesResult = await window.easygit.gitRemotes(repoPath);
    if (!remotesResult.success || !remotesResult.data.length) {
      setResult({ type: 'error', text: 'No hay remotes configurados.' });
      return;
    }
    const origin = remotesResult.data.find((r) => r.name === 'origin');
    if (!origin) {
      setResult({ type: 'error', text: 'No se encontró remote "origin".' });
      return;
    }
    const newUrl = embedTokenInUrl(origin.refs.fetch, token);
    if (newUrl === origin.refs.fetch) {
      setResult({ type: 'info', text: 'El remote ya tiene credenciales o no es HTTPS.' });
      return;
    }
    const r = await window.easygit.gitExecWithResult(repoPath, ['remote', 'set-url', 'origin', newUrl]);
    if (r.success) {
      setResult({ type: 'success', text: '✔ Credenciales configuradas en el remote.' });
      onRefresh();
    } else {
      setResult({ type: 'error', text: `Error: ${r.stderr}`, detail: r.stderr });
    }
  };

  const handleCreateRepo = async () => {
    if (!newRepo.name || creating) return;
    setCreating(true);
    setResult({ type: 'info', text: 'Paso 1/3: Creando repositorio en GitHub...' });

    // Si el repo local ya tiene commits, no usar auto_init (evita historias divergentes)
    const localHasCommits = await hasLocalCommits(repoPath);
    const useAutoInit = localHasCommits ? false : newRepo.autoInit;

    const r = await window.easygit.githubCreateRepo(
      newRepo.name, newRepo.description, newRepo.isPrivate,
      useAutoInit, useAutoInit ? newRepo.gitignoreTemplate : '',
      useAutoInit ? newRepo.licenseTemplate : ''
    );

    if (!r.success) {
      setResult({ type: 'error', text: `Error: ${r.error}`, detail: r.detail || r.error });
      setCreating(false);
      return;
    }

    const data = r.data;

    if (repoPath) {
      // Show dialog asking if user wants to configure remote and push
      setRemoteDialogRepo(data);
    } else {
      setResult({ type: 'success', text: `✔ Repo creado: ${data.html_url}` });
    }

    setShowCreateRepo(false);
    setNewRepo({ name: '', description: '', isPrivate: false, autoInit: true, gitignoreTemplate: 'Node', licenseTemplate: 'mit' });
    setCreating(false);
    loadRepos();
  };

  const handleRemoteYes = async () => {
    const data = remoteDialogRepo;
    setRemoteDialogRepo(null);
    if (!data || !repoPath) return;
    setCreating(true);
    setResult({ type: 'info', text: 'Configurando remote y subiendo código...' });

    const token = await window.easygit.githubGetToken();
    const remoteUrl = token ? embedTokenInUrl(data.clone_url, token) : data.clone_url;

    const addResult = await window.easygit.gitExecWithResult(repoPath, ['remote', 'add', 'origin', remoteUrl]);
    if (!addResult.success) {
      await window.easygit.gitExecWithResult(repoPath, ['remote', 'set-url', 'origin', remoteUrl]);
    }

    const branch = await getCurrentBranch(repoPath);
    setResult({ type: 'info', text: 'Subiendo código (puede tardar unos segundos)...' });
    const pushResult = await window.easygit.gitExecWithResult(repoPath, ['push', '-u', 'origin', branch], 120000);

    if (pushResult.success) {
      setResult({ type: 'success', text: `✔ Repo creado y código subido: ${data.html_url}` });
      onRefresh();
    } else if (pushResult.stdout?.includes('Everything up-to-date')) {
      setResult({ type: 'success', text: `✔ Repo creado. El código ya estaba sincronizado: ${data.html_url}` });
    } else {
      setResult({ type: 'error', text: `✔ Repo creado. ⚠ Push falló.\n${pushResult.stderr}\n\nPush manual: git push -u origin ${branch}`, detail: pushResult.stderr });
    }
    setCreating(false);
  };

  const handleRemoteNo = () => {
    const data = remoteDialogRepo;
    setRemoteDialogRepo(null);
    if (data) {
      setResult({ type: 'success', text: `✔ Repo creado: ${data.html_url}` });
    }
  };

  const handleDeleteRepo = async (owner, repo) => {
    setResult({ type: 'info', text: `Eliminando ${owner}/${repo}...` });
    const r = await window.easygit.githubDeleteRepo(owner, repo);
    if (r.success) {
      setResult({ type: 'success', text: `✔ Repo ${owner}/${repo} eliminado permanentemente.` });
      setConfirmDeleteRepo(null);
      loadRepos();
    } else {
      setResult({ type: 'error', text: `Error: ${r.error}`, detail: r.detail || r.error });
    }
  };

  const handlePush = async () => {
    if (!repoPath) return;
    setResult({ type: 'info', text: 'Subiendo commits al remoto...' });
    const r = await window.easygit.gitExecWithResult(repoPath, ['push'], 120000);
    if (r.success) {
      setResult({ type: 'success', text: '✔ Push exitoso. Tus commits ya están en GitHub.' });
    } else if (r.stderr?.includes('Authentication failed') || r.stderr?.includes('could not read Username') || r.stderr?.includes('403')) {
      setResult({ type: 'error', text: '🔴 Error de autenticación. Haz clic en ▼ y luego usa "Configurar credenciales" abajo.', detail: r.stderr });
    } else {
      setResult({ type: 'error', text: `Error en push: ${r.stderr}`, detail: r.stderr });
    }
    onRefresh();
  };

  const handlePull = async () => {
    if (!repoPath) return;
    setResult({ type: 'info', text: 'Descargando cambios del remoto...' });
    const r = await window.easygit.gitExecWithResult(repoPath, ['pull'], 120000);
    if (r.success) {
      setResult({ type: 'success', text: '✔ Pull exitoso. Tus cambios locales están actualizados.' });
    } else if (r.stderr?.includes('Authentication failed') || r.stderr?.includes('could not read Username') || r.stderr?.includes('403')) {
      setResult({ type: 'error', text: '🔴 Error de autenticación. Haz clic en ▼ y luego usa "Configurar credenciales" abajo.', detail: r.stderr });
    } else {
      setResult({ type: 'error', text: `Error en pull: ${r.stderr}`, detail: r.stderr });
    }
    onRefresh();
  };

  const handleRepoDoubleClick = (repo) => {
    setExplorerRepo(repo);
    setExplorerView('detail');
  };

  // --- Render: Login screen ---
  if (!githubUser) {
    return (
      <div className="p-6">
        <h2 className="text-sm font-bold text-terminal-cyan mb-4">$ GitHub</h2>
        {!showTokenInput ? (
          <div>
            <p className="text-xs text-terminal-dim mb-4">
              Conecta con GitHub para push, pull, fork, PRs, crear repos, navegar tu código y más.
            </p>
            <button onClick={() => setShowTokenInput(true)}
              className="px-4 py-2 text-xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 transition-colors">
              $ Conectar con GitHub
            </button>
            <div className="mt-4 text-2xs text-terminal-dim space-y-1">
              <p>1. Crea un token en GitHub:</p>
              <p className="text-terminal-cyan">Settings → Developer settings → Personal access tokens → Fine-grained tokens</p>
              <p className="mt-2">2. Permisos necesarios:</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>Repos: Read y Write</li>
                <li>Pull requests: Read y Write</li>
                <li>Contents: Read y Write</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="password" placeholder="ghp_... o github_pat_..." value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-terminal-highlight/50 border border-terminal-dim/30 rounded px-3 py-2 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-cyan/50" />
            <div className="flex gap-2">
              <button onClick={handleLogin} disabled={!tokenInput.trim()}
                className="px-3 py-1.5 text-xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 disabled:opacity-40 transition-colors">$ Conectar</button>
              <button onClick={() => setShowTokenInput(false)}
                className="px-3 py-1.5 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg transition-colors">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Render: Repo Explorer (detail view) ---
  if (explorerView === 'detail' && explorerRepo) {
    return (
      <div className="h-full flex flex-col">
        <button onClick={() => { setExplorerRepo(null); setExplorerView(null); }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-terminal-cyan hover:text-terminal-fg border-b border-terminal-dim/20 bg-terminal-highlight/30">
          ← Volver a mis repositorios
        </button>
        <div className="flex-1 overflow-auto">
          <RepoExplorer repo={explorerRepo} />
        </div>
      </div>
    );
  }

  // --- Render: Main panel (repos list + actions) ---
  return (
    <div className="p-6 space-y-6">
      {/* User header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {githubUser.avatar_url && <img src={githubUser.avatar_url} alt="" className="w-8 h-8 rounded-full border border-terminal-cyan/30" />}
          <div>
            <h2 className="text-sm font-bold text-terminal-cyan">@{githubUser.login}</h2>
            <span className="text-2xs text-terminal-dim">{githubUser.name || ''}</span>
          </div>
        </div>
        <button onClick={handleLogout}
          className="px-3 py-1 text-2xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-red hover:border-terminal-red/50 transition-colors">$ logout</button>
      </div>

      {/* Remote info */}
      <div>
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">Repositorio remoto</h3>
        {remote ? (
          <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-terminal-green">{remote.owner}/{remote.repo}</div>
                <div className="text-2xs text-terminal-dim mt-1">{status?.tracking}</div>
              </div>
              <button onClick={() => setShowCredPopup(true)}
                className="px-2 py-1 text-2xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 transition-colors shrink-0 ml-2">
                🔑 Configurar credenciales
              </button>
            </div>
            <div className="text-2xs text-terminal-dim mt-2">
              Si git te pide usuario/contraseña en cada push, haz clic en "Configurar credenciales" para usar tu token automáticamente.
            </div>
          </div>
        ) : (
          <div className="text-xs text-terminal-dim bg-terminal-highlight/30 border border-terminal-dim/20 rounded p-3">
            No hay remote configurado o no es GitHub.
            {repoPath && <div className="mt-1 text-2xs text-terminal-yellow">Crea un repo abajo y se configurará automáticamente.</div>}
          </div>
        )}
      </div>

      {/* Sync actions with descriptions */}
      <div>
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-3">Sync</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={handlePush} className="px-3 py-2 text-left border border-terminal-cyan/50 rounded text-xs text-terminal-cyan hover:bg-terminal-cyan/10 transition-colors">
            <div className="font-bold">$ Push</div>
            <div className="text-2xs text-terminal-dim mt-0.5">Sube tus commits al repositorio remoto. Es como "guardar en la nube".</div>
          </button>
          <button onClick={handlePull} className="px-3 py-2 text-left border border-terminal-green/50 rounded text-xs text-terminal-green hover:bg-terminal-green/10 transition-colors">
            <div className="font-bold">$ Pull</div>
            <div className="text-2xs text-terminal-dim mt-0.5">Descarga los últimos cambios del remoto. Es como "actualizar" tu copia local.</div>
          </button>
          <button onClick={handleFork} disabled={!remote} className={`px-3 py-2 text-left border rounded text-xs transition-colors ${remote ? 'border-terminal-yellow/50 text-terminal-yellow hover:bg-terminal-yellow/10' : 'border-terminal-dim/30 text-terminal-dim'} ${!remote && 'opacity-40 cursor-not-allowed'}`}>
            <div className="font-bold">$ Fork</div>
            <div className="text-2xs text-terminal-dim mt-0.5">Crea una copia del repo en tu cuenta de GitHub. Útil para contribuir a proyectos ajenos.</div>
          </button>
          <button onClick={() => setShowPRForm(true)} disabled={!remote} className={`px-3 py-2 text-left border rounded text-xs transition-colors ${remote ? 'border-terminal-blue/50 text-terminal-blue hover:bg-terminal-blue/10' : 'border-terminal-dim/30 text-terminal-dim'} ${!remote && 'opacity-40 cursor-not-allowed'}`}>
            <div className="font-bold">$ New PR</div>
            <div className="text-2xs text-terminal-dim mt-0.5">Solicita que tus cambios se integren en otra rama. Es el corazón de la colaboración en GitHub.</div>
          </button>
        </div>
      </div>

      {/* PR form */}
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
              className="px-3 py-1.5 text-xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 disabled:opacity-40">$ Crear PR</button>
            <button onClick={() => setShowPRForm(false)}
              className="px-3 py-1.5 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg">Cancelar</button>
          </div>
        </div>
      )}

      {/* Result message */}
      {result && <ResultBox result={result} onClear={() => setResult(null)} />}

      {/* Remote config dialog */}
      {remoteDialogRepo && (
        <div className="bg-terminal-highlight/70 border border-terminal-cyan/40 rounded p-4 space-y-3">
          <h4 className="text-xs font-bold text-terminal-cyan">✔ Repo creado: {remoteDialogRepo.full_name}</h4>
          <p className="text-xs text-terminal-dim">¿Quieres configurar el remote y subir el código local?</p>
          <div className="flex gap-2">
            <button onClick={handleRemoteYes} disabled={creating}
              className="px-3 py-1.5 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 transition-colors">
              {creating ? 'Subiendo...' : 'Sí, configurar y subir'}
            </button>
            <button onClick={handleRemoteNo} disabled={creating}
              className="px-3 py-1.5 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg transition-colors">
              No, solo crearlo
            </button>
          </div>
          <div className="text-2xs text-terminal-dim">
            URL: {remoteDialogRepo.html_url}
          </div>
        </div>
      )}

      {/* Credential popup */}
      {showCredPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCredPopup(false)}>
          <div className="bg-terminal-highlight border border-terminal-cyan/40 rounded p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-terminal-cyan mb-3">🔑 Configurar credenciales</h3>
            <p className="text-xs text-terminal-dim mb-3">
              Esto actualizará la URL del remote <span className="text-terminal-fg">origin</span> para incluir tu token de GitHub.
              Así no te pedirá usuario/contraseña en cada push.
            </p>
            <div className="flex gap-2">
              <button onClick={async () => { await setupCredentialRemote(); setShowCredPopup(false); }}
                className="px-3 py-1.5 text-xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 transition-colors">
                Sí, configurar
              </button>
              <button onClick={() => setShowCredPopup(false)}
                className="px-3 py-1.5 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {settingsRepo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSettingsRepo(null)}>
          <div className="bg-terminal-highlight border border-terminal-green/40 rounded p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-terminal-green">⚙ Editar {settingsRepo.full_name}</h3>
              <button onClick={() => setSettingsRepo(null)} className="text-terminal-dim hover:text-terminal-fg">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Descripción</label>
                <input type="text" value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg font-mono outline-none focus:border-terminal-green/50" />
              </div>
              <div>
                <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Visibilidad</label>
                <div className="flex gap-2">
                  <button onClick={() => setSettingsForm({ ...settingsForm, isPrivate: false })}
                    className={`px-3 py-1.5 text-xs border rounded transition-colors ${!settingsForm.isPrivate ? 'bg-terminal-highlight border-terminal-green/50 text-terminal-green' : 'border-terminal-dim/30 text-terminal-dim hover:text-terminal-fg'}`}>○ Público</button>
                  <button onClick={() => setSettingsForm({ ...settingsForm, isPrivate: true })}
                    className={`px-3 py-1.5 text-xs border rounded transition-colors ${settingsForm.isPrivate ? 'bg-terminal-highlight border-terminal-green/50 text-terminal-green' : 'border-terminal-dim/30 text-terminal-dim hover:text-terminal-fg'}`}>🔒 Privado</button>
                </div>
              </div>
              <div>
                <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Licencia</label>
                <select value={settingsForm.license}
                  onChange={(e) => setSettingsForm({ ...settingsForm, license: e.target.value })}
                  className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg font-mono outline-none focus:border-terminal-green/50">
                  {LICENSE_TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">URL del repo</label>
                <div className="text-xs text-terminal-dim font-mono break-all bg-terminal-bg/50 rounded p-2">{settingsRepo.html_url}</div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={async () => {
                  const r = await window.easygit.githubUpdateRepo(settingsRepo.owner?.login || settingsRepo.owner?.name, settingsRepo.name, {
                    description: settingsForm.description,
                    private: settingsForm.isPrivate,
                    license_template: settingsForm.license || undefined,
                  });
                  if (r.success) {
                    setResult({ type: 'success', text: '✔ Repo actualizado.' });
                    setSettingsRepo(null);
                    loadRepos();
                  } else {
                    setResult({ type: 'error', text: `Error: ${r.error}`, detail: r.detail || r.error });
                  }
                }}
                  className="px-3 py-1.5 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 transition-colors">
                  $ Guardar cambios
                </button>
                <button onClick={() => setSettingsRepo(null)}
                  className="px-3 py-1.5 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create repo */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider">Crear repositorio en GitHub</h3>
        </div>
        {!showCreateRepo ? (
          <button onClick={() => setShowCreateRepo(true)}
            className="px-4 py-2 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 transition-colors">$ Nuevo repositorio</button>
        ) : (
          <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded p-4 space-y-3">
            <div>
              <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Nombre *</label>
              <input type="text" placeholder="mi-proyecto" value={newRepo.name}
                onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-green/50" />
            </div>
            <div>
              <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Descripción</label>
              <input type="text" placeholder="Breve descripción del proyecto" value={newRepo.description}
                onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-green/50" />
            </div>
            <div>
              <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Visibilidad</label>
              <div className="flex gap-2">
                <button onClick={() => setNewRepo({ ...newRepo, isPrivate: false })}
                  className={`px-3 py-1.5 text-xs border rounded transition-colors ${!newRepo.isPrivate ? 'bg-terminal-highlight border-terminal-green/50 text-terminal-green' : 'border-terminal-dim/30 text-terminal-dim hover:text-terminal-fg'}`}>○ Público</button>
                <button onClick={() => setNewRepo({ ...newRepo, isPrivate: true })}
                  className={`px-3 py-1.5 text-xs border rounded transition-colors ${newRepo.isPrivate ? 'bg-terminal-highlight border-terminal-green/50 text-terminal-green' : 'border-terminal-dim/30 text-terminal-dim hover:text-terminal-fg'}`}>🔒 Privado</button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-terminal-dim cursor-pointer">
              <input type="checkbox" checked={newRepo.autoInit}
                onChange={(e) => setNewRepo({ ...newRepo, autoInit: e.target.checked })}
                className="accent-terminal-green" /> Inicializar con README.md
            </label>
            {newRepo.autoInit && (
              <>
                <div>
                  <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">.gitignore</label>
                  <select value={newRepo.gitignoreTemplate} onChange={(e) => setNewRepo({ ...newRepo, gitignoreTemplate: e.target.value })}
                    className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg font-mono outline-none focus:border-terminal-green/50">
                    {GITIGNORE_TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-2xs text-terminal-dim uppercase tracking-wider block mb-1">Licencia</label>
                  <select value={newRepo.licenseTemplate} onChange={(e) => setNewRepo({ ...newRepo, licenseTemplate: e.target.value })}
                    className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg font-mono outline-none focus:border-terminal-green/50">
                    {LICENSE_TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={handleCreateRepo} disabled={!newRepo.name || creating}
                className="px-4 py-2 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 disabled:opacity-40 transition-colors font-bold">
                {creating ? '$ Creando...' : `$ Crear repo${repoPath ? ' y subir código' : ''}`}
              </button>
              <button onClick={() => setShowCreateRepo(false)} disabled={creating}
                className="px-4 py-2 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg disabled:opacity-40 transition-colors">Cancelar</button>
            </div>
            {repoPath && <div className="text-2xs text-terminal-dim bg-terminal-bg/50 rounded p-2">Se configurará el remote y se hará push automáticamente.</div>}
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
                  className={`text-2xs px-2 py-0.5 rounded ${prState === s ? 'bg-terminal-highlight text-terminal-green' : 'text-terminal-dim hover:text-terminal-fg'}`}>{s}</button>
              ))}
              <button onClick={() => loadPRs(prState)} className="text-2xs text-terminal-dim hover:text-terminal-fg px-1">↻</button>
            </div>
          </div>
          <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded max-h-48 overflow-auto">
            {prsLoading ? <div className="text-xs text-terminal-dim p-3">Cargando...</div>
            : prs.length === 0 ? <div className="text-xs text-terminal-dim p-3">Sin PRs {prState}</div>
            : prs.map((pr) => (
              <div key={pr.number} className="flex items-center gap-2 px-3 py-2 border-b border-terminal-dim/10 last:border-0 text-xs hover:bg-terminal-highlight/30">
                <span className={pr.state === 'open' ? 'text-terminal-green' : 'text-terminal-dim'}>{pr.state === 'open' ? '●' : '○'}</span>
                <span className="text-terminal-dim font-mono">#{pr.number}</span>
                <span className="flex-1 truncate text-terminal-fg">{pr.title}</span>
                <span className="text-2xs text-terminal-dim">{pr.user?.login}</span>
                {pr.state === 'open' && (
                  <button onClick={() => handleMergePR(pr.number)}
                    className="text-2xs px-2 py-0.5 border border-terminal-dim/30 text-terminal-dim rounded hover:border-terminal-green/50 hover:text-terminal-green">merge</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tus repositorios */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider">Tus repositorios</h3>
          <div className="flex gap-2">
            <span className="text-2xs text-terminal-dim">Doble click para explorar</span>
            <button onClick={loadRepos} className="text-2xs text-terminal-dim hover:text-terminal-fg">↻ refrescar</button>
          </div>
        </div>
        <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded max-h-[30vh] overflow-auto">
          {reposLoading ? <div className="text-xs text-terminal-dim p-3">Cargando...</div>
          : repos.length === 0 ? <div className="text-xs text-terminal-dim p-3">Sin repositorios. Crea uno arriba.</div>
          : repos.map((repo) => (
            <div key={repo.id}
              className="group flex items-center gap-2 px-3 py-2 border-b border-terminal-dim/10 last:border-0 text-xs hover:bg-terminal-highlight/50 cursor-pointer transition-colors"
              onDoubleClick={() => handleRepoDoubleClick(repo)}>
              <span className="shrink-0 text-sm">{repo.private ? '🔒' : '○'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-terminal-fg truncate font-medium">{repo.full_name}</div>
                {repo.description && <div className="text-2xs text-terminal-dim truncate">{repo.description}</div>}
              </div>
              <span className="text-2xs text-terminal-dim shrink-0">{repo.language || ''}</span>
              <span className="text-2xs text-terminal-dim shrink-0 mr-1">{repo.license?.spdx_id || ''}</span>
              <button onClick={(e) => { e.stopPropagation(); setSettingsRepo(repo); setSettingsForm({ description: repo.description || '', isPrivate: repo.private, license: repo.license?.spdx_id?.toLowerCase() || '' }); }}
                className="text-2xs px-1.5 py-0.5 border border-terminal-dim/30 text-terminal-dim rounded hover:border-terminal-yellow/50 hover:text-terminal-yellow transition-colors shrink-0 opacity-0 group-hover:opacity-100 mr-1">
                ⚙
              </button>
              {confirmDeleteRepo === repo.full_name ? (
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-2xs text-terminal-red">¿Eliminar?</span>
                  <button onClick={() => { const [o, n] = repo.full_name.split('/'); handleDeleteRepo(o, n); }}
                    className="text-2xs px-1.5 py-0.5 border border-terminal-red/50 text-terminal-red rounded hover:bg-terminal-red/10">Sí</button>
                  <button onClick={() => setConfirmDeleteRepo(null)}
                    className="text-2xs px-1.5 py-0.5 border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg">No</button>
                </div>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteRepo(repo.full_name); }}
                  className="text-2xs px-1.5 py-0.5 border border-terminal-dim/30 text-terminal-dim rounded hover:border-terminal-red/50 hover:text-terminal-red transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultBox({ result, onClear }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`px-3 py-2 rounded text-xs border ${
      result.type === 'success' ? 'bg-terminal-green/10 border-terminal-green/30 text-terminal-green' :
      result.type === 'error' ? 'bg-terminal-red/10 border-terminal-red/30 text-terminal-red' :
      'bg-terminal-cyan/10 border-terminal-cyan/30 text-terminal-cyan'
    }`}>
      <div className="flex items-start justify-between">
        <span className="whitespace-pre-wrap break-all">{result.text}</span>
        <div className="flex gap-1 shrink-0 ml-2">
          {result.detail && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-terminal-dim hover:text-terminal-fg text-xs px-1">{expanded ? '▲' : '▼'}</button>
          )}
          <button onClick={onClear} className="text-terminal-dim hover:text-terminal-fg">x</button>
        </div>
      </div>
      {expanded && result.detail && (
        <pre className="mt-2 p-2 bg-terminal-bg/50 rounded text-2xs text-terminal-fg font-mono whitespace-pre-wrap overflow-auto max-h-32">
          {result.detail}
        </pre>
      )}
    </div>
  );
}
