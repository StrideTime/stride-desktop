import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { WorkspaceManager } from "./WorkspaceManager";
import { ProjectManager } from "./ProjectManager";
import { TaskManager } from "./TaskManager";
import "./Dashboard.css";

export function Dashboard() {
  const { session, signOut } = useAuth();
  const user = session?.user;

  // Refresh counters to trigger re-renders
  const [workspaceRefresh, setWorkspaceRefresh] = useState(0);
  const [projectRefresh, setProjectRefresh] = useState(0);
  const [taskRefresh, setTaskRefresh] = useState(0);

  const handleWorkspacesChange = () => {
    setWorkspaceRefresh(prev => prev + 1);
    setProjectRefresh(prev => prev + 1);
    setTaskRefresh(prev => prev + 1);
  };

  const handleProjectsChange = () => {
    setProjectRefresh(prev => prev + 1);
    setTaskRefresh(prev => prev + 1);
  };

  const handleTasksChange = () => {
    setTaskRefresh(prev => prev + 1);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to Stride</h1>
        <button onClick={signOut} className="sign-out-button">
          Sign Out
        </button>
      </div>

      <div className="dashboard-content">
        <div className="user-info-card">
          <h2>User Information</h2>
          <div className="user-details">
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>User ID:</strong> {user?.id}
            </p>
            <p>
              <strong>First Name:</strong> {user?.firstName || "Not set"}
            </p>
            <p>
              <strong>Last Name:</strong> {user?.lastName || "Not set"}
            </p>
          </div>
        </div>

        {/* Workspace Management - Testing Database Functionality */}
        <div className="workspaces-section">
          <WorkspaceManager
            key={`workspace-${workspaceRefresh}`}
            onWorkspacesChange={handleWorkspacesChange}
          />
        </div>

        {/* Project Management - Testing Database Functionality */}
        <div className="projects-section">
          <ProjectManager
            key={`project-${projectRefresh}`}
            onProjectsChange={handleProjectsChange}
          />
        </div>

        {/* Task Management - Testing Database Functionality */}
        <div className="tasks-section">
          <TaskManager
            key={`task-${taskRefresh}`}
            onTasksChange={handleTasksChange}
          />
        </div>
      </div>
    </div>
  );
}
