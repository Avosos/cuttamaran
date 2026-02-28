const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const url = require("url");
const { spawn } = require("child_process");
const fs = require("fs");

// Resolve the bundled ffmpeg binary
let ffmpegPath;
try {
  ffmpegPath = require("ffmpeg-static");
} catch {
  ffmpegPath = "ffmpeg"; // fall back to system PATH
}

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

// ─── Export Pipeline ──────────────────────────────────────

/** Active export state — only one export at a time */
let activeExport = null;

/**
 * Start an FFmpeg export.
 *
 * The renderer will push raw PNG frame buffers one-by-one via `export:push-frame`,
 * then call `export:finish` when all frames have been sent. FFmpeg ingests the
 * frames as an image-pipe and muxes any audio sources on top.
 *
 * @param {object} opts
 * @param {string} opts.outputPath   — final file path
 * @param {number} opts.fps          — target frame-rate
 * @param {number} opts.width        — canvas width
 * @param {number} opts.height       — canvas height
 * @param {string} opts.format       — "mp4" | "webm" | "mov" | "gif"
 * @param {string} opts.quality      — "low" | "medium" | "high"
 * @param {number} opts.totalFrames  — expected frame count (for progress)
 * @param {{src:string, startTime:number, duration:number, trimStart:number, volume:number}[]} opts.audioClips
 */
ipcMain.handle("export:start", async (_event, opts) => {
  if (activeExport) {
    return { ok: false, error: "An export is already in progress." };
  }

  const {
    outputPath,
    fps = 30,
    width = 1920,
    height = 1080,
    format = "mp4",
    quality = "high",
    totalFrames = 1,
    audioClips = [],
  } = opts;

  // ── Build FFmpeg arguments ────────────────────────────
  const args = [];

  // Input 0: raw image pipe (PNG frames from the renderer canvas).
  args.push(
    "-y",                             // overwrite output
    "-f", "image2pipe",
    "-framerate", String(fps),
    "-i", "pipe:0"                    // stdin
  );

  // Input 1…N: audio files
  const validAudioClips = audioClips.filter((a) => a.src && fs.existsSync(a.src));
  for (const audio of validAudioClips) {
    args.push("-i", audio.src);
  }

  // ── Filter: map audio clips onto the timeline ─────────
  if (validAudioClips.length > 0) {
    const filterParts = [];
    const mixLabels = [];

    validAudioClips.forEach((audio, idx) => {
      const inputIdx = idx + 1; // input 0 is the video pipe
      const label = `a${idx}`;
      const delay = Math.round(audio.startTime * 1000);
      const vol = audio.volume ?? 1;
      const trimStart = audio.trimStart ?? 0;
      const trimEnd = trimStart + audio.duration;
      filterParts.push(
        `[${inputIdx}:a]atrim=start=${trimStart}:end=${trimEnd},asetpts=PTS-STARTPTS,adelay=${delay}|${delay},volume=${vol}[${label}]`
      );
      mixLabels.push(`[${label}]`);
    });

    filterParts.push(
      `${mixLabels.join("")}amix=inputs=${validAudioClips.length}:normalize=0[aout]`
    );
    args.push("-filter_complex", filterParts.join(";"));
    args.push("-map", "0:v");
    args.push("-map", "[aout]");
  }

  // ── Codec settings per format / quality ───────────────
  const crf = quality === "high" ? "18" : quality === "medium" ? "23" : "28";

  switch (format) {
    case "mp4":
      args.push("-c:v", "libx264", "-preset", "medium", "-crf", crf,
                "-pix_fmt", "yuv420p", "-movflags", "+faststart");
      if (validAudioClips.length > 0) args.push("-c:a", "aac", "-b:a", "192k");
      break;
    case "webm":
      args.push("-c:v", "libvpx-vp9", "-crf", crf, "-b:v", "0",
                "-pix_fmt", "yuv420p");
      if (validAudioClips.length > 0) args.push("-c:a", "libopus", "-b:a", "128k");
      break;
    case "mov":
      args.push("-c:v", "libx264", "-preset", "medium", "-crf", crf,
                "-pix_fmt", "yuv420p");
      if (validAudioClips.length > 0) args.push("-c:a", "aac", "-b:a", "192k");
      break;
    case "gif":
      // Two-pass palette for high-quality GIF
      args.push(
        "-vf", `fps=${Math.min(fps, 15)},scale=${width}:${height}:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
      );
      break;
    default:
      args.push("-c:v", "libx264", "-preset", "medium", "-crf", crf,
                "-pix_fmt", "yuv420p");
      break;
  }

  args.push(outputPath);

  // ── Spawn FFmpeg ──────────────────────────────────────
  return new Promise((resolve) => {
    let framesWritten = 0;

    const proc = spawn(ffmpegPath, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderrLog = "";
    proc.stderr.on("data", (chunk) => {
      stderrLog += chunk.toString();
    });

    proc.on("error", (err) => {
      mainWindow?.webContents.send("export:error", err.message);
      activeExport = null;
    });

    proc.on("close", (code) => {
      activeExport = null;
      if (code === 0) {
        mainWindow?.webContents.send("export:progress", { percent: 100, framesWritten, totalFrames });
        mainWindow?.webContents.send("export:done", { outputPath });
      } else {
        mainWindow?.webContents.send("export:error",
          `FFmpeg exited with code ${code}.\n${stderrLog.slice(-500)}`);
      }
    });

    activeExport = { proc, totalFrames, framesWritten: 0 };

    resolve({ ok: true });
  });
});

/**
 * Push a single rendered frame (PNG buffer) into FFmpeg's stdin.
 * The renderer calls this once per frame after drawing onto an OffscreenCanvas.
 */
ipcMain.handle("export:push-frame", async (_event, pngArrayBuffer) => {
  if (!activeExport) return { ok: false };
  const buf = Buffer.from(pngArrayBuffer);

  return new Promise((resolve) => {
    activeExport.proc.stdin.write(buf, () => {
      activeExport.framesWritten++;
      const percent = Math.min(
        99,
        Math.round((activeExport.framesWritten / activeExport.totalFrames) * 100)
      );
      mainWindow?.webContents.send("export:progress", {
        percent,
        framesWritten: activeExport.framesWritten,
        totalFrames: activeExport.totalFrames,
      });
      resolve({ ok: true });
    });
  });
});

/**
 * Renderer signals that all frames have been pushed.
 * Closes FFmpeg's stdin so it can finalize the file.
 */
ipcMain.handle("export:finish", async () => {
  if (!activeExport) return { ok: false };
  activeExport.proc.stdin.end();
  return { ok: true };
});

/**
 * Abort a running export.
 */
ipcMain.handle("export:cancel", async () => {
  if (!activeExport) return { ok: false };
  activeExport.proc.kill("SIGTERM");
  activeExport = null;
  return { ok: true };
});

// Suppress Electron security warning in dev
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
