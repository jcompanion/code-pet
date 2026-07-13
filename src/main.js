const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const { Store } = require('./store');
const { SessionMonitor } = require('./sessions');
const { Game } = require('./game');

const DEFAULT_SIZE = { width: 170, height: 190 };
const MIN_SIZE = { width: 90, height: 100 };

let store, monitor, game, tray;
let panelWin = null;
const petWins = new Map(); // display.id -> BrowserWindow
let dragTimer = null;

if (!app.requestSingleInstanceLock()) app.quit();

function petBounds(display) {
  const saved = ((store.data.windows || {})[display.id]) || {};
  const wa = display.workArea;
  const width = saved.width || DEFAULT_SIZE.width;
  const height = saved.height || DEFAULT_SIZE.height;
  let x = saved.x !== undefined ? saved.x : wa.x + wa.width - width - 24;
  let y = saved.y !== undefined ? saved.y : wa.y + wa.height - height - 24;
  // Keep on-screen if resolution changed since last run.
  x = Math.min(Math.max(x, wa.x - width + 40), wa.x + wa.width - 40);
  y = Math.min(Math.max(y, wa.y), wa.y + wa.height - 40);
  return { x, y, width, height };
}

function createPetWindow(display) {
  if (petWins.has(display.id)) return;
  const win = new BrowserWindow(Object.assign({}, petBounds(display), {
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    minWidth: MIN_SIZE.width,
    minHeight: MIN_SIZE.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  }));
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'renderer', 'pet.html'));
  win.webContents.on('did-finish-load', () => sendState(win));

  const remember = () => {
    const [x, y] = win.getPosition();
    const [width, height] = win.getSize();
    store.data.windows = store.data.windows || {};
    store.data.windows[display.id] = { x, y, width, height };
    store.save();
  };
  win.on('moved', remember);
  win.on('resized', remember);
  win.on('closed', () => petWins.delete(display.id));
  petWins.set(display.id, win);
}

function createAllPetWindows() {
  for (const d of screen.getAllDisplays()) createPetWindow(d);
}

function createPanel() {
  panelWin = new BrowserWindow({
    width: 460,
    height: 640,
    minWidth: 380,
    minHeight: 420,
    show: false,
    title: 'Code Pet',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1a14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  panelWin.loadFile(path.join(__dirname, 'renderer', 'panel.html'));
  panelWin.webContents.on('did-finish-load', () => sendState(panelWin));
  panelWin.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      panelWin.hide();
    }
  });
}

function togglePanel() {
  if (!panelWin || panelWin.isDestroyed()) createPanel();
  if (panelWin.isVisible()) panelWin.hide();
  else {
    panelWin.show();
    panelWin.focus();
  }
}

function fullState() {
  return {
    sessions: monitor.snapshot || [],
    game: game.snapshot(),
  };
}

function sendState(win) {
  if (win && !win.isDestroyed()) win.webContents.send('state', fullState());
}

let broadcastTimer = null;
function broadcast() {
  clearTimeout(broadcastTimer);
  broadcastTimer = setTimeout(() => {
    const state = fullState();
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send('state', state);
    }
  }, 150);
}

function sendToPets(channel, payload) {
  for (const win of petWins.values()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle('🐾');
  tray.setToolTip('Code Pet');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Dashboard', click: togglePanel },
    {
      label: 'Reset pet positions',
      click: () => {
        store.data.windows = {};
        store.save();
        for (const win of petWins.values()) win.destroy();
        petWins.clear();
        createAllPetWindows();
      },
    },
    { type: 'separator' },
    { label: 'Quit Code Pet', click: () => { app.isQuitting = true; app.quit(); } },
  ]));
}

app.whenReady().then(() => {
  if (app.dock) app.dock.hide();

  store = new Store(path.join(app.getPath('userData'), 'code-pet.json'));
  game = new Game(store);
  monitor = new SessionMonitor();

  monitor.on('activity', (a) => game.onActivity(a));
  monitor.on('update', (snap) => {
    game.onSessions(snap);
    broadcast();
  });
  monitor.on('attention', (s) => {
    sendToPets('attention', {
      text: s.toolStall ? `${s.project} may need an approval!` : `${s.project} is waiting on you!`,
      project: s.project,
    });
  });
  game.on('change', broadcast);
  game.on('celebrate', (c) => sendToPets('celebrate', c));

  createAllPetWindows();
  createPanel();
  createTray();
  monitor.start();

  screen.on('display-added', (_e, d) => createPetWindow(d));
  screen.on('display-removed', (_e, d) => {
    const win = petWins.get(d.id);
    if (win) win.destroy();
    petWins.delete(d.id);
  });

  setInterval(broadcast, 5000); // keep "idle for Xm" labels fresh
});

// --- IPC -------------------------------------------------------------------

ipcMain.on('open-panel', togglePanel);
ipcMain.on('hatch-egg', (_e, eggId) => {
  const state = game.snapshot();
  const egg = eggId
    ? state.eggs.find((x) => x.id === eggId)
    : state.eggs.find((x) => x.ready);
  if (egg) game.hatch(egg.id);
});
ipcMain.on('set-active-pet', (_e, petId) => game.setActive(petId));
ipcMain.on('quit', () => { app.isQuitting = true; app.quit(); });

// Manual window dragging: the renderer reports grab offset, we follow the cursor.
ipcMain.on('drag-start', (e, { offX, offY }) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  clearInterval(dragTimer);
  dragTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return clearInterval(dragTimer);
    const cur = screen.getCursorScreenPoint();
    win.setPosition(Math.round(cur.x - offX), Math.round(cur.y - offY));
  }, 16);
});
ipcMain.on('drag-end', (e) => {
  clearInterval(dragTimer);
  dragTimer = null;
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) win.emit('moved');
});

// Corner-grip resizing, same pattern as dragging.
let resizeTimer = null;
ipcMain.on('resize-start', (e, { x, y }) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  const start = win.getBounds();
  clearInterval(resizeTimer);
  resizeTimer = setInterval(() => {
    if (win.isDestroyed()) return clearInterval(resizeTimer);
    const cur = screen.getCursorScreenPoint();
    win.setBounds({
      x: start.x,
      y: start.y,
      width: Math.max(MIN_SIZE.width, Math.round(start.width + cur.x - x)),
      height: Math.max(MIN_SIZE.height, Math.round(start.height + cur.y - y)),
    });
  }, 16);
});
ipcMain.on('resize-end', (e) => {
  clearInterval(resizeTimer);
  resizeTimer = null;
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) win.emit('resized');
});

app.on('window-all-closed', () => {
  // Tray app: stay alive even with no windows.
});
app.on('before-quit', () => {
  app.isQuitting = true;
  if (monitor) monitor.stop();
  if (store) store.flush();
});
