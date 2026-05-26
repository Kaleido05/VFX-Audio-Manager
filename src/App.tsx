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
      stopPlayback();
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

  // Sync play state — only start playback when the file changes, not on isPlaying toggle.
  // Pause/resume is handled directly by AudioPlayer / AudioCard via audioManager methods.
  useEffect(() => {
    if (player.currentFile && player.isPlaying) {
      audioManager.play(player.currentFile.path);
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
