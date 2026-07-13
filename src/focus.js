const { execFile } = require('child_process');
const { promisify } = require('util');
const run = promisify(execFile);

/**
 * Best-effort "take me to that session": find the local `claude` CLI process
 * whose cwd matches the session's, figure out which GUI app hosts it (by
 * walking up the process tree), and activate that exact window/tab.
 */

async function psTable() {
  const { stdout } = await run('ps', ['-axo', 'pid=,ppid=,tty=,command=']);
  const rows = new Map();
  for (const line of stdout.split('\n')) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/);
    if (m) rows.set(Number(m[1]), { pid: Number(m[1]), ppid: Number(m[2]), tty: m[3], command: m[4] });
  }
  return rows;
}

async function cwdOf(pid) {
  try {
    const { stdout } = await run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']);
    const line = stdout.split('\n').find((l) => l.startsWith('n'));
    return line ? line.slice(1) : null;
  } catch {
    return null;
  }
}

function looksLikeClaudeCli(command) {
  if (/Electron|Code Pet|Helper|electron/.test(command)) return false;
  return /(^|\/)claude( |$)/.test(command) || /claude\/cli\.js|\.claude\/local/.test(command);
}

// Walk ancestors to find the hosting GUI app's .app bundle name.
function hostApp(rows, pid) {
  let cur = rows.get(pid);
  for (let i = 0; cur && i < 15; i++) {
    const m = cur.command.match(/\/([^/]+)\.app\/Contents\//);
    if (m) return m[1];
    cur = rows.get(cur.ppid);
  }
  return null;
}

async function osascript(script) {
  try {
    await run('osascript', ['-e', script]);
    return true;
  } catch {
    return false;
  }
}

async function focusTerminalByTty(tty) {
  return osascript(`
    tell application "Terminal"
      repeat with w in windows
        repeat with t in tabs of w
          if tty of t is "${tty}" then
            set selected tab of w to t
            set index of w to 1
            activate
            return
          end if
        end repeat
      end repeat
    end tell`);
}

async function focusITermByTty(tty) {
  return osascript(`
    tell application "iTerm2"
      repeat with w in windows
        repeat with t in tabs of w
          repeat with s in sessions of t
            if tty of s is "${tty}" then
              tell s to select
              select t
              select w
              activate
              return
            end if
          end repeat
        end repeat
      end repeat
    end tell`);
}

/** @returns {Promise<{ok: boolean, via?: string}>} */
async function focusSession(cwd) {
  if (!cwd) return { ok: false };
  const rows = await psTable();
  const matches = [];
  for (const row of rows.values()) {
    if (!looksLikeClaudeCli(row.command)) continue;
    if ((await cwdOf(row.pid)) === cwd) matches.push(row);
  }
  if (!matches.length) return { ok: false };
  // Prefer a process attached to a real terminal over headless/daemon ones.
  const target = matches.find((m) => m.tty && m.tty !== '??') || matches[0];

  const app = hostApp(rows, target.pid);
  const tty = target.tty && target.tty !== '??' ? `/dev/${target.tty}` : null;

  if (tty && app === 'Terminal' && (await focusTerminalByTty(tty))) return { ok: true, via: 'Terminal' };
  if (tty && (app === 'iTerm' || app === 'iTerm2') && (await focusITermByTty(tty))) return { ok: true, via: 'iTerm2' };

  // Editors: reopening the folder focuses its existing window.
  const editors = { 'Visual Studio Code': 1, Cursor: 1, Windsurf: 1, VSCodium: 1 };
  if (app && editors[app]) {
    try {
      await run('open', ['-a', app, cwd]);
      return { ok: true, via: app };
    } catch {}
  }

  // Anything else (Ghostty, Warp, kitty, Alacritty, WezTerm…): activate the app.
  if (app) {
    try {
      await run('open', ['-a', app]);
      return { ok: true, via: app };
    } catch {}
  }
  return { ok: false };
}

module.exports = { focusSession };
