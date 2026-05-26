import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import AudioCard from './AudioCard';
import { HiSquares2X2 } from 'react-icons/hi2';
import type { AudioFile } from '../types';

export default function AudioList() {
  const { audioFiles, searchQuery, activeView, selectedFileIds, selectAllFiles } = useStore();
  const isBatchMode = selectedFileIds.size > 0;

  const filteredFiles = useMemo(() => {
    let files: AudioFile[] = audioFiles;

    // Filter by view
    if (activeView.type === 'favorites') {
      files = files.filter((f) => f.isFavorite);
    } else if (activeView.type === 'category') {
      files = files.filter((f) => f.categoryId === activeView.categoryId);
    } else if (activeView.type === 'collection') {
      files = files.filter((f) => f.collectionIds.includes(activeView.collectionId));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      files = files.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.format.toLowerCase().includes(query)
      );
    }

    // Sort by favorite first, then by name
    return [...files].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [audioFiles, searchQuery, activeView]);

  const allVisibleSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((f) => selectedFileIds.has(f.id));

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      // Deselect visible files
      const visibleIds = new Set(filteredFiles.map((f) => f.id));
      const remaining = [...selectedFileIds].filter((id) => !visibleIds.has(id));
      useStore.setState({ selectedFileIds: new Set(remaining) });
    } else {
      // Select all visible files
      const combined = new Set(selectedFileIds);
      filteredFiles.forEach((f) => combined.add(f.id));
      selectAllFiles([...combined]);
    }
  };

  if (audioFiles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-800">
            <svg
              className="h-8 w-8 text-surface-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-surface-400">
              还没有导入音效文件
            </p>
            <p className="mt-1 text-xs text-surface-500">
              点击左侧「导入文件夹」按钮开始
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-surface-400">
            {activeView.type === 'favorites'
              ? '还没有收藏任何音效'
              : activeView.type === 'category'
                ? '该分类下没有匹配的文件'
                : activeView.type === 'collection'
                  ? '该收藏夹下还没有音效'
                  : `没有匹配 "${searchQuery}" 的结果`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Select all bar for batch mode */}
      {isBatchMode && (
        <div className="flex items-center gap-2 border-b border-surface-700 px-4 py-2">
          <button
            onClick={handleToggleSelectAllVisible}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-surface-400 transition-all hover:bg-surface-700 hover:text-primary"
          >
            <HiSquares2X2 className="h-3.5 w-3.5" />
            {allVisibleSelected ? '取消全选' : '选择当前列表'}
          </button>
          <span className="text-xs text-surface-500">
            已选中 {selectedFileIds.size} 个
          </span>
        </div>
      )}

      {/* File grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredFiles.map((file) => (
            <AudioCard key={file.id} file={file} />
          ))}
        </div>
      </div>
    </div>
  );
}
