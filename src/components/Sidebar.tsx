import { useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  HiFolderOpen,
  HiMusicalNote,
  HiStar,
  HiPlay,
  HiCog6Tooth,
  HiPencil,
  HiTrash,
  HiCheck,
  HiXMark,
  HiFolder,
  HiFolderPlus,
  HiBookmark,
} from 'react-icons/hi2';
import CreateCollectionDialog from './CreateCollectionDialog';

export default function Sidebar() {
  const {
    categories,
    userCollections,
    collectionFiles,
    activeView,
    importFolder,
    setActiveView,
    renameCategory,
    removeCategory,
    createUserCollection,
    deleteUserCollection,
    renameUserCollection,
    isLoading,
  } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);

  const handleImport = useCallback(async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder();
      if (folderPath) {
        await importFolder(folderPath);
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  }, [importFolder]);

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setContextMenuId(null);
  };

  const confirmRename = async () => {
    if (editingId) {
      const trimmed = editName.trim();
      if (trimmed) {
        await renameCategory(editingId, trimmed);
      }
      setEditingId(null);
    }
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const handleDeleteCategory = async (id: string) => {
    setContextMenuId(null);
    if (window.confirm('确定要删除该分类吗？分类下的所有文件将从列表中移除。')) {
      await removeCategory(id);
    }
  };

  const startCollEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setContextMenuId(null);
  };

  const confirmCollRename = async () => {
    if (editingId) {
      const trimmed = editName.trim();
      if (trimmed) {
        await renameUserCollection(editingId, trimmed);
      }
      setEditingId(null);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    setContextMenuId(null);
    if (window.confirm('确定要删除该收藏夹吗？')) {
      await deleteUserCollection(id);
    }
  };

  const isActive = (view: typeof activeView) => {
    if (view.type === 'all' && activeView.type === 'all') return true;
    if (view.type === 'favorites' && activeView.type === 'favorites') return true;
    if (
      view.type === 'category' &&
      activeView.type === 'category' &&
      view.categoryId === activeView.categoryId
    )
      return true;
    if (
      view.type === 'collection' &&
      activeView.type === 'collection' &&
      view.collectionId === activeView.collectionId
    )
      return true;
    if (view.type === 'settings' && activeView.type === 'settings') return true;
    return false;
  };

  return (
    <aside className="flex w-60 flex-col border-r border-surface-700 bg-surface-900">
      {/* App logo / title */}
      <div className="flex items-center gap-3 border-b border-surface-700 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600">
          <HiPlay className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-primary">VFX</h1>
          <p className="text-[11px] text-surface-400">Audio Manager</p>
        </div>
      </div>

      {/* Import button */}
      <div className="px-4 py-4">
        <button
          onClick={handleImport}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiFolderOpen className="h-4 w-4" />
          {isLoading ? '导入中...' : '导入文件夹'}
        </button>
      </div>

      {/* Create collection button */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowCreateCollection(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-700 active:scale-[0.98]"
        >
          <HiFolderPlus className="h-4 w-4" />
          新建收藏夹
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
          浏览
        </p>

        {/* All Audio */}
        <button
          onClick={() => setActiveView({ type: 'all' })}
          className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
            isActive({ type: 'all' })
              ? 'bg-surface-700 text-primary'
              : 'text-surface-400 hover:bg-surface-800 hover:text-primary'
          }`}
        >
          <HiMusicalNote className="h-4 w-4 shrink-0" />
          全部音效
        </button>

        {/* Favorites */}
        <button
          onClick={() => setActiveView({ type: 'favorites' })}
          className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
            isActive({ type: 'favorites' })
              ? 'bg-surface-700 text-primary'
              : 'text-surface-400 hover:bg-surface-800 hover:text-primary'
          }`}
        >
          <HiStar className="h-4 w-4 shrink-0" />
          我的收藏
        </button>

        {/* Categories section */}
        {categories.length > 0 && (
          <>
            <p className="mb-2 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
              分类
            </p>

            {categories.map((cat) => (
              <div key={cat.id} className="relative">
                {editingId === cat.id ? (
                  <div className="mb-0.5 flex items-center gap-2 rounded-lg bg-surface-700 px-3 py-1.5">
                    <HiFolder className="h-4 w-4 shrink-0 text-accent-500" />
                    <input
                      className="min-w-0 flex-1 rounded border border-accent-600 bg-surface-800 px-1.5 py-0.5 text-sm text-primary outline-none"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      autoFocus
                      onBlur={confirmRename}
                    />
                    <button
                      onClick={confirmRename}
                      className="shrink-0 rounded p-0.5 text-surface-400 hover:text-primary"
                    >
                      <HiCheck className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="shrink-0 rounded p-0.5 text-surface-400 hover:text-primary"
                    >
                      <HiXMark className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveView({ type: 'category', categoryId: cat.id })}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuId(contextMenuId === cat.id ? null : cat.id);
                    }}
                    className={`group/cat mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActive({ type: 'category', categoryId: cat.id })
                        ? 'bg-surface-700 text-primary'
                        : 'text-surface-400 hover:bg-surface-800 hover:text-primary'
                    }`}
                  >
                    <HiFolder className="h-4 w-4 shrink-0" />
                    <span className="truncate text-left">{cat.name}</span>

                    {/* Context menu trigger */}
                    <div className="ml-auto flex shrink-0 opacity-0 group-hover/cat:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuId(contextMenuId === cat.id ? null : cat.id);
                        }}
                        className="rounded p-0.5 text-surface-500 hover:text-primary"
                      >
                        <HiPencil className="h-3 w-3" />
                      </button>
                    </div>
                  </button>
                )}

                {/* Context menu popup */}
                {contextMenuId === cat.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setContextMenuId(null)}
                    />
                    <div className="absolute left-16 top-full z-20 mt-1 w-32 rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl">
                      <button
                        onClick={() => startRename(cat.id, cat.name)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
                      >
                        <HiPencil className="h-3 w-3" />
                        重命名
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-surface-700 hover:text-red-300"
                      >
                        <HiTrash className="h-3 w-3" />
                        删除分类
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}
        {/* User Collections section */}
        {userCollections.length > 0 && (
          <>
            <p className="mb-2 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
              我的收藏夹
            </p>

            {userCollections.map((col) => (
              <div key={col.id} className="relative">
                {editingId === col.id ? (
                  <div className="mb-0.5 flex items-center gap-2 rounded-lg bg-surface-700 px-3 py-1.5">
                    <HiBookmark className="h-4 w-4 shrink-0 text-amber-400" />
                    <input
                      className="min-w-0 flex-1 rounded border border-accent-600 bg-surface-800 px-1.5 py-0.5 text-sm text-primary outline-none"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmCollRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      autoFocus
                      onBlur={confirmCollRename}
                    />
                    <button
                      onClick={confirmCollRename}
                      className="shrink-0 rounded p-0.5 text-surface-400 hover:text-primary"
                    >
                      <HiCheck className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="shrink-0 rounded p-0.5 text-surface-400 hover:text-primary"
                    >
                      <HiXMark className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveView({ type: 'collection', collectionId: col.id })}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuId(contextMenuId === col.id ? null : col.id);
                    }}
                    className={`group/col mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActive({ type: 'collection', collectionId: col.id })
                        ? 'bg-surface-700 text-primary'
                        : 'text-surface-400 hover:bg-surface-800 hover:text-primary'
                    }`}
                  >
                    <HiBookmark className="h-4 w-4 shrink-0 text-amber-400" />
                    <span className="truncate text-left">{col.name}</span>

                    <div className="ml-auto flex shrink-0 opacity-0 group-hover/col:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuId(contextMenuId === col.id ? null : col.id);
                        }}
                        className="rounded p-0.5 text-surface-500 hover:text-primary"
                      >
                        <HiPencil className="h-3 w-3" />
                      </button>
                    </div>
                  </button>
                )}

                {/* Context menu popup */}
                {contextMenuId === col.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setContextMenuId(null)}
                    />
                    <div className="absolute left-16 top-full z-20 mt-1 w-32 rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl">
                      <button
                        onClick={() => startCollEdit(col.id, col.name)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-primary"
                      >
                        <HiPencil className="h-3 w-3" />
                        重命名
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(col.id)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-surface-700 hover:text-red-300"
                      >
                        <HiTrash className="h-3 w-3" />
                        删除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

      </nav>

      {/* Settings button */}
      <div className="border-t border-surface-700 px-3 py-2">
        <button
          onClick={() => setActiveView({ type: 'settings' })}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
            isActive({ type: 'settings' })
              ? 'bg-surface-700 text-primary'
              : 'text-surface-400 hover:bg-surface-800 hover:text-primary'
          }`}
        >
          <HiCog6Tooth className="h-4 w-4" />
          设置
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-surface-700 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <HiCog6Tooth className="h-3.5 w-3.5" />
          <span>
            {categories.length} 个分类 · {userCollections.length} 个收藏夹
          </span>
        </div>
        <div className="mt-1.5 text-[10px] text-surface-600">
          Developed by Richard29
        </div>
      </div>
      {showCreateCollection && (
        <CreateCollectionDialog
          onConfirm={(name) => {
            createUserCollection(name);
            setShowCreateCollection(false);
          }}
          onCancel={() => setShowCreateCollection(false)}
        />
      )}
    </aside>
  );
}
