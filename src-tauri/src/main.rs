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
                // En modo de desarrollo (debug), usamos `node` para ejecutar el script directamente.
                // Esto permite hot-reload y acceso directo a los módulos de node.
                #[cfg(debug_assertions)]
                let (mut rx, _child) = handle.shell()
                    .command("node")
                    // La ruta es relativa al directorio de trabajo de `cargo run`, que es `src-tauri`.
                    .args(["../src-backend/index.js"])
                    .spawn()
                    .expect("Failed to spawn node backend for development");

                // En modo de producción (release), usamos el binario pre-compilado.
                #[cfg(not(debug_assertions))]
                let (mut rx, _child) = {
                    let resources_path = handle.path().resource_dir().unwrap();
                    let sidecar_path = resources_path.join("backend.exe");
                    
                    handle.shell()
                        .command(sidecar_path)
                        // Establecemos el directorio de trabajo en la misma carpeta que el ejecutable principal.
                        // Así, el backend creará su carpeta 'data' en el lugar correcto.
                        .current_dir(resources_path)
                        .spawn()
                        .expect("Failed to spawn sidecar")
                };

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