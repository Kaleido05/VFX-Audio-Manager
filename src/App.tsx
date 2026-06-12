import { useEffect, useCallback, useState, useRef } from 'react';
import { useStore } from './store/useStore';
import { audioManager } from './services/AudioManager';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import AudioList from './components/AudioList';
import AudioPlayer from './components/AudioPlayer';
import BatchToolbar from './components/BatchToolbar';
import SettingsPage from './components/SettingsPage';

const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 480;
const MIN_PLAYER_WIDTH = 200;
const MAX_PLAYER_WIDTH = 500;

export default function App() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('vfx-sidebar-width');
    return saved ? Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, Number(saved))) : 240;
  });
  const [playerWidth, setPlayerWidth] = useState(() => {
    const saved = localStorage.getItem('vfx-player-width');
    return saved ? Math.max(MIN_PLAYER_WIDTH, Math.min(MAX_PLAYER_WIDTH, Number(saved))) : 256;
  });

  const sidebarResizing = useRef(false);
  const playerResizing = useRef(false);
  const {
    player,
    activeView,
    selectedFileIds,
    playbackRate,
    sleepTimerEnd,
    importFolder,
    loadFavorites,
    loadAndRestoreFolders,
    loadSettings,
    loadUserCollections,
    updatePlayerState,
    stopPlayback,
  } = useStore();

  const isBatchMode = selectedFileIds.size > 0;

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Startup: load settings, restore folders, sync favorites, load user collections
  useEffect(() => {
    loadSettings()
      .then(() => loadAndRestoreFolders())
      .then(() => loadFavorites())
      .then(() => loadUserCollections());
  }, [loadSettings, loadAndRestoreFolders, loadFavorites, loadUserCollections]);

  // Drag and drop folder import
  useEffect(() => {
    // Counter to track drag enter/leave nesting level across all child elements
    let dragEnterCount = 0;

    const handleDragEnter = (e: DragEvent) => {
      // Prevent when no files are being dragged (e.g. text selection drag)
      if (e.dataTransfer && !Array.from(e.dataTransfer.types).includes('Files')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      dragEnterCount++;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'link';
      }
      document.body.classList.add('drag-over');
    };

    const handleDragOver = (e: DragEvent) => {
      // Prevent default to allow drop
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'link';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.dataTransfer && !Array.from(e.dataTransfer.types).includes('Files')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      dragEnterCount--;
      if (dragEnterCount <= 0) {
        dragEnterCount = 0;
        document.body.classList.remove('drag-over');
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragEnterCount = 0;
      document.body.classList.remove('drag-over');

      const dtFiles = e.dataTransfer?.files;
      if (!dtFiles || dtFiles.length === 0) return;

      // Collect all file paths from the drop
      const paths: string[] = [];
      for (let i = 0; i < dtFiles.length; i++) {
        const p = (dtFiles[i] as { path?: string }).path;
        if (p) paths.push(p);
      }
      if (paths.length === 0) return;

      // Find common parent directory of all dropped paths
      let commonRoot = paths[0].replace(/\\/g, '/');
      for (let i = 1; i < paths.length; i++) {
        const p = paths[i].replace(/\\/g, '/');
        while (commonRoot && !p.startsWith(commonRoot + '/')) {
          const idx = commonRoot.lastIndexOf('/');
          if (idx <= 0) {
            commonRoot = '';
            break;
          }
          commonRoot = commonRoot.substring(0, idx);
        }
        if (!commonRoot) break;
      }
      // Convert back to OS path separators
      const droppedPath = commonRoot.replace(/\//g, '\\');
      if (droppedPath) {
        await importFolder(droppedPath);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [importFolder]);

  // Panel resize: global mousemove/mouseup handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sidebarResizing.current) {
        const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, e.clientX));
        setSidebarWidth(newWidth);
        localStorage.setItem('vfx-sidebar-width', String(newWidth));
      }
      if (playerResizing.current) {
        const newWidth = Math.max(MIN_PLAYER_WIDTH, Math.min(MAX_PLAYER_WIDTH, window.innerWidth - e.clientX));
        setPlayerWidth(newWidth);
        localStorage.setItem('vfx-player-width', String(newWidth));
      }
    };

    const handleMouseUp = () => {
      sidebarResizing.current = false;
      playerResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    sidebarResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handlePlayerResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    playerResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // Sync AudioManager events with store
  useEffect(() => {
    audioManager.on('timeupdate', (currentTime: number) => {
      updatePlayerState({ currentTime });
    });

    audioManager.on('durationchange', (duration: number) => {
      updatePlayerState({ duration });
    });

    audioManager.on('ended', () => {
      const state = useStore.getState();
      if (state.loopMode === 'one' && state.player.currentFile) {
        audioManager.play(state.player.currentFile.path);
        audioManager.setVolume(state.player.volume);
        useStore.setState((s) => ({
          player: { ...s.player, isPlaying: true, currentTime: 0, duration: 0 },
          recentlyPlayedIds: [state.player.currentFile!.id, ...s.recentlyPlayedIds.filter((id) => id !== state.player.currentFile!.id)].slice(0, 20),
        }));
      } else {
        const queue = state.playQueue;
        if (queue.length > 0) {
          const [nextId, ...rest] = queue;
          const nextFile = state.audioFiles.find((f) => f.id === nextId);
          if (nextFile) {
            const currentRecentlyPlayed = useStore.getState().recentlyPlayedIds;
            const filtered = currentRecentlyPlayed.filter((id) => id !== nextFile.id);
            useStore.setState({
              playQueue: rest,
              recentlyPlayedIds: [nextFile.id, ...filtered].slice(0, 20),
              player: {
                ...state.player,
                currentFile: nextFile,
                isPlaying: true,
                currentTime: 0,
                duration: 0,
              },
            });
          } else {
            state.playNextInQueue();
          }
        } else if (state.loopMode === 'all' && state.player.currentFile) {
          audioManager.play(state.player.currentFile.path);
          audioManager.setVolume(state.player.volume);
          useStore.setState((s) => ({
            player: { ...s.player, isPlaying: true, currentTime: 0, duration: 0 },
            recentlyPlayedIds: [state.player.currentFile!.id, ...s.recentlyPlayedIds.filter((id) => id !== state.player.currentFile!.id)].slice(0, 20),
          }));
        } else {
          stopPlayback();
        }
      }
    });

    audioManager.on('error', (message: string) => {
      console.error('Audio error:', message);
      stopPlayback();
    });
  }, [updatePlayerState, stopPlayback]);

  // Sync volume
  useEffect(() => {
    audioManager.setVolume(player.volume);
  }, [player.volume]);

  // Sync playback rate
  useEffect(() => {
    audioManager.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  // Sleep timer
  useEffect(() => {
    if (sleepTimerEnd === null) return;
    const remaining = Math.max(0, sleepTimerEnd - Date.now());
    if (remaining <= 0) {
      audioManager.pause();
      useStore.setState((s) => ({
        player: { ...s.player, isPlaying: false },
        sleepTimerEnd: null,
      }));
      return;
    }
    const timer = setTimeout(() => {
      audioManager.pause();
      useStore.setState((s) => ({
        player: { ...s.player, isPlaying: false },
        sleepTimerEnd: null,
      }));
    }, remaining);
    return () => clearTimeout(timer);
  }, [sleepTimerEnd]);

  // Sync play state — only start playback when the file changes, not on isPlaying toggle.
  // Pause/resume is handled directly by AudioPlayer / AudioCard via audioManager methods.
  useEffect(() => {
    if (player.currentFile && player.isPlaying) {
      audioManager.play(player.currentFile.path);
      audioManager.setVolume(player.volume);
    }
  }, [player.currentFile?.id]);

  return (
    <div className="flex h-full bg-surface-950">
      <Sidebar width={sidebarWidth} />
      {/* Sidebar resize handle */}
      <div
        className="w-1 shrink-0 cursor-col-resize bg-surface-700 transition-colors hover:bg-accent-500 active:bg-accent-500"
        onMouseDown={handleSidebarResizeStart}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {activeView.type === 'settings' ? (
          <SettingsPage />
        ) : (
          <>
            {!isBatchMode && <SearchBar />}
            {isBatchMode && <BatchToolbar />}
            <AudioList />
          </>
        )}
      </main>
      {/* Player resize handle */}
      <div
        className="w-1 shrink-0 cursor-col-resize bg-surface-700 transition-colors hover:bg-accent-500 active:bg-accent-500"
        onMouseDown={handlePlayerResizeStart}
      />
      <AudioPlayer width={playerWidth} />
    </div>
  );
}
