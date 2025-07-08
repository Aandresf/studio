#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::api::process::{Command, CommandEvent};

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // Iniciar el sidecar de Node.js
            tauri::async_runtime::spawn(async move {
                // `node-server` es el nombre que definimos en tauri.conf.json
                let (mut rx, _child) = Command::new_sidecar("node-server")
                    .expect("failed to create `node-server` command")
                    .spawn()
                    .expect("Failed to spawn sidecar");

                // Leer la salida del proceso del backend para poder depurar
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line) = event {
                        println!("[Backend]: {}", line);
                    } else if let CommandEvent::Stderr(line) = event {
                        eprintln!("[Backend ERROR]: {}", line);
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}