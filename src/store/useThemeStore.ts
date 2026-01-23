import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  focusMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setFocusMode: (enabled: boolean) => void;
  toggleFocusMode: () => void;
}

const THEME_KEY = 'archflow_theme';

// Get initial theme from localStorage or system preference
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  focusMode: false,

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, newTheme);
    set({ theme: newTheme });
  },

  setFocusMode: (enabled) => {
    set({ focusMode: enabled });
  },

  toggleFocusMode: () => {
    set({ focusMode: !get().focusMode });
  },
}));
