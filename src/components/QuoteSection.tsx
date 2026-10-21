import React, { useState, useEffect } from 'react';
import { Quote } from '../types';
import { QURAN_QUOTES } from '../data/quotes';
import { Sparkles, ChevronRight, ChevronLeft, Copy, Check, Shuffle, Clock, Settings2 } from 'lucide-react';

export type QuoteInterval = '5m' | '15m' | '30m' | '1h' | '12h' | '24h';

const INTERVAL_LABELS: Record<QuoteInterval, string> = {
  '5m': 'كل 5 دقائق',
  '15m': 'كل ربع ساعة',
  '30m': 'كل نصف ساعة',
  '1h': 'كل ساعة',
  '12h': 'مرتين في اليوم',
  '24h': 'يوم كامل',
};

const INTERVAL_DURATIONS: Record<QuoteInterval, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

interface QuoteSectionProps {
  onSelectQuote?: (quote: Quote) => void;
}

export const QuoteSection: React.FC<QuoteSectionProps> = () => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedIdx = localStorage.getItem('alnoor_quote_idx');
    return savedIdx ? parseInt(savedIdx, 10) % QURAN_QUOTES.length : 0;
  });
  const [intervalOption, setIntervalOption] = useState<QuoteInterval>(() => {
    const saved = localStorage.getItem('alnoor_quote_interval') as QuoteInterval;
    return saved && INTERVAL_LABELS[saved] ? saved : '15m';
  });
  const [copied, setCopied] = useState(false);
  const [fade, setFade] = useState(false);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);

  const quote = QURAN_QUOTES[currentIndex] || QURAN_QUOTES[0];

  // Rotate based on chosen user interval
  useEffect(() => {
    localStorage.setItem('alnoor_quote_interval', intervalOption);
    const ms = INTERVAL_DURATIONS[intervalOption];
    const timer = setInterval(() => {
      handleNext();
    }, ms);
    return () => clearInterval(timer);
  }, [currentIndex, intervalOption]);

  const changeQuoteWithFade = (newIndex: number) => {
    setFade(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      localStorage.setItem('alnoor_quote_idx', newIndex.toString());
      setFade(false);
    }, 180);
  };

  const handleNext = () => {
    const next = (currentIndex + 1) % QURAN_QUOTES.length;
    changeQuoteWithFade(next);
  };

  const handlePrev = () => {
    const prev = (currentIndex - 1 + QURAN_QUOTES.length) % QURAN_QUOTES.length;
    changeQuoteWithFade(prev);
  };

  const handleRandom = () => {
    let rand = Math.floor(Math.random() * QURAN_QUOTES.length);
    if (rand === currentIndex) {
      rand = (currentIndex + 1) % QURAN_QUOTES.length;
    }
    changeQuoteWithFade(rand);
  };

  const handleCopy = async () => {
    try {
      const text = `«${quote.text}»\n— ${quote.author}${quote.source ? ` (${quote.source})` : ''}\nمن تطبيق النور المبين`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const categoryName = {
    quran: 'آية وتدبر',
    hadith: 'حديث شريف',
    sahaba: 'من أقوال الصحابة',
    scholar: 'درر وأقوال',
  }[quote.category];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-900/10 dark:border-amber-500/15 bg-gradient-to-b from-amber-50/70 via-stone-50/50 to-amber-50/40 dark:from-stone-900/90 dark:via-stone-900/60 dark:to-stone-950 p-6 md:p-8 transition-colors">
      {/* Subtle decorative Islamic watermark arch geometry */}
      <div 
        className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full border border-amber-500/10 dark:border-amber-400/5 blur-sm"
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full border border-amber-600/10 dark:border-amber-400/5 blur-sm"
        aria-hidden="true" 
      />

      <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Subtle Category indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-amber-800/80 dark:text-amber-400/90 mb-3 tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{categoryName}</span>
          <span aria-hidden="true">·</span>
          <span>قبسات نورانية</span>
        </div>

        {/* The Quote Text */}
        <div 
          className={`min-h-[90px] flex items-center justify-center transition-opacity duration-200 ${
            fade ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <blockquote className="font-quran text-2xl sm:text-3xl md:text-3xl leading-relaxed md:leading-loose text-stone-900 dark:text-stone-100 font-medium tracking-normal select-text">
            «{quote.text}»
          </blockquote>
        </div>

        {/* Author & Source */}
        <div className="mt-3 text-sm text-stone-600 dark:text-stone-400 flex items-center justify-center gap-2 flex-wrap">
          <span className="font-semibold text-stone-800 dark:text-stone-200">{quote.author}</span>
          {quote.source && (
            <>
              <span aria-hidden="true" className="text-stone-400">·</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">{quote.source}</span>
            </>
          )}
        </div>

        {/* Actions row */}
        <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3 text-xs text-stone-600 dark:text-stone-400 flex-wrap">
          <button
            onClick={handlePrev}
            aria-label="الاقتباس السابق"
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 transition-colors"
            title="السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleRandom}
            aria-label="اقتباس عشوائي"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 transition-colors"
            title="اقتباس آخر"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>اقتباس آخر</span>
          </button>

          <button
            onClick={handleCopy}
            aria-label="نسخ الاقتباس"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 transition-colors"
            title="نسخ"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ</span>
              </>
            )}
          </button>

          {/* Quote Rotation Duration Selector */}
          <div className="relative">
            <button
              onClick={() => setShowIntervalMenu(!showIntervalMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
              title="تحديد مدة بقاء الاقتباس"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>مدة التبديل: {INTERVAL_LABELS[intervalOption]}</span>
            </button>

            {showIntervalMenu && (
              <div className="absolute bottom-full mb-2 right-0 z-30 w-44 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-xl p-1.5 text-xs space-y-1">
                <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 px-2 py-1">
                  مدة بقاء الاقتباس:
                </div>
                {(Object.keys(INTERVAL_LABELS) as QuoteInterval[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setIntervalOption(key);
                      setShowIntervalMenu(false);
                    }}
                    className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      intervalOption === key
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    <span>{INTERVAL_LABELS[key]}</span>
                    {intervalOption === key && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            aria-label="الاقتباس التالي"
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 transition-colors"
            title="التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
