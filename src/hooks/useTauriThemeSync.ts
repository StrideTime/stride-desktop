import { useEffect } from 'react';
import { useTheme } from '@stridetime/ui';

/**
 * Detect whether we're running inside the Tauri shell (as opposed to a
 * plain browser tab).  Tauri injects `window.__TAURI_INTERNALS__`.
 */
const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Syncs macOS system theme changes into the ThemeProvider.
 *
 * The shared ThemeProvider uses `window.matchMedia` which may not
 * fire reliably in Tauri's WKWebView. This hook uses Tauri's native
 * `onThemeChanged` listener as the authoritative source when the
 * user's theme preference is set to "system".
 *
 * When running in a plain browser (dev server without Tauri) the hook
 * is a no-op so it doesn't crash on missing Tauri APIs.
 */
export function useTauriThemeSync() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme !== 'system' || !isTauri) return;

    let unlisten: (() => void) | undefined;

    // Dynamic import so the module is never evaluated in a browser context
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      getCurrentWindow()
        .onThemeChanged(({ payload }) => {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(payload);
        })
        .then(fn => {
          unlisten = fn;
        });
    });

    return () => unlisten?.();
  }, [theme]);
}
