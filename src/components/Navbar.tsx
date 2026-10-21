import React from 'react';
import { TabId, UserProfile } from '../types';
import { TABS_CONFIG, TABS_ORDER } from '../data/tabs';
import { Moon, Sun, User, Sparkles, BookOpen } from 'lucide-react';

interface NavbarProps {
  currentTab: TabId | null;
  onSelectTab: (tabId: TabId | null) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  profile: UserProfile;
  onOpenAccountModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  theme,
  onToggleTheme,
  profile,
  onOpenAccountModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, one line */}
        <button
          onClick={() => onSelectTab(null)}
          className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100 whitespace-nowrap shrink-0 group text-right"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-700 dark:bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold font-quran tracking-wide leading-none text-stone-900 dark:text-stone-50">
              النور المبين
            </div>
            <div className="text-[10px] text-amber-800 dark:text-amber-400 font-sans mt-0.5 leading-none">
              للاستماع للقرآن الكريم
            </div>
          </div>
        </button>

        {/* Zone 2: 4 nav links, 1-2 word labels, single-line */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <button
            onClick={() => onSelectTab(null)}
            className={`whitespace-nowrap shrink-0 hover:text-amber-700 dark:hover:text-amber-400 transition-colors ${
              currentTab === null ? 'text-amber-700 dark:text-amber-400 font-bold' : ''
            }`}
          >
            الرئيسية
          </button>
          {TABS_ORDER.map((tId) => {
            const config = TABS_CONFIG[tId];
            const isActive = currentTab === tId;
            return (
              <button
                key={tId}
                onClick={() => onSelectTab(tId)}
                className={`whitespace-nowrap shrink-0 hover:text-amber-700 dark:hover:text-amber-400 transition-colors ${
                  isActive ? 'text-amber-700 dark:text-amber-400 font-bold underline underline-offset-8' : ''
                }`}
              >
                {config.title}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'التحويل للوضع المشرق' : 'التحويل للوضع الداكن'}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-amber-500/40 text-xs font-medium transition-colors shadow-2xs"
            title={theme === 'dark' ? 'التبديل إلى الوضع المشرق' : 'التبديل إلى الوضع الداكن'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">الوضع المشرق</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-stone-700" />
                <span className="hidden sm:inline">الوضع الداكن</span>
              </>
            )}
          </button>

          {/* User Profile / Account Trigger */}
          <button
            onClick={onOpenAccountModal}
            className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-600/40 text-xs font-medium text-stone-800 dark:text-stone-200 transition-colors shadow-xs"
          >
            <User className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="truncate max-w-[100px]">
              {profile.isGuest ? 'زائر' : profile.displayName}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
