import { useState, useEffect, useCallback } from 'react';

export type JoystickPreference = 'auto' | 'always_on' | 'always_off';

const PREFERENCE_KEY = 'zombie_arena_joystick_mode';

/**
 * Checks if the current environment is a mobile phone, tablet, or coarse-pointer touch device.
 */
export function detectIsMobileOrTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check User Agent for mobile/tablet devices
  const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
  const isMobileUa = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  if (isMobileUa) return true;

  // 2. iPadOS masquerading as Mac (iPad on iOS 13+ reports MacIntel but has maxTouchPoints > 1)
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (isIPadOS) return true;

  // 3. Pointer type query: pointer coarse implies touch screen device (phone/tablet)
  if (typeof window.matchMedia === 'function') {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hoverNone = window.matchMedia('(hover: none)').matches;
    if (coarsePointer && hoverNone) {
      return true;
    }
  }

  // 4. Touch support detection
  const hasTouchCapability = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  // If it has touch capability and screen width is smaller than typical desktop monitor, treat as mobile/tablet
  if (hasTouchCapability && window.innerWidth <= 1024) {
    return true;
  }

  return false;
}

export function getSavedJoystickPreference(): JoystickPreference {
  if (typeof localStorage === 'undefined') return 'auto';
  const saved = localStorage.getItem(PREFERENCE_KEY);
  if (saved === 'always_on' || saved === 'always_off' || saved === 'auto') {
    return saved;
  }
  return 'auto';
}

export function saveJoystickPreference(pref: JoystickPreference): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PREFERENCE_KEY, pref);
  }
}

/**
 * React hook to reactively manage device detection and joystick visibility.
 */
export function useDeviceInput() {
  const [isMobileOrTouch, setIsMobileOrTouch] = useState<boolean>(() => detectIsMobileOrTouchDevice());
  const [preference, setPreferenceState] = useState<JoystickPreference>(() => getSavedJoystickPreference());

  // Listen for real touch events to dynamically upgrade to touch mode (e.g., hybrid laptops or devtools mode)
  useEffect(() => {
    const handleTouchStart = () => {
      setIsMobileOrTouch(true);
    };

    const handleResize = () => {
      setIsMobileOrTouch(detectIsMobileOrTouchDevice());
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true, once: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const setPreference = useCallback((newPref: JoystickPreference) => {
    setPreferenceState(newPref);
    saveJoystickPreference(newPref);
  }, []);

  // Compute effective visibility
  const showJoystick =
    preference === 'always_on' ? true : preference === 'always_off' ? false : isMobileOrTouch;

  return {
    isMobileOrTouch,
    isDesktop: !isMobileOrTouch,
    showJoystick,
    preference,
    setPreference,
  };
}
