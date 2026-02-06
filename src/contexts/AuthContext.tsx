import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createAuthService } from "@stridetime/core";
import type { AuthSession, OAuthProvider } from "@stridetime/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
 throw new Error("Missing Supabase environment variables");
}

// Initialize auth service (provider is created inside stride-core)
const authService = createAuthService(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
 session: AuthSession | null;
 loading: boolean;
 isPasswordRecovery: boolean;
 signIn: (email: string, password: string) => Promise<void>;
 signUp: (
  email: string,
  password: string,
  metadata?: { first_name?: string; last_name?: string },
 ) => Promise<void>;
 signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
 signOut: () => Promise<void>;
 resetPassword: (email: string) => Promise<void>;
 updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
 const [session, setSession] = useState<AuthSession | null>(null);
 const [loading, setLoading] = useState(true);
 const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

 useEffect(() => {
  // Get initial session
  authService.getCurrentSession().then((session) => {
   setSession(session);
   setLoading(false);
  });

  // Listen for auth changes
  const unsubscribe = authService.onAuthChange((session, event) => {
   console.log("AuthContext - auth event:", event, "session:", !!session);
   setSession(session);
   setLoading(false);

   if (event === "PASSWORD_RECOVERY") {
    setIsPasswordRecovery(true);
   }
  });

  return () => unsubscribe();
 }, []);

 const signIn = async (email: string, password: string) => {
  const session = await authService.signIn(email, password);
  setSession(session);
 };

 const signUp = async (
  email: string,
  password: string,
  metadata?: { first_name?: string; last_name?: string },
 ) => {
  const session = await authService.signUp(email, password, {
   firstName: metadata?.first_name,
   lastName: metadata?.last_name,
  });
  setSession(session);
 };

 const signInWithOAuth = async (provider: OAuthProvider) => {
  await authService.signInWithOAuth(provider);
  // Session will be set via onAuthChange listener after OAuth redirect
 };

 const signOut = async () => {
  await authService.signOut();
  setSession(null);
 };

 const resetPassword = async (email: string) => {
  await authService.resetPassword(email, {
   redirectTo: `${window.location.origin}/reset-password`,
  });
  // Show success message to user
  alert("Password reset email sent! Check your inbox.");
 };

 const updatePassword = async (newPassword: string) => {
  await authService.updatePassword(newPassword);
  setIsPasswordRecovery(false);
 };

 const value = {
  session,
  loading,
  isPasswordRecovery,
  signIn,
  signUp,
  signInWithOAuth,
  signOut,
  resetPassword,
  updatePassword,
 };

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
 const context = useContext(AuthContext);
 if (context === undefined) {
  throw new Error("useAuth must be used within an AuthProvider");
 }
 return context;
}
