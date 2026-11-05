#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    iptracer_ui::create_app()
        .run(tauri::generate_context!())
        .expect("error while running NetPulse desktop application");
}
