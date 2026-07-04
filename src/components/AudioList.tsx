import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import AudioCard from './AudioCard';
import { HiSquares2X2, HiArrowsUpDown } from 'react-icons/hi2';
import { SORT_LABELS } from '../types';
import type { AudioFile, SortKey } from '../types';

const SORT_KEYS: SortKey[] = ['name', 'size', 'duration', 'format'];

function sortFiles(files: AudioFile[], key: SortKey, asc: boolean): AudioFile[] {
  return [...files].sort((a, b) => {
    let cmp: number;
    switch (key) {
      case 'name':
        cmp = (a.customName || a.name).localeCompare(b.customName || b.name);
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

export default function AudioList() {
  const { audioFiles, searchQuery, activeView, selectedFileIds, recentlyPlayedIds, sortKey, sortAsc, selectAllFiles, setSort } = useStore();
  const isBatchMode = selectedFileIds.size > 0;

  const filteredFiles = useMemo(() => {
    let files: AudioFile[] = audioFiles;

    if (activeView.type === 'favorites') {
      files = files.filter((f) => f.isFavorite);
    } else if (activeView.type === 'recentlyPlayed') {
      const idSet = new Set(recentlyPlayedIds);
      files = files.filter((f) => idSet.has(f.id));
      files.sort((a, b) => {
        const ia = recentlyPlayedIds.indexOf(a.id);
        const ib = recentlyPlayedIds.indexOf(b.id);
        return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
      });
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        files = files.filter(
          (f) =>
            f.name.toLowerCase().includes(query) ||
            f.format.toLowerCase().includes(query)
        );
      }
      return files;
    } else if (activeView.type === 'category') {
      files = files.filter((f) => f.categoryId === activeView.categoryId);
    } else if (activeView.type === 'collection') {
      files = files.filter((f) => f.collectionIds.includes(activeView.collectionId));
    } else if (activeView.type === 'subdirectory') {
      files = files.filter(
        (f) => f.categoryId === activeView.categoryId && f.subPath === activeView.subPath
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      files = files.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.format.toLowerCase().includes(query)
      );
    }

    const favoritesFirst = [...files].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return 0;
    });
    return sortFiles(favoritesFirst, sortKey, sortAsc);
  }, [audioFiles, searchQuery, activeView, sortKey, sortAsc, recentlyPlayedIds]);

  const allVisibleSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((f) => selectedFileIds.has(f.id));

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredFiles.map((f) => f.id));
      const remaining = [...selectedFileIds].filter((id) => !visibleIds.has(id));
      useStore.setState({ selectedFileIds: new Set(remaining) });
    } else {
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
            <svg className="h-8 w-8 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-surface-400">还没有导入音效文件</p>
            <p className="mt-1 text-xs text-surface-500">点击左侧「导入文件夹」按钮开始</p>
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
            {activeView.type === 'favorites' ? '还没有收藏任何音效'
              : activeView.type === 'recentlyPlayed' ? '还没有播放记录'
              : activeView.type === 'category' ? '该分类下没有匹配的文件'
              : activeView.type === 'collection' ? '该收藏夹下还没有音效'
              : activeView.type === 'subdirectory' ? '该子目录下没有匹配的文件'
              : `没有匹配 "${searchQuery}" 的结果`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {isBatchMode && (
        <div className="flex items-center gap-2 border-b border-surface-700 px-4 py-2">
          <button onClick={handleToggleSelectAllVisible} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-surface-400 transition-all hover:bg-surface-700 hover:text-primary">
            <HiSquares2X2 className="h-3.5 w-3.5" />
            {allVisibleSelected ? '取消全选' : '选择当前列表'}
          </button>
          <span className="text-xs text-surface-500">已选中 {selectedFileIds.size} 个</span>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-surface-700 px-4 py-1.5">
        <HiArrowsUpDown className="h-3.5 w-3.5 text-surface-500" />
        <div className="flex items-center gap-1">
          {SORT_KEYS.map((key) => (
            <button key={key} onClick={() => setSort(key, sortKey === key ? !sortAsc : true)} className={`rounded px-2 py-0.5 text-xs transition-all ${sortKey === key ? 'bg-accent-600/20 text-accent-400' : 'text-surface-400 hover:bg-surface-700 hover:text-primary'}`}>
              {SORT_LABELS[key]}{sortKey === key && (sortAsc ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-surface-500">{filteredFiles.length} 个文件</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredFiles.map((file) => (
            <AudioCard key={file.id} file={file} />
          ))}
        </div>
      </div>
    </div>
  );
}
