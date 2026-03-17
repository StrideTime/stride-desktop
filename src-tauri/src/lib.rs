mod env;

use env::AppEnv;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::{
    Manager, State,
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
    WindowEvent,
};
use tauri_plugin_positioner::{Position, WindowExt};

// DatabaseConfig struct for frontend
#[derive(serde::Serialize)]
struct DatabaseConfig {
    database_url: String,
}

#[tauri::command]
fn get_database_config(env: State<AppEnv>) -> Result<DatabaseConfig, String> {
    Ok(DatabaseConfig {
        database_url: env.database_url.clone(),
    })
}

/// Show the main window (used from tray menu or when re-opening the app)
#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggle tray panel visibility and position near tray icon
#[tauri::command]
fn toggle_tray_panel(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(panel) = app.get_webview_window("tray-panel") {
        if panel.is_visible().unwrap_or(false) {
            panel.hide().map_err(|e| e.to_string())?;
        } else {
            let _ = panel.as_ref().window().move_window(Position::TrayBottomCenter);
            panel.show().map_err(|e| e.to_string())?;
            panel.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
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
        .plugin(tauri_plugin_positioner::init())
        .manage(app_env)
        .invoke_handler(tauri::generate_handler![
            get_database_config,
            show_main_window,
            toggle_tray_panel,
        ])
        .setup(|app| {
            // Shared timestamp for debouncing blur vs tray-click race condition.
            // When the panel hides on blur, we record the instant so a tray click
            // arriving within 200ms won't immediately re-show the panel (which
            // would cause a flicker on Windows where blur fires before click).
            let last_hide_at: Arc<Mutex<Option<Instant>>> = Arc::new(Mutex::new(None));

            // ── Tray Icon Event Handler ──
            if let Some(tray) = app.tray_by_id("stride-tray") {
                let app_handle = app.handle().clone();
                let hide_timestamp = Arc::clone(&last_hide_at);

                tray.on_tray_icon_event(move |tray, event| {
                    // Update positioner's internal tray position on every event
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

                    match event {
                        // Only handle mouse-up to avoid double-fire (down + up)
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            if let Some(panel) = app_handle.get_webview_window("tray-panel") {
                                if panel.is_visible().unwrap_or(false) {
                                    let _ = panel.hide();
                                } else {
                                    // Debounce: skip if panel was just hidden by blur (<200ms ago)
                                    let should_skip = {
                                        let ts = hide_timestamp.lock().unwrap();
                                        ts.map_or(false, |t| t.elapsed().as_millis() < 200)
                                    };

                                    if !should_skip {
                                        // Position below tray icon (macOS) or above (Windows)
                                        let _ = panel
                                            .as_ref()
                                            .window()
                                            .move_window(Position::TrayBottomCenter);
                                        let _ = panel.show();
                                        let _ = panel.set_focus();
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                });
            }

            // ── Main Window: Close-to-Tray ──
            // Closing the main window hides it instead of quitting the app
            if let Some(main_window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                main_window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        // Prevent the window from actually closing
                        api.prevent_close();
                        // Hide it instead — app stays in tray
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                });
            }

            // ── Tray Panel: Hide on Focus Lost ──
            // When the tray panel loses focus, hide it automatically
            if let Some(tray_panel) = app.get_webview_window("tray-panel") {
                let hide_timestamp = Arc::clone(&last_hide_at);
                let app_handle = app.handle().clone();

                tray_panel.on_window_event(move |event| {
                    if let WindowEvent::Focused(false) = event {
                        if let Some(panel) = app_handle.get_webview_window("tray-panel") {
                            let _ = panel.hide();
                            // Record hide time so the tray click debounce works
                            if let Ok(mut ts) = hide_timestamp.lock() {
                                *ts = Some(Instant::now());
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
