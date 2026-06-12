# VFX Audio Manager

现代化桌面音效管理软件 — 为视频剪辑创作者与内容创作者打造。

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/electron-42-9feaf9)
![React](https://img.shields.io/badge/react-18-61dafb)
![TypeScript](https://img.shields.io/badge/typescript-5.6-3178c6)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## 🎯 简介

VFX Audio Manager 是一款面向视频剪辑师和内容创作者的音效管理桌面软件。它可以导入本地音频文件夹并自动建立分类，提供播放、搜索、收藏、批量操作等功能。界面参考专业音频软件设计，支持深色/浅色双主题。

**核心理念**：不修改磁盘上的任何文件，所有管理操作（重命名、删除、分类、收藏）仅在应用内部生效。

## ✨ 功能特性

### 导入与管理
- **文件夹导入**：系统对话框选择文件夹，自动递归扫描所有子目录
- **拖拽导入**：拖拽文件夹到应用窗口即可导入，自动识别目标文件夹路径
- **多格式支持**：MP3、WAV、FLAC、OGG、M4A、AAC、WMA、AIFF、OPUS、WEBM、MKA 共 11 种格式，每种有独立颜色标签
- **时长检测**：导入时并行解析音频文件时长，覆盖全部格式
- **会话恢复**：关闭后重新打开，自动恢复所有分类和文件列表
- **分类管理**：每个导入的文件夹为一个分类，支持重命名/删除（不影响磁盘）
- **多级目录树**：子目录以树形结构展示，每层可独立展开/折叠
- **软件内重命名**：右键重命名文件（仅应用内显示，不修改磁盘文件）
- **移除文件**：从列表中移除（仅应用内，不删除磁盘文件），持久化忽略

### 播放功能
- 播放/暂停/停止、续播不重头开始
- 可拖拽调整宽度的右侧播放面板
- 进度条拖动快进快退、等宽时间戳
- 音量和静音控制，静音后恢复之前音量
- 单例播放：同时只播一首

### 高级功能
- **播放队列**：右键添加到队列，曲目播完自动切换
- **三种循环模式**：关闭 / 单曲循环 / 全部循环
- **六档变速**：0.5x ~ 2.0x，方便快速浏览或慢速试听
- **睡眠定时**：15 / 30 / 60 分钟自动暂停
- **最近播放**：自动记录 20 首，含自动切换曲目

### 搜索与排序
- 实时搜索，按文件名和格式筛选
- 四种排序方式（名称/大小/时长/格式），升降序切换
- 排序偏好持久保存
- 收藏文件优先排列
- 重命名文件按自定义名称排序

### 收藏夹系统
- 星标按钮一键收藏/取消收藏
- 自定义收藏夹：创建、重命名、删除
- 文件可同时属于多个收藏夹

### 批量操作
- 多选文件，一键全选/取消全选
- 批量收藏、添加到收藏夹、从列表移除
- 实时显示选中数量

### 键盘快捷键
全部 11 个快捷键可在设置页自定义绑定：

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放 / 暂停 |
| `Escape` | 取消选择 / 停止播放 |
| `Delete` | 删除已选文件 |
| `Ctrl+A` | 全选当前列表 |
| `Ctrl+F` | 聚焦搜索框 |
| `Ctrl+Q` | 加入播放队列 |
| `←` `→` | 快退 / 快进 5 秒 |
| `↑` `↓` | 音量增减 5% |
| `M` | 静音 / 取消静音 |

### 界面设计
- 深色主题（默认）+ 浅色主题，CSS 变量驱动即时切换
- 可拖拽分隔条自由调整侧边栏和播放面板宽度，偏好持久保存
- 响应式音频卡片网格（1–5 列）
- 自定义细滚动条
- 空状态引导提示
- 拖拽导入蓝色虚线高亮，仅识别文件/文件夹拖拽
- 侧边栏页脚："Developed by Richard29"

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| Electron 42 | 桌面应用框架 |
| React 18 + TypeScript 5.6 | UI 框架 |
| Vite 5 | 渲染进程构建 |
| esbuild | Electron 主进程编译 |
| TailwindCSS 3 | CSS 框架 |
| Zustand 4 | 状态管理 |
| music-metadata 11 | 音频文件时长解析 |
| Electron Builder 25 | Windows EXE 打包 |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+
- Windows 10/11

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

这会同时启动 Vite 开发服务器 (localhost:5173) 和 Electron 窗口。

### 构建

```bash
npm run build
```

输出：
- `dist/renderer/` — React 前端（静态文件）
- `dist/electron/` — Electron 主进程

### 打包 EXE

```bash
npm run dist
```

等价于 `npm run build && npm run pack`。输出到 `release/` 目录，生成 NSIS 安装程序。

> 国内用户建议使用 npmmirror 镜像加速：
> ```bash
> ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
> ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
> npm run dist
> ```

## 📁 项目结构

```
VFX Audio Manager/
├── electron/                  # Electron 主进程
│   ├── main.ts                # 主进程入口（窗口管理、CSP）
│   ├── preload.ts             # 预加载脚本（IPC 桥接）
│   └── ipc/
│       ├── fileScanner.ts     # 文件扫描 + 时长检测 IPC
│       └── storage.ts         # 本地存储 IPC（JSON 读写）
├── src/                       # React 渲染进程
│   ├── App.tsx                # 根组件（布局、拖拽、事件同步）
│   ├── main.tsx               # React 入口
│   ├── index.html             # HTML 模板
│   ├── components/
│   │   ├── Sidebar.tsx        # 侧边栏（导入、导航、分类、目录树）
│   │   ├── SearchBar.tsx      # 搜索栏
│   │   ├── AudioList.tsx      # 音频列表（过滤、排序、批量）
│   │   ├── AudioCard.tsx      # 音频卡片（播放、收藏、右键菜单）
│   │   ├── AudioPlayer.tsx    # 播放面板（进度、音量、队列、变速）
│   │   ├── BatchToolbar.tsx   # 批量操作工具栏
│   │   ├── SettingsPage.tsx   # 设置页面（音量、主题、快捷键）
│   │   ├── CollectionPicker.tsx       # 收藏夹选择器
│   │   └── CreateCollectionDialog.tsx # 新建收藏夹对话框
│   ├── store/
│   │   └── useStore.ts        # Zustand 全局状态与所有操作
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts  # 键盘快捷键（可自定义）
│   ├── services/
│   │   └── AudioManager.ts    # Audio 播放管理器（单例）
│   ├── types/
│   │   ├── index.ts           # 全部类型定义
│   │   └── electron.d.ts      # Electron API 类型声明
│   └── styles/
│       └── index.css          # TailwindCSS + 全局样式 + 双主题变量
├── scripts/
│   └── build-electron.mjs     # esbuild 主进程构建脚本
├── electron-builder.yml       # Electron Builder 打包配置
├── CHANGELOG.md               # 版本更新日志
└── package.json
```

## 🔒 安全模型

- `contextIsolation: true` — 渲染进程与主进程完全隔离
- `nodeIntegration: false` — 渲染进程无法直接访问 Node API
- 所有系统操作通过 `ipcMain.handle` / `ipcRenderer.invoke` 通信
- Preload 脚本通过 `contextBridge.exposeInMainWorld` 暴露有限 API
- 生产和开发模式均配置 Content-Security-Policy

### 数据流

```
用户操作 → React 组件 → Zustand Store → IPC (invoke) → Main Process → 文件系统 / JSON 存储
```

## 💾 数据存储

所有数据存储在 `%APPDATA%/vfx-audio-manager/vfx-data.json`：

```json
{
  "categories": [
    { "id": "uuid", "name": "音效分类", "folderPath": "C:\\path\\to\\folder" }
  ],
  "userCollections": [
    { "id": "uuid", "name": "战斗音效" }
  ],
  "collectionFiles": {
    "uuid": ["file-id-1", "file-id-2"]
  },
  "favorites": ["C:\\path\\to\\audio.mp3"],
  "ignoredPaths": ["C:\\path\\to\\removed.mp3"],
  "settings": {
    "defaultVolume": 0.8,
    "theme": "dark",
    "sortKey": "name",
    "sortAsc": true,
    "shortcuts": { ... }
  }
}
```

## 📝 License

MIT — 作者 **Richard29**
