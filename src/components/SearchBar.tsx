import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, audioFiles } = useStore();

  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  return (
    <div className="flex items-center gap-3 border-b border-surface-700 bg-surface-900/50 px-6 py-3">
      <div className="relative flex-1">
        <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索音效名称..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-10 pr-8 text-sm text-primary placeholder-surface-500 outline-none transition-all focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-primary transition-colors"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="text-xs text-surface-500 whitespace-nowrap">
        {audioFiles.length} 个文件
      </div>
    </div>
  );
}
