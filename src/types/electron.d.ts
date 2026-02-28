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
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
