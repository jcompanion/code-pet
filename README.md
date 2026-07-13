# 🐾 Code Pet

A tiny, hatchable desktop pet that lives on every screen and watches your
**local Claude Code sessions**. It bobs along while Claude works, hops and
yells when a session is **waiting on your answer** (or a permission approval),
and sleeps when you're not coding.

Coding feeds it XP. XP hatches eggs, levels pets, and **evolves** them.
Achievements drop new eggs with rarities from Common to Legendary.

## Features

- 🖥️ **Every display, every Space** — one pet window per monitor, always on
  top, visible on all macOS Spaces (even over fullscreen apps).
- 🖱️ **Drag & resize** — grab the pet to move it, resize the window by its
  edges; the pet scales with it. Positions are remembered per display.
- 👀 **Session radar** — tails `~/.claude/projects/**/*.jsonl` live. Detects
  every running conversation, whether Claude is *working*, *waiting for your
  reply*, or *probably stuck on a permission prompt*.
- 🤖 **Background agent radar** — subagents spawned by your sessions show up
  under each session with their task description and RUNNING/DONE state
  (completion detected from the parent transcript's tool results). While
  agents run, the session counts as working, never "stuck".
- 🥚 **Hatching** — you start with a welcome egg. Earn XP by coding with
  Claude; when the egg is ready it wobbles — click it to hatch.
- 🏆 **19 achievements** (streaks, night owl, 5 concurrent sessions, 6
  concurrent agents, marathon sessions…) — each one drops a new egg.
  Higher-tier achievements roll rarer eggs: Common → Uncommon → Rare → Epic →
  Legendary.
- 🍄 **16 original pixel-art species, 3 evolution stages each** — creatures
  are hand-authored pixel grids rendered to SVG (crisp at any size): Blobby,
  Sporeling the mushroom, Kentari the centaur, Wispurr the ghost cat,
  Byteling, Axopuff, Drakon… Pets evolve at Lv.5 and Lv.12; the final
  Ascended form is generated with a golden crown and a brightened palette.
  Your **main pet** earns the XP; switch mains anytime from the dashboard.
- 📟 **Dashboard** — live session list, egg incubator, pet collection, and the
  achievement wall. Open with ☰ on the pet (hover) or the 🐾 menu-bar icon.

## Run it

```bash
npm install   # one-time (downloads Electron)
npm start
```

The pet appears in the bottom-right of each display. Quit from the 🐾
menu-bar icon or the dashboard footer.

## Use it as a Claude Code plugin

This repo doubles as a Claude Code plugin marketplace:

```
/plugin marketplace add jcompanion/code-pet
/plugin install code-pet@code-pet
```

Then in any session, run **`/code-pet:pet`** to launch (it installs deps on
first run and starts the app detached).

For local use without GitHub: `claude --plugin-dir /path/to/code-pet` and run
`/code-pet:pet`.

## How state detection works

Claude Code appends every message of every local conversation to a JSONL
transcript under `~/.claude/projects/`. Code Pet tails those files:

| Last transcript event | Idle time | State |
| --- | --- | --- |
| assistant text reply | > 5s | **waiting** — Claude asked/answered, your turn |
| assistant `tool_use`, no result | > 20s | **waiting** — likely a permission prompt |
| your message / tool result | < 3 min | **working** — Claude is thinking |
| anything | > 60 min | session considered over |

XP: +2 per message you send, +3 per Claude reply, +1 per tool result.
All game state persists in Electron's `userData` dir (`code-pet.json`).

## Notes

- macOS-first (menu-bar 🐾, Spaces support). It should largely work on
  Windows/Linux but is untested there.
- The pet only reads transcripts; it never writes to `~/.claude`.
