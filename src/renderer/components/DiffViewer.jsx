import React, { useEffect, useRef } from 'react';

export default function DiffViewer({ diff, filename, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [filename, diff]);

  if (!diff) {
    return (
      <div className="h-full flex items-center justify-center text-terminal-dim text-xs">
        Selecciona un archivo para ver su diff
      </div>
    );
  }

  const lines = diff.split('\n');

  return (
    <div className="h-full flex flex-col bg-terminal-bg border-l border-terminal-dim/30">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-terminal-highlight/50 border-b border-terminal-dim/30">
        <span className="text-xs text-terminal-cyan font-mono">{filename}</span>
        <button onClick={onClose} className="text-terminal-dim hover:text-terminal-fg text-xs px-1">✕</button>
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-auto p-2 font-mono text-xs leading-5">
        {lines.map((line, i) => {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            return <div key={i} className="bg-terminal-green/10 text-terminal-green whitespace-pre-wrap">{line}</div>;
          }
          if (line.startsWith('-') && !line.startsWith('---')) {
            return <div key={i} className="bg-terminal-red/10 text-terminal-red whitespace-pre-wrap">{line}</div>;
          }
          if (line.startsWith('@@')) {
            return <div key={i} className="text-terminal-cyan whitespace-pre-wrap">{line}</div>;
          }
          if (line.startsWith('diff --git') || line.startsWith('---') || line.startsWith('+++') || line.startsWith('index ')) {
            return <div key={i} className="text-terminal-dim italic whitespace-pre-wrap">{line}</div>;
          }
          return <div key={i} className="text-terminal-fg/70 whitespace-pre-wrap">{line}</div>;
        })}
      </div>
    </div>
  );
}
