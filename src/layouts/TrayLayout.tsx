import { Outlet } from 'react-router-dom';

interface TrayLayoutProps {
  header?: React.ReactNode;
  children?: React.ReactNode;
}

export function TrayLayout({ header, children }: TrayLayoutProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Compact Header */}
      {header && (
        <header className="flex shrink-0 items-center border-b bg-card px-4 py-2">
          {header}
        </header>
      )}

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {children || <Outlet />}
      </main>
    </div>
  );
}
