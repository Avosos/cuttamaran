const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),

  // Window sizing
  enterEditor: () => ipcRenderer.invoke("window:enterEditor"),
  enterLauncher: () => ipcRenderer.invoke("window:enterLauncher"),

  // File dialogs
  openFileDialog: (options) => ipcRenderer.invoke("dialog:openFile", options),
  saveFileDialog: (options) => ipcRenderer.invoke("dialog:saveFile", options),
  openFolderDialog: (options) => ipcRenderer.invoke("dialog:openFolder", options),

  // Listen for window state changes
  onMaximizedChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on("window:maximized", handler);
    return () => ipcRenderer.removeListener("window:maximized", handler);
  },

  // ─── Export pipeline ─────────────────────────────────
  exportStart: (opts) => ipcRenderer.invoke("export:start", opts),
  exportPushFrame: (pngBuffer) => ipcRenderer.invoke("export:push-frame", pngBuffer),
  exportFinish: () => ipcRenderer.invoke("export:finish"),
  exportCancel: () => ipcRenderer.invoke("export:cancel"),

  onExportProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("export:progress", handler);
    return () => ipcRenderer.removeListener("export:progress", handler);
  },
  onExportDone: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("export:done", handler);
    return () => ipcRenderer.removeListener("export:done", handler);
  },
  onExportError: (callback) => {
    const handler = (_event, msg) => callback(msg);
    ipcRenderer.on("export:error", handler);
    return () => ipcRenderer.removeListener("export:error", handler);
  },

  // Platform info
  platform: process.platform,
});
