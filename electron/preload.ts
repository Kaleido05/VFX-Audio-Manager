import { contextBridge, ipcRenderer } from 'electron';

interface AudioFileInfo {
  name: string;
  path: string;
  size: number;
  format: string;
  duration?: number;
}

interface ScanResult {
  files: AudioFileInfo[];
  totalFolders: number;
  errors: string[];
}

interface CategoryInfo {
  id: string;
  name: string;
  folderPath: string;
}

const electronAPI = {
  // File operations
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:selectFolder'),

  scanFolder: (folderPath: string): Promise<ScanResult> =>
    ipcRenderer.invoke('file:scanFolder', folderPath),

  getAudioDuration: (filePath: string): Promise<number> =>
    ipcRenderer.invoke('file:getAudioDuration', filePath),

  // Drag & drop
  onDropFolder: (callback: (folderPath: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, folderPath: string) => {
      callback(folderPath);
    };
    ipcRenderer.on('drop:folder', handler);
    return () => {
      ipcRenderer.removeListener('drop:folder', handler);
    };
  },

  // Storage operations
  getFavorites: (): Promise<string[]> =>
    ipcRenderer.invoke('storage:getFavorites'),

  addFavorite: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('storage:addFavorite', filePath),

  removeFavorite: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('storage:removeFavorite', filePath),

  toggleFavorite: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('storage:toggleFavorite', filePath),

  getImportFolders: (): Promise<string[]> =>
    ipcRenderer.invoke('storage:getImportFolders'),

  saveImportFolders: (folders: string[]): Promise<void> =>
    ipcRenderer.invoke('storage:saveImportFolders', folders),

  // Category persistence
  getCategories: (): Promise<CategoryInfo[]> =>
    ipcRenderer.invoke('storage:getCategories'),

  saveCategories: (categories: CategoryInfo[]): Promise<void> =>
    ipcRenderer.invoke('storage:saveCategories', categories),

  // User collections persistence
  getUserCollections: (): Promise<CategoryInfo[]> =>
    ipcRenderer.invoke('storage:getUserCollections'),

  saveUserCollections: (collections: CategoryInfo[]): Promise<void> =>
    ipcRenderer.invoke('storage:saveUserCollections', collections),

  getCollectionFiles: (): Promise<Record<string, string[]>> =>
    ipcRenderer.invoke('storage:getCollectionFiles'),

  saveCollectionFiles: (data: Record<string, string[]>): Promise<void> =>
    ipcRenderer.invoke('storage:saveCollectionFiles', data),

  // Settings
  getSettings: (): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('storage:getSettings'),

  updateSettings: (settings: Record<string, unknown>): Promise<void> =>
    ipcRenderer.invoke('storage:updateSettings', settings),

  // Clear all data
  clearAllData: (): Promise<void> =>
    ipcRenderer.invoke('storage:clearAllData'),

  // App info
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('app:getVersion'),

  getPlatform: (): string => process.platform,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
