import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs';

interface Category {
  id: string;
  name: string;
  folderPath: string;
}

interface UserCollection {
  id: string;
  name: string;
}

interface AppData {
  favorites: string[];
  importFolders: string[];
  categories: Category[];
  userCollections: UserCollection[];
  collectionFiles: Record<string, string[]>;
  settings: Record<string, unknown>;
}

function getDataFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'vfx-data.json');
}

function readData(): AppData {
  const filePath = getDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      let categories: Category[] = [];
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        categories = data.categories;
      } else if (Array.isArray(data.importFolders) && data.importFolders.length > 0) {
        // Migrate legacy data: create categories from importFolders
        categories = data.importFolders.map((folderPath: string) => {
          const name = folderPath.split(/[\\/]/).filter(Boolean).pop() || folderPath;
          return {
            id: `migrated-${folderPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name,
            folderPath,
          };
        });
        // Persist the migration immediately
        const migrated = {
          favorites: Array.isArray(data.favorites) ? data.favorites : [],
          importFolders: Array.isArray(data.importFolders) ? data.importFolders : [],
          categories,
          userCollections: Array.isArray(data.userCollections) ? data.userCollections : [],
          collectionFiles: data.collectionFiles && typeof data.collectionFiles === 'object' ? data.collectionFiles : {},
          settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
        };
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2), 'utf-8');
      }

      return {
        favorites: Array.isArray(data.favorites) ? data.favorites : [],
        importFolders: Array.isArray(data.importFolders) ? data.importFolders : [],
        categories,
        userCollections: Array.isArray(data.userCollections) ? data.userCollections : [],
        collectionFiles: data.collectionFiles && typeof data.collectionFiles === 'object' ? data.collectionFiles : {},
        settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
      };
    }
  } catch {
    // File not found or corrupted — start fresh
  }
  return { favorites: [], importFolders: [], categories: [], userCollections: [], collectionFiles: {}, settings: {} };
}

function writeData(data: AppData): void {
  const filePath = getDataFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function registerStorageHandlers(): void {
  // Favorites
  ipcMain.handle('storage:getFavorites', () => {
    const data = readData();
    return data.favorites;
  });

  ipcMain.handle('storage:addFavorite', (_event, filePath: string) => {
    const data = readData();
    if (!data.favorites.includes(filePath)) {
      data.favorites.push(filePath);
      writeData(data);
    }
  });

  ipcMain.handle('storage:removeFavorite', (_event, filePath: string) => {
    const data = readData();
    data.favorites = data.favorites.filter((f) => f !== filePath);
    writeData(data);
  });

  ipcMain.handle('storage:toggleFavorite', (_event, filePath: string) => {
    const data = readData();
    const index = data.favorites.indexOf(filePath);
    if (index === -1) {
      data.favorites.push(filePath);
      writeData(data);
      return true;
    } else {
      data.favorites.splice(index, 1);
      writeData(data);
      return false;
    }
  });

  // Settings
  ipcMain.handle('storage:getSettings', () => {
    const data = readData();
    return data.settings;
  });

  ipcMain.handle('storage:updateSettings', (_event, newSettings: Record<string, unknown>) => {
    const data = readData();
    data.settings = { ...data.settings, ...newSettings };
    writeData(data);
  });

  // Import folders persistence (legacy, kept for backward compat)
  ipcMain.handle('storage:getImportFolders', () => {
    const data = readData();
    return data.importFolders;
  });

  ipcMain.handle('storage:saveImportFolders', (_event, folders: string[]) => {
    const data = readData();
    data.importFolders = folders;
    writeData(data);
  });

  // Categories persistence
  ipcMain.handle('storage:getCategories', () => {
    const data = readData();
    return data.categories;
  });

  ipcMain.handle('storage:saveCategories', (_event, categories: Category[]) => {
    const data = readData();
    data.categories = categories;
    // Keep importFolders in sync for backward compat
    data.importFolders = categories.map((c) => c.folderPath);
    writeData(data);
  });

  // User collections persistence
  ipcMain.handle('storage:getUserCollections', () => {
    const data = readData();
    return data.userCollections;
  });

  ipcMain.handle('storage:saveUserCollections', (_event, collections: UserCollection[]) => {
    const data = readData();
    data.userCollections = collections;
    // Clean up collectionFiles for removed collections
    const validIds = new Set(collections.map((c) => c.id));
    for (const key of Object.keys(data.collectionFiles)) {
      if (!validIds.has(key)) {
        delete data.collectionFiles[key];
      }
    }
    writeData(data);
  });

  ipcMain.handle('storage:getCollectionFiles', () => {
    const data = readData();
    return data.collectionFiles;
  });

  ipcMain.handle('storage:saveCollectionFiles', (_event, collectionFiles: Record<string, string[]>) => {
    const data = readData();
    data.collectionFiles = collectionFiles;
    writeData(data);
  });

  // Clear all data
  ipcMain.handle('storage:clearAllData', () => {
    writeData({ favorites: [], importFolders: [], categories: [], userCollections: [], collectionFiles: {}, settings: {} });
  });

  // App info
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });
}
