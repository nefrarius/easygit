import React, { useState, useEffect } from 'react';

export default function RepoExplorer({ repo }) {
  const [readme, setReadme] = useState(null);
  const [contents, setContents] = useState([]);
  const [commits, setCommits] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const owner = repo.owner?.login || repo.owner;
  const repoName = repo.name;

  const fetchContents = async (path) => {
    setLoading(true);
    setError(null);
    const r = await window.easygit.githubGetContents(owner, repoName, path);
    if (r.success) {
      setContents(Array.isArray(r.data) ? r.data : [r.data]);
    } else {
      setError(r.error);
      setContents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!repo) return;

    // Load README
    window.easygit.githubGetReadme(owner, repoName).then((r) => {
      if (r.success) setReadme(r.data);
    });

    // Load root contents
    fetchContents('');

    // Load recent commits
    window.easygit.githubGetCommits(owner, repoName, 15).then((r) => {
      if (r.success) setCommits(r.data);
    });
  }, [repo?.id]);

  const enterDir = (path) => {
    setPathHistory((prev) => [...prev, currentPath]);
    setCurrentPath(path);
    fetchContents(path);
  };

  const goBack = () => {
    const prev = pathHistory[pathHistory.length - 1];
    setPathHistory((prev2) => prev2.slice(0, -1));
    setCurrentPath(prev || '');
    if (prev !== undefined) fetchContents(prev);
  };

  // Get file extension icon/color
  const fileColor = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    const map = {
      js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#3178c6',
      py: '#3572A5', rs: '#dea584', go: '#00ADD8', rb: '#CC342D',
      java: '#b07219', kt: '#7F52FF', swift: '#F05138',
      md: '#083fa1', json: '#292929', yml: '#cb171e', yaml: '#cb171e',
      html: '#e34c26', css: '#563d7c', scss: '#c6538c',
      toml: '#862424', lock: '#7a7a7a',
    };
    return map[ext] || '#8b949e';
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Repo header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{repo.private ? '🔒' : '○'}</span>
          <h2 className="text-sm font-bold text-terminal-cyan">{repo.full_name}</h2>
          {repo.language && (
            <span className="text-2xs px-1.5 py-0.5 rounded border border-terminal-dim/30 text-terminal-dim">
              {repo.language}
            </span>
          )}
        </div>
        {repo.description && (
          <p className="text-xs text-terminal-dim mt-1">{repo.description}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-2 text-2xs text-terminal-dim">
          <span>⭐ {repo.stargazers_count || 0}</span>
          <span>⑂ {repo.forks_count || 0}</span>
          <span>⚠ {repo.open_issues_count || 0}</span>
          <span>{repo.license?.spdx_id || ''}</span>
          <span>{repo.default_branch}</span>
          <a href={repo.html_url} target="_blank" rel="noreferrer"
            className="text-terminal-cyan hover:underline">Abrir en GitHub →</a>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => navigator.clipboard.writeText(repo.clone_url)}
            className="text-2xs px-2 py-1 border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 transition-colors">
            📋 git clone {repo.clone_url}
          </button>
          {repo.ssh_url && (
            <button onClick={() => navigator.clipboard.writeText(repo.ssh_url)}
              className="text-2xs px-2 py-1 border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg hover:border-terminal-fg transition-colors">
              📋 SSH
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-terminal-dim">
        <button onClick={goBack} disabled={pathHistory.length === 0}
          className={`px-1.5 py-0.5 rounded hover:bg-terminal-highlight ${pathHistory.length === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
          ←
        </button>
        <button onClick={() => { setPathHistory([]); setCurrentPath(''); fetchContents(''); }}
          className="px-1.5 py-0.5 rounded hover:bg-terminal-highlight">{repoName}</button>
        {currentPath.split('/').filter(Boolean).map((part, i, arr) => (
          <React.Fragment key={i}>
            <span>/</span>
            <span className="text-terminal-fg">{part}</span>
          </React.Fragment>
        ))}
      </div>

      {/* Error */}
      {error && <div className="text-xs text-terminal-red">Error: {error}</div>}

      {/* File browser */}
      <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded overflow-hidden">
        {loading ? (
          <div className="text-xs text-terminal-dim p-3">Cargando...</div>
        ) : contents.length === 0 ? (
          <div className="text-xs text-terminal-dim p-3">Directorio vacío</div>
        ) : (
          <div className="divide-y divide-terminal-dim/10">
            {contents.map((item) => (
              <div key={item.path}
                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-terminal-highlight/50 cursor-pointer transition-colors"
                onClick={() => item.type === 'dir' ? enterDir(item.path) : null}>
                <span className="shrink-0 text-sm">
                  {item.type === 'dir' ? '📁' : '📄'}
                </span>
                <span className="flex-1 text-terminal-fg truncate"
                  style={item.type === 'file' ? { color: fileColor(item.name) } : {}}>
                  {item.name}
                </span>
                {item.type === 'dir' && <span className="text-2xs text-terminal-dim">dir</span>}
                {item.type === 'file' && (
                  <a href={item.url} target="_blank" rel="noreferrer"
                    className="text-2xs text-terminal-dim hover:text-terminal-cyan shrink-0"
                    onClick={(e) => e.stopPropagation()}>
                    raw
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* README */}
      {readme?.content_decoded && (
        <div>
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">README.md</h3>
          <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded p-4">
            <pre className="text-xs text-terminal-fg whitespace-pre-wrap font-mono leading-5 overflow-auto">
              {readme.content_decoded}
            </pre>
          </div>
        </div>
      )}

      {/* Recent commits */}
      <div>
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">Commits recientes</h3>
        <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded divide-y divide-terminal-dim/10 max-h-64 overflow-auto">
          {commits.length === 0 ? (
            <div className="text-xs text-terminal-dim p-3">Sin commits</div>
          ) : (
            commits.map((c) => (
              <div key={c.sha} className="px-3 py-2 text-xs">
                <div className="flex items-start gap-2">
                  {c.author?.avatar_url && (
                    <img src={c.author.avatar_url} alt="" className="w-5 h-5 rounded-full mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-terminal-fg truncate">{c.commit?.message?.split('\n')[0]}</div>
                    <div className="text-2xs text-terminal-dim mt-0.5">
                      <span className="text-terminal-cyan cursor-pointer hover:underline"
                        onClick={() => navigator.clipboard.writeText(c.sha)} title="Copiar SHA">
                        {c.sha.substring(0, 7)}
                      </span>
                      <span className="ml-2">{c.commit?.author?.name}</span>
                      <span className="ml-2">{formatDate(c.commit?.author?.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
