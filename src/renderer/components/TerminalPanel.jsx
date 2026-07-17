import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function TerminalPanel({ lines, repoPath, onExecute }) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };

  const handleKeyDown = useCallback(async (e) => {
    if (e.key === 'Enter' && inputVal.trim()) {
      const cmd = inputVal.trim();
      setCmdHistory((prev) => [cmd, ...prev.slice(0, 49)]);
      setHistIdx(-1);
      setInputVal('');
      if (onExecute) await onExecute(cmd);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const newIdx = histIdx === -1 ? 0 : Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(newIdx);
      setInputVal(cmdHistory[newIdx]);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx <= 0) {
        setHistIdx(-1);
        setInputVal('');
        return;
      }
      const newIdx = histIdx - 1;
      setHistIdx(newIdx);
      setInputVal(cmdHistory[newIdx]);
      return;
    }
  }, [inputVal, cmdHistory, histIdx, onExecute]);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="h-64 border-t border-terminal-dim/30 bg-terminal-bg flex flex-col shrink-0" onClick={handleContainerClick}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-terminal-highlight/50 border-b border-terminal-dim/30 shrink-0">
        <span className="text-xs font-bold text-terminal-dim tracking-wider">$ Terminal</span>
        <span className="text-2xs text-terminal-dim">
          {lines.filter((l) => l.done).length} ejecutados
          {repoPath && <span className="ml-2 text-terminal-green">●</span>}
        </span>
      </div>

      {/* Output */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-auto p-3 space-y-1">
        {lines.length === 0 && (
          <div className="text-terminal-dim text-xs">
            $ Escribe un comando abajo...<span className="animate-blink">▊</span>
          </div>
        )}
        {lines.map((line) => (
          <CmdLine key={line.id} line={line} />
        ))}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-terminal-highlight/30 border-t border-terminal-dim/30 shrink-0">
        <span className="text-terminal-green text-xs font-bold shrink-0">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={repoPath ? 'git status' : 'Abre un repositorio primero...'}
          disabled={!repoPath}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent text-xs text-terminal-fg font-mono outline-none placeholder-terminal-dim/50"
        />
        <span className={`text-terminal-green text-xs ${inputVal ? 'opacity-100' : 'opacity-0'}`}>⏎</span>
      </div>
    </div>
  );
}

function CmdLine({ line }) {
  const outputRef = useRef(null);

  useEffect(() => {
    if (line.done && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [line.done]);

  const icon = !line.done ? <span className="text-terminal-yellow animate-blink">●</span>
    : line.success ? <span className="text-terminal-green">✔</span>
    : <span className="text-terminal-red">✘</span>;

  return (
    <div className="font-mono">
      <div className="flex items-start gap-2 text-xs">
        <span className="text-terminal-green shrink-0">$</span>
        <span className={line.success === false ? 'text-terminal-red' : 'text-terminal-fg'}>
          {line.command}
        </span>
        <span className="ml-auto shrink-0">{icon}</span>
      </div>

      {line.output && (
        <div ref={outputRef} className="ml-5 mt-0.5 text-xs space-y-0.5">
          {line.output.split('\n').filter(Boolean).map((ol, i) => (
            <div key={i} className={line.success === false ? 'text-terminal-red' : 'text-terminal-dim'}>{ol}</div>
          ))}
          {line.done && (
            <button onClick={() => navigator.clipboard.writeText(line.command)}
              className="text-2xs text-terminal-dim hover:text-terminal-cyan transition-colors">[copiar comando]</button>
          )}
        </div>
      )}

      {line.done && !line.output && (
        <div className="ml-5 mt-0.5 text-xs text-terminal-green">✔ Comando ejecutado correctamente</div>
      )}
    </div>
  );
}
