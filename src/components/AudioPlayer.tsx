import { useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/AudioManager';
import {
  HiPlay,
  HiPause,
  HiStop,
  HiSpeakerWave,
  HiSpeakerXMark,
} from 'react-icons/hi2';

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AudioPlayer() {
  const { player, pausePlayback, stopPlayback, seekTo, setVolume } =
    useStore();

  const { currentFile, isPlaying, currentTime, duration, volume } = player;

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioManager.pause();
      pausePlayback();
    } else {
      audioManager.resume();
      useStore.setState((state) => ({
        player: { ...state.player, isPlaying: true },
      }));
    }
  }, [isPlaying, pausePlayback]);

  const handleStop = useCallback(() => {
    audioManager.stop();
    stopPlayback();
  }, [stopPlayback]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      audioManager.seek(time);
      seekTo(time);
    },
    [seekTo]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = parseFloat(e.target.value);
      setVolume(vol);
    },
    [setVolume]
  );

  const handleToggleMute = useCallback(() => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(0.8);
    }
  }, [volume, setVolume]);

  const displayName = useMemo(
    () =>
      currentFile ? currentFile.name.replace(/\.[^.]+$/, '') : '未选择音频',
    [currentFile]
  );

  return (
    <div className="flex w-64 shrink-0 flex-col border-l border-surface-700 bg-surface-900">
      {/* Progress bar */}
      <div className="px-3 pt-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full"
        />
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-1 px-3 pt-3">
        <button
          onClick={handlePlayPause}
          disabled={!currentFile}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-600 text-white transition-all hover:bg-accent-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <HiPause className="h-5 w-5" />
          ) : (
            <HiPlay className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={handleStop}
          disabled={!currentFile}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-surface-400 transition-all hover:bg-surface-800 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="停止"
        >
          <HiStop className="h-5 w-5" />
        </button>
      </div>

      {/* Track info */}
      <div className="min-w-0 px-3 pt-3">
        <p
          className="truncate text-center text-[13px] font-medium text-primary"
          title={displayName}
        >
          {displayName}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] text-surface-500">
          <span className="inline-block min-w-[2.5em] text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span>/</span>
          <span className="inline-block min-w-[2.5em] text-left tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
        {currentFile && (
          <div className="mt-1.5 flex justify-center">
            <span className="rounded bg-surface-700 px-2 py-0.5 text-[10px] font-semibold uppercase text-surface-400">
              {currentFile.format}
            </span>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Volume control */}
      <div className="border-t border-surface-700 px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="rounded p-1 text-surface-400 transition-colors hover:text-primary"
            aria-label={volume === 0 ? '取消静音' : '静音'}
          >
            {volume === 0 ? (
              <HiSpeakerXMark className="h-4 w-4" />
            ) : (
              <HiSpeakerWave className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="min-w-0 flex-1"
            aria-label="音量"
          />
          <span className="w-9 text-right text-[11px] tabular-nums text-surface-500">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
