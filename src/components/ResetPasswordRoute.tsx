import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ResetPassword from "../pages/ResetPassword";

export function ResetPasswordRoute() {
 const { session, loading, isPasswordRecovery } = useAuth();

 if (loading) {
  return (
   <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
   </div>
  );
 }

 // Only show the reset form if the user arrived via a PASSWORD_RECOVERY event
 if (session && isPasswordRecovery) {
  return <ResetPassword />;
 }

 // Authenticated but not in recovery flow — go to dashboard
 if (session) {
  return <Navigate to="/" replace />;
 }

 // Not authenticated — go to login
 return (
  <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", textAlign: "center" }}>
   <h2>Access Denied</h2>
   <p>This page is only accessible through a password reset email.</p>
   <p>Please request a password reset from the login page.</p>
   <button
    onClick={() => (window.location.href = "/login")}
    style={{
     background: "#007bff",
     color: "white",
     border: "none",
     padding: "12px 24px",
     borderRadius: "4px",
     cursor: "pointer",
     marginTop: "20px",
    }}>
    Go to Login
   </button>
  </div>
 );
}
