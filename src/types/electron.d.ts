/// <reference types="vite/client" />

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

interface UserCollectionInfo {
  id: string;
  name: string;
}

interface StoredAppData {
  favorites: string[];
  importFolders: string[];
  categories: CategoryInfo[];
  userCollections: UserCollectionInfo[];
  collectionFiles: Record<string, string[]>;
  settings: Record<string, unknown>;
}

interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  scanFolder: (folderPath: string) => Promise<ScanResult>;
  getAudioDuration: (filePath: string) => Promise<number>;
  onDropFolder: (callback: (folderPath: string) => void) => () => void;
  getFavorites: () => Promise<string[]>;
  addFavorite: (filePath: string) => Promise<void>;
  removeFavorite: (filePath: string) => Promise<void>;
  toggleFavorite: (filePath: string) => Promise<boolean>;
  getImportFolders: () => Promise<string[]>;
  saveImportFolders: (folders: string[]) => Promise<void>;
  getCategories: () => Promise<CategoryInfo[]>;
  saveCategories: (categories: CategoryInfo[]) => Promise<void>;
  getUserCollections: () => Promise<UserCollectionInfo[]>;
  saveUserCollections: (collections: UserCollectionInfo[]) => Promise<void>;
  getCollectionFiles: () => Promise<Record<string, string[]>>;
  saveCollectionFiles: (data: Record<string, string[]>) => Promise<void>;
  getSettings: () => Promise<Record<string, unknown>>;
  updateSettings: (settings: Record<string, unknown>) => Promise<void>;
  clearAllData: () => Promise<void>;
  getAppVersion: () => Promise<string>;
  getPlatform: () => string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type { AudioFileInfo, ScanResult, CategoryInfo, UserCollectionInfo, ElectronAPI };
