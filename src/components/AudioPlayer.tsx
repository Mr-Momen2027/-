import React, { useEffect, useRef, useState } from 'react';
import { Recitation, RepeatMode } from '../types';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Repeat1, ListMusic, Moon, Clock, 
  Sparkles, Youtube, Check, Waves, Droplets, Wind, Bird, X
} from 'lucide-react';
import { ambientSound, AmbientSoundType } from '../utils/ambientAudio';

interface AudioPlayerProps {
  currentRecitation: Recitation | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  repeatMode: RepeatMode;
  onSetRepeatMode: (mode: RepeatMode) => void;
  onOpenPlaylist: () => void;
  playlistCount: number;
  isWakeLocked: boolean;
  keepAwakeEnabled: boolean;
  onToggleKeepAwake: () => void;
  onTrackEnd: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  initialTime?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentRecitation,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  repeatMode,
  onSetRepeatMode,
  onOpenPlaylist,
  playlistCount,
  isWakeLocked,
  keepAwakeEnabled,
  onToggleKeepAwake,
  onTrackEnd,
  onTimeUpdate,
  initialTime = 0,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Sleep Timer state
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [stopAtEndOfTrack, setStopAtEndOfTrack] = useState<boolean>(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepToast, setSleepToast] = useState<string | null>(null);

