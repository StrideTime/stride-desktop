import { initDatabase } from "@stridetime/core";

let dbInitialized = false;

export async function initAppDatabase() {
 console.log("Initializing database...");
 if (dbInitialized) return;

 // Get public config from Vite env (safe to expose)
 const localOnly = import.meta.env.VITE_LOCAL_ONLY === "true";

 if (localOnly) {
  // Local-only mode: just SQLite
  await initDatabase({
   enableSync: false,
   dbFilename: "stride.db",
  });
 } else {
  // Cloud sync mode: Supabase + PowerSync
  await initDatabase({
   enableSync: true,
   supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
   supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY, // Safe to use - public key
   powersyncUrl: import.meta.env.VITE_POWERSYNC_URL,
   dbFilename: "stride.db",
  });
 }

 dbInitialized = true;
 console.log("✓ Database initialized");
}
