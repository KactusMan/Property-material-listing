import { useEffect, useState } from 'react';

// 'light' (default), 'dark', or 'system' (follow the device). Stored per browser.
const KEY = 'mf_theme';
const THEMES = ['light', 'dark', 'system'];

export const readTheme = () => {
  try {
    const saved = localStorage.getItem(KEY);
    return THEMES.includes(saved) ? saved : 'light';
  } catch {
    return 'light';
  }
};

export const applyTheme = (theme = readTheme()) => {
  document.documentElement.dataset.theme = theme;
};

export function useTheme() {
  const [theme, setThemeState] = useState(readTheme);
  useEffect(() => {
    const sync = () => setThemeState(readTheme());
    window.addEventListener('mf-theme', sync);
    return () => window.removeEventListener('mf-theme', sync);
  }, []);
  const setTheme = (next) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Falls back to light on the next visit if storage is blocked.
    }
    applyTheme(next);
    window.dispatchEvent(new Event('mf-theme'));
  };
  return [theme, setTheme];
}
