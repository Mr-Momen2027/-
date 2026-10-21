import React, { useState } from 'react';
import { TabId, Recitation, SourceType } from '../types';
import { TABS_CONFIG, TABS_ORDER } from '../data/tabs';
import { extractYouTubeId } from '../utils/youtube';
import { saveAudioBlob } from '../services/storage';
import { X, Link2, Youtube, UploadCloud, Check, Music, FileAudio } from 'lucide-react';

interface AddRecitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTabId: TabId;
  onAddRecitation: (recitation: Recitation) => void;
}

export const AddRecitationModal: React.FC<AddRecitationModalProps> = ({
  isOpen,
  onClose,
  initialTabId,
  onAddRecitation,
}) => {
  const [sourceType, setSourceType] = useState<SourceType>('direct');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [reciter, setReciter] = useState('');
  const [riwayah, setRiwayah] = useState('حفص عن عاصم');
  const [occasionOrPlace, setOccasionOrPlace] = useState('');
  const [selectedTabs, setSelectedTabs] = useState<TabId[]>([initialTabId]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      // Auto-fill title if empty from filename
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('يرجى كتابة اسم التلاوة أو السورة');
      return;
    }
    if (!reciter.trim()) {
      setErrorMsg('يرجى تحديد اسم القارئ');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalSourceUrl = url.trim();
      let youtubeId: string | undefined = undefined;

      if (sourceType === 'youtube') {
        const yId = extractYouTubeId(finalSourceUrl);
        if (!yId) {
          setErrorMsg('رابط يوتيوب غير صحيح، يرجى التأكد من نسخه بشكل كامل.');
          setIsSubmitting(false);
          return;
        }
        youtubeId = yId;
      } else if (sourceType === 'upload') {
        if (!uploadedFile) {
          setErrorMsg('يرجى اختيار ملف صوتي من جهازك.');
          setIsSubmitting(false);
          return;
        }
        const fileId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await saveAudioBlob(fileId, uploadedFile);
        finalSourceUrl = URL.createObjectURL(uploadedFile);
      } else {
        if (!finalSourceUrl) {
          setErrorMsg('يرجى إدخال رابط صوتي مباشر (مثل mp3).');
          setIsSubmitting(false);
          return;
        }
      }

      const newRecitation: Recitation = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        reciter: reciter.trim(),
        riwayah: riwayah.trim() || undefined,
        occasionOrPlace: occasionOrPlace.trim() || undefined,
        sourceType,
        sourceUrl: finalSourceUrl,
        youtubeId,
        tabs: selectedTabs,
        isFavorite: false,
        order: Date.now(),
        createdAt: Date.now(),
      };

      onAddRecitation(newRecitation);
      onClose();
      // Reset form
      setTitle('');
      setReciter('');
      setUrl('');
      setUploadedFile(null);
      setOccasionOrPlace('');
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء حفظ التلاوة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl p-6 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              إضافة تلاوة جديدة
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              أضف تلاوة عبر رابط مباشر، يوتيوب (صوت فقط)، أو ارفع ملفك
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Source Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              مصدر التلاوة:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSourceType('direct')}
                className={`py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                  sourceType === 'direct'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>رابط مباشر</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('youtube')}
                className={`py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                  sourceType === 'youtube'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <Youtube className="w-3.5 h-3.5 text-red-600" />
                <span>يوتيوب (صوت)</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('upload')}
                className={`py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                  sourceType === 'upload'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>رفع ملف</span>
              </button>
            </div>
          </div>

          {/* Source Input depending on sourceType */}
          {sourceType === 'youtube' ? (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                رابط يوتيوب:
              </label>
              <div className="relative">
                <Youtube className="w-4 h-4 text-red-600 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-3 pr-9 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-left dir-ltr"
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                * ستعمل التلاوة في الخلفية صوتياً فقط دون إظهار الفيديو كما طلبت.
              </p>
            </div>
          ) : sourceType === 'upload' ? (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                الملف الصوتي من جهازك:
              </label>
              <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl p-4 text-center hover:border-amber-500 transition-colors">
                <input
                  type="file"
                  id="audio-upload-input"
                  accept="audio/*,.mp3,.m4a,.wav,.ogg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="audio-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <FileAudio className="w-8 h-8 text-amber-600" />
                  {uploadedFile ? (
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        اضغط هنا لاختيار ملف صوتي
                      </div>
                      <div className="text-[11px] text-stone-400">
                        يدعم صيغ MP3, M4A, WAV, وغيرها ويحفظ في المتصفح
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                رابط الملف الصوتي المباشر:
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/recitation.mp3"
                  className="w-full pl-3 pr-9 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-left dir-ltr"
                />
              </div>
            </div>
          )}

          {/* Title & Reciter fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                اسم التلاوة أو السورة:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: سورة مريم، سورة يوسف"
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
                placeholder="مثال: الشيخ عبد الباسط عبد الصمد"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Riwayah and Occasion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                الرواية (اختياري):
              </label>
              <input
                type="text"
                value={riwayah}
                onChange={(e) => setRiwayah(e.target.value)}
                placeholder="مثال: حفص عن عاصم، ورش عن نافع"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                المكان أو المناسبة (اختياري):
              </label>
              <input
                type="text"
                value={occasionOrPlace}
                onChange={(e) => setOccasionOrPlace(e.target.value)}
                placeholder="مثال: المسجد الأقصى 1964، الحرم المكي"
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Target Tabs Selection (Can select multiple as requested!) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              إضافة إلى التبويبات (يمكن تحديد أكثر من تبويب):
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
            <p className="text-[11px] text-stone-400 mt-1">
              * يمكنك مثلاً تعيين التلاوة في تبويبي الترتيل والقراءات معاً كما طلبت.
            </p>
          </div>

          {/* Action buttons */}
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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ التلاوة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
