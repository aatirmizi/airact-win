const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('clik8', {
  platform: process.platform,
  openProjector: () => ipcRenderer.invoke('open-projector'),
  quit: () => ipcRenderer.invoke('quit-app'),
});
