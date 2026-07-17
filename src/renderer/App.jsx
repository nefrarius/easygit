import React, { useEffect, useCallback, useState } from 'react';
import { useRepoStore } from '../store/repoStore';
import Sidebar from './components/Sidebar';
import RepoPanel from './components/RepoPanel';
import TerminalPanel from './components/TerminalPanel';
import HistoryPanel from './components/HistoryPanel';
import GitHubPanel from './components/GitHubPanel';

export default function App() {
  const { state, setAll, setStatus, setBranches, executeCommand, approveCommand, rejectCommand } = useRepoStore();
  const { repoPath, status, branches } = state;
  const [activeTab, setActiveTab] = useState('repo');
  const [githubUser, setGithubUser] = useState(null);

  const refreshStatus = useCallback(async () => {
    if (!repoPath) return;
    const statusResult = await window.easygit.gitStatus(repoPath);
    if (statusResult.success) {
      setStatus(statusResult.data);
    }
    const branchesResult = await window.easygit.gitBranches(repoPath);
    if (branchesResult.success) {
      setBranches(branchesResult.data);
    }
  }, [repoPath, setStatus, setBranches]);

  useEffect(() => {
    if (repoPath) {
      refreshStatus();
      window.easygit.storeGetHistory(repoPath).then((h) => {
        setAll({ history: h || [] });
      });
    }
  }, [repoPath]);

  useEffect(() => {
    window.easygit.storeGetFavorites().then((favs) => {
      setAll({ favorites: favs || [] });
    });
    window.easygit.githubGetToken().then(async (token) => {
      if (token) {
        const result = await window.easygit.githubSetToken(token);
        if (result.success) setGithubUser(result.user);
      }
    });
  }, []);

  const handleSelectFolder = async () => {
    const folder = await window.easygit.selectFolder();
    if (folder) {
      setAll({ repoPath: folder });
      window.easygit.storeAddFavorite(folder);
      const favs = await window.easygit.storeGetFavorites();
      setAll({ favorites: favs || [] });
    }
  };

  const handleInitRepo = async () => {
    const folder = await window.easygit.selectFolder();
    if (folder) {
      const result = await executeCommand(folder, ['init'], false);
      if (result.success) {
        setAll({ repoPath: folder });
        const favs = await window.easygit.storeGetFavorites();
        setAll({ favorites: favs || [] });
      }
    }
  };

  const handleQuickCommit = async () => {
    if (!repoPath) return;
    const msg = generateCommitMessage(status);
    await executeCommand(repoPath, ['add', '.']);
    await executeCommand(repoPath, ['commit', '-m', msg]);
    await executeCommand(repoPath, ['push']);
    refreshStatus();
  };

  const handleSync = async () => {
    if (!repoPath) return;
    await executeCommand(repoPath, ['pull']);
    refreshStatus();
  };

  const handleNewBranch = async () => {
    if (!repoPath) return;
    const name = prompt('Nombre de la nueva rama:');
    if (!name) return;
    await executeCommand(repoPath, ['checkout', '-b', name]);
    await executeCommand(repoPath, ['push', '-u', 'origin', name]);
    refreshStatus();
  };

  const handleUndoCommit = async () => {
    if (!repoPath) return;
    const ok = confirm('¿Deshacer el último commit? (soft reset - no se pierden cambios)');
    if (!ok) return;
    await executeCommand(repoPath, ['reset', '--soft', 'HEAD~1']);
    refreshStatus();
  };

  const handleGithubLogin = async (token) => {
    const result = await window.easygit.githubSetToken(token);
    if (result.success) {
      setGithubUser(result.user);
    }
    return result;
  };

  const handleGithubLogout = async () => {
    await window.easygit.githubSetToken('');
    setGithubUser(null);
  };

  const handleDiscardChanges = async () => {
    if (!repoPath) return;
    const ok = confirm('⚠️ ¿DESCARTAR todos los cambios? Esto es DESTRUCTIVO.');
    if (!ok) return;
    const ok2 = confirm('¿Estás SEGURO? Los cambios sin stagear se perderán.');
    if (!ok2) return;
    await executeCommand(repoPath, ['restore', '.']);
    refreshStatus();
  };

  return (
    <div className="h-screen flex flex-col bg-terminal-bg text-terminal-fg overflow-hidden">
      {/* Title bar (macOS) */}
      <div className="drag-region h-8 flex items-center px-4 bg-terminal-highlight border-b border-terminal-dim/30">
        <span className="text-xs text-terminal-green font-bold tracking-wider no-drag">
          EasyGit
        </span>
        <span className="text-xs text-terminal-dim ml-2 no-drag">
          {repoPath ? repoPath.split('/').pop() : 'sin repositorio'}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          repoPath={repoPath}
          status={status}
          branches={branches}
          favorites={state.favorites}
          onSelectFolder={handleSelectFolder}
          onInitRepo={handleInitRepo}
          onSelectFavorite={(p) => setAll({ repoPath: p })}
          onRemoveFavorite={(p) => {
            window.easygit.storeRemoveFavorite(p);
            window.easygit.storeGetFavorites().then((favs) => setAll({ favorites: favs || [] }));
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-terminal-dim/30 bg-terminal-highlight/50">
            {[
              { id: 'repo', label: 'Repo' },
              { id: 'github', label: 'GitHub' },
              { id: 'history', label: 'Historial' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-mono tracking-wider border-r border-terminal-dim/30 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-terminal-bg text-terminal-green border-b-2 border-b-terminal-green'
                    : 'text-terminal-dim hover:text-terminal-fg'
                }`}
              >
                $ {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'repo' && (
              <RepoPanel
                repoPath={repoPath}
                status={status}
                onRefresh={refreshStatus}
                onQuickCommit={handleQuickCommit}
                onSync={handleSync}
                onNewBranch={handleNewBranch}
                onUndoCommit={handleUndoCommit}
                onDiscardChanges={handleDiscardChanges}
              />
            )}
            {activeTab === 'github' && (
              <GitHubPanel
                repoPath={repoPath}
                status={status}
                githubUser={githubUser}
                onLogin={handleGithubLogin}
                onLogout={handleGithubLogout}
                onRefresh={refreshStatus}
              />
            )}
            {activeTab === 'history' && (
              <HistoryPanel history={state.history} />
            )}
          </div>

          {/* Terminal panel */}
          <TerminalPanel
            lines={state.terminalLines}
            onApprove={approveCommand}
            onReject={rejectCommand}
          />
        </div>
      </div>
    </div>
  );
}

function generateCommitMessage(status) {
  if (!status) return 'WIP: cambios automáticos';
  const parts = [];
  if (status.modified?.length) {
    const folders = groupByFolder(status.modified);
    parts.push(`modifica: ${folders.join(', ')}`);
  }
  if (status.created?.length) {
    parts.push(`añade: ${status.created.length} archivos`);
  }
  if (status.deleted?.length) {
    parts.push(`elimina: ${status.deleted.length} archivos`);
  }
  if (parts.length === 0) return `WIP: cambios en ${new Date().toLocaleDateString('es')}`;
  return parts.join('; ');
}

function groupByFolder(files) {
  const folders = new Set();
  files.forEach((f) => {
    const parts = f.split('/');
    if (parts.length > 1) folders.add(parts[0] + '/');
    else folders.add(f);
  });
  return Array.from(folders).slice(0, 3).join(', ');
}
