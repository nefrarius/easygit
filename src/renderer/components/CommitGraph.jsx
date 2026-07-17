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
            <span className="shrink-0">
              {[...row.graph].map((ch, j) => (
                <span key={j} style={{ color: ch === '*' ? (row.color || '#b8cc52') : ch !== ' ' ? '#525252' : undefined }}>
                  {ch}
                </span>
              ))}
            </span>
            <span className="text-terminal-dim w-[72px] shrink-0 font-mono">
              {row.hash && (
                <span className="cursor-pointer hover:text-terminal-cyan" onClick={() => navigator.clipboard.writeText(row.hash)} title="Copiar hash">
                  {row.hash.substring(0, 7)}
                </span>
              )}
            </span>
            <span className="shrink-0 mr-2 space-x-1">
              {row.refs.map((ref, k) => {
                const clean = ref.replace('tag: ', '').replace(/[()]/g, '');
                const isBr = ref.includes('HEAD');
                const c = isBr ? '#e6db74' : colorFor(clean);
                return (
                  <span key={k} className="text-2xs px-1 rounded" style={{ backgroundColor: c + '20', color: c, border: `1px solid ${c}40` }}>
                    {clean}
                  </span>
                );
              })}
            </span>
            <span className="text-terminal-fg truncate">{row.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseGraph(out) {
  const lines = out.split('\n').filter(Boolean);
  const commitColors = {};
  const bc = {};
  let ci = 0;

  return lines.map((l) => {
    const m = l.match(/^([*|/\\\-\s\w._]+?)([a-f0-9]{7,40})\s(.*)/);
    if (!m) return { graph: [...l], hash: null, refs: [], msg: l.trim(), color: '#525252' };
    const graph = m[1];
    const hash = m[2];
    const rest = m[3];
    let refs = [];
    let msg = rest;
    const rm = rest.match(/^\((.+?)\)\s(.+)/);
    if (rm) {
      refs = rm[1].split(', ').map((s) => s.trim()).filter(Boolean);
      msg = rm[2];
    }
    const br = refs.find((r) => !r.includes('HEAD') && !r.startsWith('tag:') && !r.includes('/'));
    if (br) {
      if (!bc[br]) { bc[br] = COLORS[ci % COLORS.length]; ci++; }
      commitColors[hash] = bc[br];
    }
    return { graph: [...graph], hash, refs, msg: msg || '', color: commitColors[hash] || '#b8cc52' };
  });
}
