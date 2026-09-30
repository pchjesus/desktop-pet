const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('startAPI', {
  start: (characterId) => ipcRenderer.send('start:launch-pet', characterId),
  openManual: () => ipcRenderer.send('start:open-manual')
});
