import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('clik8', {
  platform: process.platform,
});
