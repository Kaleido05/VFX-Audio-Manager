# Playback Experience Enhancement — Design Spec

**Date:** 2026-05-27
**Status:** Design approved, pending implementation plan

## Overview

Enhance the audio playback experience by adding a play queue system, loop modes, playback speed control, and a sleep timer. The existing single-file playback model is preserved — clicking a card still plays immediately. Queue is an opt-in "play next" system.

## Data Model

### New state fields in Zustand store

| Field | Type | Default | Description |
|---|---|---|---|
| `playQueue` | `string[]` | `[]` | Queued file IDs in order |
| `loopMode` | `'off' \| 'one' \| 'all'` | `'off'` | Loop behavior |
| `playbackRate` | `number` | `1.0` | Playback speed (0.5–2.0) |
| `sleepTimerEnd` | `number \| null` | `null` | `Date.now() + ms` |

### New actions

- `addToPlayQueue(fileId)` — append to queue
- `removeFromPlayQueue(index)` — remove by position
- `clearPlayQueue()` — empty the queue
- `playNextInQueue()` — shift head of queue and play; called on track end
- `setLoopMode(mode)` — update loopMode
- `setPlaybackRate(rate)` — update speed, sync to AudioManager
- `setSleepTimer(minutes \| null)` — arm/disarm timer

### New keyboard shortcuts (customizable)

- `queueNext` — default `Ctrl+Q`, adds first selected file to play queue
- Shortcut config field added to `ShortcutConfig` type

## Core Logic

### Playback flow (ended event)

```
audio ended
  ├── loopMode === 'one'  → seek to 0, replay same file
  ├── loopMode === 'all'  → play queue head if non-empty, else replay same file
  └── loopMode === 'off'  → play queue head if non-empty, else stop
```

### Queue semantics

- **Add to queue:** right-click context menu on AudioCard → "添加到播放队列", or Ctrl+Q for selected file
- **Do NOT auto-consume on click:** clicking a card directly always plays that file immediately, bypassing the queue
- **Queue persistence:** in-memory only, lost on restart (like recentlyPlayed)

### Sleep timer

- Dropdown options: Off / 15min / 30min / 60min
- Arming stores `Date.now() + minutes * 60000` in `sleepTimerEnd`
- Rendered via `useEffect` with `setTimeout`; on fire, calls `pausePlayback()`
- Dismissed only when user stops playback or plays a different file (pause does NOT dismiss)
- Visible countdown in AudioPlayer while timer is active ("15:00 → 14:59...")

## UI Layout (AudioPlayer panel, top to bottom)

```
┌──────────────────────┐
│  Progress bar (existing)│
│  Cover/track info     │
│  Play controls (existing)│
├──────────────────────┤ ← new section divider
│  Loop: [Off] [One] [All]│  ← segmented toggle, active state = accent bg
│  Speed: 0.5x  1x  2x  │  ← segmented toggle, selected = accent bg
│                      │
│  Queue (3)    [Clear] │  ← row: count label + clear button
│  ┌──────────────────┐ │
│  │ #1 filename.wav  ✕│ │  ← scrollable list, × to remove
│  │ #2 filename.mp3  ✕│ │
│  │ #3 filename.wav  ✕│ │
│  └──────────────────┘ │
│                      │
│  Sleep timer: [Off ▼] │  ← dropdown selector
├──────────────────────┤
│  Volume slider (existing)│
└──────────────────────┘
```

The queue list is scrollable if items exceed the available vertical space. The entire queue section is collapsible — collapsed when queue is empty.

## AudioManager Changes

`src/services/AudioManager.ts`:

1. New method: `setPlaybackRate(rate: number)` → sets `this.audio.playbackRate`
2. New callback: `onEnded: (() => void) | null` — set by App.tsx, called when audio `ended` event fires
3. App.tsx registers the `onEnded` handler in a `useEffect`, with `loopMode`, `playQueue`, and store actions as dependencies

## Files to Change

| File | Change |
|---|---|
| `src/types/index.ts` | Add `playQueue`, `loopMode`, `playbackRate`, `sleepTimerEnd` to state; add `queueNext` to `ShortcutConfig` and `DEFAULT_SHORTCUTS` |
| `src/types/electron.d.ts` | No changes needed |
| `src/store/useStore.ts` | Add new state fields + actions |
| `src/services/AudioManager.ts` | Add `setPlaybackRate`, `onEnded` callback |
| `src/App.tsx` | Wire `onEnded` handler, sync `playbackRate`, sleep timer `setTimeout` |
| `src/components/AudioPlayer.tsx` | Queue UI, loop/speed toggles, sleep timer dropdown |
| `src/components/AudioCard.tsx` | Add "添加到播放队列" to context menu |
| `src/hooks/useKeyboardShortcuts.ts` | Add `queueNext` shortcut handler |
| `src/components/SettingsPage.tsx` | Register new shortcut in KeyBindButton list |

## Constraints

- `playbackRate` range: 0.5x to 2.0x in 0.25 increments. Below 0.5 sounds bad; above 2.0 is rarely useful for SFX browsing.
- Queue list shows at most ~6 items before scrolling (configurable via max-height CSS)
- Sleep timer: if user manually stops playback, timer is cleared
