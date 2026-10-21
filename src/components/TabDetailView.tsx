import React, { useState, useMemo } from 'react';
import { TabId, Recitation, SortMode, RepeatMode } from '../types';
import { TABS_CONFIG, TABS_ORDER } from '../data/tabs';
import { TAB_SUGGESTIONS } from '../data/suggestions';
import { 
  ArrowRight, Plus, Search, Heart, Play, Pause, ListPlus, 
  Share2, Edit3, Trash2, Repeat, Repeat1, Shuffle, 
  ArrowUpDown, Volume2, ArrowUp, ArrowDown, FolderPlus, 
  Sparkles, Check, Youtube, Music, UploadCloud, Layers
} from 'lucide-react';

interface TabDetailViewProps {
  tabId: TabId;
  onBack: () => void;
  recitations: Recitation[];
  onPlayRecitation: (recitation: Recitation, tabId?: TabId) => void;
  currentRecitation: Recitation | null;
  isPlaying: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToPlaylist: (recitation: Recitation) => void;
  playlist: Recitation[];
  onOpenPlaylist: () => void;
  onOpenAddModal: (tabId: TabId) => void;
  onOpenEditModal: (recitation: Recitation) => void;
  onDeleteRecitation: (id: string) => void;
  onToggleTabAssignment: (recitationId: string, targetTabId: TabId) => void;
  repeatMode: RepeatMode;
  onSetRepeatMode: (mode: RepeatMode) => void;
  onReorderRecitation: (id: string, direction: 'up' | 'down') => void;
  onAddSuggestionToTab: (suggestion: Recitation, targetTab: TabId) => void;
}

