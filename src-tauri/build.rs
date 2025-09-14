use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    // 1. Obtener el directorio de salida de la compilación de Rust
    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());
    // Salir del directorio de build del script para llegar a `target/debug` o `target/release`
    let target_dir = out_dir.ancestors().nth(3).unwrap().to_path_buf();

    // 2. Definir la ruta de origen de node.exe
    let mut source_path = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    source_path.push("binaries/node.exe");

    // 3. Definir la ruta y el nombre de destino que Tauri espera
    let target_triple = env::var("TARGET").unwrap();
    let dest_name = format!("node-{}", target_triple);
    let mut dest_path = target_dir.clone();
    dest_path.push(&dest_name);
    
    // En Windows, los ejecutables terminan en .exe
    if target_triple.contains("windows") {
        dest_path.set_extension("exe");
    }

    // 4. Copiar el archivo si existe el origen
    if source_path.exists() {
        println!("cargo:rerun-if-changed={}", source_path.display());
        println!("Copying node.exe from {} to {}", source_path.display(), dest_path.display());
        
        if let Err(e) = fs::copy(&source_path, &dest_path) {
            panic!("Failed to copy node.exe: {}", e);
        }
    } else {
        panic!("node.exe not found at {}", source_path.display());
    }

    // 5. Finalmente, ejecutar el build por defecto de Tauri
    tauri_build::build()
}