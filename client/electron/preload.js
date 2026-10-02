const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add narrowly scoped, safe IPC methods here if needed in the future
});
