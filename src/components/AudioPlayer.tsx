import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/AudioManager';
import type { AudioFile } from '../types';
import {
  HiPlay,
  HiPause,
  HiStop,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiQueueList,
  HiXMark,
  HiClock,
} from 'react-icons/hi2';

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface AudioPlayerProps {
  width: number;
}

export default function AudioPlayer({ width }: AudioPlayerProps) {
  const {
    player, pausePlayback, stopPlayback, seekTo, setVolume,
    playQueue, removeFromPlayQueue, clearPlayQueue,
    loopMode, setLoopMode,
    playbackRate, setPlaybackRate,
    sleepTimerEnd, setSleepTimer,
  } = useStore();

  const { currentFile, isPlaying, currentTime, duration, volume } = player;

  // Track pre-mute volume to restore on unmute
  const preMuteVolumeRef = useRef(0.8);

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
    setSleepTimer(null);
  }, [stopPlayback, setSleepTimer]);

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
      preMuteVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(preMuteVolumeRef.current);
    }
  }, [volume, setVolume]);

  const displayName = useMemo(
    () =>
      currentFile
        ? (currentFile.customName || currentFile.name.replace(/\.[^.]+$/, ''))
        : '未选择音频',
    [currentFile]
  );

  // Sleep timer countdown display
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (sleepTimerEnd === null) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEnd]);

  const sleepRemaining = useMemo(() => {
    if (sleepTimerEnd === null) return null;
    const remaining = Math.max(0, Math.ceil((sleepTimerEnd - Date.now()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepTimerEnd, tick]);

  const audioFiles = useStore((s) => s.audioFiles);

  const queueFiles = useMemo(
    () =>
      playQueue
        .map((id) => audioFiles.find((f) => f.id === id))
        .filter(Boolean) as AudioFile[],
    [playQueue, audioFiles]
  );

  return (
    <div className="flex shrink-0 flex-col border-l border-surface-700 bg-surface-900" style={{ width }}>
      {/* Progress bar */}
      <div className="px-3 pt-4">
        <input
          type="range"
          min="0"
          max={duration || 1}
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

      {/* Divider */}
      <div className="mx-3 border-t border-surface-700" />

      {/* Loop mode */}
      <div className="px-3 pt-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">循环模式</p>
        <div className="flex rounded-lg bg-surface-800 p-0.5">
          {(['off', 'one', 'all'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setLoopMode(mode)}
              className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-all ${
                loopMode === mode
                  ? 'bg-accent-600 text-white'
                  : 'text-surface-400 hover:text-primary'
              }`}
            >
              {mode === 'off' ? '关闭' : mode === 'one' ? '单曲' : '全部'}
            </button>
          ))}
        </div>
      </div>

      {/* Playback speed */}
      <div className="px-3 pt-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">播放速度</p>
        <div className="flex rounded-lg bg-surface-800 p-0.5">
          {[0.5, 0.75, 1, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`flex-1 rounded-md py-1 text-[10px] font-medium transition-all ${
                playbackRate === rate
                  ? 'bg-accent-600 text-white'
                  : 'text-surface-400 hover:text-primary'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Play queue */}
      <div className="px-3 pt-2">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
            播放队列 ({playQueue.length})
          </p>
          {playQueue.length > 0 && (
            <button
              onClick={clearPlayQueue}
              className="text-[10px] text-surface-500 transition-colors hover:text-red-400"
            >
              清空
            </button>
          )}
        </div>
        {playQueue.length === 0 ? (
          <p className="py-2 text-center text-[10px] text-surface-600">
            右键音效卡片添加到队列
          </p>
        ) : (
          <div className="max-h-[140px] space-y-0.5 overflow-y-auto">
            {queueFiles.map((qf, idx) => (
              <div
                key={`${qf.id}-${idx}`}
                className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] transition-all hover:bg-surface-800"
              >
                <span className="w-3 shrink-0 text-right text-surface-600">{idx + 1}</span>
                <span className="min-w-0 flex-1 truncate text-surface-300" title={qf.customName || qf.name}>
                  {qf.customName || qf.name.replace(/\.[^.]+$/, '')}
                </span>
                <button
                  onClick={() => removeFromPlayQueue(idx)}
                  className="shrink-0 rounded p-0.5 text-surface-600 transition-colors hover:text-red-400"
                >
                  <HiXMark className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sleep timer */}
      <div className="px-3 pt-2">
        <div className="flex items-center gap-2">
          <HiClock className="h-3.5 w-3.5 text-surface-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
            睡眠定时
            {sleepRemaining !== null && (
              <span className="ml-1 text-accent-400">{sleepRemaining}</span>
            )}
          </p>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[
            { label: '关', value: null as number | null },
            { label: '15分', value: 15 },
            { label: '30分', value: 30 },
            { label: '60分', value: 60 },
          ].map((opt) => {
            const isActive =
              opt.value === null
                ? sleepTimerEnd === null
                : sleepTimerEnd !== null &&
                  Math.abs((sleepTimerEnd - Date.now()) / 60000 - opt.value) < 1;
            return (
              <button
                key={opt.label}
                onClick={() => setSleepTimer(opt.value)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                  isActive
                    ? 'bg-accent-600 text-white'
                    : 'bg-surface-800 text-surface-400 hover:text-primary'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
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
