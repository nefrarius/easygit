import React, { useEffect, useRef, useState } from 'react';

export default function TerminalPanel({ lines, onApprove, onReject }) {
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  return (
    <div className="h-56 border-t border-terminal-dim/30 bg-terminal-bg flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-terminal-highlight/50 border-b border-terminal-dim/30">
        <span className="text-xs font-bold text-terminal-dim tracking-wider">
          $ Terminal
        </span>
        <span className="text-2xs text-terminal-dim">
          {lines.filter((l) => l.done).length} ejecutados
        </span>
      </div>

      {/* Output */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-3 space-y-1"
      >
        {lines.length === 0 && (
          <div className="text-terminal-dim text-xs">
            $ Esperando comandos...<span className="animate-blink">▊</span>
          </div>
        )}

        {lines.map((line) => (
          <CommandLine
            key={line.id}
            line={line}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}

function CommandLine({ line, onApprove, onReject }) {
  const [displayedCmd, setDisplayedCmd] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const outputRef = useRef(null);

  // Typing animation
  useEffect(() => {
    if (line.type !== 'command') return;
    if (line.done) {
      setDisplayedCmd(line.command);
      setShowOutput(true);
      return;
    }

    let i = 0;
    const cmd = line.command;
    const interval = setInterval(() => {
      i++;
      setDisplayedCmd(cmd.substring(0, i));
      if (i >= cmd.length) {
        clearInterval(interval);
        setShowOutput(true);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [line.command, line.done]);

  // Scroll output into view as it appears
  useEffect(() => {
    if (showOutput && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showOutput]);

  const statusIcon = () => {
    if (!line.done) return <span className="text-terminal-yellow animate-blink">●</span>;
    if (line.success) return <span className="text-terminal-green">✔</span>;
    return <span className="text-terminal-red">✘</span>;
  };

  return (
    <div className="font-mono">
      {/* Prompt + command */}
      <div className="flex items-start gap-2 text-xs">
        <span className="text-terminal-green shrink-0">$</span>
        <div className="flex-1">
          <span className="text-terminal-fg">{displayedCmd}</span>
          {!line.done && displayedCmd.length < line.command.length && (
            <span className="text-terminal-green animate-blink">▊</span>
          )}

          {/* Approval buttons */}
          {line.pendingApproval && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => onApprove?.(line.id)}
                className={`px-2 py-0.5 text-2xs border rounded ${
                  line.destructive
                    ? 'border-terminal-red text-terminal-red hover:bg-terminal-red/10'
                    : 'border-terminal-green text-terminal-green hover:bg-terminal-green/10'
                }`}
              >
                {line.destructive ? '⚠️ Ejecutar' : '✔ Ejecutar'}
              </button>
              <button
                onClick={() => onReject?.(line.id)}
                className="px-2 py-0.5 text-2xs border border-terminal-dim text-terminal-dim hover:text-terminal-fg rounded"
              >
                ✘ Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="shrink-0">{statusIcon()}</div>
      </div>

      {/* Output */}
      {showOutput && line.output && (
        <div ref={outputRef} className="ml-5 mt-0.5 text-xs space-y-0.5">
          {line.output.split('\n').filter(Boolean).map((outLine, i) => {
            const isError = line.stderr && line.output.includes(line.stderr);
            return (
              <div
                key={i}
                className={`${
                  isError ? 'text-terminal-red' : 'text-terminal-dim'
                } whitespace-pre-wrap`}
              >
                {outLine}
              </div>
            );
          })}
          <div className="flex gap-2 mt-1">
            {line.done && (
              <button
                onClick={() => navigator.clipboard.writeText(line.command)}
                className="text-2xs text-terminal-dim hover:text-terminal-cyan transition-colors"
              >
                [copiar comando]
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty done line */}
      {line.done && !line.output && (
        <div className="ml-5 mt-0.5 text-xs text-terminal-green">
          {line.success ? '✔ Comando ejecutado correctamente' : '✘ Error al ejecutar comando'}
        </div>
      )}
    </div>
  );
}
