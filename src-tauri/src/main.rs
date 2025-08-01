#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_shell::{process::CommandEvent as Event, ShellExt};
use std::sync::{Arc, Mutex};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let main_window = app.get_webview_window("main").unwrap();

            tauri::async_runtime::spawn(async move {
                #[cfg(debug_assertions)]
                let (mut rx, child) = handle.shell()
                    .command("node")
                    .args(["../src-backend/index.js"])
                    .spawn()
                    .expect("Failed to spawn node backend for development");

                #[cfg(not(debug_assertions))]
                let (mut rx, child) = {
                    let resources_path = handle.path().resource_dir().unwrap();
                    let sidecar_path = resources_path.join("backend/backend.exe");
                    
                    handle.shell()
                        .command(sidecar_path)
                        .current_dir(resources_path)
                        .spawn()
                        .expect("Failed to spawn sidecar")
                };

                // Envolvemos el 'child' en un Mutex para control de concurrencia, 
                // y luego en un Arc para compartir la propiedad.
                let child_arc_mutex = Arc::new(Mutex::new(Some(child)));
                let child_clone_for_kill = Arc::clone(&child_arc_mutex);

                main_window.on_window_event(move |event| {
                    if let WindowEvent::Destroyed = event {
                        println!("Ventana principal destruida. Terminando el proceso sidecar...");
                        
                        // Bloqueamos el mutex y tomamos el 'child', dejando 'None' en su lugar.
                        if let Some(child_to_kill) = child_clone_for_kill.lock().unwrap().take() {
                            if let Err(e) = child_to_kill.kill() {
                                eprintln!("Error al terminar el proceso sidecar: {}", e);
                            } else {
                                println!("Proceso sidecar terminado con éxito.");
                            }
                        }
                    }
                });

                while let Some(event) = rx.recv().await {
                    if let Event::Stdout(line) = event {
                        let line_str = String::from_utf8_lossy(&line);
                        println!("[Backend]: {}", line_str);
                        if line_str.contains("Backend server listening") {
                            main_window.emit("backend-ready", ()).unwrap();
                        }
                    } else if let Event::Stderr(line) = event {
                        eprintln!("[Backend ERROR]: {}", String::from_utf8_lossy(&line));
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
