# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

VFX Audio Manager — Windows desktop app for importing, browsing, searching, and playing local sound effect files. Built for video editing / content creation workflows. Supports folder import with recursive scanning, favorites with persistent storage, batch operations, and drag-and-drop.

## Current features

### Audio import & management
- **Folder import** — system dialog selects a folder, recursively scans all subdirectories for audio files (MP3, WAV, FLAC, OGG, M4A, AAC, WMA, AIFF, OPUS, WEBM, MKA)
- **Drag-and-drop import** — drop a folder onto the app window to import directly (`App.tsx` dragover/drop handlers)
- **Category system** — each imported folder becomes a "category" shown in the sidebar; supports rename (Enter/Escape) and delete via right-click context menu, with confirmation dialog; no inline edit icon — all management via context menu
- **Subdirectory browsing** — scanner tracks `relativeDir` per file during recursive scan; sidebar shows expandable chevron toggle on categories that contain nested folders; clicking a subdirectory filters the audio list to files only within that subdirectory (`ActiveView` type `'subdirectory'`)
- **Session restore** — on startup, `loadAndRestoreFolders()` re-scans previously imported folders and rebuilds the file list from disk; categories are persisted to JSON
- **Format color tags** — all 12 supported formats get distinct colored badges (MP3 blue, WAV green, FLAC purple, OGG amber, M4A rose, AAC cyan, WMA orange, AIFF/AIF teal, OPUS pink, WEBM indigo, MKA lime)

### Audio playback
- **Duration detection** — `music-metadata` reads audio duration from file headers during import (parallel batches of 8); supports all 11 formats; fallback to `--:--` for unreadable files
- **Pause/resume** — `App.tsx` effect only triggers `audioManager.play()` on file change, not on `isPlaying` toggle; `AudioCard` and `AudioPlayer` call `audioManager.pause()` / `audioManager.resume()` directly for instant pause/resume without restarting
- **Right-side fixed-width player panel** — 256px (`w-64`) vertical layout that doesn't resize when switching tracks with different durations
- **Mono-spaced timestamps** — `font-mono` + `tabular-nums` with `min-w-[2.5em]` ensures time display width stays constant regardless of value (e.g. `0:00` → `10:00`)
- **Three-line card layout** — AudioCard displays file name on line 1 (supports inline rename via right-click context menu), format badge + file size on line 2, and duration with "时长：" prefix on line 3 to prevent text layout issues at narrow widths
- **Right-click context menu** — AudioCard supports `onContextMenu` with 6 actions: play, add to collection, open in Explorer (`shell.showItemInFolder`), copy path (`clipboard.writeText`), rename (in-app only, sets `customName`), remove from list. All shell/clipboard operations go through IPC handlers in the main process. Context menu overlay and popup both use `stopPropagation` to prevent click events from bubbling to the card's play handler.
- **Play/pause/stop** — centered controls in the player panel
- **Progress bar** — range slider at the top of the player panel for scrubbing
- **Volume control** — slider (0-100%) with mute toggle, located at the panel bottom with a separator
- **Playing indicator** — currently playing audio card shows a blue progress bar along its bottom edge
- **Singleton playback** — `AudioManager` singleton ensures only one audio plays at a time
- **Play queue** — right-click "添加到播放队列" or Ctrl+Q adds files to a sequential queue; queue persists in memory, lost on restart
- **Loop modes** — off / single-track / queue-all; controlled via segmented toggle in the player panel
- **Playback speed** — 0.5x to 2.0x in 6 steps; `AudioManager.setPlaybackRate()` delegates to `HTMLAudioElement.playbackRate`
- **Sleep timer** — 15/30/60 minute countdown; auto-pauses playback on expiry; manual stop clears the timer

### Search & filtering
- **Real-time search** — search bar filters by filename and format, with a clear (X) button
- **View switching** — sidebar provides "All Audio", "Favorites", "Recently Played", and per-category views
- **Sorting** — favorites appear first, then sort by user-selected key (name, size, duration, format) with asc/desc toggle; recently played view sorts by play recency; sort preference persisted to settings
- **Empty states** — empty library shows intro guide; no-search-results shows contextual messages per view type

