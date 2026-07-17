import React, { useState } from 'react';

export default function HistoryPanel({ history }) {
  const [filter, setFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const branches = [...new Set(history.map((h) => h.branch).filter(Boolean))];

  const filtered = history.filter((entry) => {
    if (filter && !entry.command.toLowerCase().includes(filter.toLowerCase())) return false;
    if (branchFilter && entry.branch !== branchFilter) return false;
    return true;
  });

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-terminal-dim text-xs">
          $ Sin historial de comandos en este repositorio
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="filtrar comandos..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 bg-terminal-highlight/50 border border-terminal-dim/30 rounded px-2 py-1 text-xs text-terminal-fg placeholder-terminal-dim font-mono outline-none focus:border-terminal-green/50 transition-colors"
        />
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="bg-terminal-highlight/50 border border-terminal-dim/30 rounded px-2 py-1 text-xs text-terminal-fg font-mono outline-none focus:border-terminal-green/50"
        >
          <option value="">todas las ramas</option>
          {branches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-2xs text-terminal-dim uppercase tracking-wider px-2 pb-1 border-b border-terminal-dim/20">
          <span className="w-16 shrink-0">Estado</span>
          <span className="w-20 shrink-0">Hora</span>
          <span className="w-24 shrink-0">Rama</span>
          <span className="flex-1">Comando</span>
        </div>
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 text-xs px-2 py-1 hover:bg-terminal-highlight/30 rounded transition-colors"
          >
            <span className={`w-16 shrink-0 ${entry.success ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {entry.success ? '✔ éxito' : '✘ error'}
            </span>
            <span className="w-20 shrink-0 text-terminal-dim font-mono">
              {formatTime(entry.timestamp)}
            </span>
            <span className="w-24 shrink-0 text-terminal-yellow truncate font-mono">
              {entry.branch || '-'}
            </span>
            <span className="flex-1 text-terminal-fg font-mono truncate">
              $ git {Array.isArray(entry.args) ? entry.args.join(' ') : entry.command}
            </span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-terminal-dim text-xs text-center mt-8">
          No hay resultados para este filtro
        </div>
      )}
    </div>
  );
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
