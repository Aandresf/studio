#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::{process::CommandEvent as Event, ShellExt};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Lanzamos el sidecar en un hilo asíncrono
            tauri::async_runtime::spawn(async move {
                let shell = handle.shell();
                // Resolvemos la ruta al script del backend que hemos incluido en los recursos
                let backend_script = handle.path().resource_dir()
                    .expect("failed to get resource directory")
                    .join("src-backend/index.js");

                let (mut rx, _child) = shell
                    .sidecar("node")
                    .expect("Failed to create sidecar command")
                    .args([backend_script.to_string_lossy().as_ref()])
                    .spawn()
                    .expect("Failed to spawn sidecar");

                // Escuchamos la salida del proceso para depuración
                while let Some(event) = rx.recv().await {
                    if let Event::Stdout(line) = event {
                        println!("[Backend]: {}", String::from_utf8_lossy(&line));
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