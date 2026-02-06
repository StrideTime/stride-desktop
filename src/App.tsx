import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Auth } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { ResetPasswordRoute } from "./components/ResetPasswordRoute";
import { initAppDatabase } from "./lib/db";
import "./App.css";

function App() {
 const { loading: authLoading } = useAuth();
 const [dbInitialized, setDbInitialized] = useState(false);

 useEffect(() => {
  // Initialize database on app start
  initAppDatabase()
   .then(() => {
    console.log("Database initialized successfully");
    setDbInitialized(true);
   })
   .catch((error) => {
    console.error("Failed to initialize database:", error);
    // Still set as initialized to allow app to load (can retry later)
    setDbInitialized(true);
   });
 }, []);

 const loading = authLoading || !dbInitialized;

 if (loading) {
  return (
   <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
   </div>
  );
 }

 return (
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

    {/* Reset password route - only accessible with valid token */}
    <Route path="/reset-password" element={<ResetPasswordRoute />} />

    {/* Protected dashboard route - root path */}
    <Route
     path="/"
     element={
      <ProtectedRoute>
       <Dashboard />
      </ProtectedRoute>
     }
    />

    {/* Catch all - redirect to home */}
    <Route path="*" element={<Navigate to="/" replace />} />
   </Routes>
  </Router>
 );
}

export default App;
