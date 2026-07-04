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
  subPath: string;
  customName?: string;
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
  | { type: 'recentlyPlayed' }
  | { type: 'category'; categoryId: string }
  | { type: 'collection'; collectionId: string }
  | { type: 'subdirectory'; categoryId: string; subPath: string }
  | { type: 'settings' };

export interface ShortcutConfig {
  playPause: string;
  deselect: string;
  delete: string;
  selectAll: string;
  focusSearch: string;
  seekBack: string;
  seekForward: string;
  volumeUp: string;
  volumeDown: string;
  toggleMute: string;
  queueNext: string;
}

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  playPause: 'Space',
  deselect: 'Escape',
  delete: 'Delete',
  selectAll: 'Ctrl+A',
  focusSearch: 'Ctrl+F',
  seekBack: 'ArrowLeft',
  seekForward: 'ArrowRight',
  volumeUp: 'ArrowUp',
  volumeDown: 'ArrowDown',
  toggleMute: 'KeyM',
  queueNext: 'Ctrl+Q',
};

export type SortKey = 'name' | 'size' | 'duration' | 'format';

export const SORT_LABELS: Record<SortKey, string> = {
  name: '名称',
  size: '文件大小',
  duration: '时长',
  format: '格式',
};

export interface AppSettings {
  defaultVolume: number;
  theme: 'dark' | 'light' | 'warm' | 'forest' | 'ocean';
  shortcuts: ShortcutConfig;
  sortKey: SortKey;
  sortAsc: boolean;
}

export interface AppState {
  // Data
  audioFiles: AudioFile[];
  categories: Category[];
  userCollections: UserCollection[];
  collectionFiles: Record<string, string[]>; // collectionId → fileId[]
  selectedFileIds: Set<string>;
  recentlyPlayedIds: string[]; // most recent first, max 20
  playQueue: string[];          // queued file IDs
  loopMode: 'off' | 'one' | 'all';
  playbackRate: number;         // 0.5 ~ 2.0
  sleepTimerEnd: number | null; // Date.now() + ms

  // Player
  player: PlayerState;

  // UI
  searchQuery: string;
  activeView: ActiveView;
  isLoading: boolean;
  error: string | null;
  sortKey: SortKey;
  sortAsc: boolean;

  // Settings
  settings: AppSettings;

  // Actions - folders
  importFolder: (folderPath: string) => Promise<void>;
  loadAndRestoreFolders: () => Promise<void>;

  // Actions - categories
  renameCategory: (categoryId: string, newName: string) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;

  // Actions - favorites
  toggleFavoriteQuick: (fileId: string) => Promise<void>;
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

  // Actions - individual file operations
  renameAudioFile: (fileId: string, newName: string) => void;
  removeFileFromList: (fileId: string) => void;

  // Actions - play queue
  addToPlayQueue: (fileId: string) => void;
  removeFromPlayQueue: (index: number) => void;
  clearPlayQueue: () => void;
  playNextInQueue: () => void;

  // Actions - playback controls
  setLoopMode: (mode: 'off' | 'one' | 'all') => void;
  setPlaybackRate: (rate: number) => void;
  setSleepTimer: (minutes: number | null) => void;

  // Actions - player
  playFile: (file: AudioFile) => void;
  addToRecentlyPlayed: (fileId: string) => void;
  pausePlayback: () => void;
  stopPlayback: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  updatePlayerState: (update: Partial<PlayerState>) => void;

  // Actions - UI
  setSearchQuery: (query: string) => void;
  setActiveView: (view: ActiveView) => void;
  setSort: (key: SortKey, asc: boolean) => void;
}
