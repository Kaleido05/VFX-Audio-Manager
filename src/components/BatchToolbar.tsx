import { useStore } from '../store/useStore';
import {
  HiCheck,
  HiXMark,
  HiStar,
  HiTrash,
  HiSquares2X2,
  HiFolderPlus,
  HiBookmark,
} from 'react-icons/hi2';
import { useMemo, useState } from 'react';
import type { AudioFile, SortKey } from '../types';

function sortFiles(files: AudioFile[], key: SortKey, asc: boolean): AudioFile[] {
  return [...files].sort((a, b) => {
    let cmp: number;
    switch (key) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'size':
        cmp = a.size - b.size;
        break;
      case 'duration':
        cmp = a.duration - b.duration;
        break;
      case 'format':
        cmp = a.format.localeCompare(b.format);
        break;
      default:
        cmp = 0;
    }
    return asc ? cmp : -cmp;
  });
}

export default function BatchToolbar() {
  const {
    audioFiles,
    selectedFileIds,
    activeView,
    searchQuery,
    sortKey,
    sortAsc,
    userCollections,
    addToCollection,
    selectAllFiles,
    deselectAllFiles,
    batchToggleFavorite,
    batchDeleteFiles,
  } = useStore();

  const [showBatchCollectionPicker, setShowBatchCollectionPicker] = useState(false);

  // Filter visible files (same logic as AudioList to match what user sees)
  const visibleFiles = useMemo(() => {
    let files = audioFiles;
    if (activeView.type === 'favorites') {
      files = files.filter((f) => f.isFavorite);
    } else if (activeView.type === 'category') {
      files = files.filter((f) => f.categoryId === activeView.categoryId);
    } else if (activeView.type === 'collection') {
      files = files.filter((f) => f.collectionIds.includes(activeView.collectionId));
    } else if (activeView.type === 'subdirectory') {
      files = files.filter(
        (f) => f.categoryId === activeView.categoryId && f.subPath === activeView.subPath
      );
    } else if (activeView.type === 'recentlyPlayed') {
      files = []; // handled separately
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      files = files.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.format.toLowerCase().includes(q)
      );
    }
    const favoritesFirst = [...files].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return 0;
    });
    return sortFiles(favoritesFirst, sortKey, sortAsc);
  }, [audioFiles, activeView, searchQuery, sortKey, sortAsc]);

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

      {/* Batch add to collection */}
      {userCollections.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowBatchCollectionPicker(!showBatchCollectionPicker)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-surface-400 transition-all hover:bg-surface-700 hover:text-primary"
          >
            <HiFolderPlus className="h-3.5 w-3.5" />
            添加到收藏夹
          </button>
          {showBatchCollectionPicker && (
            <>
              <div
                className="fixed inset-0 z-50"
                onClick={(e) => { e.stopPropagation(); setShowBatchCollectionPicker(false); }}
              />
              <div className="absolute bottom-full left-0 z-50 mb-1 w-44 rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl">
                {userCollections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      selectedFileIds.forEach((id) => addToCollection(id, col.id));
                      setShowBatchCollectionPicker(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
                  >
                    <HiBookmark className="h-3 w-3 text-amber-400" />
                    <span className="truncate">{col.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

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
