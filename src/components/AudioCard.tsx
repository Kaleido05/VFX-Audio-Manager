import { memo, useCallback, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/AudioManager';
import { HiPlay, HiPause, HiStar, HiCheck, HiFolderOpen, HiClipboard, HiPencil, HiTrash, HiXMark, HiQueueList } from 'react-icons/hi2';
import type { AudioFile } from '../types';
import CollectionPicker from './CollectionPicker';

interface AudioCardProps {
  file: AudioFile;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '时长：--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `时长：${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

function getFormatColor(format: string): string {
  const colors: Record<string, string> = {
    mp3: 'bg-blue-500/20 text-blue-400',
    wav: 'bg-emerald-500/20 text-emerald-400',
    flac: 'bg-purple-500/20 text-purple-400',
    ogg: 'bg-amber-500/20 text-amber-400',
    m4a: 'bg-rose-500/20 text-rose-400',
    aac: 'bg-cyan-500/20 text-cyan-400',
    wma: 'bg-orange-500/20 text-orange-400',
    aiff: 'bg-teal-500/20 text-teal-400',
    aif: 'bg-teal-500/20 text-teal-400',
    opus: 'bg-pink-500/20 text-pink-400',
    webm: 'bg-indigo-500/20 text-indigo-400',
    mka: 'bg-lime-500/20 text-lime-400',
  };
  return colors[format] || 'bg-surface-600 text-surface-400';
}

const AudioCard = memo(function AudioCard({ file }: AudioCardProps) {
  const { player, selectedFileIds, toggleFileSelection, playFile, pausePlayback, renameAudioFile, removeFileFromList, toggleFavoriteQuick, addToPlayQueue } = useStore();
  const [showPicker, setShowPicker] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const isCurrentFile = player.currentFile?.id === file.id;
  const isThisPlaying = isCurrentFile && player.isPlaying;
  const isBatchMode = selectedFileIds.size > 0;
  const isSelected = selectedFileIds.has(file.id);

  const handlePlay = useCallback(() => {
    if (isThisPlaying) {
      audioManager.pause();
      pausePlayback();
    } else if (isCurrentFile) {
      audioManager.resume();
      useStore.setState((state) => ({
        player: { ...state.player, isPlaying: true },
      }));
    } else {
      playFile(file);
    }
  }, [isThisPlaying, isCurrentFile, pausePlayback, playFile, file]);

  const handleClick = useCallback(() => {
    if (isBatchMode) {
      toggleFileSelection(file.id);
    } else {
      handlePlay();
    }
  }, [isBatchMode, toggleFileSelection, file.id, handlePlay]);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavoriteQuick(file.id);
    },
    [file.id, toggleFavoriteQuick]
  );

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFileSelection(file.id);
    },
    [toggleFileSelection, file.id]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 176);
    const y = Math.min(e.clientY, window.innerHeight - 240);
    setContextMenuPos({ x, y });
    setContextMenuVisible(true);
  }, []);

  const startRename = useCallback(() => {
    setContextMenuVisible(false);
    setRenameValue(file.customName || file.name.replace(/\.[^.]+$/, ''));
    setIsRenaming(true);
  }, [file]);

  const confirmRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      renameAudioFile(file.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, file.id, renameAudioFile]);

  const cancelRename = useCallback(() => {
    setIsRenaming(false);
  }, []);

  const displayName = useMemo(
    () => file.customName || file.name.replace(/\.[^.]+$/, ''),
    [file.name, file.customName]
  );

  return (
    <div
      className={`group relative flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
        isSelected
          ? 'border-accent-500 bg-accent-600/10'
          : isCurrentFile
            ? 'border-accent-600/50 bg-accent-600/10'
            : 'border-transparent bg-surface-800/50 hover:bg-surface-800 hover:border-surface-600'
      }`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Batch selection checkbox */}
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
          isSelected
            ? 'border-accent-600 bg-accent-600 text-white'
            : isBatchMode
              ? 'border-surface-500 opacity-100'
              : 'border-surface-600 opacity-0 group-hover:opacity-100'
        }`}
        onClick={handleCheckboxClick}
      >
        {isSelected && <HiCheck className="h-3 w-3" />}
      </div>

      {/* Play/pause button */}
      <button
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
          isCurrentFile
            ? 'bg-accent-600 text-white'
            : 'bg-surface-700 text-surface-400 group-hover:bg-accent-600 group-hover:text-white'
        }`}
        aria-label={isThisPlaying ? '暂停' : '播放'}
        onClick={(e) => {
          e.stopPropagation();
          handlePlay();
        }}
      >
        {isThisPlaying ? (
          <HiPause className="h-4 w-4" />
        ) : (
          <HiPlay className="h-4 w-4" />
        )}
      </button>

      {/* File info */}
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <div className="flex items-center gap-1">
            <input
              className="min-w-0 flex-1 rounded border border-accent-600 bg-surface-800 px-1.5 py-0.5 text-[13px] text-primary outline-none"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') cancelRename();
              }}
              autoFocus
              onBlur={confirmRename}
            />
            <button
              onClick={confirmRename}
              className="shrink-0 rounded p-0.5 text-surface-400 hover:text-primary"
            >
              <HiCheck className="h-3 w-3" />
            </button>
            <button
              onClick={cancelRename}
              className="shrink-0 rounded p-0.5 text-surface-400 hover:text-primary"
            >
              <HiXMark className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <p
            className="truncate text-[13px] font-medium text-primary"
            title={displayName}
          >
            {displayName}
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${getFormatColor(
              file.format
            )}`}
          >
            {file.format}
          </span>
          <span className="text-[11px] text-surface-500">
            {formatFileSize(file.size)}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-surface-500">
          {formatDuration(file.duration)}
        </p>
      </div>

      {/* Favorite button */}
      <button
        onClick={handleToggleFavorite}
        className={`shrink-0 rounded p-1 transition-all hover:bg-surface-700 ${
          file.isFavorite || file.collectionIds.length > 0
            ? 'text-amber-400'
            : 'text-surface-600 opacity-0 group-hover:opacity-100'
        }`}
        aria-label={file.isFavorite ? '管理收藏' : '收藏'}
      >
        <HiStar
          className={`h-4 w-4 ${file.isFavorite || file.collectionIds.length > 0 ? 'fill-current' : ''}`}
        />
      </button>

      {/* Collection picker */}
      {showPicker && (
        <CollectionPicker
          fileId={file.id}
          fileName={displayName}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Context menu */}
      {contextMenuVisible && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={(e) => { e.stopPropagation(); setContextMenuVisible(false); }}
          />
          <div
            className="fixed z-50 w-40 rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setContextMenuVisible(false); handlePlay(); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
            >
              <HiPlay className="h-3 w-3" /> 播放
            </button>
            <button
              onClick={() => { setContextMenuVisible(false); addToPlayQueue(file.id); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
            >
              <HiQueueList className="h-3 w-3" /> 添加到播放队列
            </button>
            <button
              onClick={() => { setContextMenuVisible(false); setShowPicker(true); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
            >
              <HiStar className="h-3 w-3" /> 添加到收藏夹
            </button>
            <button
              onClick={() => { setContextMenuVisible(false); window.electronAPI.showItemInFolder(file.path); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
            >
              <HiFolderOpen className="h-3 w-3" /> 在资源管理器打开
            </button>
            <button
              onClick={() => { setContextMenuVisible(false); window.electronAPI.copyToClipboard(file.path); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
            >
              <HiClipboard className="h-3 w-3" /> 复制路径
            </button>
            <button
              onClick={startRename}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
            >
              <HiPencil className="h-3 w-3" /> 重命名
            </button>
            <button
              onClick={() => { setContextMenuVisible(false); removeFileFromList(file.id); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-surface-700 hover:text-red-300"
            >
              <HiTrash className="h-3 w-3" /> 从列表移除
            </button>
          </div>
        </>
      )}

      {/* Playing indicator */}
      {isThisPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-lg">
          <div
            className="h-full bg-accent-500 transition-all duration-300"
            style={{
              width: `${
                player.duration > 0
                  ? (player.currentTime / player.duration) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      )}
    </div>
  );
});

export default AudioCard;
