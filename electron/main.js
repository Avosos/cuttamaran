const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net, nativeImage } = require("electron");
const path = require("path");
const url = require("url");
const { spawn } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");

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

// ─── Custom protocol for serving local media files ─────────
// Register the scheme as privileged before app is ready so
// <video>/<audio>/<img> elements can stream from local paths.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

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

// Accent-coloured window icon
ipcMain.handle("app:set-accent-icon", (_event, pngDataUrl) => {
  if (!mainWindow || !pngDataUrl) return;
  try {
    const img = nativeImage.createFromDataURL(pngDataUrl);
    mainWindow.setIcon(img);
  } catch (e) {
    console.error("Failed to set accent icon:", e);
  }
});

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

// ─── Project Save / Load ──────────────────────────────────
ipcMain.handle("project:save", async (_event, { filePath, data }) => {
  try {
    // If no filePath provided, show Save-As dialog
    let targetPath = filePath;
    if (!targetPath) {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Save Project",
        defaultPath: `${data.projectName || "Untitled"}.cutta`,
        filters: [
          { name: "Cuttamaran Project", extensions: ["cutta"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      if (result.canceled || !result.filePath) {
        return { ok: false, canceled: true };
      }
      targetPath = result.filePath;
    }
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf-8");
    return { ok: true, filePath: targetPath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("project:load", async (_event, { filePath }) => {
  try {
    let targetPath = filePath;
    if (!targetPath) {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: "Open Project",
        properties: ["openFile"],
        filters: [
          { name: "Cuttamaran Project", extensions: ["cutta"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      if (result.canceled || !result.filePaths[0]) {
        return { ok: false, canceled: true };
      }
      targetPath = result.filePaths[0];
    }
    const raw = fs.readFileSync(targetPath, "utf-8");
    const data = JSON.parse(raw);
    return { ok: true, filePath: targetPath, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ─── Media file management ────────────────────────────────

/**
 * Resolve the "media" directory for the current project.
 * If projectDir is given (directory containing the .cutta file), puts media/ next to it.
 * Otherwise falls back to a shared location in appData.
 */
function resolveMediaDir(projectDir) {
  if (projectDir) {
    return path.join(projectDir, "media");
  }
  return path.join(app.getPath("userData"), "media");
}

/**
 * Copy (or move) source file into the project's media/ folder.
 * Returns { ok, destPath, fileName }.
 *
 * @param {string} sourcePath  – absolute source path
 * @param {string|null} projectFilePath – path to .cutta file (may be null for unsaved projects)
 */
ipcMain.handle("media:import-file", async (_event, { sourcePath, projectFilePath }) => {
  try {
    const projectDir = projectFilePath ? path.dirname(projectFilePath) : null;
    const mediaDir = resolveMediaDir(projectDir);
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    // Unique filename: <8-char-hash>_<originalName> to avoid collisions
    const originalName = path.basename(sourcePath);
    const hash = crypto.randomBytes(4).toString("hex");
    const destName = `${hash}_${originalName}`;
    const destPath = path.join(mediaDir, destName);

    // Copy (don't move — user might want the original)
    fs.copyFileSync(sourcePath, destPath);
    const stats = fs.statSync(destPath);

    return {
      ok: true,
      destPath,
      fileName: originalName,
      fileSize: stats.size,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

/**
 * Write raw file bytes (from a drag-dropped File in the renderer)
 * into the project's media/ folder.
 * Expects { buffer: ArrayBuffer, fileName: string, projectFilePath: string|null }
 */
ipcMain.handle("media:write-file", async (_event, { buffer, fileName, projectFilePath }) => {
  try {
    const projectDir = projectFilePath ? path.dirname(projectFilePath) : null;
    const mediaDir = resolveMediaDir(projectDir);
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    const hash = crypto.randomBytes(4).toString("hex");
    const destName = `${hash}_${fileName}`;
    const destPath = path.join(mediaDir, destName);

    fs.writeFileSync(destPath, Buffer.from(buffer));
    const stats = fs.statSync(destPath);

    return {
      ok: true,
      destPath,
      fileName,
      fileSize: stats.size,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

/**
 * Convert an absolute file path to a local-media:// URL the renderer can load.
 */
ipcMain.handle("media:path-to-url", (_event, absolutePath) => {
  const encoded = encodeURIComponent(absolutePath).replace(/%2F/gi, "/").replace(/%5C/gi, "/").replace(/%3A/gi, ":");
  return `local-media://media/${encoded}`;
});

/**
 * Check whether a file path exists on disk.
 */
ipcMain.handle("media:file-exists", (_event, filePath) => {
  return fs.existsSync(filePath);
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

// ─── MIME type lookup ─────────────────────────────────────
const MIME_TYPES = {
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".avi": "video/x-msvideo", ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
  ".aac": "audio/aac", ".flac": "audio/flac",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// ─── App lifecycle ────────────────────────────────────────
app.whenReady().then(() => {
  // Register local-media:// protocol handler.
  // URLs look like: local-media://media/C%3A%5Cusers%5C...%5Cfile.mp4
  // We decode the pathname to get the absolute file path.
  //
  // IMPORTANT: We handle HTTP Range requests manually so that <audio> and
  // <video> elements can seek and stream the full file.  Without this,
  // the browser only gets the initial buffered chunk (~2 s of audio).
  protocol.handle("local-media", (request) => {
    // Strip the scheme + host ("local-media://media/")
    let filePath = decodeURIComponent(
      new URL(request.url).pathname
    );
    // On Windows the pathname starts with / before drive letter, e.g. /C:/foo
    if (process.platform === "win32" && filePath.startsWith("/")) {
      filePath = filePath.slice(1);
    }

    // Make sure the file actually exists
    if (!fs.existsSync(filePath)) {
      return new Response("Not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const totalSize = stat.size;
    const mimeType = getMimeType(filePath);
    const rangeHeader = request.headers.get("Range");

    if (rangeHeader) {
      // Parse "bytes=START-END"
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
        const chunkSize = end - start + 1;

        const stream = fs.createReadStream(filePath, { start, end });
        return new Response(stream, {
          status: 206,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": String(chunkSize),
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Accept-Ranges": "bytes",
          },
        });
      }
    }

    // Full file response
    const stream = fs.createReadStream(filePath);
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(totalSize),
        "Accept-Ranges": "bytes",
      },
    });
  });

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

/**
 * Convert a local-media:// URL back to an absolute file path.
 * e.g. "local-media://media/C:/Users/foo/bar.mp3" → "C:/Users/foo/bar.mp3"
 */
function localMediaUrlToPath(src) {
  if (!src) return null;
  if (!src.startsWith("local-media://")) {
    // Already a plain file path — just normalize separators
    return path.normalize(src);
  }
  try {
    let filePath = decodeURIComponent(new URL(src).pathname);
    // On Windows the pathname starts with / before drive letter
    if (process.platform === "win32" && filePath.startsWith("/")) {
      filePath = filePath.slice(1);
    }
    // Normalize to native separators so FFmpeg is happy on Windows
    return path.normalize(filePath);
  } catch (err) {
    console.error("[export] Failed to parse local-media URL:", src, err);
    return null;
  }
}

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

  // Input 1…N: audio files — resolve local-media:// URLs to real paths
  const resolvedAudioClips = audioClips
    .map((a) => {
      const filePath = localMediaUrlToPath(a.src);
      const exists = filePath ? fs.existsSync(filePath) : false;
      console.log(`[export] Audio clip: src=${a.src}  →  path=${filePath}  exists=${exists}`);
      return { ...a, filePath };
    })
    .filter((a) => a.filePath && fs.existsSync(a.filePath));

  console.log(`[export] ${resolvedAudioClips.length} audio clip(s) resolved for FFmpeg`);

  for (const audio of resolvedAudioClips) {
    args.push("-i", audio.filePath);
  }

  // ── Filter: map audio clips onto the timeline ─────────
  if (resolvedAudioClips.length > 0) {
    const filterParts = [];
    const mixLabels = [];

    resolvedAudioClips.forEach((audio, idx) => {
      const inputIdx = idx + 1; // input 0 is the video pipe
      const label = `a${idx}`;
      const delayMs = Math.round(audio.startTime * 1000);
      const vol = audio.volume ?? 1;
      const trimStart = audio.trimStart ?? 0;
      const trimEnd = trimStart + audio.duration;
      filterParts.push(
        `[${inputIdx}:a]atrim=start=${trimStart}:end=${trimEnd},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${vol}[${label}]`
      );
      mixLabels.push(`[${label}]`);
    });

    // For a single audio clip, skip amix (just pass through).
    // amix with inputs=1 can behave oddly in some FFmpeg builds.
    if (resolvedAudioClips.length === 1) {
      // The single clip's label is already [a0], rename to [aout]
      filterParts[0] = filterParts[0].replace(/\[a0\]$/, "[aout]");
    } else {
      filterParts.push(
        `${mixLabels.join("")}amix=inputs=${resolvedAudioClips.length}:dropout_transition=0:normalize=0[aout]`
      );
    }
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
      if (resolvedAudioClips.length > 0) args.push("-c:a", "aac", "-b:a", "192k");
      break;
    case "webm":
      args.push("-c:v", "libvpx-vp9", "-crf", crf, "-b:v", "0",
                "-pix_fmt", "yuv420p");
      if (resolvedAudioClips.length > 0) args.push("-c:a", "libopus", "-b:a", "128k");
      break;
    case "mov":
      args.push("-c:v", "libx264", "-preset", "medium", "-crf", crf,
                "-pix_fmt", "yuv420p");
      if (resolvedAudioClips.length > 0) args.push("-c:a", "aac", "-b:a", "192k");
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

  // Ensure audio doesn't extend past video (or vice versa)
  if (resolvedAudioClips.length > 0) {
    args.push("-shortest");
  }

  args.push(outputPath);

  console.log("[export] FFmpeg path:", ffmpegPath);
  console.log("[export] FFmpeg args:", args.join(" "));

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
