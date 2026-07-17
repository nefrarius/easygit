import { useState, useCallback, useRef } from 'react';

let commandIdCounter = 0;

const initialState = {
  repoPath: null,
  status: null,
  branches: [],
  remotes: [],
  favorites: [],
  history: [],
  terminalLines: [],
  isExecuting: false,
  error: null,
};

export function useRepoStore() {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const addTerminalLine = useCallback((line) => {
    const newLine = { ...line, id: ++commandIdCounter };
    setState((prev) => ({
      ...prev,
      terminalLines: [...prev.terminalLines, newLine],
    }));
    return newLine.id;
  }, []);

  const appendTerminalOutput = useCallback((id, text) => {
    setState((prev) => ({
      ...prev,
      terminalLines: prev.terminalLines.map((l) =>
        l.id === id ? { ...l, output: (l.output || '') + text } : l
      ),
    }));
  }, []);

  const setTerminalDone = useCallback((id, success) => {
    setState((prev) => ({
      ...prev,
      terminalLines: prev.terminalLines.map((l) =>
        l.id === id ? { ...l, done: true, success } : l
      ),
    }));
  }, []);

  const setStatus = useCallback((status) => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  const setBranches = useCallback((branches) => {
    setState((prev) => ({ ...prev, branches }));
  }, []);

  const setAll = useCallback((partial) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const executeCommand = useCallback(
    async (repoPath, args, store = true) => {
      if (!repoPath) return null;

      const cmdStr = `git ${args.join(' ')}`;
      const lineId = addTerminalLine({
        type: 'command',
        command: cmdStr,
        args,
        output: '',
        done: false,
        success: null,
        approved: false,
        pendingApproval: false,
      });

      const result = await window.easygit.gitExecWithResult(repoPath, args);

      appendTerminalOutput(lineId, result.stdout || result.stderr);
      setTerminalDone(lineId, result.success);

      if (store && result.success) {
        await window.easygit.storeAddHistory({
          repoPath,
          command: 'git',
          args,
          stdout: result.stdout,
          stderr: result.stderr,
          success: result.success,
          exitCode: result.exitCode,
          branch: stateRef.current.status?.current || '',
          timestamp: result.timestamp,
        });
      }

      return result;
    },
    [addTerminalLine, appendTerminalOutput, setTerminalDone]
  );

  const executeWithApproval = useCallback(
    async (repoPath, args, destructive = false) => {
      if (!repoPath) return null;

      const cmdStr = `git ${args.join(' ')}`;
      const lineId = addTerminalLine({
        type: 'command',
        command: cmdStr,
        args,
        output: '',
        done: false,
        success: null,
        approved: false,
        pendingApproval: true,
        destructive,
      });

      return new Promise((resolve) => {
        const checkApproval = async () => {
          await new Promise((r) => setTimeout(r, 100));
          const currentLines = stateRef.current.terminalLines;
          const line = currentLines.find((l) => l.id === lineId);
          if (!line || line.approved === true) {
            const result = await window.easygit.gitExecWithResult(repoPath, args);
            appendTerminalOutput(lineId, result.stdout || result.stderr);
            setTerminalDone(lineId, result.success);

            if (result.success) {
              await window.easygit.storeAddHistory({
                repoPath,
                command: 'git',
                args,
                stdout: result.stdout,
                stderr: result.stderr,
                success: result.success,
                exitCode: result.exitCode,
                branch: stateRef.current.status?.current || '',
                timestamp: result.timestamp,
              });
            }
            resolve(result);
          } else if (line.approved === false) {
            appendTerminalOutput(lineId, '[CANCELADO por el usuario]\n');
            setTerminalDone(lineId, false);
            resolve({ success: false, cancelled: true, command: cmdStr });
          } else {
            setTimeout(() => checkApproval(), 200);
          }
        };
        checkApproval();
      });
    },
    [addTerminalLine, appendTerminalOutput, setTerminalDone]
  );

  const approveCommand = useCallback((lineId) => {
    setState((prev) => ({
      ...prev,
      terminalLines: prev.terminalLines.map((l) =>
        l.id === lineId ? { ...l, approved: true, pendingApproval: false } : l
      ),
    }));
  }, []);

  const rejectCommand = useCallback((lineId) => {
    setState((prev) => ({
      ...prev,
      terminalLines: prev.terminalLines.map((l) =>
        l.id === lineId ? { ...l, approved: false, pendingApproval: false } : l
      ),
    }));
  }, []);

  return {
    state,
    setAll,
    setStatus,
    setBranches,
    addTerminalLine,
    executeCommand,
    executeWithApproval,
    approveCommand,
    rejectCommand,
  };
}
