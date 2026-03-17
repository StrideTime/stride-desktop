import { useCallback, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/auth/Auth';
import { Dashboard } from './components/Dashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { ResetPasswordRoute } from './components/auth/ResetPasswordRoute';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { SplashScreen } from '@stridetime/ui';
import { AppLayout } from './layouts/AppLayout';
import { TrayLayout } from './layouts/TrayLayout';
import { Sidebar } from './components/navigation/Sidebar';
import { TodayView } from './pages/TodayView';
import { WeeklyPlanner } from './pages/WeeklyPlanner';
import { DailyPlanner } from './pages/DailyPlanner';
import { AllTasksView } from './pages/AllTasksView';
import { ProjectView } from './pages/ProjectView';
import { StatsView } from './pages/StatsView';
import { SettingsView } from './pages/SettingsView';
import { TrayPanel } from './pages/TrayPanel';
import { useTauriThemeSync } from './hooks/useTauriThemeSync';

/**
 * Detect whether this webview is the tray panel or the main window.
 * The tray-panel window loads at /tray (configured in tauri.conf.json).
 */
function isTrayWindow(): boolean {
  return window.location.pathname.startsWith('/tray');
}

export function App() {
  const { loading: authLoading } = useAuth();
  const [splashDone, setSplashDone] = useState(() => isTrayWindow());

  // Sync system theme changes via Tauri's native API
  useTauriThemeSync();

  const handleSplashComplete = useCallback(() => {
    setSplashDone(true);
  }, []);

  // Tray window — no splash screen, compact layout
  if (isTrayWindow()) {
    if (authLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    return (
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route
              path="/tray"
              element={
                <ProtectedRoute>
                  <TrayLayout>
                    <TrayPanel />
                  </TrayLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/tray" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    );
  }

  // Main window — full app with splash screen
  if (!splashDone) {
    return <SplashScreen loading={authLoading} onComplete={handleSplashComplete} />;
  }

  return (
    <>
      <Toaster />
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Public login route */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              }
            />

            {/* Reset password route */}
            <Route path="/reset-password" element={<ResetPasswordRoute />} />

            {/* Protected routes — wrapped in AppLayout with Sidebar */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<Sidebar />} />
                </ProtectedRoute>
              }
            >
              <Route path="/today" element={<TodayView />} />
              <Route path="/schedule/weekly" element={<WeeklyPlanner />} />
              <Route path="/schedule/daily" element={<DailyPlanner />} />
              <Route path="/tasks" element={<AllTasksView />} />
              <Route path="/project/:id" element={<ProjectView />} />
              <Route path="/stats" element={<StatsView />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Settings — own layout with SettingsSidebar replacing main Sidebar */}
            <Route
              path="/settings/*"
              element={
                <ProtectedRoute>
                  <SettingsView />
                </ProtectedRoute>
              }
            />

            {/* Root → redirect to today */}
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </>
  );
}
