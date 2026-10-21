import { useEffect, useRef, useState } from 'react';

export function useWakeLock(isPlaying: boolean, userPrefersAwake: boolean = true) {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  useEffect(() => {
    if (!isSupported || !userPrefersAwake) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        setIsLocked(false);
      }
      return;
    }

    let active = true;

    async function requestLock() {
      try {
        if (isPlaying && !wakeLockRef.current && 'wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          if (active) {
            wakeLockRef.current = lock;
            setIsLocked(true);

            lock.addEventListener('release', () => {
              if (active) {
                wakeLockRef.current = null;
                setIsLocked(false);
              }
            });
          } else {
            lock.release().catch(() => {});
          }
        }
      } catch (err) {
        // WakeLock can fail if battery saver is on or document not visible
        console.warn('Wake Lock error:', err);
      }
    }

    if (isPlaying) {
      requestLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        setIsLocked(false);
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && userPrefersAwake) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        setIsLocked(false);
      }
    };
  }, [isPlaying, userPrefersAwake, isSupported]);

  return { isLocked, isSupported };
}
