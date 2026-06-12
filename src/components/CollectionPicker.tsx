import { useState } from 'react';
import { useStore } from '../store/useStore';
import { HiXMark, HiFolderPlus, HiFolder, HiCheck } from 'react-icons/hi2';
import CreateCollectionDialog from './CreateCollectionDialog';

interface CollectionPickerProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
}

export default function CollectionPicker({
  fileId,
  fileName,
  onClose,
}: CollectionPickerProps) {
  const { userCollections, collectionFiles, addToCollection, removeFromCollection, createUserCollection } = useStore();
  const [showCreate, setShowCreate] = useState(false);

  const handleToggle = (collectionId: string) => {
    const fileIds = collectionFiles[collectionId] || [];
    if (fileIds.includes(fileId)) {
      removeFromCollection(fileId, collectionId);
    } else {
      addToCollection(fileId, collectionId);
    }
  };

  const handleCreate = async (name: string) => {
    await createUserCollection(name);
    setShowCreate(false);
  };

  const displayName =
    fileName.length > 30
      ? fileName.substring(0, 30) + '...'
      : fileName;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />
      {/* stopPropagation prevents clicks from bubbling to AudioCard's onClick */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-surface-600 bg-surface-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-surface-700 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-primary">
              收藏到...
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-surface-400">
              {displayName}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="shrink-0 rounded-lg p-1.5 text-surface-500 hover:bg-surface-700 hover:text-primary"
          >
            <HiXMark className="h-4 w-4" />
          </button>
        </div>

        {/* Collection list */}
        <div className="max-h-56 overflow-y-auto px-2 py-2">
          {userCollections.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-surface-500">
              还没有收藏夹，请先创建一个
            </p>
          ) : (
            userCollections.map((col) => {
              const fileIds = collectionFiles[col.id] || [];
              const checked = fileIds.includes(fileId);
              return (
                <button
                  key={col.id}
                  onClick={() => handleToggle(col.id)}
                  className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                    checked
                      ? 'bg-accent-600/10 text-accent-400'
                      : 'text-surface-400 hover:bg-surface-700/50 hover:text-primary'
                  }`}
                >
                  <HiFolder
                    className={`h-4 w-4 shrink-0 ${
                      checked ? 'text-accent-500' : 'text-surface-500'
                    }`}
                  />
                  <span className="flex-1 truncate text-sm">{col.name}</span>
                  <span className="text-[11px] text-surface-500">
                    {fileIds.length}
                  </span>
                  {checked && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-600">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-surface-700 px-4 py-3 flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-surface-600 px-4 py-2 text-xs text-surface-400 transition-all hover:border-accent-600 hover:text-accent-500"
          >
            <HiFolderPlus className="h-4 w-4" />
            新建收藏夹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-accent-500"
          >
            <HiCheck className="h-4 w-4" />
            完成
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateCollectionDialog
          onConfirm={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </>
  );
}
