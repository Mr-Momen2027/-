export type TabId = 'tartil' | 'tajweed' | 'haflat' | 'qiraat';

export interface TabConfig {
  id: TabId;
  title: string;
  subtitle: string;
  description: string;
  colorName: string;
  theme: {
    badgeBg: string;
    badgeText: string;
    headerGradient: string;
    accentBg: string;
    accentHover: string;
    border: string;
    cardBg: string;
    cardBgHover: string;
    softBg: string;
  };
  imagePath: string;
}

export type SourceType = 'direct' | 'youtube' | 'upload';

export interface Recitation {
  id: string;
  title: string;
  reciter: string;
  riwayah?: string; // e.g. حفص عن عاصم، ورش عن نافع
  occasionOrPlace?: string; // e.g. مسجد الحسين 1968
  sourceType: SourceType;
  sourceUrl: string; // Direct audio URL, YouTube URL, or Blob/Data URL
  youtubeId?: string; // Extracted YouTube video ID
  duration?: number; // seconds
  tabs: TabId[]; // A recitation can belong to multiple tabs!
  isFavorite: boolean;
  order: number; // for custom order
  createdAt: number;
  playCount?: number;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  source?: string;
  category: 'quran' | 'hadith' | 'sahaba' | 'scholar';
}

export type SortMode = 
  | 'alphabetical-asc' 
  | 'alphabetical-desc' 
  | 'newest' 
  | 'oldest' 
  | 'custom' 
  | 'random';

export type RepeatMode = 'off' | 'track' | 'playlist';

export interface UserProfile {
  isGuest: boolean;
  email: string;
  displayName: string;
  photoUrl?: string;
  joinedAt: number;
}
