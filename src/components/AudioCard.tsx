import { memo, useCallback, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/AudioManager';
import { HiPlay, HiPause, HiStar, HiCheck } from 'react-icons/hi2';
import type { AudioFile } from '../types';
import CollectionPicker from './CollectionPicker';

interface AudioCardProps {
  file: AudioFile;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  };
  return colors[format] || 'bg-surface-600 text-surface-400';
}

const AudioCard = memo(function AudioCard({ file }: AudioCardProps) {
  const { player, selectedFileIds, toggleFileSelection, playFile, pausePlayback } = useStore();
  const [showPicker, setShowPicker] = useState(false);

  const isCurrentFile = player.currentFile?.id === file.id;
  const isThisPlaying = isCurrentFile && player.isPlaying;
  const isBatchMode = selectedFileIds.size > 0;
  const isSelected = selectedFileIds.has(file.id);

  const handleClick = useCallback(() => {
    if (isBatchMode) {
      toggleFileSelection(file.id);
    } else if (isThisPlaying) {
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
  }, [isBatchMode, isThisPlaying, isCurrentFile, toggleFileSelection, file.id, pausePlayback, playFile, file]);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowPicker(true);
    },
    []
  );

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFileSelection(file.id);
    },
    [toggleFileSelection, file.id]
  );

  const displayName = useMemo(
    () => file.name.replace(/\.[^.]+$/, ''),
    [file.name]
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
        <p
          className="truncate text-[13px] font-medium text-primary"
          title={displayName}
        >
          {displayName}
        </p>
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
          {file.duration > 0 && (
            <span className="text-[11px] text-surface-500">
              {formatDuration(file.duration)}
            </span>
          )}
        </div>
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
