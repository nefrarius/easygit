import React, { useState } from 'react';

export default function RepoPanel({
  repoPath, status, onRefresh, onQuickCommit, onSync, onNewBranch, onUndoCommit, onDiscardChanges, onOpenDiff, onCommitSelected,
}) {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');

  if (!repoPath) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-terminal-dim text-xs mb-1">╔══════════════════════════╗</div>
          <div className="text-terminal-dim text-xs mb-1">║  Abre un repositorio     ║</div>
          <div className="text-terminal-dim text-xs mb-1">║  o inicializa uno nuevo  ║</div>
          <div className="text-terminal-dim text-xs mb-4">╚══════════════════════════╝</div>
          <div className="text-terminal-green text-xs animate-blink">▊</div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-terminal-dim text-xs">$ detectando estado del repo...</div>
      </div>
    );
  }

  const statusIcon = status.isClean && status.ahead === 0 && status.behind === 0 ? '✔'
    : !status.isClean ? '●' : '↕';

  const statusColor = status.isClean && status.ahead === 0 && status.behind === 0 ? 'text-terminal-green'
    : !status.isClean ? 'text-terminal-yellow' : 'text-terminal-cyan';

  const toggleFile = (path) => {
    setSelectedFiles((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const selectAll = () => {
    const allSelected = status.files.every((f) => selectedFiles[f.path]);
    const newSel = {};
    if (!allSelected) {
      status.files.forEach((f) => { newSel[f.path] = true; });
    }
    setSelectedFiles(newSel);
  };

  const selectedCount = Object.values(selectedFiles).filter(Boolean).length;
  const hasSelection = selectedCount > 0;

  const handleCommitSelected = () => {
    setShowCommitModal(true);
    setCommitMsg(generateCommitMessage(status, selectedFiles));
  };

  const doCommitSelected = async () => {
    const files = Object.entries(selectedFiles).filter(([, v]) => v).map(([k]) => k);
    if (files.length === 0) return;
    await onCommitSelected(files, commitMsg);
    setShowCommitModal(false);
    setSelectedFiles({});
    onRefresh();
  };

  const handleFileClick = (file) => {
    if (onOpenDiff) onOpenDiff(file.path);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-terminal-green">{repoPath.split('/').pop()}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs ${statusColor}`}>{statusIcon} {status.current}</span>
            <span className="text-xs text-terminal-dim">{repoPath}</span>
          </div>
        </div>
        <button onClick={onRefresh} className="px-3 py-1 text-xs border border-terminal-dim/50 text-terminal-dim hover:text-terminal-fg hover:border-terminal-fg rounded transition-colors">↻ refresh</button>
      </div>

      {/* Sync info */}
      <div className="flex gap-4 text-xs">
        <span className={status.ahead > 0 ? 'text-terminal-cyan' : 'text-terminal-dim'}>ahead: {status.ahead}</span>
        <span className={status.behind > 0 ? 'text-terminal-yellow' : 'text-terminal-dim'}>behind: {status.behind}</span>
        <span className={status.isClean ? 'text-terminal-green' : 'text-terminal-yellow'}>clean: {status.isClean ? 'true' : 'false'}</span>
      </div>

      {/* Files */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider">Archivos</h3>
          <div className="flex gap-2">
            {status.files.length > 0 && (
              <button onClick={selectAll} className="text-2xs text-terminal-dim hover:text-terminal-fg">
                {status.files.every((f) => selectedFiles[f.path]) ? '▲ deseleccionar' : '▼ seleccionar'}
              </button>
            )}
          </div>
        </div>
        <div className="bg-terminal-highlight/30 border border-terminal-dim/20 rounded max-h-52 overflow-auto">
          {status.files.length === 0 ? (
            <div className="text-terminal-dim text-xs p-3">No hay cambios pendientes</div>
          ) : (
            status.files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 border-b border-terminal-dim/10 last:border-0 hover:bg-terminal-highlight/50 group">
                <input
                  type="checkbox"
                  checked={!!selectedFiles[file.path]}
                  onChange={() => toggleFile(file.path)}
                  className="accent-terminal-green shrink-0"
                />
                <Badge status={file.working_dir} />
                <span
                  className={`flex-1 truncate text-xs cursor-pointer ${file.working_dir === 'D' ? 'text-terminal-red line-through' : 'text-terminal-fg hover:text-terminal-cyan'}`}
                  onClick={() => handleFileClick(file)}
                >
                  {file.path}
                </span>
                <button
                  onClick={() => handleFileClick(file)}
                  className="text-2xs text-terminal-dim opacity-0 group-hover:opacity-100 hover:text-terminal-cyan transition-opacity"
                >
                  diff
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Staged */}
      {status.staged.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-terminal-cyan uppercase tracking-wider mb-2">Staged</h3>
          <div className="space-y-1">
            {status.staged.map((file, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-terminal-cyan ml-2">
                <span>+</span>
                <span className="cursor-pointer hover:text-terminal-fg" onClick={() => handleFileClick(file)}>{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected commit bar */}
      {hasSelection && !showCommitModal && (
        <div className="bg-terminal-green/10 border border-terminal-green/30 rounded p-2 flex items-center justify-between">
          <span className="text-xs text-terminal-green">{selectedCount} archivo(s) seleccionado(s)</span>
          <button onClick={handleCommitSelected} className="px-3 py-1 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 transition-colors">
            $ Commit seleccionados
          </button>
        </div>
      )}

      {/* Commit modal */}
      {showCommitModal && (
        <div className="bg-terminal-highlight/50 border border-terminal-green/30 rounded p-4 space-y-3">
          <h4 className="text-xs font-bold text-terminal-green">Commit ({selectedCount} archivos)</h4>
          <input
            type="text"
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Mensaje del commit"
            className="w-full bg-terminal-bg border border-terminal-dim/30 rounded px-2 py-1.5 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-green/50"
            onKeyDown={(e) => e.key === 'Enter' && doCommitSelected()}
          />
          <div className="text-2xs text-terminal-dim">
            {Object.entries(selectedFiles).filter(([, v]) => v).map(([k]) => (
              <div key={k} className="text-terminal-green">+ {k}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={doCommitSelected} disabled={!commitMsg.trim()}
              className="px-3 py-1.5 text-xs border border-terminal-green/50 text-terminal-green rounded hover:bg-terminal-green/10 disabled:opacity-40 transition-colors">
              $ Hacer commit
            </button>
            <button onClick={() => setShowCommitModal(false)}
              className="px-3 py-1.5 text-xs border border-terminal-dim/50 text-terminal-dim rounded hover:text-terminal-fg transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-3">Acciones rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionBtn label="Quick Commit" sub="add + commit + push" onClick={onQuickCommit} color="green" disabled={status.isClean} />
          <ActionBtn label="Sync" sub="git pull" onClick={onSync} color="cyan" />
          <ActionBtn label="Nueva rama" sub="checkout -b + push -u" onClick={onNewBranch} color="yellow" />
          <ActionBtn label="Undo commit" sub="reset --soft HEAD~1" onClick={onUndoCommit} color="blue" />
        </div>
        <div className="mt-4 pt-4 border-t border-terminal-dim/30">
          <h4 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">Zona de peligro</h4>
          <ActionBtn label="Descartar cambios" sub="git restore . (destructivo)" onClick={onDiscardChanges} color="red" disabled={status.isClean} />
        </div>
      </div>

      {/* Recent commits */}
      {status.recentCommits?.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider mb-2">Commits recientes</h3>
          <div className="space-y-1">
            {status.recentCommits.slice(0, 10).map((c) => (
              <div key={c.hash} className="flex items-start gap-2 text-xs">
                <span className="text-terminal-dim font-mono shrink-0">{c.hash.substring(0, 7)}</span>
                <span className="text-terminal-fg truncate">{c.message}</span>
                <span className="text-terminal-dim shrink-0 ml-auto">{fmtDate(c.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ status: s }) {
  const map = { M: 'M', A: 'A', D: 'D', '?': '?', ' ': ' ' };
  const colors = { M: 'text-terminal-yellow', A: 'text-terminal-green', D: 'text-terminal-red', '?': 'text-terminal-dim' };
  return <span className={`font-bold text-xs ${colors[s] || 'text-terminal-dim'}`}>[{map[s] || ' '}]</span>;
}

function ActionBtn({ label, sub, onClick, color, disabled }) {
  const colors = {
    green: 'border-terminal-green/50 text-terminal-green hover:bg-terminal-green/10',
    cyan: 'border-terminal-cyan/50 text-terminal-cyan hover:bg-terminal-cyan/10',
    yellow: 'border-terminal-yellow/50 text-terminal-yellow hover:bg-terminal-yellow/10',
    blue: 'border-terminal-blue/50 text-terminal-blue hover:bg-terminal-blue/10',
    red: 'border-terminal-red/50 text-terminal-red hover:bg-terminal-red/10',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-2 text-left border rounded text-xs transition-colors ${colors[color] || colors.green} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="font-bold">$ {label}</div>
      <div className="text-terminal-dim text-2xs mt-0.5">{sub}</div>
    </button>
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('es', { month: 'short', day: 'numeric' });
}

function generateCommitMessage(status, selectedFiles) {
  const selected = Object.entries(selectedFiles).filter(([, v]) => v).map(([k]) => k);
  if (selected.length > 0) {
    const folders = [...new Set(selected.map((f) => f.includes('/') ? f.split('/')[0] + '/' : f))].slice(0, 3);
    return `modifica: ${folders.join(', ')}`;
  }
  if (!status) return 'WIP: cambios automáticos';
  const parts = [];
  if (status.modified?.length) parts.push(`modifica: ${groupByFolder(status.modified)}`);
  if (status.created?.length) parts.push(`añade: ${status.created.length} archivos`);
  if (status.deleted?.length) parts.push(`elimina: ${status.deleted.length} archivos`);
  return parts.length ? parts.join('; ') : `WIP: cambios en ${new Date().toLocaleDateString('es')}`;
}

function groupByFolder(files) {
  const folders = new Set();
  files.forEach((f) => {
    const p = f.split('/');
    folders.add(p.length > 1 ? p[0] + '/' : f);
  });
  return Array.from(folders).slice(0, 3).join(', ');
}
