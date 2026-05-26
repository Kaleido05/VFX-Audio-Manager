export interface Category {
  id: string;
  name: string;
  folderPath: string;
}

export interface UserCollection {
  id: string;
  name: string;
}

export interface AudioFile {
  id: string;
  name: string;
  path: string;
  size: number;
  format: string;
  duration: number;
  isFavorite: boolean;
  categoryId: string;
  collectionIds: string[];
}

export interface PlayerState {
  currentFile: AudioFile | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export type ActiveView =
  | { type: 'all' }
  | { type: 'favorites' }
  | { type: 'category'; categoryId: string }
  | { type: 'collection'; collectionId: string }
  | { type: 'settings' };

export interface AppSettings {
  defaultVolume: number;
  theme: 'dark' | 'light';
}

export interface AppState {
  // Data
  audioFiles: AudioFile[];
  categories: Category[];
  userCollections: UserCollection[];
  collectionFiles: Record<string, string[]>; // collectionId → fileId[]
  importFolders: string[];
  selectedFileIds: Set<string>;

  // Player
  player: PlayerState;

  // UI
  searchQuery: string;
  activeView: ActiveView;
  isLoading: boolean;
  error: string | null;

  // Settings
  settings: AppSettings;

  // Actions - folders
  importFolder: (folderPath: string) => Promise<void>;
  loadAndRestoreFolders: () => Promise<void>;

  // Actions - categories
  renameCategory: (categoryId: string, newName: string) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;

  // Actions - favorites
  toggleFavorite: (fileId: string) => Promise<void>;
  loadFavorites: () => Promise<void>;

  // Actions - user collections
  createUserCollection: (name: string) => Promise<void>;
  deleteUserCollection: (id: string) => Promise<void>;
  renameUserCollection: (id: string, name: string) => Promise<void>;
  addToCollection: (fileId: string, collectionId: string) => Promise<void>;
  removeFromCollection: (fileId: string, collectionId: string) => Promise<void>;
  loadUserCollections: () => Promise<void>;

  // Actions - settings
  loadSettings: () => Promise<void>;
  updateSettings: (update: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;

  // Actions - batch
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: (fileIds: string[]) => void;
  deselectAllFiles: () => void;
  batchToggleFavorite: (makeFavorite: boolean) => Promise<void>;
  batchDeleteFiles: () => void;

  // Actions - player
  playFile: (file: AudioFile) => void;
  pausePlayback: () => void;
  stopPlayback: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  updatePlayerState: (update: Partial<PlayerState>) => void;

  // Actions - UI
  setSearchQuery: (query: string) => void;
  setActiveView: (view: ActiveView) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
