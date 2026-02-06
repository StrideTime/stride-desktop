mod env;

use env::AppEnv;
use tauri::State;

// DatabaseConfig struct for frontend
#[derive(serde::Serialize)]
struct DatabaseConfig {
    database_url: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn get_database_config(env: State<AppEnv>) -> Result<DatabaseConfig, String> {
    // Return only safe config to frontend
    // Service keys stay in backend, never exposed
    Ok(DatabaseConfig {
        database_url: env.database_url.clone(),
    })
}

#[tauri::command]
async fn init_database(env: State<'_, AppEnv>) -> Result<(), String> {
    // Initialize database from Tauri context
    let config = crate::getDatabaseConfig().await;
    
    // Call the database initialization
    match crate::init_database(config).await {
        Ok(()) => Ok("Database initialized successfully".to_string()),
        Err(e) => Err(format!("Failed to initialize database: {}", e)),
    }
}

pub async fn getDatabaseConfig() -> DatabaseConfig {
    // Get public config from Vite env (safe to expose)
    let _supabase_url = std::env::var("VITE_SUPABASE_URL").unwrap_or_else(|_| "http://supabase.stride.local".to_string());
    let _supabase_anon_key = std::env::var("VITE_SUPABASE_ANON_KEY").unwrap_or_else(|_| "public_key".to_string());
    let _powersync_url = std::env::var("VITE_POWERSYNC_URL").unwrap_or_else(|_| "http://powersync.stride.local".to_string());
    let local_only = std::env::var("VITE_LOCAL_ONLY").unwrap_or_else(|_| "false".to_string()) == "true";

    if local_only {
        DatabaseConfig {
            database_url: "stride.db".to_string(),
        }
    } else {
        DatabaseConfig {
            database_url: "sync_database_url".to_string(), // Placeholder for cloud sync
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load backend environment
    let app_env = AppEnv::load().expect("Failed to load environment");

    // Initialize Sentry for backend error tracking
    let _guard = if let Some(dsn) = &app_env.sentry_dsn {
        Some(sentry::init((
            dsn.as_str(),
            sentry::ClientOptions {
                release: sentry::release_name!(),
                ..Default::default()
            },
        )))
    } else {
        None
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_env) // Make env available to commands
        .invoke_handler(tauri::generate_handler![get_database_config, init_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