  // Ambient Natural White Noise state
  const [ambientType, setAmbientType] = useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);
  const [isAmbientModalOpen, setIsAmbientModalOpen] = useState<boolean>(false);

  // Is YouTube source
  const isYouTube = currentRecitation?.sourceType === 'youtube' && !!currentRecitation.youtubeId;

  // Setup HTML5 Audio
  useEffect(() => {
    if (!currentRecitation || isYouTube) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = currentRecitation.sourceUrl;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;

    if (initialTime > 0) {
      audio.currentTime = initialTime;
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentRecitation.duration || 0);
      if (isPlaying) {
        audio.play().catch(e => console.warn('Audio play failed:', e));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime);
      }
    };

    const handleEnded = () => {
      if (stopAtEndOfTrack) {
        setStopAtEndOfTrack(false);
        setSleepToast('تم إيقاف التلاوة بموجب مؤقت النوم (نهاية التلاوة)');
        setTimeout(() => setSleepToast(null), 4000);
        onTogglePlay();
        return;
      }
      if (repeatMode === 'track') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        onTrackEnd();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      audio.play().catch(e => console.warn('Audio play failed:', e));
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentRecitation?.id, currentRecitation?.sourceUrl, isYouTube, stopAtEndOfTrack]);

  // Sync play/pause with HTML5 Audio
  useEffect(() => {
    if (isYouTube) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(e => console.warn('Audio play error:', e));
    } else {
      audio.pause();
    }
  }, [isPlaying, isYouTube]);

  // Sync volume and speed
  useEffect(() => {
    if (audioRef.current && !isYouTube) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate, isYouTube]);

  // Sync Ambient Natural Sound
  useEffect(() => {
    if (ambientType !== 'none') {
      ambientSound.setSound(ambientType, ambientVolume);
    } else {
      ambientSound.stopCurrent();
    }
    return () => {
      ambientSound.stopCurrent();
    };
  }, [ambientType]);

  useEffect(() => {
    if (ambientType !== 'none') {
      ambientSound.setVolume(ambientVolume);
    }
  }, [ambientVolume, ambientType]);

  // YouTube postMessage controls
  useEffect(() => {
    if (!isYouTube || !ytIframeRef.current) return;
    const iframe = ytIframeRef.current;

    const sendYTCommand = (func: string, args: any[] = []) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    };

    if (isPlaying) {
      sendYTCommand('playVideo');
    } else {
      sendYTCommand('pauseVideo');
    }
    sendYTCommand('setVolume', [isMuted ? 0 : volume * 100]);
    sendYTCommand('setPlaybackRate', [playbackRate]);
  }, [isPlaying, isYouTube, volume, isMuted, playbackRate]);

  // Listen to YouTube postMessage events for duration & time
  useEffect(() => {
    if (!isYouTube) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event === 'infoDelivery' && data.info) {
          if (data.info.duration) setDuration(data.info.duration);
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
            if (onTimeUpdate) onTimeUpdate(data.info.currentTime);
          }
          if (data.info.playerState === 0) {
            // Ended
            if (stopAtEndOfTrack) {
              setStopAtEndOfTrack(false);
              setSleepToast('تم إيقاف التلاوة بموجب مؤقت النوم (نهاية التلاوة)');
              setTimeout(() => setSleepToast(null), 4000);
              onTogglePlay();
              return;
            }
            if (repeatMode === 'track') {
              ytIframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
                '*'
              );
              ytIframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
                '*'
              );
            } else {
              onTrackEnd();
            }
          }
        }
      } catch {
        // ignore non-json messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isYouTube, repeatMode, stopAtEndOfTrack]);

  // Sleep timer ticker countdown
  useEffect(() => {
    if (!sleepTimerMinutes) {
      setSleepTimerRemaining(null);
      return;
    }

    setSleepTimerRemaining(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setSleepTimerMinutes(null);
          if (isPlaying) {
            onTogglePlay(); // pause recitation
          }
          ambientSound.stopCurrent();
          setAmbientType('none');
          setSleepToast('تم إيقاف التلاوة تلقائياً بموجب مؤقت النوم.');
          setTimeout(() => setSleepToast(null), 5000);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (isYouTube && ytIframeRef.current) {
      ytIframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [newTime, true] }),
        '*'
      );
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  const cycleRepeat = () => {
    const nextMode: RepeatMode = 
      repeatMode === 'off' ? 'track' : repeatMode === 'track' ? 'playlist' : 'off';
    onSetRepeatMode(nextMode);
  };

  const cancelSleepTimer = () => {
    setSleepTimerMinutes(null);
    setSleepTimerRemaining(null);
    setStopAtEndOfTrack(false);
  };

  if (!currentRecitation) return null;

  return (
    <>
      {/* Hidden YouTube Audio-Only IFrame */}
      {isYouTube && (
        <div className="absolute -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none" aria-hidden="true">
          <iframe
            ref={ytIframeRef}
            src={`https://www.youtube.com/embed/${currentRecitation.youtubeId}?enablejsapi=1&autoplay=1&controls=0&origin=${window.location.origin}`}
            allow="autoplay"
            title="Audio Source"
          />
        </div>
      )}

      {/* Floating Notification Toast */}
      {sleepToast && (
        <div className="fixed bottom-24 right-1/2 translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-amber-900/90 text-amber-100 text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 border border-amber-500/30">
          <Clock className="w-4 h-4 text-amber-300" />
          <span>{sleepToast}</span>
        </div>
      )}

      {/* Persistent Bottom Fixed Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 shadow-xl px-4 py-2.5 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col gap-1.5">
          {/* Active Sleep Timer Countdown Ribbon */}
          {(sleepTimerRemaining !== null || stopAtEndOfTrack) && (
            <div className="flex items-center justify-between px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300/40 dark:border-amber-700/40 text-[11px] text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span className="font-semibold">
                  مؤقت النوم مفعّل: {stopAtEndOfTrack ? 'سيتوقف عند نهاية التلاوة الحالية' : `متبقي ${formatTime(sleepTimerRemaining || 0)} دقيقة`}
                </span>
              </div>
              <button
                onClick={cancelSleepTimer}
                className="text-stone-500 hover:text-red-600 dark:hover:text-red-400 font-medium underline"
              >
                إلغاء المؤقت
              </button>
            </div>
          )}

          {/* Progress Seek Bar */}
          <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-stone-500">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-600 hover:accent-amber-700"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            {/* Recitation Title & Info */}
            <div className="flex items-center gap-3 min-w-0 max-w-xs sm:max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                {isYouTube ? (
                  <Youtube className="w-5 h-5 text-red-600" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                    {currentRecitation.title}
                  </h4>
                  {isYouTube && (
                    <span className="text-[10px] text-stone-400 font-sans">(صوت)</span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  {currentRecitation.reciter} {currentRecitation.riwayah ? `· ${currentRecitation.riwayah}` : ''}
                </p>
              </div>
            </div>

            {/* Core Playback Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Repeat Mode Toggle */}
              <button
                onClick={cycleRepeat}
                className={`p-2 rounded-lg transition-colors ${
                  repeatMode !== 'off'
                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
                title={
                  repeatMode === 'track'
                    ? 'تكرار التلاوة الحالية فقط'
                    : repeatMode === 'playlist'
                    ? 'تكرار قائمة التشغيل'
                    : 'التكرار متوقف'
                }
              >
                {repeatMode === 'track' ? (
                  <Repeat1 className="w-4 h-4 text-amber-600" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>

              {/* Prev */}
              <button
                onClick={onPrev}
                className="p-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                title="التلاوة السابقة"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                onClick={onTogglePlay}
                className="w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={onNext}
                className="p-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                title="التلاوة التالية"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* Playback Rate / Speed */}
              <button
                onClick={cyclePlaybackRate}
                className="text-[11px] font-mono font-semibold px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                title="سرعة التلاوة"
              >
                {playbackRate}x
              </button>
            </div>

            {/* Right Utilities: Sleep Timer, Ambient White Noise, WakeLock, Volume, Playlist */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Natural White Noise / Ambience (خرير الماء / عصافير / بدون موسيقى) */}
              <div className="relative">
                <button
                  onClick={() => setIsAmbientModalOpen(!isAmbientModalOpen)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    ambientType !== 'none'
                      ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="أصوات الطبيعة والسكينة في الخلفية (بدون موسيقى)"
                >
                  <Waves className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="hidden md:inline text-[11px]">
                    {ambientType === 'none' ? 'أصوات الطبيعة' : ambientType === 'water' ? 'خرير الماء' : ambientType === 'birds' ? 'عصافير' : ambientType === 'rain' ? 'مطر' : 'نسيم'}
                  </span>
                </button>

                {/* Ambient Sound Popover */}
                {isAmbientModalOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-2xl p-3 text-xs space-y-2 z-50">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-stone-700">
                      <div className="flex items-center gap-1 font-bold text-stone-800 dark:text-stone-200">
                        <Waves className="w-3.5 h-3.5 text-teal-600" />
                        <span>أصوات طبيعية (بدون موسيقى)</span>
                      </div>
                      <button onClick={() => setIsAmbientModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {[
                        { type: 'water' as AmbientSoundType, label: 'خرير الماء والجدول الهادئ', icon: <Droplets className="w-3.5 h-3.5 text-blue-500" /> },
                        { type: 'birds' as AmbientSoundType, label: 'زقزقة العصافير الصباحية', icon: <Bird className="w-3.5 h-3.5 text-amber-500" /> },
                        { type: 'rain' as AmbientSoundType, label: 'هطول المطر الخفيف', icon: <Waves className="w-3.5 h-3.5 text-teal-500" /> },
                        { type: 'breeze' as AmbientSoundType, label: 'نسيم الرياح الهادئ', icon: <Wind className="w-3.5 h-3.5 text-stone-400" /> },
                        { type: 'none' as AmbientSoundType, label: 'إيقاف الصوت الطبيعي', icon: <X className="w-3.5 h-3.5 text-red-500" /> },
                      ].map((s) => (
                        <button
                          key={s.type}
                          onClick={() => {
                            setAmbientType(s.type);
                            if (s.type === 'none') setIsAmbientModalOpen(false);
                          }}
                          className={`w-full text-right px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                            ambientType === s.type
                              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {s.icon}
                            <span>{s.label}</span>
                          </span>
                          {ambientType === s.type && <Check className="w-3 h-3 text-teal-600" />}
                        </button>
                      ))}
                    </div>

                    {ambientType !== 'none' && (
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-700">
                        <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                          <span>درجة صوت الطبيعة:</span>
                          <span className="font-mono">{Math.round(ambientVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0.05}
                          max={0.8}
                          step={0.05}
                          value={ambientVolume}
                          onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                          className="w-full h-1 bg-stone-200 dark:bg-stone-700 rounded-lg accent-teal-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dedicated Sleep Timer Button & Popover (مؤقت النوم) */}
              <div className="relative">
                <button
                  onClick={() => setIsSleepModalOpen(!isSleepModalOpen)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    sleepTimerRemaining !== null || stopAtEndOfTrack
                      ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="مؤقت النوم لإيقاف التلاوة تلقائياً"
                >
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline text-[11px]">
                    {sleepTimerRemaining !== null ? `${Math.ceil(sleepTimerRemaining / 60)}د` : stopAtEndOfTrack ? 'نهاية السورة' : 'مؤقت النوم'}
                  </span>
                </button>

                {/* Sleep Timer Selector Popover */}
                {isSleepModalOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-2xl p-2.5 text-xs space-y-1.5 z-50">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-stone-700">
                      <div className="flex items-center gap-1 font-bold text-stone-800 dark:text-stone-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>مؤقت إيقاف التلاوة</span>
                      </div>
                      <button onClick={() => setIsSleepModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {[15, 30, 45, 60].map(mins => (
                        <button
                          key={mins}
                          onClick={() => {
                            setStopAtEndOfTrack(false);
                            setSleepTimerMinutes(mins);
                            setIsSleepModalOpen(false);
                          }}
                          className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                            sleepTimerMinutes === mins
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                        >
                          <span>بعد {mins} دقيقة</span>
                          {sleepTimerMinutes === mins && <Check className="w-3.5 h-3.5 text-amber-600" />}
                        </button>
                      ))}

                      {/* End of Current Recitation option */}
                      <button
                        onClick={() => {
                          setSleepTimerMinutes(null);
                          setStopAtEndOfTrack(true);
                          setIsSleepModalOpen(false);
                        }}
                        className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          stopAtEndOfTrack
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                        }`}
                      >
                        <span>عند نهاية التلاوة الحالية</span>
                        {stopAtEndOfTrack && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>
                    </div>

                    {(sleepTimerMinutes !== null || stopAtEndOfTrack) && (
                      <button
                        onClick={() => {
                          cancelSleepTimer();
                          setIsSleepModalOpen(false);
                        }}
                        className="w-full text-center py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px] font-semibold border border-red-200 dark:border-red-900/50 mt-1"
                      >
                        إلغاء مؤقت النوم
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Screen Wake Lock Status */}
              <button
                onClick={onToggleKeepAwake}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                  keepAwakeEnabled && isWakeLocked
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
                title={
                  keepAwakeEnabled
                    ? 'خاصية إبقاء الشاشة مفتوحة أثناء التلاوة (مفعلة)'
                    : 'إبقاء الشاشة مفتوحة (معطلة)'
                }
              >
                <Moon className="w-4 h-4" />
                <span className="hidden xl:inline text-[11px]">الشاشة مضاءة</span>
              </button>

              {/* Volume Slider (hidden on small mobile) */}
              <div className="hidden sm:flex items-center gap-1.5 text-stone-500">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="hover:text-stone-800 dark:hover:text-stone-200"
                  title={isMuted ? 'إلغاء الكتم' : 'كتم'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-14 sm:w-16 h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Playlist Drawer Button */}
              <button
                onClick={onOpenPlaylist}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs transition-colors"
                title="عرض قائمة التشغيل الحالية"
              >
                <ListMusic className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="tabular-nums font-semibold">{playlistCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
