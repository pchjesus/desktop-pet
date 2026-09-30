const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('startAPI', {
  start: () => ipcRenderer.send('start:launch-pet'),
  openManual: () => ipcRenderer.send('start:open-manual')
});
