const { execFile } = require('child_process');
const simpleGit = require('simple-git');

/**
 * Servicio Git - usa simple-git + child_process.
 *
 * ¿Por qué ambos?
 * - simple-git: API limpia, parsea automáticamente status/branches/log etc.
 *   Devuelve objetos JS estructurados. Ideal para la UI.
 * - child_process (execFile): ejecución directa del binario git.
 *   Necesario para capturar el comando EXACTO que se muestra en la terminal visual.
 *   También más seguro (no pasa por shell) y permite manejar errores crudos de git.
 */

function escapeShellArg(arg) {
  if (!arg) return '';
  const str = String(arg);
  if (/^[a-zA-Z0-9_.\-/]+$/.test(str)) return str;
  return `'${str.replace(/'/g, "'\\''")}'`;
}

function execCommand(repoPath, args) {
  return new Promise((resolve, reject) => {
    const cmdStr = `git ${args.join(' ')}`;

    const child = execFile('git', args, { cwd: repoPath }, (error, stdout, stderr) => {
      const result = {
        command: cmdStr,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: !error,
        exitCode: error ? error.code || 1 : 0,
        timestamp: new Date().toISOString(),
      };

      if (error) {
        console.error(`[git:error] ${cmdStr}\n${stderr}`);
        resolve(result);
      } else {
        resolve(result);
      }
    });
  });
}

async function getStatus(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const status = await git.status();
    const branches = await git.branchLocal();
    const log = await git.log({ maxCount: 5 });

    return {
      success: true,
      data: {
        current: status.current,
        tracking: status.tracking,
        isClean: status.isClean(),
        modified: status.modified,
        staged: status.staged,
        created: status.created,
        deleted: status.deleted,
        files: status.files,
        ahead: status.ahead,
        behind: status.behind,
        branches: branches.all,
        currentBranch: branches.current,
        recentCommits: log.all,
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getBranches(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const branchSummary = await git.branchLocal();
    const branches = branchSummary.all.map((name) => ({
      name,
      current: name === branchSummary.current,
    }));
    return { success: true, data: branches };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getLog(repoPath, maxCount = 20) {
  try {
    const git = simpleGit(repoPath);
    const log = await git.log({ maxCount });
    return { success: true, data: log.all };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getRemotes(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const remotes = await git.getRemotes(true);
    return { success: true, data: remotes };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getDiff(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const diff = await git.diff();
    return { success: true, data: diff };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  execCommand,
  getStatus,
  getBranches,
  getLog,
  getRemotes,
  getDiff,
  escapeShellArg,
};
