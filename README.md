# VFX Audio Manager

现代化桌面音效管理软件 — 为视频剪辑创作者与内容创作者打造。

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/electron-42.2.0-9feaf9)
![React](https://img.shields.io/badge/react-18.3.1-61dafb)
![TypeScript](https://img.shields.io/badge/typescript-5.6.3-3178c6)
![Version](https://img.shields.io/badge/version-1.0.1-green)

## 功能特性

- **音效导入**：支持导入本地文件夹，自动递归扫描所有子目录；支持拖拽文件夹到应用窗口
- **分类管理**：每个导入的文件夹自动成为分类，支持重命名和删除；子目录树形浏览
- **启动恢复**：关闭后重新打开，自动恢复所有分类和文件列表
- **多格式支持**：MP3、WAV、FLAC、OGG、M4A、AAC、WMA、AIFF、OPUS、WEBM、MKA 等，格式标签着色区分
- **音频时长检测**：导入时使用 `music-metadata` 自动读取音频文件时长（并行批量处理），支持全部 11 种格式
- **音频播放**：播放/暂停/停止、支持续播不重头开始、进度条拖动、音量调节（固定宽度右侧面板，不受时长变化影响）
- **播放队列**：右键音效卡片「添加到播放队列」，曲目播放完毕后自动播放下一首
- **循环模式**：支持关闭 / 单曲循环 / 全部循环三种模式
- **变速播放**：0.5x ~ 2.0x 六档变速，方便快速浏览或慢速试听
- **睡眠定时**：15 / 30 / 60 分钟定时自动暂停播放
- **最近播放**：自动记录最近播放的 20 首音效，侧边栏点击「最近播放」按顺序回溯
- **键盘快捷键**：Space 播放/暂停、Esc 取消选择/停止播放、Delete 删除选中、Ctrl+A 全选、Ctrl+F 搜索、Ctrl+Q 加入队列、方向键快进快退/调音量、M 静音；全部快捷键可在设置中自定义绑定
- **灵活排序**：支持按名称、文件大小、时长、格式排序，点击切换升降序；排序偏好持久保存
- **实时搜索**：按文件名和格式快速筛选，带清除按钮
- **自定义收藏夹**：创建自定义文件夹分类管理音效，点击星标快速收藏/取消收藏，右键菜单选择收藏夹
- **批量操作**：多选文件，批量收藏、添加到收藏夹、从列表移除
- **音频右键菜单**：播放、添加到收藏夹、在资源管理器打开、复制路径、重命名（仅软件内）、从列表移除
- **设置页面**：默认音量调节、深色/浅色主题切换、自定义快捷键绑定、数据清除、作者信息与社交媒体快捷入口（外部链接使用系统默认浏览器打开）
- **双主题**：深色主题（默认）+ 浅色主题，CSS 变量驱动的运行时切换，按钮和组件颜色自适应
- **页脚标识**：侧边栏底部显示 "Developed by Richard29"
- **高性能**：大量音频文件下流畅滚动，使用 `React.memo` 和 `useMemo` 优化

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron 42 | 桌面应用框架 |
| React 18 + TypeScript 5.6 | UI 框架 |
| Vite 5 | 构建工具 |
| TailwindCSS 3 | CSS 框架 |
| Zustand 4 | 状态管理 |
| esbuild | Electron 主进程编译 |
| music-metadata | 音频文件时长解析 |
| Electron Builder | Windows EXE 打包 |

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+
- Windows 10/11

### 安装

```bash
git clone <repo-url>
cd VFX
npm install
```

### 开发

```bash
npm run dev
```

这会同时启动：
- Vite 开发服务器（http://localhost:5173）
- Electron 窗口（自动连接开发服务器）

### 构建

```bash
npm run build
```

输出到 `dist/` 目录：
- `dist/renderer/` — React 前端（静态文件）
- `dist/electron/` — Electron 主进程

### 打包 EXE

```bash
npm run dist
```

等价于 `npm run build && npm run pack`。

打包输出到 `release/` 目录，生成 NSIS 安装程序（`.exe`）。发布者：**Richard29**。

> 国内用户建议使用 npmmirror 镜像加速下载：
> ```bash
> ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
> ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
> npm run dist
> ```
>
> 项目 `.npmrc` 已配置 `registry=https://registry.npmmirror.com`。

## 项目结构

```
VFX/
├── electron/                  # Electron 主进程
│   ├── main.ts                # 主进程入口
│   ├── preload.ts             # 预加载脚本（IPC 桥接）
│   └── ipc/
│       ├── fileScanner.ts     # 文件扫描 + 时长检测 IPC 处理器
│       └── storage.ts         # 本地存储 IPC 处理器
├── src/                       # React 渲染进程
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 根组件
│   ├── index.html             # HTML 模板
│   ├── components/
│   │   ├── Sidebar.tsx        # 侧边栏（导入、新建收藏夹、导航、分类管理、页脚）
│   │   ├── SearchBar.tsx      # 搜索栏
│   │   ├── AudioList.tsx      # 音频列表（过滤、排序、批量选择）
│   │   ├── AudioCard.tsx      # 音频卡片（播放、收藏、批量勾选）
│   │   ├── AudioPlayer.tsx    # 右侧固定宽度播放面板（256px）
│   │   ├── BatchToolbar.tsx            # 批量操作工具栏
│   │   ├── SettingsPage.tsx            # 设置页面
│   │   ├── CollectionPicker.tsx        # 收藏夹选择面板（收藏时弹出）
│   │   └── CreateCollectionDialog.tsx  # 新建收藏夹对话框
│   ├── store/
│   │   └── useStore.ts        # Zustand 全局状态
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts  # 全局键盘快捷键
│   ├── services/
│   │   └── AudioManager.ts    # 音频播放管理器（单例）
│   ├── types/
│   │   ├── index.ts           # 应用类型定义
│   │   └── electron.d.ts      # Electron API 类型声明
│   └── styles/
│       └── index.css          # TailwindCSS + 全局样式
├── scripts/
│   └── build-electron.mjs     # esbuild 构建脚本
├── electron-builder.yml       # Electron Builder 配置
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 架构设计

### 安全模型

- `contextIsolation: true` — 渲染进程与主进程完全隔离
- `nodeIntegration: false` — 渲染进程无法直接访问 Node API
- 所有文件操作通过 `ipcMain.handle` / `ipcRenderer.invoke` 通信
- Preload 脚本通过 `contextBridge.exposeInMainWorld` 暴露有限 API

### 数据流

```
用户操作 → React 组件 → Zustand Store → IPC (invoke) → Main Process → 文件系统
                                                                     → JSON 存储
```

### 模块职责

| 模块 | 职责 |
|------|------|
| `FileScanner` (main) | 递归扫描文件夹、筛选音频文件、`music-metadata` 并行读取时长 |
| `StorageService` (main) | 本地 JSON 文件读写（收藏、设置） |
| `AudioManager` (renderer) | HTML5 Audio API 封装，单例模式 |
| `useStore` (renderer) | Zustand 全局状态管理 |

### 状态管理

使用 Zustand 管理以下状态：

- `audioFiles[]` — 已导入的音频文件列表
- `categories[]` — 分类列表（每个导入文件夹对应一个分类）
- `userCollections[]` — 用户自定义收藏夹列表
- `collectionFiles` — 收藏夹→文件 ID 映射 (`Record<string, string[]>`)
- `player` — 播放器状态（当前文件、播放/暂停、进度、音量）
- `searchQuery` — 搜索关键词
- `activeView` — 当前视图（全部 / 收藏 / 分类 / 收藏夹 / 设置）
- `selectedFileIds` — 批量选中的文件 ID 集合
- `settings` — 应用设置（默认音量、主题）
- `isLoading` / `error` — 加载与错误状态

### 性能优化

- `AudioCard` 组件使用 `React.memo` 避免无关渲染
- `AudioList` 使用 `useMemo` 缓存过滤/排序结果
- 播放进度条使用 CSS 过渡而非高频重渲染
- 收藏状态通过 IPC 异步更新，不阻塞 UI

## 使用说明

1. **导入音效**：点击左侧「导入文件夹」按钮（蓝色），选择包含音频文件的文件夹，或直接拖拽文件夹到应用窗口。下方「新建收藏夹」按钮可创建自定义文件分类
2. **浏览音效**：在「全部音效」视图查看所有导入的音频；左侧分类列表可按文件夹分类浏览
3. **管理分类**：右键点击左侧分类可重命名或删除（不会影响磁盘上的文件）
4. **排序**：在文件列表顶部点击排序按钮（名称/大小/时长/格式），再次点击同一字段切换升降序
5. **搜索**：在顶部搜索栏输入关键词，按文件名或格式实时筛选
6. **播放**：点击音频卡片或在右侧播放面板控制播放/暂停/停止
7. **收藏到文件夹**：鼠标悬停音频卡片，点击五角星图标弹出收藏夹选择面板，选择目标文件夹或新建
8. **批量操作**：点击音频卡片左侧复选框进入批量模式，可全选、批量收藏、批量移除
9. **查看收藏**：点击左侧「我的收藏」查看所有已收藏音效
10. **音量调节**：右侧播放器面板底部拖动音量滑块，或点击喇叭图标一键静音
11. **设置**：点击左下角齿轮图标进入设置页面，调整默认音量、切换深色/浅色主题、查看快捷键表或清除所有数据
12. **键盘快捷键**：`Space` 播放/暂停、`Esc` 取消选择/停止播放、`Delete` 删除选中文件、`Ctrl+F` 聚焦搜索、`←→` 快进快退 5 秒、`↑↓` 音量增减 5%、`M` 静音切换

## 数据存储

所有数据存储在 `%APPDATA%/vfx-audio-manager/vfx-data.json` 中，格式为：

```json
{
  "favorites": ["C:\path\to\audio.mp3"],
  "categories": [
    { "id": "uuid", "name": "音效分类", "folderPath": "C:\path\to\folder" }
  ],
  "userCollections": [
    { "id": "uuid", "name": "战斗音效" }
  ],
  "collectionFiles": {
    "uuid": ["file-id-1", "file-id-2"]
  },
  "ignoredPaths": [],
  "importFolders": ["C:\path\to\folder"],
  "settings": {
    "defaultVolume": 0.8,
    "theme": "dark",
    "sortKey": "name",
    "sortAsc": true,
    "shortcuts": {
      "playPause": "Space",
      "deselect": "Escape",
      "delete": "Delete",
      "selectAll": "Ctrl+A",
      "focusSearch": "Ctrl+F",
      "seekBack": "ArrowLeft",
      "seekForward": "ArrowRight",
      "volumeUp": "ArrowUp",
      "volumeDown": "ArrowDown",
      "toggleMute": "KeyM"
    }
  }
}
```

## License

MIT
