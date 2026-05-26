import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, AudioFile, PlayerState, Category, UserCollection, ActiveView } from '../types';

const initialPlayerState: PlayerState = {
  currentFile: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
};

function getFolderName(folderPath: string): string {
  return folderPath.split(/[\\/]/).filter(Boolean).pop() || folderPath;
}

export const useStore = create<AppState>((set, get) => ({
  // Data
  audioFiles: [],
  categories: [],
  userCollections: [],
  collectionFiles: {},
  importFolders: [],
  selectedFileIds: new Set<string>(),

  // Player
  player: { ...initialPlayerState },

  // UI
  searchQuery: '',
  activeView: { type: 'all' } as ActiveView,
  isLoading: false,
  error: null,

  // Settings
  settings: {
    defaultVolume: 0.8,
    theme: 'dark' as const,
  },

  // ---- Folder import ----
  importFolder: async (folderPath: string) => {
    const { categories } = get();

    if (categories.some((c) => c.folderPath === folderPath)) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await window.electronAPI.scanFolder(folderPath);

      if (result.errors.length > 0) {
        console.warn('Scan warnings:', result.errors);
      }

      const favorites = await window.electronAPI.getFavorites();

      const category: Category = {
        id: uuidv4(),
        name: getFolderName(folderPath),
        folderPath,
      };

      const audioFiles: AudioFile[] = result.files.map((file) => ({
        id: uuidv4(),
        name: file.name,
        path: file.path,
        size: file.size,
        format: file.format,
        duration: file.duration || 0,
        isFavorite: favorites.includes(file.path),
        categoryId: category.id,
        collectionIds: [],
      }));

      const newCategories = [...get().categories, category];

      set((state) => ({
        audioFiles: [...state.audioFiles, ...audioFiles],
        categories: newCategories,
        importFolders: [...state.importFolders, folderPath],
        isLoading: false,
      }));

      window.electronAPI.saveCategories(newCategories).catch((err) => {
        console.error('Save categories failed:', err);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '导入失败';
      set({ error: message, isLoading: false });
    }
  },

  // ---- Restore session on startup ----
  loadAndRestoreFolders: async () => {
    try {
      const savedCategories = await window.electronAPI.getCategories();
      if (savedCategories.length === 0) return;

      const existing = get().categories;
      const favorites = await window.electronAPI.getFavorites();

      for (const cat of savedCategories) {
        if (existing.some((c) => c.id === cat.id)) continue;

        const result = await window.electronAPI.scanFolder(cat.folderPath);

        const audioFiles: AudioFile[] = result.files.map((file) => ({
          id: uuidv4(),
          name: file.name,
          path: file.path,
          size: file.size,
          format: file.format,
          duration: file.duration || 0,
          isFavorite: favorites.includes(file.path),
          categoryId: cat.id,
          collectionIds: [],
        }));

        set((state) => ({
          audioFiles: [...state.audioFiles, ...audioFiles],
          categories: [...state.categories, cat],
          importFolders: [...state.importFolders, cat.folderPath],
        }));
      }
    } catch (err) {
      console.error('Restore import folders failed:', err);
    }
  },

  // ---- Categories ----
  renameCategory: async (categoryId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId ? { ...c, name: trimmed } : c
      ),
    }));

    await window.electronAPI.saveCategories(get().categories);
  },

  removeCategory: async (categoryId: string) => {
    const { player, audioFiles } = get();

    // Stop playback if playing file belongs to this category
    const categoryFile = audioFiles.find(
      (f) => f.categoryId === categoryId && f.id === player.currentFile?.id
    );
    if (categoryFile) {
      set({
        player: { ...initialPlayerState, volume: player.volume },
      });
    }

    // Remove files and category, clear batch selections for removed files
    const removedIds = new Set(
      audioFiles.filter((f) => f.categoryId === categoryId).map((f) => f.id)
    );
    set((state) => ({
      audioFiles: state.audioFiles.filter((f) => f.categoryId !== categoryId),
      categories: state.categories.filter((c) => c.id !== categoryId),
      importFolders: state.importFolders.filter(
        (f) => !state.categories.some((c) => c.id === categoryId && c.folderPath === f)
      ),
      selectedFileIds: new Set(
        [...state.selectedFileIds].filter((id) => !removedIds.has(id))
      ),
    }));

    await window.electronAPI.saveCategories(get().categories);
  },

  // ---- Favorites ----
  toggleFavorite: async (fileId: string) => {
    const { audioFiles } = get();
    const file = audioFiles.find((f) => f.id === fileId);
    if (!file) return;

    try {
      const isFav = await window.electronAPI.toggleFavorite(file.path);
      set((state) => ({
        audioFiles: state.audioFiles.map((f) =>
          f.id === fileId ? { ...f, isFavorite: isFav } : f
        ),
      }));
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  },

  loadFavorites: async () => {
    try {
      const favorites = await window.electronAPI.getFavorites();
      set((state) => ({
        audioFiles: state.audioFiles.map((f) => ({
          ...f,
          isFavorite: favorites.includes(f.path),
        })),
      }));
    } catch (err) {
      console.error('Load favorites failed:', err);
    }
  },

  // ---- User collections ----
  loadUserCollections: async () => {
    try {
      const [collections, collectionFiles] = await Promise.all([
        window.electronAPI.getUserCollections(),
        window.electronAPI.getCollectionFiles(),
      ]);
      const typedCollections: UserCollection[] = collections.map(
        (c: { id: string; name: string }) => ({
          id: c.id,
          name: c.name,
        })
      );
      set({ userCollections: typedCollections, collectionFiles });
    } catch (err) {
      console.error('Load user collections failed:', err);
    }
  },

  createUserCollection: async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newCollection: UserCollection = {
      id: uuidv4(),
      name: trimmed,
    };

    set((state) => ({
      userCollections: [...state.userCollections, newCollection],
      collectionFiles: { ...state.collectionFiles, [newCollection.id]: [] },
    }));

    try {
      await window.electronAPI.saveUserCollections(get().userCollections);
      await window.electronAPI.saveCollectionFiles(get().collectionFiles);
    } catch (err) {
      console.error('Save user collection failed:', err);
    }
  },

  deleteUserCollection: async (id: string) => {
    set((state) => {
      const { [id]: _, ...rest } = state.collectionFiles;
      return {
        userCollections: state.userCollections.filter((c) => c.id !== id),
        collectionFiles: rest,
      };
    });

    try {
      await window.electronAPI.saveUserCollections(get().userCollections);
      await window.electronAPI.saveCollectionFiles(get().collectionFiles);
    } catch (err) {
      console.error('Delete user collection failed:', err);
    }
  },

  renameUserCollection: async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    set((state) => ({
      userCollections: state.userCollections.map((c) =>
        c.id === id ? { ...c, name: trimmed } : c
      ),
    }));

    try {
      await window.electronAPI.saveUserCollections(get().userCollections);
    } catch (err) {
      console.error('Rename user collection failed:', err);
    }
  },

  addToCollection: async (fileId: string, collectionId: string) => {
    set((state) => {
      const currentIds = state.collectionFiles[collectionId] || [];
      if (currentIds.includes(fileId)) return state;
      return {
        collectionFiles: {
          ...state.collectionFiles,
          [collectionId]: [...currentIds, fileId],
        },
        audioFiles: state.audioFiles.map((f) =>
          f.id === fileId
            ? {
                ...f,
                isFavorite: true,
                collectionIds: [...f.collectionIds, collectionId],
              }
            : f
        ),
      };
    });

    try {
      await window.electronAPI.saveCollectionFiles(get().collectionFiles);
      const file = get().audioFiles.find((f) => f.id === fileId);
      if (file) {
        await window.electronAPI.addFavorite(file.path);
      }
    } catch (err) {
      console.error('Add to collection failed:', err);
    }
  },

  removeFromCollection: async (fileId: string, collectionId: string) => {
    set((state) => {
      const currentIds = state.collectionFiles[collectionId] || [];
      const newFile = state.audioFiles.find((f) => f.id === fileId);
      const stillInCollections =
        newFile?.collectionIds.filter((id) => id !== collectionId).length || 0;
      return {
        collectionFiles: {
          ...state.collectionFiles,
          [collectionId]: currentIds.filter((id) => id !== fileId),
        },
        audioFiles: state.audioFiles.map((f) =>
          f.id === fileId
            ? {
                ...f,
                isFavorite: stillInCollections > 0,
                collectionIds: f.collectionIds.filter((id) => id !== collectionId),
              }
            : f
        ),
      };
    });

    try {
      await window.electronAPI.saveCollectionFiles(get().collectionFiles);
      const file = get().audioFiles.find((f) => f.id === fileId);
      if (file && !file.isFavorite) {
        await window.electronAPI.removeFavorite(file.path);
      }
    } catch (err) {
      console.error('Remove from collection failed:', err);
    }
  },

  // ---- Settings ----
  loadSettings: async () => {
    try {
      const raw = await window.electronAPI.getSettings();
      const defaultVolume =
        typeof raw.defaultVolume === 'number'
          ? Math.max(0, Math.min(1, raw.defaultVolume))
          : 0.8;
      const theme = (raw.theme === 'dark' || raw.theme === 'light') ? raw.theme : 'dark';
      document.documentElement.classList.toggle('light', theme === 'light');
      set({
        settings: { defaultVolume, theme },
        player: { ...get().player, volume: defaultVolume },
      });
    } catch (err) {
      console.error('Load settings failed:', err);
    }
  },

  updateSettings: async (update) => {
    set((state) => {
      const next = { ...state.settings, ...update };
      if (update.theme) {
        document.documentElement.classList.toggle('light', update.theme === 'light');
      }
      return {
        settings: next,
        player: update.defaultVolume !== undefined
          ? { ...state.player, volume: update.defaultVolume }
          : state.player,
      };
    });
    await window.electronAPI.updateSettings(
      get().settings as unknown as Record<string, unknown>
    );
  },

  resetAllData: async () => {
    document.documentElement.classList.remove('light');
    set({
      audioFiles: [],
      categories: [],
      userCollections: [],
      collectionFiles: {},
      importFolders: [],
      selectedFileIds: new Set(),
      settings: { defaultVolume: 0.8, theme: 'dark' },
      player: { ...initialPlayerState, volume: 0.8 },
      activeView: { type: 'all' },
      searchQuery: '',
      error: null,
    });
    await window.electronAPI.clearAllData();
  },

  // ---- Batch operations ----
  toggleFileSelection: (fileId: string) => {
    set((state) => {
      const next = new Set(state.selectedFileIds);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return { selectedFileIds: next };
    });
  },

  selectAllFiles: (fileIds: string[]) => {
    set({ selectedFileIds: new Set(fileIds) });
  },

  deselectAllFiles: () => {
    set({ selectedFileIds: new Set() });
  },

  batchToggleFavorite: async (makeFavorite: boolean) => {
    const { selectedFileIds, audioFiles } = get();
    const selectedFiles = audioFiles.filter((f) => selectedFileIds.has(f.id));

    for (const file of selectedFiles) {
      try {
        if (makeFavorite) {
          await window.electronAPI.addFavorite(file.path);
        } else {
          await window.electronAPI.removeFavorite(file.path);
        }
      } catch (err) {
        console.error('Batch favorite toggle failed for:', file.path, err);
      }
    }

    set((state) => ({
      audioFiles: state.audioFiles.map((f) =>
        selectedFileIds.has(f.id) ? { ...f, isFavorite: makeFavorite } : f
      ),
    }));
  },

  batchDeleteFiles: () => {
    set((state) => ({
      audioFiles: state.audioFiles.filter(
        (f) => !state.selectedFileIds.has(f.id)
      ),
      selectedFileIds: new Set(),
    }));
  },

  // ---- Player ----
  playFile: (file: AudioFile) => {
    set({
      player: {
        currentFile: file,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        volume: get().player.volume,
      },
    });
  },

  pausePlayback: () => {
    set((state) => ({
      player: { ...state.player, isPlaying: false },
    }));
  },

  stopPlayback: () => {
    set({
      player: { ...initialPlayerState, volume: get().player.volume },
    });
  },

  seekTo: (time: number) => {
    set((state) => ({
      player: { ...state.player, currentTime: time },
    }));
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set((state) => ({
      player: { ...state.player, volume: clamped },
    }));
  },

  updatePlayerState: (update: Partial<PlayerState>) => {
    set((state) => ({
      player: { ...state.player, ...update },
    }));
  },

  // ---- UI ----
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setActiveView: (view: ActiveView) => {
    set({ activeView: view, selectedFileIds: new Set() });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
