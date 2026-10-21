import React from 'react';
import { Recitation, RepeatMode } from '../types';
import { X, Play, Trash2, ListMusic, Repeat, Shuffle, ArrowUp, ArrowDown } from 'lucide-react';

interface PlaylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Recitation[];
  currentRecitation: Recitation | null;
  isPlaying: boolean;
  onPlayRecitation: (recitation: Recitation) => void;
  onRemoveFromPlaylist: (id: string) => void;
  onClearPlaylist: () => void;
  onShufflePlaylist: () => void;
  repeatMode: RepeatMode;
  onSetRepeatMode: (mode: RepeatMode) => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isOpen,
  onClose,
  playlist,
  currentRecitation,
  isPlaying,
  onPlayRecitation,
  onRemoveFromPlaylist,
  onClearPlaylist,
  onShufflePlaylist,
  repeatMode,
  onSetRepeatMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-stone-950/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md h-full bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col justify-between"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                قائمة التشغيل الحالية
              </h3>
              <p className="text-[11px] text-stone-500">
                {playlist.length} تلاوة في قائمة الانتظار
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        {playlist.length > 0 && (
          <div className="px-4 py-2 bg-stone-50 dark:bg-stone-800/40 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={onShufflePlaylist}
                className="flex items-center gap-1 text-stone-600 dark:text-stone-300 hover:text-amber-700"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>خلط القائمة</span>
              </button>
              <span>·</span>
              <button
                onClick={() => onSetRepeatMode(repeatMode === 'playlist' ? 'off' : 'playlist')}
                className={`flex items-center gap-1 ${
                  repeatMode === 'playlist' ? 'text-amber-600 font-bold' : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>تكرار القائمة {repeatMode === 'playlist' ? '(مفعل)' : ''}</span>
              </button>
            </div>

            <button
              onClick={onClearPlaylist}
              className="text-stone-400 hover:text-red-600 transition-colors"
            >
              مسح الكل
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {playlist.length === 0 ? (
            <div className="text-center py-16 text-stone-400 text-xs">
              <ListMusic className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
              قائمة التشغيل فارغة حالياً.
              <br />
              اضغط على «لقائمة التشغيل» عند أي تلاوة لإضافتها هنا.
            </div>
          ) : (
            playlist.map((item, index) => {
              const isCurrent = currentRecitation?.id === item.id;
              return (
                <div
                  key={`${item.id}-${index}`}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    isCurrent
                      ? 'border-amber-500/60 bg-amber-50/50 dark:bg-amber-950/30'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => onPlayRecitation(item)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current translate-x-[-0.5px]" />
                    </button>
                    <div className="min-w-0">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {item.reciter}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveFromPlaylist(item.id)}
                    className="p-1 text-stone-400 hover:text-red-600 rounded-md transition-colors"
                    title="إزالة من القائمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
