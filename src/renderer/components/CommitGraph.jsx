import React, { useEffect, useState } from 'react';

const COLORS = [
  '#b8cc52', '#95e6cb', '#66d9ef', '#e6db74', '#ff3333',
  '#a6e22e', '#f92672', '#ae81ff', '#fd971f',
];

export default function CommitGraph({ repoPath }) {
  const [graph, setGraph] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadGraph = async () => {
    if (!repoPath) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.easygit.gitExecWithResult(repoPath, ['log', '--graph', '--oneline', '--all', '--decorate']);
      if (result.success) {
        setGraph(parseGraph(result.stdout));
      } else {
        setError(result.stderr);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadGraph(); }, [repoPath]);

  const branchColors = {};
  let ci = 0;
  const colorFor = (name) => {
    if (!branchColors[name]) { branchColors[name] = COLORS[ci % COLORS.length]; ci++; }
    return branchColors[name];
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-terminal-dim uppercase tracking-wider">Git Graph</h3>
        <button onClick={loadGraph} className="text-xs text-terminal-dim hover:text-terminal-fg">↻</button>
      </div>
      {loading && <div className="text-xs text-terminal-dim">Cargando...</div>}
      {error && <div className="text-xs text-terminal-red">Error: {error}</div>}
      {!loading && !error && graph.length === 0 && <div className="text-xs text-terminal-dim">Sin commits</div>}
      <div className="font-mono text-xs leading-6 overflow-auto max-h-[500px]">
        {graph.map((row, i) => (
          <div key={i} className="flex whitespace-nowrap">
            <span className="shrink-0" style={{ color: row.color || '#b8cc52' }}>
              {row.graph}
            </span>
            <span className={`w-[72px] shrink-0 font-mono ${row.hash ? 'text-terminal-dim' : ''}`}>
              {row.hash && (
                <span className="cursor-pointer hover:text-terminal-cyan" onClick={() => navigator.clipboard.writeText(row.hash)} title="Copiar hash">
                  {row.hash}
                </span>
              )}
            </span>
            {row.refs.length > 0 && (
              <span className="shrink-0 mr-2 space-x-1">
                {row.refs.map((ref, k) => {
                  const clean = ref.replace('tag: ', '').replace(/[()]/g, '');
                  const isHead = clean === 'HEAD';
                  const c = isHead ? '#e6db74' : colorFor(clean);
                  return (
                    <span key={k} className="text-2xs px-1 rounded" style={{ backgroundColor: c + '20', color: c, border: `1px solid ${c}40` }}>
                      {clean}
                    </span>
                  );
                })}
              </span>
            )}
            <span className="text-terminal-fg truncate">{row.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseGraph(out) {
  const lines = out.split('\n').filter(Boolean);
  const branchColors = {};
  let ci = 0;
  const result = [];

  for (const line of lines) {
    // Find the commit hash: first sequence of 7+ hex chars after graph symbols
    // Graph symbols are at the start: * | / \ - space
    const graphMatch = line.match(/^([*|/\\\-\s]+?)([a-f0-9]{7,40})(.*)/);
    if (!graphMatch) {
      // Line without commit (graph continuation)
      result.push({
        graph: line.replace(/\s+$/, ''),
        hash: null,
        refs: [],
        msg: '',
        color: '#525252',
      });
      continue;
    }

    const graphStr = graphMatch[1] + '*';
    const hash = graphMatch[2].substring(0, 7);
    const rest = graphMatch[3];

    let refs = [];
    let msg = rest;

    // Extract refs from (...)
    const refMatch = rest.match(/^\s*\((.+?)\)\s*(.*)/);
    if (refMatch) {
      refs = refMatch[1].split(', ').map((s) => s.trim()).filter(Boolean);
      msg = refMatch[2];
    }

    // Assign color by branch
    const localBranch = refs.find((r) => !r.includes('HEAD') && !r.startsWith('tag:') && !r.includes('/'));
    if (localBranch) {
      if (!branchColors[localBranch]) {
        branchColors[localBranch] = COLORS[ci % COLORS.length];
        ci++;
      }
    }

    const color = localBranch ? branchColors[localBranch] : '#b8cc52';

    result.push({
      graph: graphStr,
      hash,
      refs,
      msg: msg.trim(),
      color,
    });
  }

  return result;
}
