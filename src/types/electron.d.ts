/// <reference types="vite/client" />

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
  getFavorites: () => Promise<string[]>;
  addFavorite: (filePath: string) => Promise<void>;
  removeFavorite: (filePath: string) => Promise<void>;
  toggleFavorite: (filePath: string) => Promise<boolean>;
  getCategories: () => Promise<CategoryInfo[]>;
  saveCategories: (categories: CategoryInfo[]) => Promise<void>;
  getUserCollections: () => Promise<UserCollectionInfo[]>;
  saveUserCollections: (collections: UserCollectionInfo[]) => Promise<void>;
  getCollectionFiles: () => Promise<Record<string, string[]>>;
  saveCollectionFiles: (data: Record<string, string[]>) => Promise<void>;
  getSettings: () => Promise<Record<string, unknown>>;
  updateSettings: (settings: Record<string, unknown>) => Promise<void>;
  clearAllData: () => Promise<void>;
  getIgnoredPaths: () => Promise<string[]>;
  addIgnoredPath: (filePath: string) => Promise<void>;
  showItemInFolder: (filePath: string) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type { AudioFileInfo, ScanResult, CategoryInfo, UserCollectionInfo, ElectronAPI };
