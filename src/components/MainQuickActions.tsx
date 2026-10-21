import React from 'react';
import { Recitation, TabId } from '../types';
import { Shuffle, Play, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import { TABS_CONFIG } from '../data/tabs';

interface MainQuickActionsProps {
  onShufflePlay: () => void;
  onResumeLastPlayed: () => void;
  lastPlayedRecitation: Recitation | null;
  isPlaying: boolean;
  currentRecitation: Recitation | null;
  totalRecitations: number;
  favoritesCount: number;
}

export const MainQuickActions: React.FC<MainQuickActionsProps> = ({
  onShufflePlay,
  onResumeLastPlayed,
  lastPlayedRecitation,
  isPlaying,
  currentRecitation,
  totalRecitations,
  favoritesCount,
}) => {
  return (
    <div className="py-2">
      {/* Currently Playing / Resume Banner */}
      {currentRecitation && isPlaying ? (
        <div className="mb-4 p-4 rounded-xl border border-amber-600/30 dark:border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">قيد الاستماع الآن</div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                {currentRecitation.title}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                {currentRecitation.reciter}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onShufflePlay}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-800 text-xs text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تشغيل عشوائي آخر</span>
            </button>
          </div>
        </div>
      ) : lastPlayedRecitation ? (
        <div className="mb-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-stone-500 dark:text-stone-400">آخر تلاوة استمعت إليها</div>
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                {lastPlayedRecitation.title}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                {lastPlayedRecitation.reciter}
              </p>
            </div>
          </div>
          <button
            onClick={onResumeLastPlayed}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>متابعة الاستماع</span>
          </button>
        </div>
      ) : null}

      {/* Main Dual Quick Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Shuffle Play Card */}
        <button
          onClick={onShufflePlay}
          className="group relative overflow-hidden p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-600/40 dark:hover:border-amber-500/40 hover:shadow-md transition-all text-right flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                تشغيل عشوائي
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                تلاوة مباركة تفتح لك أبواب التدبر
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 group-hover:translate-x-[-4px] transition-transform">
            ابدأ ←
          </span>
        </button>

        {/* Continue Last Play Card */}
        <button
          onClick={onResumeLastPlayed}
          disabled={!lastPlayedRecitation && totalRecitations === 0}
          className={`group relative overflow-hidden p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 transition-all text-right flex items-center justify-between ${
            !lastPlayedRecitation && totalRecitations === 0
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:border-emerald-600/40 dark:hover:border-emerald-500/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                الاستمرار على آخر تشغيل
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate max-w-[200px]">
                {lastPlayedRecitation ? lastPlayedRecitation.title : 'متابعة من حيث توقفت'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-[-4px] transition-transform">
            متابعة ←
          </span>
        </button>
      </div>

      {/* Subtle Library Overview Bar */}
      <div className="mt-4 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
        <div className="flex items-center gap-2">
          <span>المكتبة الصوتية</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-semibold text-stone-700 dark:text-stone-300">
            {totalRecitations} تلاوة محفوظة
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums text-stone-700 dark:text-stone-300">
            {favoritesCount} في المفضلة
          </span>
        </div>
        <div className="text-xs text-stone-400">
          اختر تبويبًا للاستماع أو الإضافة
        </div>
      </div>
    </div>
  );
};
