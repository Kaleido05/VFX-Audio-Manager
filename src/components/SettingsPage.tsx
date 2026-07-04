import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { HiSpeakerWave, HiMoon, HiSun, HiTrash, HiArrowLeft, HiCommandLine, HiPencil, HiSquares2X2, HiFire, HiGlobeAlt } from 'react-icons/hi2';
import { DEFAULT_SHORTCUTS } from '../types';
import type { ShortcutConfig, AppSettings } from '../types';
import { shortcutEventToString } from '../hooks/useKeyboardShortcuts';
import { shortcutToChinese } from '../hooks/useKeyboardShortcuts';

type ShortcutAction = keyof ShortcutConfig;

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
  queueNext: '加入播放队列',
};

const ALL_SHORTCUT_ACTIONS = Object.keys(SHORTCUT_LABELS) as ShortcutAction[];

function KeyBindButton({
  action,
  currentKey,
  onChange,
}: {
  action: ShortcutAction;
  currentKey: string;
  onChange: (action: ShortcutAction, key: string) => void;
}) {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const keyStr = shortcutEventToString(e as unknown as KeyboardEvent);
      onChange(action, keyStr);
      setRecording(false);
    },
    [action, onChange]
  );

  if (recording) {
    return (
      <button
        className="flex items-center gap-1 rounded border border-accent-500 bg-accent-600/20 px-2 py-0.5 font-mono text-[11px] text-accent-400 animate-pulse"
        onKeyDown={handleKeyDown}
        autoFocus
        onBlur={() => setRecording(false)}
      >
        按下快捷键...
      </button>
    );
  }

  return (
    <button
      onClick={() => setRecording(true)}
      className="flex items-center gap-1 rounded border border-surface-600 bg-surface-700 px-2 py-0.5 font-mono text-[11px] text-surface-300 transition-all hover:border-accent-500 hover:text-primary"
      title="点击修改快捷键"
    >
      {shortcutToChinese(currentKey)}
      <HiPencil className="h-2.5 w-2.5 text-surface-500" />
    </button>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, resetAllData, setActiveView } = useStore();

  const handleResetAll = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      resetAllData();
    }
  };

  const handleShortcutChange = useCallback(
    (action: ShortcutAction, key: string) => {
      const next = { ...settings.shortcuts, [action]: key };
      updateSettings({ shortcuts: next } as Partial<AppSettings>);
    },
    [settings.shortcuts, updateSettings]
  );

  const handleResetShortcuts = () => {
    updateSettings({ shortcuts: { ...DEFAULT_SHORTCUTS } } as Partial<AppSettings>);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView({ type: 'all' })}
            className="rounded-lg p-1.5 text-surface-400 transition-all hover:bg-surface-800 hover:text-primary"
          >
            <HiArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-primary">设置</h2>
        </div>

        {/* Default Volume */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <HiSpeakerWave className="h-5 w-5 text-accent-500" />
            <h3 className="text-sm font-medium text-primary">默认音量</h3>
          </div>
          <p className="mb-3 text-xs text-surface-400">
            设置每次打开应用时的默认音量
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.defaultVolume}
              onChange={(e) =>
                updateSettings({ defaultVolume: parseFloat(e.target.value) })
              }
              className="flex-1"
            />
            <span className="w-10 text-right text-sm tabular-nums text-surface-300">
              {Math.round(settings.defaultVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <HiMoon className="h-5 w-5 text-accent-500" />
            <h3 className="text-sm font-medium text-primary">主题</h3>
          </div>
          <p className="mb-3 text-xs text-surface-400">选择你喜欢的界面风格</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'dark' as const, label: '深色', icon: HiMoon },
              { key: 'light' as const, label: '浅色', icon: HiSun },
              { key: 'warm' as const, label: '暖色', icon: HiFire },
              { key: 'forest' as const, label: '森林', icon: HiGlobeAlt },
              { key: 'ocean' as const, label: '海洋', icon: HiGlobeAlt },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => updateSettings({ theme: key })}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2.5 text-xs transition-all ${
                  settings.theme === key
                    ? 'bg-accent-600 text-white'
                    : 'bg-surface-700 text-surface-400 hover:bg-surface-600 hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reset Layout */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <HiSquares2X2 className="h-5 w-5 text-accent-500" />
            <h3 className="text-sm font-medium text-primary">界面布局</h3>
          </div>
          <p className="mb-3 text-xs text-surface-400">
            将侧边栏和播放面板的宽度恢复为默认值（侧边栏 240px，播放面板 256px）
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('vfx-sidebar-width');
              localStorage.removeItem('vfx-player-width');
              window.dispatchEvent(new CustomEvent('vfx-reset-layout'));
            }}
            className="rounded-lg border border-surface-600 px-4 py-2 text-xs text-surface-300 transition-all hover:bg-surface-700 hover:text-primary"
          >
            恢复默认布局
          </button>
        </div>

        {/* Customizable Keyboard Shortcuts */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <HiCommandLine className="h-5 w-5 text-accent-500" />
            <h3 className="text-sm font-medium text-primary">快捷键</h3>
          </div>
          <p className="mb-3 text-xs text-surface-400">
            点击快捷键按钮即可自定义绑定
          </p>
          <div className="space-y-1">
            {ALL_SHORTCUT_ACTIONS.map((action) => (
              <div
                key={action}
                className="flex items-center justify-between rounded-lg px-3 py-1.5 hover:bg-surface-700/50"
              >
                <span className="text-xs text-surface-400">
                  {SHORTCUT_LABELS[action]}
                </span>
                <KeyBindButton
                  action={action}
                  currentKey={settings.shortcuts[action]}
                  onChange={handleShortcutChange}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleResetShortcuts}
            className="mt-3 rounded-lg px-3 py-1 text-[11px] text-surface-500 transition-all hover:text-surface-300"
          >
            恢复默认快捷键
          </button>
        </div>

        {/* Data Management */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <HiTrash className="h-5 w-5 text-red-400" />
            <h3 className="text-sm font-medium text-primary">数据管理</h3>
          </div>
          <p className="mb-3 text-xs text-surface-400">
            清除所有已导入的音效文件、分类、收藏和设置数据
          </p>
          <button
            onClick={handleResetAll}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/10"
          >
            清除所有数据
          </button>
        </div>

        {/* About / Author */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/50 p-5">
          <h3 className="mb-4 text-sm font-medium text-primary">关于作者</h3>
          <div className="flex items-center gap-4">
            <img
              src="./image/head.png"
              alt="作者头像"
              className="h-16 w-16 rounded-full border-2 border-surface-600 object-cover"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium text-primary">Richard29</p>
              <p className="text-xs text-surface-400">
                邮箱：gcfic05@163.com
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.electronAPI.openExternal('https://v.douyin.com/s1yjo7ZGo_o/')}
                  className="text-xs text-surface-400 hover:text-accent-400 transition-colors"
                >
                  抖音
                </button>
                <button
                  onClick={() => window.electronAPI.openExternal('https://b23.tv/9byXWeS')}
                  className="text-xs text-surface-400 hover:text-accent-400 transition-colors"
                >
                  B站
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
