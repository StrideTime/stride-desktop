import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createAuthService, connectSync, disconnectSync, isSyncEnabled, getSyncStatus } from "@stridetime/core";
import type { AuthSession, OAuthProvider } from "@stridetime/types";
import { supabaseClient, dbReady } from "../lib/db";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
 throw new Error("Missing Supabase environment variables");
}

// Initialize auth service with the shared Supabase client
const authService = createAuthService(supabaseUrl, supabaseAnonKey, supabaseClient);

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

 // TODO: make this less jank. Really hate this implementation
 const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

 useEffect(() => {
  // Get initial session
  authService.getCurrentSession().then(async (session) => {
   setSession(session);
   setLoading(false);
   // Sync connection is handled by the onAuthChange listener
   // (INITIAL_SESSION event) to avoid race conditions with DB init.
  });

  // Listen for auth changes
  const unsubscribe = authService.onAuthChange(async (session, event) => {
   setSession(session);
   setLoading(false);

   if (event === "PASSWORD_RECOVERY") {
    setIsPasswordRecovery(true);
   }

   // Connect sync when user signs in or has existing session on refresh.
   // INITIAL_SESSION fires on page refresh when a session already exists in localStorage.
   // SIGNED_IN fires on explicit sign-in or OAuth callback.
   // We must wait for the database to be initialized before checking isSyncEnabled(),
   // because syncEnabled is only set to true during initDatabase(), which may not
   // have been called yet when the auth event fires.
   if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
    console.log(`[AuthContext] Auth event: ${event}, user: ${session.user?.email}`);
    console.log('[AuthContext] Waiting for dbReady...');
    try {
     // TODO: Clean up the logic here. It is a little hairy and not entirely true from my understanding
     await dbReady;
     const syncStatus = getSyncStatus();
     console.log('[AuthContext] dbReady resolved. isSyncEnabled():', isSyncEnabled(), 'syncState:', syncStatus.state);
     if (isSyncEnabled() && syncStatus.state !== 'connected' && syncStatus.state !== 'connecting') {
      // in this case, powersync db is initialized, but the sync status hasn't been completed yet. 
      console.log('[AuthContext] Calling connectSync()...');
      await connectSync();
      console.log('[AuthContext] connectSync() complete ✓');
     } else if (syncStatus.state === 'connected' || syncStatus.state === 'connecting') {
      // in this case, powersync db is initialized, and sync is already connected
      console.log('[AuthContext] Sync already connected/connecting — skipping duplicate connectSync()');
     } else {
      console.warn('[AuthContext] Sync is NOT enabled — skipping connectSync()');
     }
    } catch (error) {
     console.error(`[AuthContext] Failed to connect sync (${event}):`, error);
    }
   }

   // TODO: Verify if this also tears down the local db or if there are any issues to consider with residue from previous user's local db on auth change
   // Disconnect sync when user signs out
   if (!session && event === "SIGNED_OUT") {
    try {
     await disconnectSync();
    } catch (error) {
     console.error("Failed to disconnect sync after sign out:", error);
    }
   }
  });

  return () => unsubscribe();
 }, []);

 const signIn = async (email: string, password: string) => {
  const session = await authService.signIn(email, password);
  setSession(session);
 };

 // TODO: Check if this does in fact force creata a new user in the users table. 
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
  // Disconnect sync before signing out to ensure clean shutdown
  if (isSyncEnabled()) {
   try {
    await disconnectSync();
   } catch (error) {
    console.error("Failed to disconnect sync on sign out:", error);
   }
  }
  await authService.signOut();
  setSession(null);
 };

 const resetPassword = async (email: string) => {
  await authService.resetPassword(email, {
   redirectTo: `${window.location.origin}/reset-password`,
  });
 };

 // TODO: determine if I should keep this or only have a reset password option
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
