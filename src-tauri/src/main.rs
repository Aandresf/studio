#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WindowEvent};
use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let shell = app.shell();

            // Resolvemos la ruta al script del backend que hemos incluido en los recursos
            let backend_script = app.path().resource_dir()
                .expect("failed to get resource directory")
                .join("src-backend/index.js");

            // Lanzamos el sidecar en un hilo asíncrono
            tauri::async_runtime::spawn(async move {
                let (mut rx, _child) = shell
                    .sidecar("node")
                    .expect("Failed to create sidecar command")
                    .args([backend_script.to_string_lossy().as_ref()])
                    .spawn()
                    .expect("Failed to spawn sidecar");

                // Escuchamos la salida del proceso para depuración
                while let Some(event) = rx.recv().await {
                    if let Event::Stdout(line) = event {
                        println!("[Backend]: {}", line);
                    } else if let Event::Stderr(line) = event {
                        eprintln!("[Backend ERROR]: {}", line);
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}