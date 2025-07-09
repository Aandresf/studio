#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager};
use tauri_plugin_shell::{process::CommandEvent as Event, ShellExt};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Lanzamos el sidecar en un hilo asíncrono
            tauri::async_runtime::spawn(async move {
                let sidecar_path = handle.path().resource_dir().unwrap().join("binaries/node.exe");

                let mut script_path = handle.path().resource_dir().unwrap();
                script_path.push("../../../src-backend/index.js");

                let (mut rx, _child) = handle.shell()
                    .sidecar(sidecar_path)
                    .expect("Failed to create sidecar command")
                    .args([script_path])
                    .spawn()
                    .expect("Failed to spawn sidecar");

                while let Some(event) = rx.recv().await {
                    if let Event::Stdout(line) = event {
                        let line_str = String::from_utf8_lossy(&line);
                        println!("[Backend]: {}", line_str);
                        if line_str.contains("Backend server listening") {
                            handle.emit("backend-ready", ()).unwrap();
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