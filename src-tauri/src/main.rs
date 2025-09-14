#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

    use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_shell::{process::{CommandEvent as Event, CommandChild}, ShellExt};
use std::sync::{Arc, Mutex};
use tauri::State;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let main_window = app.get_webview_window("main").unwrap();

            // shared state for the sidecar child so commands can restart/kill it
            let child_state: Arc<Mutex<Option<CommandChild>>> = Arc::new(Mutex::new(None));
            // make state available via Tauri State
            app.manage(child_state.clone());

            let spawn_sidecar = move |handle: tauri::AppHandle, main_window: tauri::WebviewWindow, child_state: Arc<Mutex<Option<CommandChild>>>| {
                tauri::async_runtime::spawn(async move {
                    #[cfg(debug_assertions)]
                    let (mut rx, child) = handle.shell()
                        .command("node")
                        .args(["../src-backend/index.js"])
                        .spawn()
                        .expect("Failed to spawn node backend for development");

                    #[cfg(not(debug_assertions))]
                    let (mut rx, child) = {
                        let resources_path = handle.path().resource_dir().expect("Failed to get resource dir");
                        let sidecar_path = resources_path.join("resources/backend.exe");

                        handle.shell()
                            .command(sidecar_path)
                            .current_dir(&resources_path)
                            .spawn()
                            .expect("Failed to spawn sidecar")
                    };

                    // store child in shared state
                    {
                        let mut lock = child_state.lock().unwrap();
                        *lock = Some(child);
                    }

                    while let Some(event) = rx.recv().await {
                        if let Event::Stdout(line) = event {
                            let line_str = String::from_utf8_lossy(&line);
                            println!("[Backend]: {}", line_str);
                            if line_str.contains("Backend server listening") {
                                let _ = main_window.emit("backend-ready", ());
                            }
                        } else if let Event::Stderr(line) = event {
                            eprintln!("[Backend ERROR]: {}", String::from_utf8_lossy(&line));
                        }
                    }
                });
            };

            // initial spawn
            spawn_sidecar(handle.clone(), main_window.clone(), child_state.clone());

            // ensure the child is terminated when window closes
            let child_clone_for_kill = Arc::clone(&child_state);
            main_window.on_window_event(move |event| {
                if let WindowEvent::Destroyed = event {
                    println!("Ventana principal destruida. Terminando el proceso sidecar...");
                    if let Some(child_to_kill) = child_clone_for_kill.lock().unwrap().take() {
                        if let Err(e) = child_to_kill.kill() {
                            eprintln!("Error al terminar el proceso sidecar: {}", e);
                        } else {
                            println!("Proceso sidecar terminado con éxito.");
                        }
                    }
                }
            });

            Ok(())
        })
    .invoke_handler(tauri::generate_handler![restart_sidecar, stop_sidecar, get_persisted_bind_ip])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Command to restart the sidecar process. Uses the managed state set up in setup().
#[tauri::command]
fn restart_sidecar(state: State<Arc<Mutex<Option<CommandChild>>>>, app: tauri::AppHandle) -> Result<bool, String> {
    // kill existing
    if let Some(child) = state.lock().unwrap().take() {
        if let Err(e) = child.kill() {
            eprintln!("Error killing sidecar: {}", e);
        }
    }

    // spawn new sidecar using the same logic as setup: we emulate a restart by invoking shell command
    #[cfg(debug_assertions)]
    let spawn_result: Result<(), String> = (|| {
        let (mut rx, child) = app.shell().command("node").args(["../src-backend/index.js"]).spawn().map_err(|e| e.to_string())?;
        // store child
        *state.lock().unwrap() = Some(child);
        // spawn a task to forward logs
        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
                if let Event::Stdout(line) = event {
                    println!("[Backend]: {}", String::from_utf8_lossy(&line));
                }
            }
        });
        Ok(())
    })();

    #[cfg(not(debug_assertions))]
    let spawn_result: Result<(), String> = (|| {
        let resources_path = app.path().resource_dir().map_err(|e| e.to_string())?;
        let sidecar_path = resources_path.join("resources/backend.exe");
        let (mut rx, child) = app.shell().command(sidecar_path).current_dir(&resources_path).spawn().map_err(|e| e.to_string())?;
        *state.lock().unwrap() = Some(child);
        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
                if let Event::Stdout(line) = event {
                    println!("[Backend]: {}", String::from_utf8_lossy(&line));
                }
            }
        });
        Ok(())
    })();

    spawn_result.map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn stop_sidecar(state: State<Arc<Mutex<Option<CommandChild>>>>) -> Result<bool, String> {
    if let Some(child) = state.lock().unwrap().take() {
        if let Err(e) = child.kill() {
            eprintln!("Error killing sidecar: {}", e);
            return Err(e.to_string());
        }
    }
    Ok(true)
}

#[tauri::command]
fn get_persisted_bind_ip(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use std::fs;
    use std::path::PathBuf;
    // Possible locations to check for the backend data/.env
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(resources_path) = app.path().resource_dir() {
        candidates.push(resources_path.join("resources").join("data").join(".env"));
        candidates.push(resources_path.join("data").join(".env"));
    }
    // common dev locations relative to app root
    candidates.push(PathBuf::from("src-backend/data/.env"));
    candidates.push(PathBuf::from("../src-backend/data/.env"));

    for p in candidates {
        if p.exists() {
            if let Ok(content) = fs::read_to_string(&p) {
                for line in content.lines() {
                    let l = line.trim();
                    if l.starts_with("BIND_IP=") {
                        let ip = l.trim_start_matches("BIND_IP=").to_string();
                        return Ok(Some(ip));
                    }
                }
            }
        }
    }
    Ok(None)
}
