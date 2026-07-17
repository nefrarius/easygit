import React from 'react';

export default function Sidebar({
  repoPath,
  status,
  branches,
  favorites,
  onSelectFolder,
  onInitRepo,
  onSelectFavorite,
  onRemoveFavorite,
}) {
  return (
    <div className="w-56 bg-terminal-highlight/30 border-r border-terminal-dim/30 flex flex-col overflow-hidden">
      {/* Repositorios favoritos */}
      <div className="p-3 border-b border-terminal-dim/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-terminal-dim tracking-wider uppercase">
            Repos
          </span>
        </div>
        <button
          onClick={onSelectFolder}
          className="w-full text-left px-2 py-1.5 text-xs text-terminal-green hover:bg-terminal-highlight rounded transition-colors mb-1"
        >
          $ abrir repositorio
        </button>
        <button
          onClick={onInitRepo}
          className="w-full text-left px-2 py-1.5 text-xs text-terminal-cyan hover:bg-terminal-highlight rounded transition-colors"
        >
          $ init nuevo repo
        </button>
      </div>

      {/* Lista de favoritos */}
      <div className="flex-1 overflow-auto p-3">
        {favorites.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-bold text-terminal-dim tracking-wider uppercase block mb-1">
              Favoritos
            </span>
            {favorites.map((fav) => (
              <div
                key={fav.repoPath}
                className={`group flex items-center justify-between px-2 py-1 text-xs rounded cursor-pointer hover:bg-terminal-highlight transition-colors ${
                  repoPath === fav.repoPath
                    ? 'bg-terminal-highlight text-terminal-green'
                    : 'text-terminal-fg'
                }`}
                onClick={() => onSelectFavorite(fav.repoPath)}
              >
                <span className="truncate">{fav.repoPath.split('/').pop()}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(fav.repoPath);
                  }}
                  className="hidden group-hover:block text-terminal-dim hover:text-terminal-red text-xs ml-1"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Rama actual */}
        {repoPath && status && (
          <div>
            <span className="text-xs font-bold text-terminal-dim tracking-wider uppercase block mb-1">
              Rama actual
            </span>
            <div className="px-2 py-1 text-xs font-bold text-terminal-yellow rounded bg-terminal-highlight/50 mb-3">
              $ {status.current}
            </div>

            {/* Sync status */}
            <div className="flex gap-2 mb-3 text-xs">
              {status.ahead > 0 && (
                <span className="text-terminal-cyan">↑{status.ahead}</span>
              )}
              {status.behind > 0 && (
                <span className="text-terminal-yellow">↓{status.behind}</span>
              )}
              {status.ahead === 0 && status.behind === 0 && status.isClean && (
                <span className="text-terminal-green">✔ sincronizado</span>
              )}
            </div>

            {/* Ramas */}
            {branches.length > 0 && (
              <>
                <span className="text-xs font-bold text-terminal-dim tracking-wider uppercase block mb-1">
                  Ramas
                </span>
                <div className="space-y-0.5 max-h-40 overflow-auto">
                  {branches.map((b) => (
                    <div
                      key={b.name}
                      className={`px-2 py-0.5 text-xs ${
                        b.current
                          ? 'text-terminal-yellow font-bold'
                          : 'text-terminal-dim hover:text-terminal-fg'
                      }`}
                    >
                      {b.current ? '*' : ' '} {b.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-terminal-dim/30 text-2xs text-terminal-dim">
        <span className="text-xs">EasyGit v1.0</span>
      </div>
    </div>
  );
}
