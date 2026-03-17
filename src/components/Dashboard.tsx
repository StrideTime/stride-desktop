import { useAuth } from '../contexts/AuthContext';
import { WorkspaceManager } from './WorkspaceManager';
import { ProjectManager } from './ProjectManager';
import { TaskManager } from './TaskManager';

export function Dashboard() {
  const { session, signOut } = useAuth();
  const user = session?.user;

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
          <WorkspaceManager />
        </div>

        {/* Project Management - Testing Database Functionality */}
        <div className="projects-section">
          <ProjectManager />
        </div>

        {/* Task Management - Testing Database Functionality */}
        <div className="tasks-section">
          <TaskManager />
        </div>
      </div>
    </div>
  );
}
