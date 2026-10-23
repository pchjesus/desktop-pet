const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  setIgnoreMouse: (ignore) => ipcRenderer.send('pet:set-ignore-mouse', ignore),
  dragStart: (mouseX, mouseY) => ipcRenderer.send('pet:drag-start', { mouseX, mouseY }),
  dragMove: (mouseX, mouseY) => ipcRenderer.send('pet:drag-move', { mouseX, mouseY }),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),
  getWindow: () => ipcRenderer.invoke('pet:get-window'),
  onWindowChanged: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('pet:window-updated', listener);
    return () => ipcRenderer.removeListener('pet:window-updated', listener);
  },
  setPosition: (x, y) => ipcRenderer.send('pet:set-position', { x, y }),
  quit: () => ipcRenderer.invoke('pet:quit'),
  openFanProject: () => ipcRenderer.send('pet:open-fan-project'),
  showRoyceMessage: () => ipcRenderer.invoke('pet:show-royce-message')
});
