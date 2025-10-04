import React from 'react';
import { Moon, Sun } from 'lucide-react';

type LayoutVariant = 'light' | 'dark' | 'auto';

interface LayoutProps {
  children: React.ReactNode;
  variant?: LayoutVariant;
}

const getPreferredScheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const STORAGE_KEY = 'klycs-theme-override';

type ThemeContextValue = {
  variant: 'light' | 'dark';
  systemVariant: 'light' | 'dark';
  userOverride: 'light' | 'dark' | null;
  toggleTheme: () => void;
  resetTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export const useLayoutTheme = () => {
  const value = React.useContext(ThemeContext);
  if (!value) {
    throw new Error('useLayoutTheme must be used within Layout');
  }
  return value;
};

export const Layout: React.FC<LayoutProps> = ({ children, variant = 'light' }) => {
  const [systemScheme, setSystemScheme] = React.useState<'light' | 'dark'>(() => getPreferredScheme());
  const [userOverride, setUserOverride] = React.useState<'light' | 'dark' | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  });

  React.useEffect(() => {
    if (variant !== 'auto') {
      setSystemScheme(variant === 'dark' ? 'dark' : 'light');
      return;
    }

    if (typeof window === 'undefined') {
      setSystemScheme('light');
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemScheme(mediaQuery.matches ? 'dark' : 'light');
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [variant]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (userOverride) {
      window.localStorage.setItem(STORAGE_KEY, userOverride);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [userOverride]);

  const baseVariant: 'light' | 'dark' = variant === 'auto' ? systemScheme : variant === 'dark' ? 'dark' : 'light';
  const resolvedVariant = userOverride ?? baseVariant;
  const isDark = resolvedVariant === 'dark';

  const containerClass = isDark
    ? 'min-h-screen bg-[#05070f] text-white'
    : 'min-h-screen bg-[#f8f6f2] text-neutral-900';

  const contentClass = isDark
    ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white'
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';

  const toggleTheme = () => {
    setUserOverride(prev => {
      const current = prev ?? resolvedVariant;
      return current === 'dark' ? 'light' : 'dark';
    });
  };

  const resetTheme = () => {
    setUserOverride(null);
  };

  const toggleButtonClass = isDark
    ? 'flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20'
    : 'flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-100';

  const resetButtonClass = isDark
    ? 'flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10'
    : 'flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100/80 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200';

  const showReset = variant === 'auto' && userOverride !== null;

  return (
    <ThemeContext.Provider
      value={{
        variant: resolvedVariant,
        systemVariant: systemScheme,
        userOverride,
        toggleTheme,
        resetTheme,
      }}
    >
      <div className={containerClass} data-theme={resolvedVariant}>
        <div className="pointer-events-none fixed top-4 right-4 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={`${toggleButtonClass} pointer-events-auto`}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{isDark ? 'Claro' : 'Oscuro'}</span>
          </button>
          {showReset && (
            <button
              type="button"
              onClick={resetTheme}
              className={`${resetButtonClass} pointer-events-auto`}
              aria-label="Volver al tema del sistema"
            >
              Sistema
            </button>
          )}
        </div>
        <main className={contentClass}>
          {children}
        </main>
      </div>
    </ThemeContext.Provider>
  );
};
