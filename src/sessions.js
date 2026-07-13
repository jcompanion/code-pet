const fs = require('fs');
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');
const { execFile } = require('child_process');
const { promisify } = require('util');
const run = promisify(execFile);

// A session is considered "live" if its transcript changed within this window.
const ACTIVE_MS = 60 * 60 * 1000;
// How much history to read when we first meet an already-large file.
const TAIL_BYTES = 128 * 1024;
// Idle time after a plain assistant reply before we call it "waiting on you".
const WAIT_AFTER_REPLY_MS = 5 * 1000;
// Idle time after an assistant tool_use with no tool_result — usually a
// permission prompt sitting on screen.
const WAIT_AFTER_TOOLUSE_MS = 20 * 1000;
// Idle time after a user message with no assistant reply (stuck/killed turn).
const WAIT_AFTER_USER_MS = 3 * 60 * 1000;
// An agent transcript untouched this long is assumed finished even if we
// never saw its tool_result land in the parent session.
const AGENT_ACTIVE_MS = 5 * 60 * 1000;
// Keep finished agents visible in the dashboard for a little while.
const AGENT_SHOW_DONE_MS = 15 * 60 * 1000;
// A session whose claude process has exited gets this long before it is
// dropped from the dashboard (covers process-table races and quick restarts).
const DEAD_GRACE_MS = 90 * 1000;

/**
 * Watches ~/.claude/projects/**\/*.jsonl and models every local Claude Code
 * conversation as { state: 'working' | 'waiting', project, idleMs }.
 *
 * Emits:
 *  - 'update'    (sessions[])           snapshot changed
 *  - 'activity'  ({kind, sessionKey})   a new message landed (post-startup only)
 *  - 'attention' (session)              a session just flipped to waiting
 */
class SessionMonitor extends EventEmitter {
  constructor(root) {
    super();
    this.root = root || path.join(os.homedir(), '.claude', 'projects');
    this.files = new Map(); // abs path -> file record
    this.lastSnapshotJson = '';
    this.watcher = null;
    this.timer = null;
    this.liveCwds = new Map(); // cwd -> number of running claude processes
    this.liveCwdsReady = false;
  }

  start() {
    this.scan(true);
    this.refreshLiveCwds().then(() => this.evaluate());
    try {
      this.watcher = fs.watch(this.root, { recursive: true }, (_ev, fname) => {
        if (!fname || !fname.endsWith('.jsonl')) return;
        const file = path.join(this.root, fname);
        if (fname.includes(`${path.sep}subagents${path.sep}`)) this.onAgentEvent(file);
        else this.onFileEvent(file);
      });
    } catch (err) {
      console.error('[sessions] fs.watch failed, relying on polling:', err.message);
    }
    let tick = 0;
    this.timer = setInterval(() => {
      this.scan(false);
      if (tick++ % 2 === 0) this.refreshLiveCwds().then(() => this.evaluate());
      this.evaluate();
    }, 5000);
    this.evaluate();
  }

  // Which project dirs currently have a live `claude` CLI process (and how
  // many)? Used to drop sessions from the dashboard once they're closed.
  async refreshLiveCwds() {
    try {
      const { stdout } = await run('ps', ['-axo', 'pid=,command=']);
      const pids = [];
      for (const line of stdout.split('\n')) {
        const m = line.match(/^\s*(\d+)\s+(.*)$/);
        if (!m) continue;
        const cmd = m[2];
        if (/Electron|Code Pet|Helper/.test(cmd)) continue;
        if (/(^|\/)claude( |$)/.test(cmd) || /claude\/cli\.js|\.claude\/local/.test(cmd)) {
          pids.push(m[1]);
        }
      }
      const counts = new Map();
      for (const pid of pids) {
        try {
          const { stdout: ls } = await run('lsof', ['-a', '-p', pid, '-d', 'cwd', '-Fn']);
          const line = ls.split('\n').find((l) => l.startsWith('n'));
          if (line) {
            const cwd = line.slice(1);
            counts.set(cwd, (counts.get(cwd) || 0) + 1);
          }
        } catch {}
      }
      this.liveCwds = counts;
      this.liveCwdsReady = true;
    } catch (err) {
      // ps unavailable: fall back to the time-window behavior only.
    }
  }

  // Filter out sessions whose hosting process is gone. Each live claude
  // process in a cwd "claims" the most recently active session file there;
  // anything beyond that count is a closed conversation.
  dropDeadSessions(snap, now) {
    if (!this.liveCwdsReady) return snap;
    const byCwd = new Map();
    for (const s of snap) {
      if (!s.cwd) continue;
      if (!byCwd.has(s.cwd)) byCwd.set(s.cwd, []);
      byCwd.get(s.cwd).push(s);
    }
    const dead = new Set();
    for (const [cwd, list] of byCwd) {
      const slots = this.liveCwds.get(cwd) || 0;
      list.sort((a, b) => b.mtimeMs - a.mtimeMs);
      for (const s of list.slice(slots)) {
        if (now - s.mtimeMs > DEAD_GRACE_MS) dead.add(s.key);
      }
    }
    return snap.filter((s) => !dead.has(s.key));
  }

