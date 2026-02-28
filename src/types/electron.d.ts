// Type declarations for the Electron preload API
export interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
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

  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
