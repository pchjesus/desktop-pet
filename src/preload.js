const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  setIgnoreMouse: (ignore) => ipcRenderer.send('pet:set-ignore-mouse', ignore),
  dragStart: (mouseX, mouseY) => ipcRenderer.send('pet:drag-start', { mouseX, mouseY }),
  dragMove: (mouseX, mouseY) => ipcRenderer.send('pet:drag-move', { mouseX, mouseY }),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),
  getWindow: () => ipcRenderer.invoke('pet:get-window'),
  setPosition: (x, y) => ipcRenderer.send('pet:set-position', { x, y }),
  quit: () => ipcRenderer.invoke('pet:quit')
});