  stop() {
    if (this.watcher) this.watcher.close();
    clearInterval(this.timer);
  }

  scan(initial) {
    let dirs;
    try {
      dirs = fs.readdirSync(this.root, { withFileTypes: true });
    } catch {
      return; // no ~/.claude/projects yet
    }
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const dir = path.join(this.root, d.name);
      let entries;
      try {
        entries = fs.readdirSync(dir);
      } catch {
        continue;
      }
      for (const name of entries) {
        if (!name.endsWith('.jsonl')) continue;
        const file = path.join(dir, name);
        if (this.files.has(file)) {
          if (!initial) this.onFileEvent(file);
          continue;
        }
        this.register(file, initial);
      }
    }
  }

  register(file, initial) {
    let st;
    try {
      st = fs.statSync(file);
    } catch {
      return;
    }
    const rec = {
      file,
      key: path.basename(file, '.jsonl'),
      dirName: path.basename(path.dirname(file)),
      offset: initial ? st.size : 0,
      buf: '',
      mtimeMs: st.mtimeMs,
      cwd: null,
      lastType: null, // 'user' | 'tool_result' | 'assistant'
      lastToolUse: false,
      prevState: null,
      agents: new Map(), // agentId -> {id, mtimeMs, meta}
      finishedToolIds: new Set(), // tool_use_ids resolved in the parent session
    };
    this.files.set(file, rec);
    if (initial && st.mtimeMs > Date.now() - ACTIVE_MS) {
      // Seed state from the tail of an already-live session, without XP.
      this.readChunk(rec, Math.max(0, st.size - TAIL_BYTES), st.size, false);
    } else if (!initial) {
      // Brand-new session started while we're running: everything counts.
      this.onFileEvent(file);
    }
  }

  onFileEvent(file) {
    const rec = this.files.get(file);
    if (!rec) {
      this.register(file, false);
      return;
    }
    let st;
    try {
      st = fs.statSync(file);
    } catch {
      this.files.delete(file);
      return;
    }
    rec.mtimeMs = st.mtimeMs;
    if (st.size < rec.offset) rec.offset = 0; // truncated/rewritten
    if (st.size > rec.offset) {
      // Don't replay huge backlogs as XP if we somehow fell far behind.
      const award = st.size - rec.offset < 2 * 1024 * 1024;
      const from = award ? rec.offset : Math.max(rec.offset, st.size - TAIL_BYTES);
      this.readChunk(rec, from, st.size, award);
    }
    this.evaluate();
  }

  readChunk(rec, from, to, award) {
    let fd;
    try {
      fd = fs.openSync(rec.file, 'r');
      const len = to - from;
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, from);
      rec.offset = to;
      let text = rec.buf + buf.toString('utf8');
      if (from > 0 && !rec.buf) {
        // Started mid-file (tail read): drop the first partial line.
        const nl = text.indexOf('\n');
        text = nl === -1 ? '' : text.slice(nl + 1);
      }
      const lines = text.split('\n');
      rec.buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let r;
        try {
          r = JSON.parse(line);
        } catch {
          continue;
        }
        this.apply(rec, r, award);
      }
    } catch (err) {
      console.error('[sessions] read failed:', err.message);
    } finally {
      if (fd !== undefined) try { fs.closeSync(fd); } catch {}
    }
  }

  apply(rec, r, award) {
    if (r.type !== 'user' && r.type !== 'assistant') return;
    if (r.isSidechain) return; // subagent chatter: activity, but not turn state
    if (r.cwd) rec.cwd = r.cwd;
    const content = r.message && r.message.content;
    const blocks = Array.isArray(content) ? content : [];
    const toolUse = blocks.some((b) => b && b.type === 'tool_use');
    const toolResult = blocks.some((b) => b && b.type === 'tool_result');
    for (const b of blocks) {
      // A tool_result landing in the parent marks its agent as finished.
      if (b && b.type === 'tool_result' && b.tool_use_id) rec.finishedToolIds.add(b.tool_use_id);
    }

    if (r.type === 'assistant') {
      rec.lastType = 'assistant';
      rec.lastToolUse = toolUse;
    } else {
      rec.lastType = toolResult ? 'tool_result' : 'user';
      rec.lastToolUse = false;
    }
    if (award) {
      this.emit('activity', {
        kind: r.type === 'assistant' ? 'assistant' : toolResult ? 'tool' : 'user',
        sessionKey: rec.key,
        ts: Date.parse(r.timestamp) || Date.now(),
      });
    }
  }

  // ---- background agents ----

  onAgentEvent(file) {
    // .../<projectDir>/<sessionKey>/subagents/agent-<id>.jsonl
    const sessionKey = path.basename(path.dirname(path.dirname(file)));
    for (const rec of this.files.values()) {
      if (rec.key === sessionKey) {
        this.upsertAgent(rec, file);
        this.evaluate();
        return;
      }
    }
  }

  upsertAgent(rec, file) {
    let st;
    try {
      st = fs.statSync(file);
    } catch {
      return;
    }
    const id = path.basename(file, '.jsonl');
    let agent = rec.agents.get(id);
    if (!agent) {
      agent = { id, mtimeMs: st.mtimeMs, meta: null };
      rec.agents.set(id, agent);
    }
    agent.mtimeMs = Math.max(agent.mtimeMs, st.mtimeMs);
    if (!agent.meta) {
      try {
        agent.meta = JSON.parse(fs.readFileSync(file.replace(/\.jsonl$/, '.meta.json'), 'utf8'));
      } catch {
        agent.meta = {};
      }
    }
  }

  scanAgents(rec) {
    const dir = path.join(path.dirname(rec.file), rec.key, 'subagents');
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name.endsWith('.jsonl')) this.upsertAgent(rec, path.join(dir, name));
    }
  }

  agentsOf(rec, now) {
    const out = [];
    for (const a of rec.agents.values()) {
      const idle = now - a.mtimeMs;
      const finished =
        (a.meta && a.meta.toolUseId && rec.finishedToolIds.has(a.meta.toolUseId)) ||
        idle > AGENT_ACTIVE_MS;
      if (finished && idle > AGENT_SHOW_DONE_MS) continue;
      out.push({
        id: a.id,
        description: (a.meta && a.meta.description) || 'agent',
        agentType: (a.meta && a.meta.agentType) || '',
        state: finished ? 'done' : 'running',
        idleMs: idle,
        mtimeMs: a.mtimeMs,
      });
    }
    out.sort((x, y) =>
      x.state === y.state ? y.mtimeMs - x.mtimeMs : x.state === 'running' ? -1 : 1
    );
    return out;
  }

  stateOf(rec, now, effectiveMtime, runningAgents) {
    const idle = now - effectiveMtime;
    if (idle > ACTIVE_MS || !rec.lastType) return null;
    // Live agents mean the parent turn is still in flight, whatever its tail
    // looks like (it usually ends in the Task tool_use that spawned them).
    if (runningAgents > 0) return 'working';
    const ownIdle = now - rec.mtimeMs;
    if (rec.lastType === 'assistant') {
      if (rec.lastToolUse) {
        return ownIdle > WAIT_AFTER_TOOLUSE_MS ? 'waiting' : 'working';
      }
      return ownIdle > WAIT_AFTER_REPLY_MS ? 'waiting' : 'working';
    }
    // user message or tool result just landed: Claude is thinking
    return ownIdle > WAIT_AFTER_USER_MS ? 'waiting' : 'working';
  }

  projectName(rec) {
    if (rec.cwd) return path.basename(rec.cwd);
    const parts = rec.dirName.split('-').filter(Boolean);
    return parts[parts.length - 1] || rec.dirName;
  }

  evaluate() {
    const now = Date.now();
    let snap = [];
    for (const rec of this.files.values()) {
      // Only pay the readdir for sessions that could plausibly be live.
      if (now - rec.mtimeMs < ACTIVE_MS * 1.5 || rec.agents.size) this.scanAgents(rec);
      const agents = this.agentsOf(rec, now);
      const running = agents.filter((a) => a.state === 'running').length;
      const effectiveMtime = agents.reduce((m, a) => Math.max(m, a.mtimeMs), rec.mtimeMs);
      const state = this.stateOf(rec, now, effectiveMtime, running);
      if (state && rec.prevState !== 'waiting' && state === 'waiting') {
        this.emit('attention', {
          key: rec.key,
          project: this.projectName(rec),
          toolStall: rec.lastToolUse,
        });
      }
      rec.prevState = state;
      if (!state) continue;
      snap.push({
        key: rec.key,
        project: this.projectName(rec),
        cwd: rec.cwd,
        state,
        toolStall: state === 'waiting' && rec.lastToolUse,
        idleMs: now - effectiveMtime,
        mtimeMs: effectiveMtime,
        agents,
        agentsRunning: running,
      });
    }
    snap = this.dropDeadSessions(snap, now);
    snap.sort((a, b) =>
      a.state === b.state ? b.mtimeMs - a.mtimeMs : a.state === 'waiting' ? -1 : 1
    );
    const json = JSON.stringify(
      snap.map((s) => [s.key, s.state, s.project, s.agents.map((a) => a.id + a.state).join()])
    );
    this.snapshot = snap;
    if (json !== this.lastSnapshotJson) {
      this.lastSnapshotJson = json;
      this.emit('update', snap);
    }
  }
}

module.exports = { SessionMonitor, ACTIVE_MS };
