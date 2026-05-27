import { useEffect, useCallback } from 'react';
import { useStore } from './store/useStore';
import { audioManager } from './services/AudioManager';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import AudioList from './components/AudioList';
import AudioPlayer from './components/AudioPlayer';
import BatchToolbar from './components/BatchToolbar';
import SettingsPage from './components/SettingsPage';

export default function App() {
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
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'link';
      }
      document.body.classList.add('drag-over');
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target === document.documentElement || e.target === document.body) {
        document.body.classList.remove('drag-over');
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.remove('drag-over');

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const droppedPath = (files[0] as { path?: string }).path;
      if (!droppedPath) return;

      await importFolder(droppedPath);
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [importFolder]);

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
        }));
      } else {
        const queue = state.playQueue;
        if (queue.length > 0) {
          const [nextId, ...rest] = queue;
          const nextFile = state.audioFiles.find((f) => f.id === nextId);
          useStore.setState({ playQueue: rest });
          if (nextFile) {
            useStore.setState((s) => ({
              player: {
                ...s.player,
                currentFile: nextFile,
                isPlaying: true,
                currentTime: 0,
                duration: 0,
              },
            }));
          } else {
            state.playNextInQueue();
          }
        } else if (state.loopMode === 'all' && state.player.currentFile) {
          audioManager.play(state.player.currentFile.path);
          audioManager.setVolume(state.player.volume);
          useStore.setState((s) => ({
            player: { ...s.player, isPlaying: true, currentTime: 0, duration: 0 },
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
      <Sidebar />
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
      <AudioPlayer />
    </div>
  );
}
