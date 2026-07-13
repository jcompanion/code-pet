---
description: Launch the Code Pet desktop companion (hatchable pet that watches your Claude Code sessions)
allowed-tools: Bash
---

Launch the Code Pet desktop app that ships with this plugin. Steps:

1. The app lives at `${CLAUDE_PLUGIN_ROOT}`.
2. If it's already running, tell the user and stop: check with
   `pgrep -f "Electron .*code-pet|electron \." | head -1` scoped to that directory
   (e.g. `pgrep -lf code-pet`).
3. If `${CLAUDE_PLUGIN_ROOT}/node_modules` does not exist, run
   `npm install --prefix "${CLAUDE_PLUGIN_ROOT}"` first (one-time Electron download).
4. Start it detached so it outlives this session:
   `nohup npm start --prefix "${CLAUDE_PLUGIN_ROOT}" >/dev/null 2>&1 &`
5. Tell the user: the pet appears in the bottom-right of every display. Drag it
   anywhere, resize its window by the edges, click ☰ (on hover) for the
   dashboard, and use the 🐾 menu-bar icon to quit.
