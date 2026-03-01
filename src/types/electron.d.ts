// Type declarations for the Electron preload API
export interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  forceClose: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  enterEditor: () => Promise<void>;
  enterLauncher: () => Promise<void>;
  openFileDialog: (options?: Record<string, unknown>) => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;
  saveFileDialog: (options?: Record<string, unknown>) => Promise<{
    canceled: boolean;
    filePath: string;
  }>;
  openFolderDialog: (options?: Record<string, unknown>) => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  onConfirmClose: (callback: () => void) => () => void;

  // Export pipeline
  exportStart: (opts: {
    outputPath: string;
    fps: number;
    width: number;
    height: number;
    format: string;
    quality: string;
    totalFrames: number;
    audioClips: {
      src: string;
      startTime: number;
      duration: number;
      trimStart: number;
      volume: number;
    }[];
  }) => Promise<{ ok: boolean; error?: string }>;
  exportPushFrame: (pngBuffer: ArrayBuffer) => Promise<{ ok: boolean }>;
  exportFinish: () => Promise<{ ok: boolean }>;
  exportCancel: () => Promise<{ ok: boolean }>;
  onExportProgress: (callback: (data: { percent: number; framesWritten: number; totalFrames: number }) => void) => () => void;
  onExportDone: (callback: (data: { outputPath: string }) => void) => () => void;
  onExportError: (callback: (message: string) => void) => () => void;

  // Project save / load
  saveProject: (opts: {
    filePath?: string;
    data: Record<string, unknown>;
  }) => Promise<{ ok: boolean; canceled?: boolean; filePath?: string; error?: string }>;
  loadProject: (opts?: {
    filePath?: string;
  }) => Promise<{ ok: boolean; canceled?: boolean; filePath?: string; data?: Record<string, unknown>; error?: string }>;
  listProjects: (opts?: {
    folderPath?: string;
  }) => Promise<{ ok: boolean; projects: Array<{
    filePath: string;
    projectName: string;
    resolution: string;
    trackCount: number;
    clipCount: number;
    savedAt: string;
    updatedAt: number;
  }>; error?: string }>;

  // Media file management
  importMediaFile: (opts: {
    sourcePath: string;
    projectFilePath: string | null;
  }) => Promise<{ ok: boolean; destPath?: string; fileName?: string; fileSize?: number; error?: string }>;
  writeMediaFile: (opts: {
    buffer: ArrayBuffer;
    fileName: string;
    projectFilePath: string | null;
  }) => Promise<{ ok: boolean; destPath?: string; fileName?: string; fileSize?: number; error?: string }>;
  pathToMediaUrl: (absolutePath: string) => Promise<string>;
  mediaFileExists: (filePath: string) => Promise<boolean>;

  // Library management
  libraryList: (opts: { folderPath: string }) => Promise<{
    ok: boolean;
    items?: import("./editor").LibraryItem[];
    error?: string;
  }>;
  librarySave: (opts: { folderPath: string; item: import("./editor").LibraryItem }) => Promise<{
    ok: boolean;
    error?: string;
  }>;
  libraryDelete: (opts: { folderPath: string; itemId: string }) => Promise<{
    ok: boolean;
    error?: string;
  }>;

  // Accent icon
  setAccentIcon: (pngDataUrl: string) => Promise<void>;

  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
