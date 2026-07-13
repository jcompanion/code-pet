---
description: Launch the Code Pet desktop companion (hatchable pet that watches your Claude Code sessions)
allowed-tools: Bash
---

Launch the Code Pet desktop app that ships with this plugin.

1. If it's already running (`pgrep -f "Code Pet.app|Electron.*code-pet"`), tell
   the user it's already on screen and stop.
2. Preferred path — prebuilt app (fast, no npm needed). If
   `${CLAUDE_PLUGIN_ROOT}/app/Code Pet.app` doesn't exist yet and the machine is
   Apple Silicon (`uname -m` = arm64), download it:
   ```bash
   mkdir -p "${CLAUDE_PLUGIN_ROOT}/app"
   curl -fsSL -o /tmp/codepet.zip \
     https://github.com/jcompanion/code-pet/releases/latest/download/CodePet-macos-arm64.zip
   ditto -x -k /tmp/codepet.zip "${CLAUDE_PLUGIN_ROOT}/app"
   xattr -dr com.apple.quarantine "${CLAUDE_PLUGIN_ROOT}/app/Code Pet.app" 2>/dev/null || true
   ```
   Then launch: `open "${CLAUDE_PLUGIN_ROOT}/app/Code Pet.app"`
3. Fallback — only if the download fails or the machine isn't arm64 macOS:
   ```bash
   npm install --prefix "${CLAUDE_PLUGIN_ROOT}"   # one-time Electron download
   nohup npm start --prefix "${CLAUDE_PLUGIN_ROOT}" >/dev/null 2>&1 &
   ```
   If npm start errors with "Electron failed to install correctly", run
   `node "${CLAUDE_PLUGIN_ROOT}/node_modules/electron/install.js"` and retry.
4. Tell the user: the pet appears in the bottom-right of every display. Drag it
   anywhere, resize via the ◢ corner grip or window edges, hover for ☰ to open
   the dashboard, and quit from the 🐾 menu-bar icon.
