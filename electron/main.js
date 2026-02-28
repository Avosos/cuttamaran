const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const url = require("url");

// Handle creating/removing shortcuts on Windows when installing/uninstalling
try {
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
} catch (_) {
  // electron-squirrel-startup not available (dev mode), ignore
}

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

let mainWindow = null;

// Determine icon path based on platform
function getIconPath() {
  if (process.platform === "win32") {
    return path.join(__dirname, "../public/icon.ico");
  }
  return path.join(__dirname, "../public/icon.png");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 640,
    minHeight: 440,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#06060a",
    show: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    icon: getIconPath(),
  });

  // Graceful show after ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    // In development, load from Next.js dev server
    const devUrl = process.env.ELECTRON_DEV_URL || "http://localhost:3000";
    mainWindow.loadURL(devUrl);
  } else {
    // In production, load the exported static files
    const indexPath = path.join(__dirname, "../out/index.html");
    mainWindow.loadFile(indexPath);
  }

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
    if (linkUrl.startsWith("http")) {
      shell.openExternal(linkUrl);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── IPC Handlers ─────────────────────────────────────────
ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle("window:close", () => {
  mainWindow?.close();
});

ipcMain.handle("window:enterEditor", () => {
  if (!mainWindow) return;
  mainWindow.setMinimumSize(1024, 680);
  const { width: screenW, height: screenH } = require("electron").screen.getPrimaryDisplay().workAreaSize;
  const newW = Math.min(1440, screenW);
  const newH = Math.min(900, screenH);
  mainWindow.setSize(newW, newH, true);
  mainWindow.center();
});

ipcMain.handle("window:enterLauncher", () => {
  if (!mainWindow) return;
  mainWindow.setMinimumSize(640, 440);
  mainWindow.setSize(900, 600, true);
  mainWindow.center();
});

ipcMain.handle("window:isMaximized", () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle("dialog:openFile", async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Media Files",
        extensions: [
          "mp4", "webm", "mov", "avi", "mkv",
          "mp3", "wav", "ogg", "aac", "flac",
          "png", "jpg", "jpeg", "gif", "webp", "svg",
        ],
      },
      { name: "Video", extensions: ["mp4", "webm", "mov", "avi", "mkv"] },
      { name: "Audio", extensions: ["mp3", "wav", "ogg", "aac", "flac"] },
      { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] },
      { name: "All Files", extensions: ["*"] },
    ],
    ...options,
  });
  return result;
});

ipcMain.handle("dialog:saveFile", async (_event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: "MP4 Video", extensions: ["mp4"] },
      { name: "WebM Video", extensions: ["webm"] },
      { name: "All Files", extensions: ["*"] },
    ],
    ...options,
  });
  return result;
});

ipcMain.handle("dialog:openFolder", async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    ...options,
  });
  return result;
});

// Forward maximize/unmaximize events to the renderer
function setupWindowEvents() {
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:maximized", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:maximized", false);
  });
}

// ─── App lifecycle ────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  setupWindowEvents();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      setupWindowEvents();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Suppress Electron security warning in dev
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