### Recently played
- **Auto-tracking** — `playFile` automatically adds the file ID to `recentlyPlayedIds` (max 20, most recent first, de-duplicated)
- **Recently Played view** — sidebar clock icon navigates to `{ type: 'recentlyPlayed' }` view; `AudioList` filters by ID set and preserves recency order; supports search within recent files
- **In-memory only** — not persisted to disk; resets on app restart

### Favorites & user collections
- **Collection picker** — star button toggles quick favorite/unfavorite directly; right-click context menu → "添加到收藏夹" opens modal (`CollectionPicker`) to choose which user-created collection to add the file to; modal uses `stopPropagation` to prevent click events from bubbling to the card's play handler; includes a confirm (完成) button to dismiss
- **User collections** — create custom folders via sidebar "新建收藏夹" button (located directly below "导入文件夹", same accent button style) or from within the collection picker; each collection appears in sidebar under "我的收藏夹" section
- **Collection management** — rename/delete collections via right-click context menu (no inline edit icon); deleting a collection cleans up all associated file references (`collectionIds` and `isFavorite`) and persists changes; files can belong to multiple collections
- **Collection view** — clicking a collection in sidebar filters audio list to show only files in that collection
- **Persistent storage** — collections and file mappings saved to `vfx-data.json`, restored on startup via `loadUserCollections()`

### Batch operations
- **Multi-select** — clicking the checkbox area on any card enters batch mode; `BatchToolbar` replaces `SearchBar`
- **Select all / deselect all** — toolbar button toggles all currently visible files
- **Batch favorite/unfavorite** — apply favorite state to all selected files at once
- **Batch add to collection** — toolbar dropdown to add all selected files to a chosen collection at once
- **Batch delete from list** — removes selected files from the list (does not touch disk files), persists via `ignoredPaths` so removed files stay gone across restarts
- **Selection count** — toolbar shows live count of selected files

### Keyboard shortcuts
- **Global hotkeys** — `src/hooks/useKeyboardShortcuts.ts` registers document-level keydown listener; skips when focus is in input/textarea
- **All 11 shortcuts are user-customizable** — stored in `settings.shortcuts` (`ShortcutConfig` type), persisted to `vfx-data.json`, editable in Settings page via `KeyBindButton` component (click to enter recording mode, press desired key combination)
- **Shortcut format** — `"Ctrl+A"`, `"Space"`, `"ArrowLeft"`, `"KeyM"`, etc.; `parseShortcut()` splits on `+` and maps to `e.code` / modifier flags (`ctrlKey`/`metaKey`/`shiftKey`/`altKey`); `shortcutEventToString()` does the reverse for the recording UI
- Defaults:
  - **Space** — Play/Pause toggle
  - **Escape** — Deselect all (batch mode) or stop playback
  - **Delete** — Delete selected files (persists ignored paths)
  - **Ctrl+A** — Select all visible files (computes visibility from current view/search, including subdirectory and recentlyPlayed views)
  - **Ctrl+F** — Focus search bar
  - **Arrow Left/Right** — Seek backward/forward 5 seconds
  - **Arrow Up/Down** — Volume up/down 5%
  - **M** — Toggle mute (0% / 80%)
  - **Ctrl+Q** — Add first selected file to play queue, then deselect
- **Shortcut reference** — displayed in Settings page with live rebinding UI; "恢复默认快捷键" button resets all to defaults

### Settings
- **Default volume** — slider to set the volume applied on each app launch
- **Theme switching** — toggle between dark theme (default, inspired by Adobe Audition / Spotify / Notion) and light theme (white backgrounds with adapted component colors) via the settings page
- **Customizable keyboard shortcuts** — each shortcut shows current binding; click to record a new key combo; reset-to-defaults button
- **Data management** — "Clear all data" button wipes all imported files, categories, favorites, shortcuts, and settings (with confirmation)
- **Author info** — avatar (`public/image/head.png`), email (`gcfic05@163.com`), Douyin link, Bilibili link (external links open in system default browser via `shell.openExternal`)

