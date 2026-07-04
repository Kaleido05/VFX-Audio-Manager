# Playback Experience Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add play queue, loop modes, playback speed control, and sleep timer to VFX Audio Manager.

**Architecture:** Extend the existing Zustand store with new state fields and actions. The AudioManager already has an `onEnded` callback mechanism — App.tsx will register a handler that checks loop mode and queue state to decide what to play next. The AudioPlayer UI panel gets new sections for loop/speed/queue/sleep controls.

**Tech Stack:** React + Zustand + HTML5 Audio API + TailwindCSS + TypeScript

---

### Task 1: Update types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `queueNext` to ShortcutConfig and update DEFAULT_SHORTCUTS**

```typescript
// In ShortcutConfig interface, add:
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
  queueNext: string;       // NEW
}

// In DEFAULT_SHORTCUTS, add:
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
  queueNext: 'Ctrl+Q',     // NEW
};
```

- [ ] **Step 2: Add new state fields and actions to AppState**

In `AppState` interface, add to the state section:

```typescript
// State fields (add after recentlyPlayedIds):
playQueue: string[];        // queued file IDs
loopMode: 'off' | 'one' | 'all';
playbackRate: number;       // 0.5 ~ 2.0
sleepTimerEnd: number | null; // Date.now() + minutes*60000
```

In `AppState` interface, add to the actions section:

```typescript
// Play queue actions
addToPlayQueue: (fileId: string) => void;
removeFromPlayQueue: (index: number) => void;
clearPlayQueue: () => void;
playNextInQueue: () => void;

// Playback actions
setLoopMode: (mode: 'off' | 'one' | 'all') => void;
setPlaybackRate: (rate: number) => void;
setSleepTimer: (minutes: number | null) => void;
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add play queue and loop types"
```

---

### Task 2: Implement store actions

**Files:**
- Modify: `src/store/useStore.ts`

- [ ] **Step 1: Add default state values in the create call**

```typescript
// In the initial state object (around line 26), add:
playQueue: [],
loopMode: 'off' as const,
playbackRate: 1.0,
sleepTimerEnd: null,
```

- [ ] **Step 2: Add play queue actions (before batch operations section)**

```typescript
// ---- Play queue ----
addToPlayQueue: (fileId: string) => {
  set((state) => ({
    playQueue: [...state.playQueue, fileId],
  }));
},

removeFromPlayQueue: (index: number) => {
  set((state) => ({
    playQueue: state.playQueue.filter((_, i) => i !== index),
  }));
},

clearPlayQueue: () => {
  set({ playQueue: [] });
},

playNextInQueue: () => {
  const { playQueue, audioFiles, loopMode, player } = get();
  if (playQueue.length === 0) {
    if (loopMode === 'all' && player.currentFile) {
      // Replay current file
      set({
        player: { ...player, isPlaying: true, currentTime: 0, duration: 0 },
      });
    } else {
      set({ player: { ...player, isPlaying: false, currentTime: 0, duration: 0 } });
    }
    return;
  }
  const [nextId, ...rest] = playQueue;
  const nextFile = audioFiles.find((f) => f.id === nextId);
  if (nextFile) {
    // Shift the queue and prepare to play next
    set((state) => ({
      playQueue: rest,
      player: {
        ...state.player,
        currentFile: nextFile,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      },
    }));
  } else {
    // File not found (e.g., removed), skip and try next
    set({ playQueue: rest });
    get().playNextInQueue();
  }
},
```

- [ ] **Step 3: Add playback control actions**

```typescript
// ---- Playback controls ----
setLoopMode: (mode) => {
  set({ loopMode: mode });
},

setPlaybackRate: (rate) => {
  const clamped = Math.max(0.5, Math.min(2.0, rate));
  set({ playbackRate: clamped });
},

setSleepTimer: (minutes) => {
  if (minutes === null) {
    set({ sleepTimerEnd: null });
  } else {
    set({ sleepTimerEnd: Date.now() + minutes * 60000 });
  }
},
```

- [ ] **Step 4: Update resetAllData to include new fields**

In `resetAllData`, add to the set call:
```typescript
playQueue: [],
loopMode: 'off' as const,
playbackRate: 1.0,
sleepTimerEnd: null,
```

- [ ] **Step 5: Commit**

```bash
git add src/store/useStore.ts
git commit -m "feat: add play queue, loop, speed, and sleep timer store actions"
```

---

### Task 3: Add setPlaybackRate to AudioManager

**Files:**
- Modify: `src/services/AudioManager.ts`

AudioManager already has `onEnded` callback support via its `on()` method. Only need to add `setPlaybackRate`.

- [ ] **Step 1: Add setPlaybackRate method**

After the `setVolume` method (around line 105), add:

```typescript
/**
 * 设置播放速度 (0.5 ~ 2.0).
 */
setPlaybackRate(rate: number): void {
  if (this.audio) {
    this.audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/AudioManager.ts
git commit -m "feat: add setPlaybackRate to AudioManager"
```

