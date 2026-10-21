import { Recitation, UserProfile } from '../types';

const STORAGE_KEYS = {
  RECITATIONS: 'alnoor_recitations_v1',
  PROFILE: 'alnoor_profile_v1',
  LAST_PLAYED: 'alnoor_last_played_v1',
  SETTINGS: 'alnoor_settings_v1',
  PLAYLIST: 'alnoor_playlist_v1',
};

// IndexedDB configuration for uploaded audio files
const DB_NAME = 'AlNoorAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_files';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioBlob(id: string, blob: Blob): Promise<string> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(blob, id);
    req.onsuccess = () => {
      resolve(id);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAudioBlobUrl(id: string): Promise<string | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteAudioBlob(id: string): Promise<void> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch {
    // Ignore error
  }
}

// LocalStorage helpers
export function loadRecitations(): Recitation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECITATIONS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading recitations:', e);
    return [];
  }
}

export function saveRecitations(recitations: Recitation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECITATIONS, JSON.stringify(recitations));
  } catch (e) {
    console.error('Error saving recitations:', e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading profile:', e);
  }
  return {
    isGuest: true,
    email: '',
    displayName: 'زائر كريم',
    joinedAt: Date.now(),
  };
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export interface LastPlayedState {
  recitationId: string;
  currentTime: number;
  tabId?: string;
  updatedAt: number;
}

export function loadLastPlayed(): LastPlayedState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveLastPlayed(state: LastPlayedState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, JSON.stringify(state));
  } catch {
    // Ignore error
  }
}

export function exportAppData(recitations: Recitation[], profile: UserProfile): void {
  const exportData = {
    appName: 'النور المبين',
    exportDate: new Date().toISOString(),
    profile,
    stats: {
      totalRecitations: recitations.length,
      favoritesCount: recitations.filter(r => r.isFavorite).length,
    },
    recitations: recitations.map(r => ({
      ...r,
      // If it's a blob URL, we keep the metadata
      sourceUrl: r.sourceType === 'upload' ? '[ملف محلي مرفوع على هذا الجهاز]' : r.sourceUrl,
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alnoor_mubeen_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importAppData(jsonString: string): { success: boolean; recitations?: Recitation[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.recitations)) {
      return { success: false, error: 'الملف غير صالح أو لا يحتوي على قائمة تلاوات معتمدة.' };
    }
    return { success: true, recitations: parsed.recitations };
  } catch {
    return { success: false, error: 'تعذر قراءة ملف JSON، يرجى التحقق من الملف.' };
  }
}
