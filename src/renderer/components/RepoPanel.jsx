import React from 'react';

export default function RepoPanel({
  repoPath,
  status,
  onRefresh,
  onQuickCommit,
  onSync,
  onNewBranch,
  onUndoCommit,
  onDiscardChanges,
}) {
  if (!repoPath) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-terminal-dim text-sm mb-2">
            ╔════════════════════════════╗
          </div>
          <div className="text-terminal-dim text-sm mb-1">
            ║  Abre un repositorio o     ║
          </div>
          <div className="text-terminal-dim text-sm mb-1">
            ║  inicializa uno nuevo      ║
          </div>
          <div className="text-terminal-dim text-sm mb-4">
            ╚════════════════════════════╝
          </div>
          <div className="text-terminal-green text-xs animate-blink">▊</div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-terminal-dim text-sm">$ detectando estado del repo...</div>
      </div>
    );
  }

  const statusColor = () => {
    if (status.isClean && status.ahead === 0 && status.behind === 0)
      return 'text-terminal-green';
    if (!status.isClean) return 'text-terminal-yellow';
    if (status.behind > 0) return 'text-terminal-yellow';
    if (status.ahead > 0) return 'text-terminal-cyan';
    return 'text-terminal-fg';
  };

  const statusIcon = () => {
    if (status.isClean && status.ahead === 0 && status.behind === 0) return '✔';
    if (!status.isClean) return '●';
    if (status.behind > 0 || status.ahead > 0) return '↕';
    return '○';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera del repo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-terminal-green">
            {repoPath.split('/').pop()}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs ${statusColor()}`}>
              {statusIcon()} {status.current}
            </span>
            <span className="text-xs text-terminal-dim">{repoPath}</span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-xs border border-terminal-dim/50 text-terminal-dim hover:text-terminal-fg hover:border-terminal-fg rounded transition-colors"
        >
          ↻ refresh
        </button>
      </div>

      {/* Sync status bar */}
      <div className="flex gap-4 text-xs">
        <span className={status.ahead > 0 ? 'text-terminal-cyan' : 'text-terminal-dim'}>
          ahead: {status.ahead}
        </span>
        <span className={status.behind > 0 ? 'text-terminal-yellow' : 'text-terminal-dim'}>
          behind: {status.behind}
        </span>
        <span className={status.isClean ? 'text-terminal-green' : 'text-terminal-yellow'}>
          clean: {status.isClean ? 'true' : 'false'}
        </span>
      </div>

      {/* Archivos modificados */}
      <div>
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">
          Archivos modificados
        </h3>
        <div className="bg-terminal-highlight/30 rounded border border-terminal-dim/20 p-3 max-h-40 overflow-auto">
          {status.files.length === 0 ? (
            <div className="text-terminal-dim text-xs">No hay cambios pendientes</div>
          ) : (
            <div className="space-y-1">
              {status.files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <FileBadge status={file.working_dir} />
                  <span className={file.working_dir === 'D' ? 'text-terminal-red line-through' : 'text-terminal-fg'}>
                    {file.path}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Archivos staged */}
      {status.staged.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-terminal-cyan uppercase tracking-wider mb-2">
            Staged
          </h3>
          <div className="space-y-1">
            {status.staged.map((file, i) => (
              <div key={i} className="text-xs text-terminal-cyan ml-2">
                + {file}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div>
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-3">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton
            label="Quick Commit"
            sub="add + commit + push"
            onClick={onQuickCommit}
            color="green"
            disabled={status.isClean}
          />
          <ActionButton
            label="Sync"
            sub="git pull"
            onClick={onSync}
            color="cyan"
          />
          <ActionButton
            label="Nueva rama"
            sub="checkout -b + push -u"
            onClick={onNewBranch}
            color="yellow"
          />
          <ActionButton
            label="Undo commit"
            sub="reset --soft HEAD~1"
            onClick={onUndoCommit}
            color="blue"
          />
        </div>

        {/* Acciones destructivas */}
        <div className="mt-4 pt-4 border-t border-terminal-dim/30">
          <h4 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">
            Zona de peligro
          </h4>
          <ActionButton
            label="Descartar cambios"
            sub="git restore . (destructivo)"
            onClick={onDiscardChanges}
            color="red"
            disabled={status.isClean}
          />
        </div>
      </div>

      {/* Recent commits */}
      {status.recentCommits && status.recentCommits.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">
            Commits recientes
          </h3>
          <div className="space-y-1">
            {status.recentCommits.slice(0, 10).map((commit) => (
              <div key={commit.hash} className="flex items-start gap-2 text-xs">
                <span className="text-terminal-dim font-mono shrink-0">
                  {commit.hash.substring(0, 7)}
                </span>
                <span className="text-terminal-fg truncate">{commit.message}</span>
                <span className="text-terminal-dim shrink-0 ml-auto">
                  {formatDate(commit.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileBadge({ status }) {
  const map = { M: 'M', A: 'A', D: 'D', '?': '?', ' ': ' ' };
  const colors = { M: 'text-terminal-yellow', A: 'text-terminal-green', D: 'text-terminal-red', '?': 'text-terminal-dim' };
  const s = status || ' ';
  return (
    <span className={`font-bold ${colors[s] || 'text-terminal-dim'}`}>
      [{s}]
    </span>
  );
}

function ActionButton({ label, sub, onClick, color, disabled }) {
  const colorMap = {
    green: 'border-terminal-green/50 text-terminal-green hover:bg-terminal-green/10',
    cyan: 'border-terminal-cyan/50 text-terminal-cyan hover:bg-terminal-cyan/10',
    yellow: 'border-terminal-yellow/50 text-terminal-yellow hover:bg-terminal-yellow/10',
    blue: 'border-terminal-blue/50 text-terminal-blue hover:bg-terminal-blue/10',
    red: 'border-terminal-red/50 text-terminal-red hover:bg-terminal-red/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 text-left border rounded text-xs transition-colors ${
        colorMap[color] || colorMap.green
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="font-bold">$ {label}</div>
      <div className="text-terminal-dim text-2xs mt-0.5">{sub}</div>
    </button>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es', { month: 'short', day: 'numeric' });
}
