import React, { useState, useEffect } from 'react';

export default function HomePage({ githubUser, onOpenRepo, onSelectFolder, onInitRepo }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [trending, setTrending] = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(false);

  useEffect(() => {
    if (githubUser) {
      loadTrending();
    }
  }, [githubUser]);

  const loadTrending = async () => {
    setTrendingLoading(true);
    const r = await window.easygit.githubGetTrending();
    if (r.success) setTrending(r.data?.items || []);
    setTrendingLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const r = await window.easygit.githubSearchRepos(searchQuery.trim(), 30);
    if (r.success) setSearchResults(r.data?.items || []);
    setSearching(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-terminal-green">
          {githubUser ? `👋 Hola, @${githubUser.login}` : '⚡ EasyGit'}
        </h1>
        <p className="text-xs text-terminal-dim mt-1">
          {githubUser ? 'Tus repositorios, tendencias y más.' : 'Abre un repositorio local para empezar.'}
        </p>
      </div>

      {/* Acciones rápidas */}
      {!githubUser && (
        <div className="flex gap-3">
          <button onClick={onSelectFolder}
            className="px-4 py-2 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 transition-colors">
            $ Abrir repositorio local
          </button>
          <button onClick={onInitRepo}
            className="px-4 py-2 text-xs border border-terminal-cyan/50 text-terminal-cyan rounded hover:bg-terminal-cyan/10 transition-colors">
            $ Init nuevo repo
          </button>
        </div>
      )}

      {/* Search */}
      {githubUser && (
        <div>
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">Buscar repositorios</h3>
          <div className="flex gap-2">
            <input type="text" placeholder="Buscar en GitHub... (ej: react, tailwindcss, electron)" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-terminal-highlight/50 border border-terminal-dim/30 rounded px-3 py-1.5 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-green/50" />
            <button onClick={handleSearch} disabled={!searchQuery.trim() || searching}
              className="px-4 py-1.5 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 disabled:opacity-40 transition-colors">
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      )}

      {/* Search results */}
      {searchResults !== null && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-terminal-cyan uppercase tracking-wider">Resultados de búsqueda</h3>
            <button onClick={() => setSearchResults(null)} className="text-2xs text-terminal-dim hover:text-terminal-fg">Limpiar</button>
          </div>
          <RepoList repos={searchResults} onOpenRepo={onOpenRepo} copyToClipboard={copyToClipboard} />
        </div>
      )}

      {/* Trending repos */}
      {githubUser && !searchResults && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider">🔥 Tendencias esta semana</h3>
            <button onClick={loadTrending} className="text-2xs text-terminal-dim hover:text-terminal-fg">↻ refrescar</button>
          </div>
          {trendingLoading ? (
            <div className="text-xs text-terminal-dim p-3">Cargando...</div>
          ) : trending && trending.length > 0 ? (
            <RepoList repos={trending.slice(0, 10)} onOpenRepo={onOpenRepo} copyToClipboard={copyToClipboard} />
          ) : (
            <div className="text-xs text-terminal-dim p-3 bg-terminal-highlight/30 border border-terminal-dim/20 rounded">
              {githubUser ? 'No se pudieron cargar tendencias. Prueba a buscar repos específicos.' : 'Conéctate con GitHub para ver tendencias.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RepoList({ repos, onOpenRepo, copyToClipboard }) {
  if (!repos || repos.length === 0) {
    return <div className="text-xs text-terminal-dim p-3">Sin resultados</div>;
  }

  return (
    <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded divide-y divide-terminal-dim/10 max-h-[50vh] overflow-auto">
      {repos.map((repo) => (
        <div key={repo.id} className="group flex items-start gap-3 px-3 py-2.5 text-xs hover:bg-terminal-highlight/50 transition-colors">
          {/* Avatar */}
          {repo.owner?.avatar_url && (
            <img src={repo.owner.avatar_url} alt="" className="w-6 h-6 rounded-full mt-0.5 shrink-0" />
          )}
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-terminal-cyan font-medium cursor-pointer hover:underline truncate"
                onDoubleClick={() => onOpenRepo && onOpenRepo(repo)}
                title="Doble click para explorar"
              >
                {repo.full_name}
              </span>
              {repo.private && <span className="text-2xs text-terminal-yellow">🔒</span>}
              {repo.fork && <span className="text-2xs text-terminal-dim">⑂ fork</span>}
            </div>
            {repo.description && (
              <div className="text-2xs text-terminal-dim mt-0.5 line-clamp-2">{repo.description}</div>
            )}
            <div className="flex flex-wrap gap-3 mt-1.5 text-2xs text-terminal-dim">
              {repo.language && <span className="text-terminal-fg">{repo.language}</span>}
              <span>⭐ {repo.stargazers_count}</span>
              <span>⑂ {repo.forks_count}</span>
              {repo.license?.spdx_id && <span>{repo.license.spdx_id}</span>}
              <span className="text-2xs">{new Date(repo.updated_at).toLocaleDateString('es')}</span>
            </div>
          </div>
          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => copyToClipboard(repo.clone_url)}
              className="text-2xs px-2 py-0.5 border border-terminal-dim/30 text-terminal-dim rounded hover:border-terminal-cyan/50 hover:text-terminal-cyan transition-colors whitespace-nowrap">
              📋 clone
            </button>
            <button onClick={() => window.open(repo.html_url, '_blank')}
              className="text-2xs px-2 py-0.5 border border-terminal-dim/30 text-terminal-dim rounded hover:border-terminal-cyan/50 hover:text-terminal-cyan transition-colors whitespace-nowrap">
              ↗ abrir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
