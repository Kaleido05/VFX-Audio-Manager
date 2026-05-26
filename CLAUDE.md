# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

VFX Audio Manager — Windows desktop app for importing, browsing, searching, and playing local sound effect files. Built for video editing / content creation workflows. Supports folder import with recursive scanning, favorites with persistent storage, batch operations, and drag-and-drop.

## Current features

### Audio import & management
- **Folder import** — system dialog selects a folder, recursively scans all subdirectories for audio files (MP3, WAV, FLAC, OGG, M4A, AAC, WMA, AIFF, OPUS, WEBM, MKA)
- **Drag-and-drop import** — drop a folder onto the app window to import directly (`App.tsx` dragover/drop handlers)
- **Category system** — each imported folder becomes a "category" shown in the sidebar; supports inline rename (Enter/Escape) and delete via right-click context menu, with confirmation dialog
- **Session restore** — on startup, `loadAndRestoreFolders()` re-scans previously imported folders and rebuilds the file list from disk; categories are persisted to JSON
- **Format color tags** — each audio format gets a distinct colored badge (MP3 blue, WAV green, FLAC purple, OGG amber, M4A rose, AAC cyan, WMA orange)

### Audio playback
- **Duration detection** — `music-metadata` reads audio duration from file headers during import (parallel batches of 8); supports all 11 formats; fallback to `--:--` for unreadable files
- **Pause/resume** — `App.tsx` effect only triggers `audioManager.play()` on file change, not on `isPlaying` toggle; `AudioCard` and `AudioPlayer` call `audioManager.pause()` / `audioManager.resume()` directly for instant pause/resume without restarting
- **Right-side fixed-width player panel** — 256px (`w-64`) vertical layout that doesn't resize when switching tracks with different durations
- **Mono-spaced timestamps** — `font-mono` + `tabular-nums` with `min-w-[2.5em]` ensures time display width stays constant regardless of value (e.g. `0:00` → `10:00`)
- **Play/pause/stop** — centered controls in the player panel
- **Progress bar** — range slider at the top of the player panel for scrubbing
- **Volume control** — slider (0-100%) with mute toggle, located at the panel bottom with a separator
- **Playing indicator** — currently playing audio card shows a blue progress bar along its bottom edge
- **Singleton playback** — `AudioManager` singleton ensures only one audio plays at a time

### Search & filtering
- **Real-time search** — search bar filters by filename and format, with a clear (X) button
- **View switching** — sidebar provides "All Audio", "Favorites", and per-category views
- **Sorting** — favorites appear first, then alphabetical by filename
- **Empty states** — empty library shows intro guide; no-search-results shows contextual messages per view type

### Favorites & user collections
- **Collection picker** — clicking the star on an audio card opens a modal (`CollectionPicker`) to choose which user-created collection to add the file to
- **User collections** — create custom folders via sidebar "新建收藏夹" button (located directly below "导入文件夹", same accent button style) or from within the collection picker; each collection appears in sidebar under "我的收藏夹" section
- **Collection management** — rename/delete collections via right-click context menu; files can belong to multiple collections
- **Collection view** — clicking a collection in sidebar filters audio list to show only files in that collection
- **Persistent storage** — collections and file mappings saved to `vfx-data.json`, restored on startup via `loadUserCollections()`

### Batch operations
- **Multi-select** — clicking the checkbox area on any card enters batch mode; `BatchToolbar` replaces `SearchBar`
- **Select all / deselect all** — toolbar button toggles all currently visible files
- **Batch favorite/unfavorite** — apply favorite state to all selected files at once
- **Batch delete from list** — removes selected files from the list (does not touch disk files), with confirmation dialog
- **Selection count** — toolbar shows live count of selected files

### Keyboard shortcuts
- **Global hotkeys** — `src/hooks/useKeyboardShortcuts.ts` registers document-level keydown listener; skips when focus is in input/textarea
- **Space** — Play/Pause toggle for current track
- **Escape** — Deselect all (batch mode) or stop playback
- **Delete** — Delete selected files with confirmation dialog
- **Ctrl+A** — Select all visible (respected by AudioList)
- **Ctrl+F** — Focus search bar
- **Arrow Left/Right** — Seek backward/forward 5 seconds
- **Arrow Up/Down** — Volume up/down 5%
- **M** — Toggle mute (0% / 80%)
- **Shortcut reference** — displayed in Settings page below theme section

### Settings
- **Default volume** — slider to set the volume applied on each app launch
- **Theme switching** — toggle between dark theme (default, inspired by Adobe Audition / Spotify / Notion) and light theme (white backgrounds with adapted component colors) via the settings page
- **Data management** — "Clear all data" button wipes all imported files, categories, favorites, and settings (with confirmation)

### UI/UX
- **Dark + Light themes** — dual theme system using CSS custom properties; dark theme (default, `surface-950 = #0d0f12` background) and light theme (`surface-950 = #ffffff` background) toggleable in settings; surface color scale flips between themes
- **CSS variable theming** — `tailwind.config.js` maps surface colors to CSS custom properties (`--surface-*`); `html.light` class swaps all surface values for light mode; `text-primary` utility adapts text color to theme
- **Custom scrollbars** — thin scrollbar (6px) using theme-aware CSS variables
- **CSS transitions** — hover/active states on buttons, smooth progress bar, drag-over dashed border feedback
- **Responsive grid** — audio cards use a responsive grid (1–5 columns depending on viewport width)
- **React.memo** — `AudioCard` is memoized to avoid unnecessary re-renders in large lists
- **useMemo** — search/filter/sort results are cached in `AudioList` and `BatchToolbar`
- **Footer** — sidebar footer shows category/collection counts and "Developed by Richard29"

### Data persistence
- **JSON file** — all data stored at `%APPDATA%/vfx-audio-manager/vfx-data.json`
- **Legacy migration** — storage layer auto-migrates old `importFolders` format to the `categories` model
- **Cross-session** — categories, favorites, and settings survive app restart

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
- **Data**: `audioFiles[]`, `categories[]`, `userCollections[]`, `collectionFiles: Record<string, string[]>`, `importFolders[]`, `selectedFileIds: Set<string>`
- **Player**: `player: PlayerState` (currentFile, isPlaying, currentTime, duration, volume)
- **UI**: `searchQuery`, `activeView` (discriminated union: `all` | `favorites` | `category` | `collection` | `settings`), `isLoading`, `error`
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
├── useKeyboardShortcuts  (global hotkey hook: Space/Escape/Delete/arrows/M/Ctrl+F)
├── Sidebar               (folder import, create collection, category nav, user collections, favorites, settings link, footer)
├── SearchBar             (search input, shown when not in batch mode, hidden on settings view)
├── BatchToolbar          (shown when selectedFileIds.size > 0: select all, batch favorite/delete)
├── AudioList             (filters audioFiles by activeView + searchQuery, renders AudioCards)
│   └── AudioCard[]       (React.memo-wrapped, play button, star→CollectionPicker, duration display)
├── AudioPlayer           (fixed 256px right panel: vertical layout)
├── SettingsPage          (shown when activeView.type === 'settings', includes theme toggle + shortcut reference)
├── CollectionPicker      (modal: pick/add to user collections when starring a file)
└── CreateCollectionDialog (modal: create new user collection, used by Sidebar and CollectionPicker)
```

### Types

- `src/types/index.ts` — `AudioFile`, `Category`, `PlayerState`, `ActiveView`, `AppSettings`, `AppState`
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
