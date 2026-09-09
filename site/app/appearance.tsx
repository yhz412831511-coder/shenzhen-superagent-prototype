'use client';
import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
export type Appearance = {
  theme: 'light' | 'dark';
  fontSize: 'standard' | 'large';
  reducedMotion: boolean;
};
export const initialAppearance: Appearance = {
  theme: 'light',
  fontSize: 'standard',
  reducedMotion: false,
};
const AppearanceContext = createContext<{
  value: Appearance;
  update: (next: Partial<Appearance>) => void;
} | null>(null);
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Appearance>(initialAppearance);
  useLayoutEffect(() => {
    const root = document.documentElement;
    // Theme colors switch atomically; hover transitions must not interpolate
    // old foregrounds over the new palette's backgrounds.
    root.dataset.themeChanging = 'true';
    root.dataset.theme = value.theme;
    root.dataset.fontSize = value.fontSize;
    root.dataset.reducedMotion = String(value.reducedMotion);
    root.classList.toggle('dark', value.theme === 'dark');
    const timer = window.setTimeout(() => {
      delete root.dataset.themeChanging;
    }, 160);
    return () => window.clearTimeout(timer);
  }, [value]);
  return (
    <AppearanceContext.Provider
      value={{
        value,
        update: (next) => setValue((old) => ({ ...old, ...next })),
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}
export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('AppearanceProvider required');
  return context;
}