---

### Task 4: Wire playback logic in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import new store selectors**

Update the destructured store values at the top of `App`:

```typescript
const {
  player,
  activeView,
  selectedFileIds,
  playQueue,
  loopMode,
  playbackRate,
  sleepTimerEnd,
  importFolder,
  loadFavorites,
  loadAndRestoreFolders,
  loadSettings,
  loadUserCollections,
  updatePlayerState,
  stopPlayback,
  playNextInQueue,
  setSleepTimer,
} = useStore();
```

- [ ] **Step 2: Replace the ended event handler**

Replace the existing `audioManager.on('ended', ...)` handler (lines 93-95):

```typescript
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
      // Replay the same file
      audioManager.play(state.player.currentFile.path);
      audioManager.setVolume(state.player.volume);
      useStore.setState((s) => ({
        player: { ...s.player, isPlaying: true, currentTime: 0, duration: 0 },
      }));
    } else {
      // Try queue first, or loop-all, or stop
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
}, [updatePlayerState, stopPlayback, playNextInQueue]);
```

- [ ] **Step 3: Sync playback rate to AudioManager**

After the existing volume sync effect (line 104-106), add:

```typescript
// Sync playback rate
useEffect(() => {
  audioManager.setPlaybackRate(playbackRate);
}, [playbackRate]);
```

- [ ] **Step 4: Sleep timer effect**

After the playback rate sync effect, add:

```typescript
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
```

- [ ] **Step 5: Clear sleep timer on manual stop**

Modify the existing volume sync effect to also clear sleep timer on manual stop:

No separate change needed — when user clicks stop, `stopPlayback()` in the store doesn't clear `sleepTimerEnd`. Add a wrapper in the handleStop below or just clear it in the ended effect and let it expire naturally. Simpler: just don't auto-dismiss on manual stop — the timer will fire and pause. If already stopped, pausing is a no-op. This is fine.

Actually, the cleaner approach: clear sleepTimerEnd when user manually clicks stop. But that requires the AudioPlayer to call setSleepTimer(null). We'll handle it in the AudioPlayer task via a separate stop handler that also clears the timer.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire queue, loop, speed, and sleep timer in App"
```

---

### Task 5: Update AudioPlayer UI

**Files:**
- Modify: `src/components/AudioPlayer.tsx`

This is the largest change. The AudioPlayer gets loop mode toggles, speed toggles, queue list, and sleep timer dropdown inserted between the playback controls and the volume section.

Replace the entire AudioPlayer component with the updated version that includes all new sections.

- [ ] **Step 1: Add new imports**

Add to the existing icon imports from react-icons/hi2:
```typescript
import {
  HiPlay,
  HiPause,
  HiStop,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiArrowPath,
  HiQueueList,
  HiXMark,
  HiClock,
} from 'react-icons/hi2';
```

- [ ] **Step 2: Pull all needed state and actions from store**

Replace the existing destructured line:
```typescript
const {
  player, pausePlayback, stopPlayback, seekTo, setVolume,
  playQueue, removeFromPlayQueue, clearPlayQueue,
  loopMode, setLoopMode,
  playbackRate, setPlaybackRate,
  sleepTimerEnd, setSleepTimer,
} = useStore();
```

- [ ] **Step 3: Add new callbacks**

After the existing handleToggleMute (around line 66), add:

```typescript
const handleStop = useCallback(() => {
  audioManager.stop();
  stopPlayback();
  setSleepTimer(null); // clear timer on manual stop
}, [stopPlayback, setSleepTimer]);

const displayName = useMemo(
  () => currentFile ? (currentFile.customName || currentFile.name.replace(/\.[^.]+$/, '')) : '未选择音频',
  [currentFile]
);

