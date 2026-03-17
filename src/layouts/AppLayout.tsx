import { Outlet } from 'react-router-dom';

interface AppLayoutProps {
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar — transparent so native vibrancy shows through */}
      {sidebar}

      {/* Main Content Area — opaque background covers vibrancy */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Draggable titlebar region (replaces OS titlebar) */}
        <div className="h-12 shrink-0" data-tauri-drag-region />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
