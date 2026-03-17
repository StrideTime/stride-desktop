import { initDatabase } from "@stridetime/core";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Single shared Supabase client instance.
 * Used by both the auth provider and the PowerSync connector to avoid
 * multiple GoTrueClient instances fighting over the same localStorage key.
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

let dbInitialized = false;
let dbReadyResolve: () => void;

/**
 * Promise that resolves once the database has been initialized.
 * Useful for code that needs to wait for the DB before proceeding
 * (e.g. connecting PowerSync after an auth event on page refresh).
 */
export const dbReady = new Promise<void>((resolve) => {
 dbReadyResolve = resolve;
});

// TODO: make this function less fragile. Research ways to make it more reliable
export async function initAppDatabase() {
 console.log('[initAppDatabase] Called, dbInitialized:', dbInitialized);
 if (dbInitialized) return;

 // Get public config from Vite env (safe to expose)
 const localOnly = import.meta.env.VITE_LOCAL_ONLY === "true";
 console.log('[initAppDatabase] Config:', {
  localOnly,
  supabaseUrl,
  powersyncUrl: import.meta.env.VITE_POWERSYNC_URL,
  hasAnonKey: !!supabaseAnonKey,
 });

 if (localOnly) {
  // Local-only mode: just SQLite
  console.log('[initAppDatabase] Starting in LOCAL-ONLY mode');
  await initDatabase({
   enableSync: false,
   dbFilename: "stride.db",
  });
 } else {
  // Cloud sync mode: Supabase + PowerSync
  console.log('[initAppDatabase] Starting in CLOUD SYNC mode');
  await initDatabase({
   enableSync: true,
   supabaseUrl,
   supabaseAnonKey,
   powersyncUrl: import.meta.env.VITE_POWERSYNC_URL,
   dbFilename: "stride.db",
   supabaseClient,
  });
 }

 dbInitialized = true;
 dbReadyResolve();
 console.log('[initAppDatabase] Complete ✓, dbReady resolved');
}