const sleepRemaining = useMemo(() => {
  if (sleepTimerEnd === null) return null;
  const remaining = Math.max(0, Math.ceil((sleepTimerEnd - Date.now()) / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}, [sleepTimerEnd]);

// Update sleep countdown every second
const [, setTick] = useState(0);
useEffect(() => {
  if (sleepTimerEnd === null) return;
  const interval = setInterval(() => setTick((t) => t + 1), 1000);
  return () => clearInterval(interval);
}, [sleepTimerEnd !== null]);

const queueFiles = useMemo(
  () => playQueue.map((id) => useStore.getState().audioFiles.find((f) => f.id === id)).filter(Boolean) as AudioFile[],
  [playQueue]
);
```

Add the missing `useState` and `useEffect` imports:
```typescript
import { useCallback, useMemo, useState, useEffect } from 'react';
```

- [ ] **Step 4: Add UI sections between controls and volume**

Replace the spacer div (`<div className="flex-1" />`) and everything between the track info section and the volume section with:

```tsx
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
      { label: '关', value: null },
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

<div className="flex-1" />
```

- [ ] **Step 5: Replace the existing spacer div**

Remove the existing `<div className="flex-1" />` (line 139) — it's now at the end of the new section block above.

Also note: the volume section border-t divider should remain. The new code is inserted BEFORE the volume section (which starts with `<div className="border-t border-surface-700 px-3 py-3">`).

- [ ] **Step 6: Commit**

```bash
git add src/components/AudioPlayer.tsx
git commit -m "feat: add queue UI, loop/speed toggles, sleep timer to AudioPlayer"
```

---

### Task 6: Add "Add to Queue" context menu item in AudioCard

**Files:**
- Modify: `src/components/AudioCard.tsx`

- [ ] **Step 1: Import queue list icon**

Add `HiQueueList` to the existing react-icons/hi2 import:
```typescript
import { HiPlay, HiPause, HiStar, HiCheck, HiFolderOpen, HiClipboard, HiPencil, HiTrash, HiXMark, HiQueueList } from 'react-icons/hi2';
```

- [ ] **Step 2: Pull addToPlayQueue from store**

```typescript
const { player, selectedFileIds, toggleFileSelection, playFile, pausePlayback, renameAudioFile, removeFileFromList, toggleFavoriteQuick, addToPlayQueue } = useStore();
```

- [ ] **Step 3: Add context menu item**

In the context menu section (after the "播放" button and before the "添加到收藏夹" button), add:

```tsx
<button
  onClick={() => { setContextMenuVisible(false); addToPlayQueue(file.id); }}
  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
>
  <HiQueueList className="h-3 w-3" /> 添加到播放队列
</button>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/AudioCard.tsx
git commit -m "feat: add 'Add to Queue' context menu in AudioCard"
```

---

### Task 7: Register queueNext keyboard shortcut

**Files:**
- Modify: `src/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: Pull queue-related store state**

Add to the destructured store values:
```typescript
const player = useStore((s) => s.player);
const selectedFileIds = useStore((s) => s.selectedFileIds);
const shortcuts = useStore((s) => s.settings.shortcuts);
const deselectAllFiles = useStore((s) => s.deselectAllFiles);
const stopPlayback = useStore((s) => s.stopPlayback);
const setVolume = useStore((s) => s.setVolume);
const addToPlayQueue = useStore((s) => s.addToPlayQueue);  // NEW
```

- [ ] **Step 2: Also add addToPlayQueue to the useEffect dependency array**

At the bottom of the useEffect hook, add `addToPlayQueue` to the dependency array.

- [ ] **Step 3: Add the queueNext handler**

After the "Toggle mute" handler and before the closing `};` of the handleKeyDown function, add:

```typescript
// Queue next (add selected file to play queue)
if (matches('queueNext') && !editing) {
  e.preventDefault();
  const fileId = [...selectedFileIds][0];
  if (fileId) {
    addToPlayQueue(fileId);
    useStore.setState({ selectedFileIds: new Set() });
  }
  return;
}
```

- [ ] **Step 4: Update dependency array**

Add `addToPlayQueue` to the useEffect dependency list.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts
git commit -m "feat: add Ctrl+Q queueNext keyboard shortcut"
```

---

### Task 8: Register queueNext in Settings page

**Files:**
- Modify: `src/components/SettingsPage.tsx`

- [ ] **Step 1: Add label for queueNext**

```typescript
const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  playPause: '播放 / 暂停',
  deselect: '取消选择 / 停止播放',
  delete: '删除已选文件',
  selectAll: '全选当前列表',
  focusSearch: '聚焦搜索框',
  seekBack: '快退 5 秒',
  seekForward: '快进 5 秒',
  volumeUp: '音量增大 5%',
  volumeDown: '音量减小 5%',
  toggleMute: '静音 / 取消静音',
  queueNext: '加入播放队列',       // NEW
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SettingsPage.tsx
git commit -m "feat: register queueNext shortcut in settings UI"
```

---

### Task 9: Typecheck

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors. Fix any type errors before proceeding.

---

### Task 10: Build and verify

- [ ] **Step 1: Full build**

```bash
npm run dist
```

- [ ] **Step 2: Launch and smoke test**

Launch the built app and verify:
1. Right-click on an audio file → "添加到播放队列" appears
2. Queue items show in the player panel
3. Click play → card plays as before (queue not affected)
4. Loop modes toggle visually
5. Speed toggles change playback rate
6. Sleep timer sets and countdown runs
7. Settings page shows "加入播放队列" shortcut with Ctrl+Q
8. Settings page shows all 10 existing shortcuts still working

---

### Task 11: Package and update docs

- [ ] **Step 1: Package**

```bash
npm run pack
```

- [ ] **Step 2: Update README.md**

Add new features under the audio playback section. Add new keyboard shortcut (Ctrl+Q) to the shortcuts list.

- [ ] **Step 3: Update CLAUDE.md**

Add new features documentation: play queue system, loop modes, playback speed control, sleep timer. Update the keyboard shortcuts section with `queueNext: Ctrl+Q`.

- [ ] **Step 4: Final commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: update README and CLAUDE.md with playback enhancement features"
```
