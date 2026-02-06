import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface PublicRouteProps {
 children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
 const { session, loading } = useAuth();

 if (loading) {
  return (
   <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
   </div>
  );
 }

 if (session) {
  // If user is already authenticated, redirect to dashboard (root)
  return <Navigate to="/" replace />;
 }

 return <>{children}</>;
}