### UI/UX
- **Dark + Light themes** — dual theme system using CSS custom properties; dark theme (default, `surface-950 = #0d0f12` background) and light theme (`surface-950 = #ffffff` background) toggleable in settings; surface color scale flips between themes
- **CSS variable theming** — `tailwind.config.js` maps surface colors to CSS custom properties (`--surface-*`); `html.light` class swaps all surface values for light mode; `text-primary` utility adapts text color to theme
- **Custom scrollbars** — thin scrollbar (6px) using theme-aware CSS variables
- **CSS transitions** — hover/active states on buttons, smooth progress bar, drag-over dashed border feedback
- **Responsive grid** — audio cards use a responsive grid (1–5 columns depending on viewport width)
- **React.memo** — `AudioCard` is memoized to avoid unnecessary re-renders in large lists
- **useMemo** — search/filter/sort results are cached in `AudioList` and `BatchToolbar`
- **Footer** — sidebar footer shows category/collection counts and "Developed by Richard29"; each category and collection item shows inline file count badge

### Data persistence
- **JSON file** — all data stored at `%APPDATA%/vfx-audio-manager/vfx-data.json`
- **Legacy migration** — storage layer auto-migrates old `importFolders` format to the `categories` model
- **Cross-session** — categories, favorites, ignoredPaths, and settings survive app restart; removed files stay gone via `ignoredPaths` persistence

### Security model
- `contextIsolation: true`, `nodeIntegration: false` — renderer cannot access Node APIs directly
- All system access goes through `ipcMain.handle` / `ipcRenderer.invoke` via the preload bridge
- CSP headers enforced in production; relaxed in dev for Vite HMR

## Commands

```bash
npm run dev          # Start Vite dev server + Electron concurrently
npm run dev:vite     # Vite dev server only (http://localhost:5173)
npm run dev:electron # Rebuild main/preload with esbuild, then launch Electron
npm run build        # Build both renderer (Vite) and electron (esbuild)
npm run pack         # Package into Windows NSIS installer via electron-builder
npm run dist         # build + pack
npm run typecheck    # tsc --noEmit (check types without emitting)
```

`npm run dev` is the primary development command. It sets `VFX_DEV=true` which makes `electron/main.ts` load from `http://localhost:5173` instead of the built HTML file.

## Architecture

### Dual build system

The **renderer** (`src/`) uses **Vite** (ESM, React JSX, TailwindCSS). The **main process** (`electron/`) uses **esbuild** (bundled to CJS, `scripts/build-electron.mjs`). The root `package.json` has `"type": "module"`, but the esbuild script writes a `{"type":"commonjs"}` package.json into `dist/electron/` so Electron loads main/preload as CJS.

Two tsconfigs extend the base `tsconfig.json`:
- `tsconfig.web.json` — renderer (DOM libs, `src/` root)
- `tsconfig.node.json` — main process (Node types, CommonJS module, `electron/` root)

### Process separation & security

- `contextIsolation: true`, `nodeIntegration: false` — renderer has no direct Node access
- `electron/preload.ts` exposes a typed `window.electronAPI` object via `contextBridge.exposeInMainWorld`
- All file I/O, folder dialogs, and data persistence go through `ipcMain.handle` / `ipcRenderer.invoke`
- `electron/ipc/fileScanner.ts` — registers handlers for folder selection dialog (`dialog:selectFolder`), recursive filesystem scan with duration detection (`file:scanFolder`, uses `music-metadata` in parallel batches), and single-file duration query (`file:getAudioDuration`)
- `electron/ipc/storage.ts` — registers handlers for favorites CRUD, settings, categories persistence, and `clearAllData`. Data lives at `%APPDATA%/vfx-audio-manager/vfx-data.json`. Includes a legacy migration path from `importFolders` to the newer `categories` model.

### State management (Zustand)

