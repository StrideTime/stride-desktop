import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { ThemeProvider } from '@stridetime/ui';
import { PowerSyncProvider } from './contexts/PowerSyncProvider';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { TimerProvider } from './contexts/TimerContext';
import { App } from './App';
import { initAppDatabase } from './lib/db';
import './styles/fonts.css';
import './styles/tailwind.css';

// Import @stridetime/ui component styles (splash screen, etc.) AFTER
// tailwind.css so splash animations aren't overridden by Tailwind's base layer.
// Uses direct path since the package doesn't export CSS via package.json exports.
import '../node_modules/@stridetime/ui/dist/ui.css';

// Initialize Sentry if DSN provided
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_NODE_ENV || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Fire-and-forget database initialization.
// PowerSyncProvider polls for the DB instance and shows a spinner until ready,
// so React can mount immediately without waiting for the DB.
initAppDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
});

// TODO: Find a way to make this context tree not look so mid
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system">
      <PowerSyncProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <TimerProvider>
              <App />
            </TimerProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </PowerSyncProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
