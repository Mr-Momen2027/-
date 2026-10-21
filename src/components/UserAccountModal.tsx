import React, { useState } from 'react';
import { UserProfile, Recitation, TabId } from '../types';
import { TABS_CONFIG, TABS_ORDER } from '../data/tabs';
import { exportAppData, importAppData } from '../services/storage';
import { 
  X, User, Mail, Download, Upload, Heart, BookOpen, 
  CheckCircle2, LogIn, LogOut, ShieldCheck, Play, 
  ExternalLink, FileJson, Sparkles
} from 'lucide-react';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  recitations: Recitation[];
  onImportRecitations: (newRecitations: Recitation[]) => void;
  onPlayRecitation: (recitation: Recitation) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  recitations,
  onImportRecitations,
  onPlayRecitation,
}) => {
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [emailInput, setEmailInput] = useState(profile.email || '');
  const [nameInput, setNameInput] = useState(profile.displayName || '');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [gmailBackupSent, setGmailBackupSent] = useState(false);

  if (!isOpen) return null;

  const favorites = recitations.filter(r => r.isFavorite);

  // Tab counts
  const tabCounts: Record<TabId, number> = {
    tartil: recitations.filter(r => r.tabs?.includes('tartil')).length,
    tajweed: recitations.filter(r => r.tabs?.includes('tajweed')).length,
    haflat: recitations.filter(r => r.tabs?.includes('haflat')).length,
    qiraat: recitations.filter(r => r.tabs?.includes('qiraat')).length,
  };

  // Distinct reciters
  const uniqueReciters = Array.from(new Set(recitations.map(r => r.reciter))).filter(Boolean);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      isGuest: !emailInput.trim(),
      email: emailInput.trim(),
      displayName: nameInput.trim() || (emailInput.includes('@') ? emailInput.split('@')[0] : 'مستخدم النور المبين'),
    };
    onUpdateProfile(updated);
    setIsEditingAccount(false);
  };

  const handleSwitchToGuest = () => {
    onUpdateProfile({
      isGuest: true,
      email: '',
      displayName: 'زائر كريم',
      joinedAt: Date.now(),
    });
    setIsEditingAccount(false);
  };

  const handleQuickGmailLogin = (presetEmail?: string) => {
    const targetEmail = presetEmail || 'momen.abass@gmail.com';
    onUpdateProfile({
      isGuest: false,
      email: targetEmail,
      displayName: targetEmail.split('@')[0],
      joinedAt: Date.now(),
    });
    setEmailInput(targetEmail);
    setNameInput(targetEmail.split('@')[0]);
    setIsEditingAccount(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const res = importAppData(content);
        if (res.success && res.recitations) {
          onImportRecitations(res.recitations);
          setImportStatus(`تم استيراد ${res.recitations.length} تلاوة بنجاح!`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus(res.error || 'فشل الاستيراد');
          setTimeout(() => setImportStatus(null), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveToGmail = () => {
    const userEmail = profile.email || 'momen.abass@gmail.com';
    const totalCount = recitations.length;
    const favCount = favorites.length;

    const subject = encodeURIComponent(`نسخة احتياطية لتطبيق النور المبين للقرآن الكريم (${new Date().toLocaleDateString('ar-EG')})`);
    
    let bodyText = `السلام عليكم ورحمة الله وبركاته،\n\n`;
    bodyText += `هذه نسخة احتياطية من مكتبتك الصوتية في تطبيق «النور المبين»:\n`;
    bodyText += `- اسم الحساب: ${profile.displayName}\n`;
    bodyText += `- إجمالي التلاوات: ${totalCount}\n`;
    bodyText += `- التلاوات المفضلة: ${favCount}\n\n`;
    bodyText += `قائمة التلاوات المفضلة:\n`;
    favorites.slice(0, 15).forEach((fav, i) => {
      bodyText += `${i + 1}. ${fav.title} - ${fav.reciter}\n`;
    });
    bodyText += `\nتم إنشاء هذا التقرير عبر تطبيق النور المبين للاستماع للقرآن الكريم.`;

    const mailtoUrl = `mailto:${userEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoUrl;

    setGmailBackupSent(true);
    setTimeout(() => setGmailBackupSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl p-6 overflow-hidden my-8"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-lg">
              {profile.isGuest ? 'ضيف' : profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {profile.displayName}
                </h3>
                {profile.isGuest ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                    وضع ضيف عادي
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>مسجل عبر Gmail</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {profile.isGuest
                  ? 'يتم حفظ بياناتك محلياً على هذا الجهاز مع إمكانية التصدير'
                  : profile.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {importStatus && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
            {importStatus}
          </div>
        )}

        {/* Account Mode Switcher / Editor */}
        {isEditingAccount ? (
          <form onSubmit={handleSaveProfile} className="mt-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              تسجيل الدخول أو تعديل الحساب
            </h4>
            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
                البريد الإلكتروني (Gmail):
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-mono text-left dir-ltr"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-600 dark:text-stone-400 mb-1">
                الاسم المعروض:
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="اسمك أو كنيتك"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSwitchToGuest}
                className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              >
                استخدام كضيف عادي
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingAccount(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold"
                >
                  حفظ
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2 text-xs">
            {profile.isGuest ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleQuickGmailLogin('momen.abass@gmail.com')}
                  className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول السريع بـ Gmail</span>
                </button>
                <button
                  onClick={() => setIsEditingAccount(true)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                >
                  تسجيل بريد آخر
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSaveToGmail}
                  className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>إرسال تقرير ونسخة احتياطية إلى Gmail</span>
                </button>
                <button
                  onClick={() => setIsEditingAccount(true)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                >
                  تعديل البريد
                </button>
                <button
                  onClick={handleSwitchToGuest}
                  className="px-2.5 py-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                >
                  خروج للوضع الضيف
                </button>
              </div>
            )}
          </div>
        )}

        {/* Detailed User Data / Stats as specifically requested:
            "حساب المستخدم يشمل البيانات والتي منها قائمة التلاوات المفضلة وعدد التلاوات المضافة بتفاصيلها"
        */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300">
            إحصائيات وبيانات مكتبتك الصوتية:
          </h4>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
              <div className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                {recitations.length}
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                إجمالي التلاوات المضافة
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/30">
              <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400">
                {favorites.length}
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                تلاوات في المفضلة
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/30">
              <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                {uniqueReciters.length}
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                قراء مختلفين
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/30">
              <div className="text-xl font-bold font-mono text-teal-700 dark:text-teal-400">
                4
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                أقسام مفعلة
              </div>
            </div>
          </div>

          {/* Breakdown per Tab */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
            <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              توزيع التلاوات على التبويبات:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {TABS_ORDER.map(tId => {
                const config = TABS_CONFIG[tId];
                return (
                  <div key={tId} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-stone-600 dark:text-stone-400">{config.title}</span>
                    <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
                      {tabCounts[tId]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Favorites List Preview */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-current" />
                <span>قائمة التلاوات المفضلة ({favorites.length}):</span>
              </div>
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-4 text-xs text-stone-400">
                لم تقم بإضافة أي تلاوة للمفضلة بعد. اضغط على أيقونة القلب في أي تلاوة لإضافتها.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                {favorites.map((fav) => (
                  <div key={fav.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">{fav.title}</div>
                      <div className="text-stone-500 text-[11px] truncate">{fav.reciter}</div>
                    </div>
                    <button
                      onClick={() => {
                        onPlayRecitation(fav);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 hover:border-amber-500 shrink-0"
                      title="تشغيل التلاوة"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Device Export and Import Section */}
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-stone-500 dark:text-stone-400 text-center sm:text-right">
            يمكنك حفظ نسختك على الجهاز أو استرجاعها في أي وقت.
          </div>

          <div className="flex items-center gap-2">
            {/* Import JSON button */}
            <label className="cursor-pointer px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>استيراد ملف</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>

            {/* Export JSON button */}
            <button
              onClick={() => exportAppData(recitations, profile)}
              className="px-3.5 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير وحفظ على الجهاز</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