export const TabDetailView: React.FC<TabDetailViewProps> = ({
  tabId,
  onBack,
  recitations,
  onPlayRecitation,
  currentRecitation,
  isPlaying,
  onToggleFavorite,
  onAddToPlaylist,
  playlist,
  onOpenPlaylist,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteRecitation,
  onToggleTabAssignment,
  repeatMode,
  onSetRepeatMode,
  onReorderRecitation,
  onAddSuggestionToTab,
}) => {
  const config = TABS_CONFIG[tabId];
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [activeTabAssignModalId, setActiveTabAssignModalId] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Filter recitations belonging to this tab
  const tabRecitations = useMemo(() => {
    return recitations.filter(r => r.tabs && r.tabs.includes(tabId));
  }, [recitations, tabId]);

  // Apply search query
  const searchedRecitations = useMemo(() => {
    if (!searchQuery.trim()) return tabRecitations;
    const q = searchQuery.toLowerCase().trim();
    return tabRecitations.filter(
      r => r.title.toLowerCase().includes(q) || 
           r.reciter.toLowerCase().includes(q) || 
           (r.riwayah && r.riwayah.toLowerCase().includes(q))
    );
  }, [tabRecitations, searchQuery]);

  // Apply sorting
  const sortedRecitations = useMemo(() => {
    const list = [...searchedRecitations];
    switch (sortMode) {
      case 'alphabetical-asc':
        return list.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
      case 'alphabetical-desc':
        return list.sort((a, b) => b.title.localeCompare(a.title, 'ar'));
      case 'newest':
        return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'oldest':
        return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      case 'custom':
        return list.sort((a, b) => (a.order || 0) - (b.order || 0));
      case 'random':
        // Deterministic pseudo-random based on id hash for stability while viewing
        return list.sort((a, b) => (a.id.charCodeAt(0) % 5) - (b.id.charCodeAt(0) % 5));
      default:
        return list;
    }
  }, [searchedRecitations, sortMode]);

  // Suggestions for this tab
  const suggestions = TAB_SUGGESTIONS[tabId] || [];

  const handleSuggestionAdd = (sug: Recitation) => {
    onAddSuggestionToTab(sug, tabId);
    setAddedNotice(`تمت إضافة «${sug.title}» إلى تبويب ${config.title}`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Tab Themed Banner Header */}
      <div className={`relative overflow-hidden rounded-2xl border ${config.theme.border} bg-gradient-to-r ${config.theme.headerGradient} text-white p-6 md:p-8 shadow-md`}>
        {/* Background decorative image with soft fade */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src={config.imagePath} 
            alt={config.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              aria-label="العودة للرئيسية"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors shrink-0 mt-1"
              title="العودة للواجهة الرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-stone-200 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm">تبويب رئيسي</span>
                <span>·</span>
                <span className="font-sans opacity-80">{config.colorName}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-quran tracking-wide">
                {config.title}
              </h1>
              <p className="text-xs md:text-sm text-stone-200/90 mt-1 max-w-xl leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => onOpenAddModal(tabId)}
            className="px-4 py-2.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-semibold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-stone-900" />
            <span>إضافة تلاوة لهذا التبويب</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {addedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 transition-all">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{addedNotice}</span>
          </div>
          <button
            onClick={onOpenPlaylist}
            className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-[11px] font-semibold transition-colors shrink-0"
          >
            عرض القائمة ({playlist.length})
          </button>
        </div>
      )}

      {/* Toolbar: Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن سورة، قارئ، أو رواية..."
            className="w-full pl-3 pr-9 py-2 text-xs bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>الترتيب:</span>
          </span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-xs py-2 px-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="newest">الأحدث إلى الأقدم</option>
            <option value="oldest">الأقدم إلى الأحدث</option>
            <option value="alphabetical-asc">هجائي (أ - ي)</option>
            <option value="alphabetical-desc">هجائي (ي - أ)</option>
            <option value="custom">الترتيب المخصص</option>
            <option value="random">عشوائي</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {sortedRecitations.length === 0 ? (
        /* Empty State with Suggestions (As specifically requested by user) */
        <div className="space-y-6">
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              تبويب {config.title} فارغ حالياً
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1 leading-relaxed">
              يمكنك رفع تلاوة من جهازك، أو نسخ رابط مباشر أو رابط يوتيوب، أو البدء بإضافة التلاوات المقترحة لهذا القسم أدناه.
            </p>
            <button
              onClick={() => onOpenAddModal(tabId)}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تلاوة جديدة الآن</span>
            </button>
          </div>

          {/* Curated Suggestions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  اقتراحات مميزة مناسبة لقسم {config.title}
                </h3>
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                أضفها لمكتبتك بنقرة واحدة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((sug) => {
                const isItemPlaying = currentRecitation?.id === sug.id && isPlaying;
                const isAlreadyAdded = recitations.some(r => r.id === sug.id && r.tabs.includes(tabId));

                return (
                  <div
                    key={sug.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => onPlayRecitation(sug, tabId)}
                          className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                          title="تشغيل التلاوة المقترحة"
                        >
                          {isItemPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                            {sug.title}
                          </h4>
                          <p className="text-xs text-stone-600 dark:text-stone-400 truncate mt-0.5">
                            {sug.reciter}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                            {sug.riwayah && <span>{sug.riwayah}</span>}
                            {sug.occasionOrPlace && (
                              <>
                                <span>·</span>
                                <span>{sug.occasionOrPlace}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => onPlayRecitation(sug, tabId)}
                        className="text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 font-medium flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>استماع</span>
                      </button>

                      {isAlreadyAdded ? (
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium text-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>مضافة في التبويب</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSuggestionAdd(sug)}
                          className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/70 text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة للتبويب</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Recitations List */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
            <span>
              عرض {sortedRecitations.length} تلاوة في هذا التبويب
            </span>
            {sortMode === 'custom' && (
              <span className="text-amber-700 dark:text-amber-400">
                يمكنك إعادة الترتيب بواسطة أزرار الأسهم
              </span>
            )}
          </div>

          <div className="space-y-3">
            {sortedRecitations.map((rec, index) => {
              const isItemPlaying = currentRecitation?.id === rec.id && isPlaying;

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isItemPlaying
                      ? 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  {/* Top row: Play, Title, Source Badge, and Reorder arrows if custom */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => onPlayRecitation(rec, tabId)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-105 ${
                          isItemPlaying
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                        }`}
                        title={isItemPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                      >
                        {isItemPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm md:text-base font-bold text-stone-900 dark:text-stone-100">
                            {rec.title}
                          </h4>

                          {/* Source badge */}
                          {rec.sourceType === 'youtube' && (
                            <span className="text-[11px] text-red-700 dark:text-red-400 flex items-center gap-1 font-medium">
                              <Youtube className="w-3.5 h-3.5" />
                              <span>يوتيوب (صوت فقط)</span>
                            </span>
                          )}
                          {rec.sourceType === 'upload' && (
                            <span className="text-[11px] text-teal-700 dark:text-teal-400 flex items-center gap-1 font-medium">
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>ملف مرفوع</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5">
                          {rec.reciter}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 mt-1 flex-wrap">
                          {rec.riwayah && <span>{rec.riwayah}</span>}
                          {rec.occasionOrPlace && (
                            <>
                              <span>·</span>
                              <span>{rec.occasionOrPlace}</span>
                            </>
                          )}
                          {rec.duration && (
                            <>
                              <span>·</span>
                              <span className="tabular-nums font-mono">{formatDuration(rec.duration)}</span>
                            </>
                          )}
                          {/* Tags showing multiple tab memberships */}
                          {rec.tabs.length > 1 && (
                            <>
                              <span>·</span>
                              <span className="text-amber-700 dark:text-amber-400">
                                مضاف في {rec.tabs.length} تبويبات: {rec.tabs.map(t => TABS_CONFIG[t].title).join('، ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Custom Sort Up/Down handlers */}
                    {sortMode === 'custom' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onReorderRecitation(rec.id, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-stone-800"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onReorderRecitation(rec.id, 'down')}
                          disabled={index === sortedRecitations.length - 1}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-stone-800"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* UNDER EACH RECITATION: The specific requested options:
                      1. الإضافة للمفضلة
                      2. الإضافة لقائمة التشغيل الحالية
                      3. الإضافة إلى تبويب آخر
                      4. التعديل (اسم التلاوة أو الرابط)
                      5. تكرار التلاوة فقط أو تكرار قائمة التشغيل الحالية
                      6. الحذف
                  */}
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      {/* 1. Favorite toggle */}
                      <button
                        onClick={() => onToggleFavorite(rec.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
                          rec.isFavorite
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                        title={rec.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${rec.isFavorite ? 'fill-current' : ''}`} />
                        <span>{rec.isFavorite ? 'مفضلة' : 'المفضلة'}</span>
                      </button>

                      {/* 2. Add to Playlist */}
                      {(() => {
                        const isInPlaylist = playlist.some(p => p.id === rec.id);
                        return (
                          <button
                            onClick={() => {
                              if (!isInPlaylist) {
                                onAddToPlaylist(rec);
                                setAddedNotice(`تمت إضافة «${rec.title}» إلى قائمة التشغيل الحالية`);
                                setTimeout(() => setAddedNotice(null), 3500);
                              } else {
                                onOpenPlaylist();
                              }
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
                              isInPlaylist
                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-semibold border border-emerald-500/20'
                                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                            }`}
                            title={isInPlaylist ? 'اضغط لعرض قائمة التشغيل' : 'إضافة إلى قائمة التشغيل الحالية'}
                          >
                            {isInPlaylist ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>في قائمة التشغيل</span>
                              </>
                            ) : (
                              <>
                                <ListPlus className="w-3.5 h-3.5 text-amber-600" />
                                <span>لقائمة التشغيل</span>
                              </>
                            )}
                          </button>
                        );
                      })()}

                      {/* 3. Assign to Another Tab */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveTabAssignModalId(activeTabAssignModalId === rec.id ? null : rec.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="إضافة إلى تبويب آخر"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>تبويب آخر</span>
                        </button>

                        {/* Dropdown for tab assignments */}
                        {activeTabAssignModalId === rec.id && (
                          <div className="absolute top-full right-0 mt-1 z-20 w-48 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-xl p-2 space-y-1">
                            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 px-2 py-1">
                              تضمين التلاوة في التبويبات:
                            </div>
                            {TABS_ORDER.map((tId) => {
                              const tConfig = TABS_CONFIG[tId];
                              const isIncluded = rec.tabs.includes(tId);
                              return (
                                <button
                                  key={tId}
                                  onClick={() => onToggleTabAssignment(rec.id, tId)}
                                  className={`w-full text-right px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                    isIncluded
                                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold'
                                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                                  }`}
                                >
                                  <span>{tConfig.title}</span>
                                  {isIncluded && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 4. Edit Recitation */}
                      <button
                        onClick={() => onOpenEditModal(rec)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="تعديل اسم التلاوة أو الرابط"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      {/* 5. Repeat options: Single vs Playlist */}
                      <button
                        onClick={() => {
                          const nextMode = repeatMode === 'off' ? 'track' : repeatMode === 'track' ? 'playlist' : 'off';
                          onSetRepeatMode(nextMode);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
                          repeatMode !== 'off'
                            ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 font-semibold'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                        title="تبديل وضع التكرار"
                      >
                        {repeatMode === 'track' ? (
                          <>
                            <Repeat1 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>تكرار التلاوة</span>
                          </>
                        ) : repeatMode === 'playlist' ? (
                          <>
                            <Repeat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>تكرار القائمة</span>
                          </>
                        ) : (
                          <>
                            <Repeat className="w-3.5 h-3.5" />
                            <span>بدون تكرار</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 6. Delete Recitation */}
                    <button
                      onClick={() => onDeleteRecitation(rec.id)}
                      className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      title="حذف التلاوة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom section: Additional suggestions always accessible */}
          <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  مقترحات إضافية تناسب تبويب {config.title}
                </h4>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.slice(0, 4).map((sug) => {
                const isAlreadyAdded = recitations.some(r => r.id === sug.id && r.tabs.includes(tabId));
                return (
                  <div 
                    key={`extra-${sug.id}`} 
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">{sug.title}</div>
                      <div className="text-stone-500 truncate">{sug.reciter}</div>
                    </div>
                    {isAlreadyAdded ? (
                      <span className="text-[11px] text-emerald-600 font-medium shrink-0">مضافة بالفعل</span>
                    ) : (
                      <button
                        onClick={() => handleSuggestionAdd(sug)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-stone-700 dark:text-stone-300 font-medium shrink-0 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>إضافة</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
