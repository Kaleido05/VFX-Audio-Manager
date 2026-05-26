import { useState } from 'react';
import { HiXMark, HiFolderPlus } from 'react-icons/hi2';

interface CreateCollectionDialogProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function CreateCollectionDialog({
  onConfirm,
  onCancel,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState('');

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onConfirm(trimmed);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onCancel}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-surface-600 bg-surface-800 p-5 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-600/20">
            <HiFolderPlus className="h-5 w-5 text-accent-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary">新建收藏夹</h3>
            <p className="text-[11px] text-surface-400">创建一个自定义分类文件夹</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto rounded-lg p-1.5 text-surface-500 hover:bg-surface-700 hover:text-primary"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="输入收藏夹名称..."
          className="mb-4 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2 text-sm text-primary placeholder-surface-500 outline-none transition-all focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
          autoFocus
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-xs text-surface-400 transition-all hover:bg-surface-700 hover:text-primary"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-accent-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            创建
          </button>
        </div>
      </div>
    </>
  );
}
