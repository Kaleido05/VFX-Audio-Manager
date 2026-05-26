import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/AudioManager';

function isEditing(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts() {
  const player = useStore((s) => s.player);
  const selectedFileIds = useStore((s) => s.selectedFileIds);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const deselectAllFiles = useStore((s) => s.deselectAllFiles);
  const stopPlayback = useStore((s) => s.stopPlayback);
  const setVolume = useStore((s) => s.setVolume);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const editing = isEditing();

      // Space — Play/Pause (skip when editing text)
      if (e.code === 'Space' && !editing) {
        e.preventDefault();
        if (player.currentFile) {
          if (player.isPlaying) {
            audioManager.pause();
            useStore.setState((s) => ({
              player: { ...s.player, isPlaying: false },
            }));
          } else {
            audioManager.resume();
            useStore.setState((s) => ({
              player: { ...s.player, isPlaying: true },
            }));
          }
        }
        return;
      }

      // Escape — Deselect all / Stop playback
      if (e.code === 'Escape') {
        if (selectedFileIds.size > 0) {
          deselectAllFiles();
        } else if (player.currentFile && player.isPlaying) {
          audioManager.stop();
          stopPlayback();
        }
        return;
      }

      // Skip shortcuts that conflict with text editing
      if (editing) return;

      // Delete — Batch delete (triggers confirmation dialog in BatchToolbar)
      if (e.code === 'Delete' && selectedFileIds.size > 0) {
        e.preventDefault();
        if (window.confirm(
          `确定要删除已选中的 ${selectedFileIds.size} 个文件吗？（不会删除磁盘上的原始文件）`
        )) {
          useStore.setState((s) => ({
            audioFiles: s.audioFiles.filter(
              (f) => !s.selectedFileIds.has(f.id)
            ),
            selectedFileIds: new Set(),
          }));
        }
        return;
      }

      // Ctrl+A — Select all visible (handled by AudioList's own logic, so skip)
      // Ctrl+F — Focus search bar
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="搜索"]'
        );
        searchInput?.focus();
        return;
      }

      // ArrowLeft/Right — Seek ±5s
      if (e.code === 'ArrowLeft' && player.currentFile) {
        e.preventDefault();
        const newTime = Math.max(0, player.currentTime - 5);
        audioManager.seek(newTime);
        useStore.setState((s) => ({
          player: { ...s.player, currentTime: newTime },
        }));
        return;
      }
      if (e.code === 'ArrowRight' && player.currentFile) {
        e.preventDefault();
        const newTime = Math.min(
          player.duration || Infinity,
          player.currentTime + 5
        );
        audioManager.seek(newTime);
        useStore.setState((s) => ({
          player: { ...s.player, currentTime: newTime },
        }));
        return;
      }

      // ArrowUp/Down — Volume ±5%
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        const vol = Math.min(1, player.volume + 0.05);
        audioManager.setVolume(vol);
        setVolume(vol);
        return;
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        const vol = Math.max(0, player.volume - 0.05);
        audioManager.setVolume(vol);
        setVolume(vol);
        return;
      }

      // M — Toggle mute
      if (e.code === 'KeyM') {
        e.preventDefault();
        const vol = player.volume > 0 ? 0 : 0.8;
        audioManager.setVolume(vol);
        setVolume(vol);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    player.currentFile,
    player.isPlaying,
    player.currentTime,
    player.duration,
    player.volume,
    selectedFileIds.size,
    searchQuery,
    setSearchQuery,
    deselectAllFiles,
    stopPlayback,
    setVolume,
  ]);
}
