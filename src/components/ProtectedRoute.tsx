import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
 children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
 const { session, loading, isPasswordRecovery } = useAuth();
 const location = useLocation();

 if (loading) {
  return (
   <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
   </div>
  );
 }

 // If in password recovery flow, redirect to reset page instead of dashboard
 if (isPasswordRecovery) {
  return <Navigate to="/reset-password" replace />;
 }

 if (!session) {
  // Redirect to login page but save the attempted location
  return <Navigate to="/login" state={{ from: location }} replace />;
 }

 return <>{children}</>;
}
