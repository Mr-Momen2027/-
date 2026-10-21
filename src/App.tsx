import React, { useState, useEffect, useMemo } from 'react';
import { TabId, Recitation, UserProfile, RepeatMode } from './types';
import { TABS_CONFIG, TABS_ORDER } from './data/tabs';
import { TAB_SUGGESTIONS } from './data/suggestions';
import { 
  loadRecitations, saveRecitations, 
  loadUserProfile, saveUserProfile, 
  loadLastPlayed, saveLastPlayed, LastPlayedState 
} from './services/storage';
import { useWakeLock } from './hooks/useWakeLock';

import { Navbar } from './components/Navbar';
import { QuoteSection } from './components/QuoteSection';
import { MainQuickActions } from './components/MainQuickActions';
import { TabsGateway } from './components/TabsGateway';
import { TabDetailView } from './components/TabDetailView';
import { AudioPlayer } from './components/AudioPlayer';
import { AddRecitationModal } from './components/AddRecitationModal';
import { EditRecitationModal } from './components/EditRecitationModal';
import { UserAccountModal } from './components/UserAccountModal';
import { PlaylistDrawer } from './components/PlaylistDrawer';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('alnoor_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem('alnoor_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // User Profile
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveUserProfile(newProfile);
  };

  // Recitations list
  const [recitations, setRecitations] = useState<Recitation[]>(() => loadRecitations());
  const updateRecitationsState = (updatedList: Recitation[]) => {
    setRecitations(updatedList);
    saveRecitations(updatedList);
  };

  // Current View: null = Main View, or TabId = Tab Detail View
  const [activeTab, setActiveTab] = useState<TabId | null>(null);

  // Playback state
  const [currentRecitation, setCurrentRecitation] = useState<Recitation | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [initialSeekTime, setInitialSeekTime] = useState<number>(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playlist, setPlaylist] = useState<Recitation[]>([]);
  const [keepAwakeEnabled, setKeepAwakeEnabled] = useState<boolean>(true);

  // Screen Wake Lock
  const { isLocked: isWakeLocked } = useWakeLock(isPlaying, keepAwakeEnabled);

  // Last played tracking
  const [lastPlayedState, setLastPlayedState] = useState<LastPlayedState | null>(() => loadLastPlayed());

  // Find last played recitation item (from library or suggestions)
  const lastPlayedRecitation = useMemo(() => {
    if (!lastPlayedState?.recitationId) return null;
    const fromLibrary = recitations.find(r => r.id === lastPlayedState.recitationId);
    if (fromLibrary) return fromLibrary;
    // Check suggestions
    for (const t of TABS_ORDER) {
      const found = TAB_SUGGESTIONS[t]?.find(s => s.id === lastPlayedState.recitationId);
      if (found) return found;
    }
    return null;
  }, [lastPlayedState, recitations]);

  // Handle saving last played state periodically
  const handleTimeUpdate = (currentTime: number) => {
    if (currentRecitation) {
      const newState: LastPlayedState = {
        recitationId: currentRecitation.id,
        currentTime,
        tabId: activeTab || undefined,
        updatedAt: Date.now(),
      };
      setLastPlayedState(newState);
      saveLastPlayed(newState);
    }
  };

  // Start Playing a recitation
  const handlePlayRecitation = (rec: Recitation, tabId?: TabId, startFrom: number = 0) => {
    if (currentRecitation?.id === rec.id) {
      setIsPlaying(!isPlaying);
      return;
    }

    setInitialSeekTime(startFrom);
    setCurrentRecitation(rec);
    setIsPlaying(true);

    // Save as last played
    const newState: LastPlayedState = {
      recitationId: rec.id,
      currentTime: startFrom,
      tabId: tabId || (rec.tabs && rec.tabs[0]) || undefined,
      updatedAt: Date.now(),
    };
    setLastPlayedState(newState);
    saveLastPlayed(newState);

    // If item is not in playlist, add it as head
    if (!playlist.some(p => p.id === rec.id)) {
      setPlaylist(prev => [rec, ...prev]);
    }
  };

  // Resume last played
  const handleResumeLastPlayed = () => {
    if (lastPlayedRecitation) {
      handlePlayRecitation(lastPlayedRecitation, lastPlayedState?.tabId as TabId, lastPlayedState?.currentTime || 0);
    } else if (recitations.length > 0) {
      handlePlayRecitation(recitations[0]);
    } else {
      // Pick first suggestion from Tartil
      const sug = TAB_SUGGESTIONS.tartil[0];
      if (sug) handlePlayRecitation(sug, 'tartil');
    }
  };

  // Random Shuffle play across library or suggestions
  const handleShufflePlay = () => {
    let pool = [...recitations];
    if (pool.length === 0) {
      // Pool suggestions from all tabs
      pool = TABS_ORDER.flatMap(t => TAB_SUGGESTIONS[t] || []);
    }
    if (pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    handlePlayRecitation(chosen, chosen.tabs[0] || 'tartil', 0);
  };

  // Next Track in playlist or active tab
  const handleNextTrack = () => {
    if (playlist.length > 0 && currentRecitation) {
      const idx = playlist.findIndex(p => p.id === currentRecitation.id);
      if (idx !== -1 && idx < playlist.length - 1) {
        handlePlayRecitation(playlist[idx + 1]);
        return;
      } else if (repeatMode === 'playlist' && playlist.length > 0) {
        handlePlayRecitation(playlist[0]);
        return;
      }
    }

    // Fallback: next in current active tab or recitations
    const currentList = activeTab 
      ? recitations.filter(r => r.tabs?.includes(activeTab))
      : recitations;
    if (currentList.length > 1 && currentRecitation) {
      const idx = currentList.findIndex(r => r.id === currentRecitation.id);
      const nextIdx = (idx + 1) % currentList.length;
      handlePlayRecitation(currentList[nextIdx]);
    }
  };

  // Previous Track
  const handlePrevTrack = () => {
    if (playlist.length > 0 && currentRecitation) {
      const idx = playlist.findIndex(p => p.id === currentRecitation.id);
      if (idx > 0) {
        handlePlayRecitation(playlist[idx - 1]);
        return;
      }
    }

    const currentList = activeTab 
      ? recitations.filter(r => r.tabs?.includes(activeTab))
      : recitations;
    if (currentList.length > 1 && currentRecitation) {
      const idx = currentList.findIndex(r => r.id === currentRecitation.id);
      const prevIdx = (idx - 1 + currentList.length) % currentList.length;
      handlePlayRecitation(currentList[prevIdx]);
    }
  };

  // When a track naturally ends
  const handleTrackEnded = () => {
    if (repeatMode === 'track') {
      // Handled inside AudioPlayer seek(0) & play
      return;
    }
    if (repeatMode === 'playlist' || playlist.length > 1) {
      handleNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  // Recitation Actions
  const handleToggleFavorite = (id: string) => {
    const updated = recitations.map(r => {
      if (r.id === id) {
        return { ...r, isFavorite: !r.isFavorite };
      }
      return r;
    });
    updateRecitationsState(updated);
  };

  const handleAddToPlaylist = (rec: Recitation) => {
    if (!playlist.some(p => p.id === rec.id)) {
      setPlaylist(prev => [...prev, rec]);
    }
  };

  const handleRemoveFromPlaylist = (id: string) => {
    setPlaylist(prev => prev.filter(p => p.id !== id));
  };

  const handleClearPlaylist = () => {
    setPlaylist([]);
  };

  const handleShufflePlaylist = () => {
    const shuffled = [...playlist].sort(() => Math.random() - 0.5);
    setPlaylist(shuffled);
  };

  // Toggle Tab Assignment (Assign to another tab)
  const handleToggleTabAssignment = (recitationId: string, targetTabId: TabId) => {
    const updated = recitations.map(r => {
      if (r.id === recitationId) {
        const hasTab = r.tabs.includes(targetTabId);
        let newTabs = hasTab
          ? r.tabs.filter(t => t !== targetTabId)
          : [...r.tabs, targetTabId];
        if (newTabs.length === 0) newTabs = [targetTabId]; // keep at least one
        return { ...r, tabs: newTabs };
      }
      return r;
    });
    updateRecitationsState(updated);
  };

  // Custom Reorder in a Tab
  const handleReorderRecitation = (id: string, direction: 'up' | 'down') => {
    const currentTabRecs = recitations.filter(r => activeTab && r.tabs.includes(activeTab));
    const idx = currentTabRecs.findIndex(r => r.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentTabRecs.length) return;

    const itemA = currentTabRecs[idx];
    const itemB = currentTabRecs[targetIdx];

    const updated = recitations.map(r => {
      if (r.id === itemA.id) return { ...r, order: itemB.order || targetIdx };
      if (r.id === itemB.id) return { ...r, order: itemA.order || idx };
      return r;
    });
    updateRecitationsState(updated);
  };

  // Delete Recitation
  const handleDeleteRecitation = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه التلاوة؟')) {
      const updated = recitations.filter(r => r.id !== id);
      updateRecitationsState(updated);
      if (currentRecitation?.id === id) {
        setIsPlaying(false);
        setCurrentRecitation(null);
      }
      setPlaylist(prev => prev.filter(p => p.id !== id));
    }
  };

  // Add Suggestion to Tab
  const handleAddSuggestionToTab = (suggestion: Recitation, targetTab: TabId) => {
    const existing = recitations.find(r => r.id === suggestion.id);
    if (existing) {
      if (!existing.tabs.includes(targetTab)) {
        handleToggleTabAssignment(existing.id, targetTab);
      }
      return;
    }
    const newRec: Recitation = {
      ...suggestion,
      tabs: [targetTab],
      order: Date.now(),
      createdAt: Date.now(),
    };
    updateRecitationsState([newRec, ...recitations]);
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTargetTab, setModalTargetTab] = useState<TabId>('tartil');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecitation, setEditingRecitation] = useState<Recitation | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPlaylistDrawerOpen, setIsPlaylistDrawerOpen] = useState(false);

  const handleOpenAddModal = (tabId?: TabId) => {
    setModalTargetTab(tabId || activeTab || 'tartil');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (rec: Recitation) => {
    setEditingRecitation(rec);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedRecitation = (updated: Recitation) => {
    const list = recitations.map(r => (r.id === updated.id ? updated : r));
    updateRecitationsState(list);
    if (currentRecitation?.id === updated.id) {
      setCurrentRecitation(updated);
    }
  };

  const handleAddRecitation = (newRec: Recitation) => {
    updateRecitationsState([newRec, ...recitations]);
  };

  const handleImportRecitations = (importedList: Recitation[]) => {
    // Merge without duplicates
    const existingIds = new Set(recitations.map(r => r.id));
    const toAdd = importedList.filter(r => !existingIds.has(r.id));
    updateRecitationsState([...toAdd, ...recitations]);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors selection:bg-amber-200 selection:text-amber-950">
      {/* Top Bar Contract Navbar */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        profile={profile}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {activeTab ? (
          /* View 2: Dedicated Tab Detail View (Opens when clicking any of the 4 tabs) */
          <TabDetailView
            tabId={activeTab}
            onBack={() => setActiveTab(null)}
            recitations={recitations}
            onPlayRecitation={(rec, tab) => handlePlayRecitation(rec, tab || activeTab)}
            currentRecitation={currentRecitation}
            isPlaying={isPlaying}
            onToggleFavorite={handleToggleFavorite}
            onAddToPlaylist={handleAddToPlaylist}
            playlist={playlist}
            onOpenPlaylist={() => setIsPlaylistDrawerOpen(true)}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onDeleteRecitation={handleDeleteRecitation}
            onToggleTabAssignment={handleToggleTabAssignment}
            repeatMode={repeatMode}
            onSetRepeatMode={setRepeatMode}
            onReorderRecitation={handleReorderRecitation}
            onAddSuggestionToTab={handleAddSuggestionToTab}
          />
        ) : (
          /* View 1: Main View (Simple, clean, quotes + quick playback + 4 tabs only!) */
          <div className="space-y-6">
            {/* 1. Top Section: Quotes about Quran */}
            <QuoteSection />

            {/* Quick Playback Bar: Shuffle & Continue Last Played */}
            <MainQuickActions
              onShufflePlay={handleShufflePlay}
              onResumeLastPlayed={handleResumeLastPlayed}
              lastPlayedRecitation={lastPlayedRecitation}
              isPlaying={isPlaying}
              currentRecitation={currentRecitation}
              totalRecitations={recitations.length}
              favoritesCount={recitations.filter(r => r.isFavorite).length}
            />

            {/* 2. Original Tabs Section: 4 Distinct Tabs (Tartil, Tajweed, Haflat, Qira'at) */}
            <TabsGateway
              onSelectTab={(tabId) => setActiveTab(tabId)}
              recitations={recitations}
            />
          </div>
        )}
      </main>

      {/* Persistent Audio Player Bar */}
      <AudioPlayer
        currentRecitation={currentRecitation}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        repeatMode={repeatMode}
        onSetRepeatMode={setRepeatMode}
        onOpenPlaylist={() => setIsPlaylistDrawerOpen(true)}
        playlistCount={playlist.length}
        isWakeLocked={isWakeLocked}
        keepAwakeEnabled={keepAwakeEnabled}
        onToggleKeepAwake={() => setKeepAwakeEnabled(!keepAwakeEnabled)}
        onTrackEnd={handleTrackEnded}
        onTimeUpdate={handleTimeUpdate}
        initialTime={initialSeekTime}
      />

      {/* Add Recitation Modal */}
      <AddRecitationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialTabId={modalTargetTab}
        onAddRecitation={handleAddRecitation}
      />

      {/* Edit Recitation Modal */}
      {editingRecitation && (
        <EditRecitationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecitation(null);
          }}
          recitation={editingRecitation}
          onSave={handleSaveEditedRecitation}
        />
      )}

      {/* User Account / Profile Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        recitations={recitations}
        onImportRecitations={handleImportRecitations}
        onPlayRecitation={(rec) => handlePlayRecitation(rec, rec.tabs[0])}
      />

      {/* Playlist Queue Drawer */}
      <PlaylistDrawer
        isOpen={isPlaylistDrawerOpen}
        onClose={() => setIsPlaylistDrawerOpen(false)}
        playlist={playlist}
        currentRecitation={currentRecitation}
        isPlaying={isPlaying}
        onPlayRecitation={(rec) => handlePlayRecitation(rec)}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        onClearPlaylist={handleClearPlaylist}
        onShufflePlaylist={handleShufflePlaylist}
        repeatMode={repeatMode}
        onSetRepeatMode={setRepeatMode}
      />
    </div>
  );
}
