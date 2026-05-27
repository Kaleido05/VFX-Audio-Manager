import { contextBridge, ipcRenderer } from 'electron';

interface AudioFileInfo {
  name: string;
  path: string;
  size: number;
  format: string;
  duration?: number;
  relativeDir: string;
}

interface ScanResult {
  files: AudioFileInfo[];
  totalFolders: number;
  subdirectories: string[];
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

  // Storage operations
  getFavorites: (): Promise<string[]> =>
    ipcRenderer.invoke('storage:getFavorites'),

  addFavorite: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('storage:addFavorite', filePath),

  removeFavorite: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('storage:removeFavorite', filePath),

  toggleFavorite: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('storage:toggleFavorite', filePath),

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

  // Ignored paths
  getIgnoredPaths: (): Promise<string[]> =>
    ipcRenderer.invoke('storage:getIgnoredPaths'),

  addIgnoredPath: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('storage:addIgnoredPath', filePath),

  // Clear all data
  clearAllData: (): Promise<void> =>
    ipcRenderer.invoke('storage:clearAllData'),

  // Shell / clipboard
  showItemInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('shell:showItemInFolder', filePath),

  copyToClipboard: (text: string): Promise<void> =>
    ipcRenderer.invoke('clipboard:writeText', text),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('shell:openExternal', url),

};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
