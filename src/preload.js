const { contextBridge, ipcRenderer } = require('electron');

const SEND_CHANNELS = new Set([
  'open-panel', 'hatch-egg', 'set-active-pet', 'quit',
  'drag-start', 'drag-end', 'resize-start', 'resize-end',
]);
const ON_CHANNELS = new Set(['state', 'celebrate', 'attention']);

contextBridge.exposeInMainWorld('pet', {
  send(channel, payload) {
    if (SEND_CHANNELS.has(channel)) ipcRenderer.send(channel, payload);
  },
  on(channel, cb) {
    if (ON_CHANNELS.has(channel)) ipcRenderer.on(channel, (_e, data) => cb(data));
  },
});
