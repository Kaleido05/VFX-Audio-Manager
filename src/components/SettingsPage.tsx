import { useStore } from '../store/useStore';
import { HiSpeakerWave, HiMoon, HiSun, HiTrash, HiArrowLeft, HiCommandLine } from 'react-icons/hi2';

export default function SettingsPage() {
  const { settings, updateSettings, resetAllData, setActiveView } = useStore();

  const handleResetAll = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      resetAllData();
    }
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
            {settings.theme === 'dark' ? (
              <HiMoon className="h-5 w-5 text-accent-500" />
            ) : (
              <HiSun className="h-5 w-5 text-amber-400" />
            )}
            <h3 className="text-sm font-medium text-primary">主题</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary">
                {settings.theme === 'dark' ? '深色主题' : '浅色主题'}
              </p>
              <p className="text-xs text-surface-400">选择你喜欢的界面风格</p>
            </div>
            <button
              onClick={() =>
                updateSettings({
                  theme: settings.theme === 'dark' ? 'light' : 'dark',
                })
              }
              className="flex items-center gap-2 rounded-lg bg-surface-700 px-3 py-1.5 text-xs text-primary transition-all hover:bg-surface-600 active:scale-95"
            >
              {settings.theme === 'dark' ? (
                <>
                  <HiSun className="h-3.5 w-3.5 text-amber-400" />
                  切换浅色
                </>
              ) : (
                <>
                  <HiMoon className="h-3.5 w-3.5 text-accent-400" />
                  切换深色
                </>
              )}
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <HiCommandLine className="h-5 w-5 text-accent-500" />
            <h3 className="text-sm font-medium text-primary">快捷键</h3>
          </div>
          <div className="space-y-2 text-xs">
            {[
              ['Space', '播放 / 暂停'],
              ['Escape', '取消选择 / 停止播放'],
              ['Delete', '删除已选中的文件'],
              ['Ctrl + A', '全选当前列表'],
              ['Ctrl + F', '聚焦搜索框'],
              ['← →', '快退 / 快进 5 秒'],
              ['↑ ↓', '音量增大 / 减小 5%'],
              ['M', '静音 / 取消静音'],
            ].map(([key, desc]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg px-3 py-1.5 hover:bg-surface-700/50"
              >
                <span className="text-surface-400">{desc}</span>
                <kbd className="rounded border border-surface-600 bg-surface-700 px-2 py-0.5 font-mono text-[11px] text-surface-300">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
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
      </div>
    </div>
  );
}