`src/store/useStore.ts` is the single Zustand store. It holds:
- **Data**: `audioFiles[]`, `categories[]`, `userCollections[]`, `collectionFiles: Record<string, string[]>`, `importFolders[]`, `selectedFileIds: Set<string>`, `recentlyPlayedIds: string[]` (max 20)
- **Player**: `player: PlayerState` (currentFile, isPlaying, currentTime, duration, volume)
- **UI**: `searchQuery`, `activeView` (discriminated union: `all` | `favorites` | `recentlyPlayed` | `category` | `collection` | `subdirectory` | `settings`), `sortKey` (name/size/duration/format), `sortAsc`, `isLoading`, `error`
- Async actions call `window.electronAPI.*` then update store state. Key action groups:
  - Folder/category: `importFolder`, `loadAndRestoreFolders`, `renameCategory`, `removeCategory`
  - Favorites: `toggleFavorite`, `loadFavorites`
  - User collections: `createUserCollection`, `deleteUserCollection`, `renameUserCollection`, `addToCollection`, `removeFromCollection`, `loadUserCollections`
  - Settings: `loadSettings`, `updateSettings`, `resetAllData`
  - Batch: `toggleFileSelection`, `selectAllFiles`, `deselectAllFiles`, `batchToggleFavorite`, `batchDeleteFiles`

### Audio playback

`src/services/AudioManager.ts` — singleton wrapping HTML5 `Audio`. One audio at a time. Emits events (`timeupdate`, `durationchange`, `ended`, `error`) that `App.tsx` wires to store updates. `App.tsx` syncs `player.volume` and `player.currentFile` + `isPlaying` into `AudioManager` via `useEffect`.

### Component tree

```
App
├── useKeyboardShortcuts  (global hotkey hook: configurable shortcuts from settings.shortcuts)
├── Sidebar               (folder import, create collection, category nav, subdirectory tree, user collections, favorites, recently played, settings link, footer)
├── SearchBar             (search input, shown when not in batch mode, hidden on settings view)
├── BatchToolbar          (shown when selectedFileIds.size > 0: select all, batch favorite/collection/delete; filters by all view types including subdirectory)
├── AudioList             (filters audioFiles by activeView + searchQuery, renders AudioCards; sort bar with 4 sort keys; recentlyPlayed view sorted by recency)
│   └── AudioCard[]       (React.memo-wrapped, play button, star→fav toggle, context menu)
├── AudioPlayer           (fixed 256px right panel: vertical layout)
├── SettingsPage          (shown when activeView.type === 'settings', includes theme toggle + shortcut rebinding + author card)
├── CollectionPicker      (modal: pick/add to user collections when starring a file)
└── CreateCollectionDialog (modal: create new user collection, used by Sidebar and CollectionPicker)
```

### Types

- `src/types/index.ts` — `AudioFile` (added `subPath`, `customName?`), `Category`, `UserCollection`, `PlayerState`, `ActiveView` (variants: `all`, `favorites`, `recentlyPlayed`, `category`, `collection`, `subdirectory`, `settings`), `AppSettings` (includes `shortcuts: ShortcutConfig`), `ShortcutConfig` (11 keybind fields), `DEFAULT_SHORTCUTS`, `AppState`
- `src/types/electron.d.ts` — `ElectronAPI` interface and global `Window.electronAPI` declaration

## Packaging

`electron-builder.yml` targets Windows x64 NSIS installer. Output goes to `release/`. Publisher: **Richard29**. `asar: false` so the built files remain inspectable.

Chinese mirror setup (`.npmrc`):
```
registry=https://registry.npmmirror.com
```

Electron and builder binaries use npmmirror mirrors via environment variables:
```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
npm run pack
```

## Design system

Dual-theme system using CSS custom properties for the `surface` color scale (50–950). Dark theme (`html` default): `surface-950 = #0d0f12` (app background). Light theme (`html.light`): `surface-950 = #ffffff`. `tailwind.config.js` maps all surface colors to `rgb(var(--surface-*) / <alpha-value>)` for runtime theme switching via `document.documentElement.classList.toggle('light', ...)`. Accent blue scale remains constant across themes. Text uses `text-primary` utility (white in dark, dark-slate in light) except on accent-colored buttons which retain `text-white`. Font: Inter with system fallbacks; monospace: JetBrains Mono. No component library — all UI is custom TailwindCSS.
