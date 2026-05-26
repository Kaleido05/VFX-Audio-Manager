import { useStore } from '../store/useStore';
import {
  HiCheck,
  HiXMark,
  HiStar,
  HiTrash,
  HiSquares2X2,
} from 'react-icons/hi2';
import { useMemo } from 'react';

export default function BatchToolbar() {
  const {
    audioFiles,
    selectedFileIds,
    activeView,
    searchQuery,
    selectAllFiles,
    deselectAllFiles,
    batchToggleFavorite,
    batchDeleteFiles,
  } = useStore();

  // Filter visible files (same logic as AudioList to match what user sees)
  const visibleFiles = useMemo(() => {
    let files = audioFiles;
    if (activeView.type === 'favorites') {
      files = files.filter((f) => f.isFavorite);
    } else if (activeView.type === 'category') {
      files = files.filter((f) => f.categoryId === activeView.categoryId);
    } else if (activeView.type === 'collection') {
      files = files.filter((f) => f.collectionIds.includes(activeView.collectionId));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      files = files.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.format.toLowerCase().includes(q)
      );
    }
    return files.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [audioFiles, activeView, searchQuery]);

  const visibleIds = useMemo(
    () => new Set(visibleFiles.map((f) => f.id)),
    [visibleFiles]
  );

  const selectedInView = useMemo(
    () => visibleFiles.filter((f) => selectedFileIds.has(f.id)),
    [visibleFiles, selectedFileIds]
  );

  const allSelected = selectedInView.length === visibleFiles.length && visibleFiles.length > 0;
  const allFavoritesInSelection =
    selectedInView.length > 0 &&
    selectedInView.every((f) => f.isFavorite);

  const handleToggleAll = () => {
    if (allSelected) {
      // Deselect only visible files
      const next = new Set(selectedFileIds);
      visibleIds.forEach((id) => next.delete(id));
      deselectAllFiles();
      // Restore non-visible selections
      selectedFileIds.forEach((id) => {
        if (!visibleIds.has(id)) next.add(id);
      });
      useStore.setState({ selectedFileIds: next });
    } else {
      const next = new Set(selectedFileIds);
      visibleIds.forEach((id) => next.add(id));
      selectAllFiles([...next]);
    }
  };

  return (
    <div className="flex items-center gap-2 border-b border-surface-700 bg-surface-800/80 px-4 py-2">
      {/* Selection count */}
      <span className="text-sm text-surface-300">
        已选择{' '}
        <span className="font-medium text-primary">{selectedFileIds.size}</span>{' '}
        个文件
      </span>

      {/* Select all / Deselect all */}
      <button
        onClick={handleToggleAll}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-surface-400 transition-all hover:bg-surface-700 hover:text-primary"
      >
        <HiSquares2X2 className="h-3.5 w-3.5" />
        {allSelected ? '取消全选' : '全选'}
      </button>

      <div className="mx-1 h-5 w-px bg-surface-600" />

      {/* Batch favorite / unfavorite */}
      <button
        onClick={() => batchToggleFavorite(!allFavoritesInSelection)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all hover:bg-surface-700"
        style={{ color: allFavoritesInSelection ? '#f59e0b' : '#8996a9' }}
      >
        <HiStar className="h-3.5 w-3.5" />
        {allFavoritesInSelection ? '取消收藏' : '收藏'}
      </button>

      {/* Batch delete */}
      <button
        onClick={() => {
          if (
            window.confirm(
              `确定要删除已选中的 ${selectedFileIds.size} 个文件吗？（不会删除磁盘上的原始文件）`
            )
          ) {
            batchDeleteFiles();
          }
        }}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
      >
        <HiTrash className="h-3.5 w-3.5" />
        删除
      </button>

      <div className="flex-1" />

      {/* Cancel batch mode */}
      <button
        onClick={deselectAllFiles}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-surface-400 transition-all hover:bg-surface-700 hover:text-primary"
      >
        <HiXMark className="h-3.5 w-3.5" />
        取消
      </button>
    </div>
  );
}
