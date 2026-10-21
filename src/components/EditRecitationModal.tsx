import React, { useState } from 'react';
import { TabId, Recitation } from '../types';
import { TABS_CONFIG, TABS_ORDER } from '../data/tabs';
import { extractYouTubeId } from '../utils/youtube';
import { X, Check } from 'lucide-react';

interface EditRecitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recitation: Recitation;
  onSave: (updated: Recitation) => void;
}

export const EditRecitationModal: React.FC<EditRecitationModalProps> = ({
  isOpen,
  onClose,
  recitation,
  onSave,
}) => {
  const [title, setTitle] = useState(recitation.title);
  const [reciter, setReciter] = useState(recitation.reciter);
  const [sourceUrl, setSourceUrl] = useState(recitation.sourceUrl);
  const [riwayah, setRiwayah] = useState(recitation.riwayah || '');
  const [occasionOrPlace, setOccasionOrPlace] = useState(recitation.occasionOrPlace || '');
  const [selectedTabs, setSelectedTabs] = useState<TabId[]>(recitation.tabs || ['tartil']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleTab = (tabId: TabId) => {
    if (selectedTabs.includes(tabId)) {
      if (selectedTabs.length > 1) {
        setSelectedTabs(selectedTabs.filter(t => t !== tabId));
      }
    } else {
      setSelectedTabs([...selectedTabs, tabId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reciter.trim()) {
      setErrorMsg('يرجى ملء اسم التلاوة والقارئ');
      return;
    }

    let youtubeId = recitation.youtubeId;
    let sourceType = recitation.sourceType;

    const yId = extractYouTubeId(sourceUrl);
    if (yId) {
      youtubeId = yId;
      sourceType = 'youtube';
    } else if (sourceType === 'youtube' && !yId) {
      sourceType = 'direct';
      youtubeId = undefined;
    }

    const updated: Recitation = {
      ...recitation,
      title: title.trim(),
      reciter: reciter.trim(),
      sourceUrl: sourceUrl.trim(),
      youtubeId,
      sourceType,
      riwayah: riwayah.trim() || undefined,
      occasionOrPlace: occasionOrPlace.trim() || undefined,
      tabs: selectedTabs,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl p-6 overflow-hidden my-8"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              تعديل بيانات التلاوة
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              تعديل اسم التلاوة، القارئ، أو الرابط وأقسام التبويبات
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/50">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              اسم التلاوة:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              اسم القارئ:
            </label>
            <input
              type="text"
              required
              value={reciter}
              onChange={(e) => setReciter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              رابط التلاوة (مباشر أو يوتيوب):
            </label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-left dir-ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                الرواية:
              </label>
              <input
                type="text"
                value={riwayah}
                onChange={(e) => setRiwayah(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                المكان / المناسبة:
              </label>
              <input
                type="text"
                value={occasionOrPlace}
                onChange={(e) => setOccasionOrPlace(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Assigned Tabs */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              التبويبات الملحقة بها هذه التلاوة:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TABS_ORDER.map((tId) => {
                const isSelected = selectedTabs.includes(tId);
                const tConfig = TABS_CONFIG[tId];
                return (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => handleToggleTab(tId)}
                    className={`p-2.5 rounded-xl border text-right flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <span>{tConfig.title}</span>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300 dark:border-stone-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
