import { useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/AudioManager';
import type { ShortcutConfig } from '../types';

function isEditing(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function parseShortcut(shortcut: string): { ctrl: boolean; shift: boolean; alt: boolean; code: string } | null {
  const parts = shortcut.split('+');
  const modifiers: string[] = [];
  let key = '';
  for (const part of parts) {
    const upper = part.trim().toUpperCase();
    if (upper === 'CTRL' || upper === 'CMD') modifiers.push('ctrl');
    else if (upper === 'SHIFT') modifiers.push('shift');
    else if (upper === 'ALT') modifiers.push('alt');
    else key = part.trim();
  }
  if (!key) return null;
  // Convert common key names to code format
  let code = key;
  if (key.length === 1 && /[A-Za-z]/.test(key)) {
    code = 'Key' + key.toUpperCase();
  } else if (key === 'Space') code = 'Space';
  else if (key === 'Escape') code = 'Escape';
  else if (key === 'Delete') code = 'Delete';
  // ArrowLeft, ArrowRight, etc. stay as-is
  return {
    ctrl: modifiers.includes('ctrl'),
    shift: modifiers.includes('shift'),
    alt: modifiers.includes('alt'),
    code,
  };
}

function matchesShortcut(e: KeyboardEvent, parsed: ReturnType<typeof parseShortcut>): boolean {
  if (!parsed) return false;
  const ctrlOrMeta = e.ctrlKey || e.metaKey;
  return (
    e.code === parsed.code &&
    ctrlOrMeta === parsed.ctrl &&
    e.shiftKey === parsed.shift &&
    e.altKey === parsed.alt
  );
}

export function useKeyboardShortcuts() {
  const player = useStore((s) => s.player);
  const selectedFileIds = useStore((s) => s.selectedFileIds);
  const shortcuts = useStore((s) => s.settings.shortcuts);
  const deselectAllFiles = useStore((s) => s.deselectAllFiles);
  const stopPlayback = useStore((s) => s.stopPlayback);
  const setVolume = useStore((s) => s.setVolume);
  const addToPlayQueue = useStore((s) => s.addToPlayQueue);

  useEffect(() => {
    const sc = shortcuts;

    const handleKeyDown = (e: KeyboardEvent) => {
      const editing = isEditing();

      // Helper to check if event matches a shortcut
      const matches = (key: keyof ShortcutConfig) => matchesShortcut(e, parseShortcut(sc[key]));

      // Play/Pause — skip when editing text
      if (matches('playPause') && !editing) {
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
      if (matches('deselect') && !editing) {
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

      // Delete — Batch delete
      if (matches('delete') && selectedFileIds.size > 0) {
        e.preventDefault();
        if (window.confirm(
          `确定要删除已选中的 ${selectedFileIds.size} 个文件吗？（不会删除磁盘上的原始文件）`
        )) {
          const state = useStore.getState();
          const removedPaths = state.audioFiles
            .filter((f) => state.selectedFileIds.has(f.id))
            .map((f) => f.path);
          useStore.setState({
            audioFiles: state.audioFiles.filter(
              (f) => !state.selectedFileIds.has(f.id)
            ),
            selectedFileIds: new Set(),
          });
          for (const p of removedPaths) {
            window.electronAPI.addIgnoredPath(p).catch((err) => {
              console.error('Add ignored path failed:', err);
            });
          }
        }
        return;
      }

      // Select all
      if (matches('selectAll')) {
        e.preventDefault();
        const { audioFiles, searchQuery, activeView } = useStore.getState();
        let visible = audioFiles;
        if (activeView.type === 'favorites') {
          visible = visible.filter((f) => f.isFavorite);
        } else if (activeView.type === 'category') {
          visible = visible.filter((f) => f.categoryId === activeView.categoryId);
        } else if (activeView.type === 'collection') {
          visible = visible.filter((f) => f.collectionIds.includes(activeView.collectionId));
        } else if (activeView.type === 'subdirectory') {
          visible = visible.filter((f) => f.categoryId === activeView.categoryId && f.subPath === activeView.subPath);
        } else if (activeView.type === 'recentlyPlayed') {
          const idSet = new Set(useStore.getState().recentlyPlayedIds);
          visible = visible.filter((f) => idSet.has(f.id));
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          visible = visible.filter(
            (f) => f.name.toLowerCase().includes(q) || f.format.toLowerCase().includes(q)
          );
        }
        useStore.setState({ selectedFileIds: new Set(visible.map((f) => f.id)) });
        return;
      }

      // Focus search
      if (matches('focusSearch')) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="搜索"]'
        );
        searchInput?.focus();
        return;
      }

      // Seek backward
      if (matches('seekBack') && player.currentFile) {
        e.preventDefault();
        const newTime = Math.max(0, player.currentTime - 5);
        audioManager.seek(newTime);
        useStore.setState((s) => ({
          player: { ...s.player, currentTime: newTime },
        }));
        return;
      }

      // Seek forward
      if (matches('seekForward') && player.currentFile) {
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

      // Volume up
      if (matches('volumeUp')) {
        e.preventDefault();
        const vol = Math.min(1, player.volume + 0.05);
        audioManager.setVolume(vol);
        setVolume(vol);
        return;
      }

      // Volume down
      if (matches('volumeDown')) {
        e.preventDefault();
        const vol = Math.max(0, player.volume - 0.05);
        audioManager.setVolume(vol);
        setVolume(vol);
        return;
      }

      // Toggle mute
      if (matches('toggleMute')) {
        e.preventDefault();
        const vol = player.volume > 0 ? 0 : 0.8;
        audioManager.setVolume(vol);
        setVolume(vol);
        return;
      }

      // Queue next (add first selected file to play queue)
      if (matches('queueNext')) {
        e.preventDefault();
        const fileId = [...selectedFileIds][0];
        if (fileId) {
          addToPlayQueue(fileId);
          useStore.setState({ selectedFileIds: new Set() });
        }
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
    shortcuts,
    deselectAllFiles,
    stopPlayback,
    setVolume,
    addToPlayQueue,
  ]);
}

export function shortcutEventToString(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');

  let key = e.code;
  if (key.startsWith('Key')) key = key.slice(3);
  else if (key.startsWith('Digit')) key = key.slice(5);
  else if (key === 'Space') key = 'Space';
  else if (key === 'Escape') key = 'Escape';
  else if (key === 'Delete') key = 'Delete';
  else if (key === 'ArrowLeft') key = 'ArrowLeft';
  else if (key === 'ArrowRight') key = 'ArrowRight';
  else if (key === 'ArrowUp') key = 'ArrowUp';
  else if (key === 'ArrowDown') key = 'ArrowDown';

  parts.push(key);
  return parts.join('+');
}
