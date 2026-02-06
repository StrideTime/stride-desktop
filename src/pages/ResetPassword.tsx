import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ResetPassword() {
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState(false);

 const { updatePassword, signOut } = useAuth();
 const navigate = useNavigate();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (newPassword !== confirmPassword) {
   setError("Passwords do not match");
   return;
  }

  if (newPassword.length < 8) {
   setError("Password must be at least 8 characters long");
   return;
  }

  setIsSubmitting(true);
  setError("");

  try {
   // For password reset, we don't need the token parameter
   // Supabase has already verified the user and they're signed in
   await updatePassword(newPassword);
   // Sign out after password change for security
   await signOut();
   setSuccess(true);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to reset password");
  } finally {
   setIsSubmitting(false);
  }
 };

 if (success) {
  return (
   <div style={{ maxWidth: "400px", margin: "50px auto", padding: "40px", textAlign: "center" }}>
    <div
     style={{
      width: "80px",
      height: "80px",
      background: "#10b981",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px",
     }}>
     <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
     </svg>
    </div>
    <h2 style={{ color: "#1f2937", marginBottom: "16px" }}>Password Reset Successful!</h2>
    <p style={{ color: "#6b7280", marginBottom: "24px" }}>
     Your password has been successfully changed. You can now sign in with your new password.
    </p>
    <button
     onClick={() => navigate("/login")}
     style={{
      background: "#007bff",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      transition: "background 0.2s",
     }}
     onMouseOver={(e) => (e.currentTarget.style.background = "#0056b3")}
     onMouseOut={(e) => (e.currentTarget.style.background = "#007bff")}>
     Sign In with New Password
    </button>
   </div>
  );
 }

 return (
  <div style={{ maxWidth: "400px", margin: "50px auto", padding: "40px" }}>
   <div style={{ textAlign: "center", marginBottom: "32px" }}>
    <div
     style={{
      width: "80px",
      height: "80px",
      background: "#007bff",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px",
     }}>
     <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
     </svg>
    </div>
    <h2 style={{ color: "#1f2937", marginBottom: "8px" }}>Reset Your Password</h2>
    <p style={{ color: "#6b7280", margin: 0 }}>
     Enter your new password below to secure your account.
    </p>
   </div>

   {error && (
    <div
     style={{
      background: "#fef2f2",
      color: "#dc2626",
      padding: "16px",
      borderRadius: "8px",
      marginBottom: "24px",
      border: "1px solid #fecaca",
     }}>
     <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <svg
       width="20"
       height="20"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       strokeWidth="2">
       <circle cx="12" cy="12" r="10" />
       <line x1="12" y1="8" x2="12" y2="12" />
       <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {error}
     </div>
    </div>
   )}

   <form onSubmit={handleSubmit}>
    <div style={{ marginBottom: "20px" }}>
     <label
      style={{
       display: "block",
       marginBottom: "8px",
       fontWeight: "500",
       color: "#374151",
      }}>
      New Password
     </label>
     <input
      type="password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      required
      placeholder="Enter your new password"
      minLength={8}
      style={{
       width: "100%",
       padding: "12px 16px",
       border: "1px solid #d1d5db",
       borderRadius: "8px",
       fontSize: "16px",
       transition: "border-color 0.2s",
       boxSizing: "border-box",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#007bff")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
     />
     <p
      style={{
       fontSize: "14px",
       color: "#6b7280",
       marginTop: "4px",
       margin: "4px 0 0 0",
      }}>
      Must be at least 8 characters long
     </p>
    </div>

    <div style={{ marginBottom: "32px" }}>
     <label
      style={{
       display: "block",
       marginBottom: "8px",
       fontWeight: "500",
       color: "#374151",
      }}>
      Confirm New Password
     </label>
     <input
      type="password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      required
      placeholder="Confirm your new password"
      minLength={8}
      style={{
       width: "100%",
       padding: "12px 16px",
       border: "1px solid #d1d5db",
       borderRadius: "8px",
       fontSize: "16px",
       transition: "border-color 0.2s",
       boxSizing: "border-box",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#007bff")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
     />
    </div>

    <button
     type="submit"
     disabled={isSubmitting}
     style={{
      width: "100%",
      background: isSubmitting ? "#9ca3af" : "#007bff",
      color: "white",
      border: "none",
      padding: "14px 24px",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "500",
      cursor: isSubmitting ? "not-allowed" : "pointer",
      transition: "background 0.2s",
      boxSizing: "border-box",
     }}>
     {isSubmitting ? "Resetting..." : "Reset Password"}
    </button>
   </form>
  </div>
 );
}
