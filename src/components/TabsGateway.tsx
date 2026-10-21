import React from 'react';
import { TabId, Recitation } from '../types';
import { TABS_CONFIG, TABS_ORDER } from '../data/tabs';
import { TAB_SUGGESTIONS } from '../data/suggestions';
import { ChevronLeft, Play, Plus, Sparkles, BookOpen, Music, Radio, Compass } from 'lucide-react';

interface TabsGatewayProps {
  onSelectTab: (tabId: TabId) => void;
  recitations: Recitation[];
}

export const TabsGateway: React.FC<TabsGatewayProps> = ({ onSelectTab, recitations }) => {
  const getTabCount = (tabId: TabId) => {
    return recitations.filter(r => r.tabs && r.tabs.includes(tabId)).length;
  };

  const getTabIcon = (tabId: TabId) => {
    switch (tabId) {
      case 'tartil':
        return <BookOpen className="w-5 h-5" />;
      case 'tajweed':
        return <Sparkles className="w-5 h-5" />;
      case 'haflat':
        return <Radio className="w-5 h-5" />;
      case 'qiraat':
        return <Compass className="w-5 h-5" />;
    }
  };

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            أقسام التلاوات القرآنية
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            اختر التبويب المطلوب للدخول واستعراض التلاوات وإدارتها
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TABS_ORDER.map((tabId) => {
          const config = TABS_CONFIG[tabId];
          const count = getTabCount(tabId);
          const suggestionsCount = TAB_SUGGESTIONS[tabId]?.length || 0;

          return (
            <div
              key={tabId}
              onClick={() => onSelectTab(tabId)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              {/* Cover Image Container with Warm Tone Scrim */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={config.imagePath}
                  alt={config.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Visual Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${config.theme.headerGradient} opacity-75 group-hover:opacity-85 transition-opacity`} />

                {/* Top Badge Overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-stone-900/60 text-white text-xs font-medium">
                  {getTabIcon(tabId)}
                  <span>{config.title}</span>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-3 right-3 left-3 text-white">
                  <div className="text-lg font-bold font-quran tracking-wide">
                    {config.title}
                  </div>
                  <div className="text-xs text-stone-200 line-clamp-1 mt-0.5 opacity-90">
                    {config.subtitle}
                  </div>
                </div>
              </div>

              {/* Bottom Body */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50">
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
                  {config.description}
                </p>

                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">
                    {count === 0 ? (
                      <span className="text-amber-800 dark:text-amber-400 font-medium">
                        فارغ · {suggestionsCount} مقترحات
                      </span>
                    ) : (
                      <span className="font-semibold text-stone-800 dark:text-stone-200 tabular-nums">
                        {count} {count === 1 ? 'تلاوة مضافة' : count === 2 ? 'تلاوتان' : 'تلاوات'}
                      </span>
                    )}
                  </span>

                  <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                    <span>فتح التبويب</span>
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
