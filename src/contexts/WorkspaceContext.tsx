import { createContext, useContext, useState, ReactNode } from 'react';
import type { Workspace, Team } from '@stridetime/types';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  currentTeam: Team | null;
  setWorkspace: (workspace: Workspace | null) => void;
  setTeam: (team: Team | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  const setWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspace(workspace);
    // Clear team when workspace changes
    if (workspace === null) {
      setCurrentTeam(null);
    }
  };

  const setTeam = (team: Team | null) => {
    setCurrentTeam(team);
  };

  const value = {
    currentWorkspace,
    currentTeam,
    setWorkspace,
    setTeam,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
