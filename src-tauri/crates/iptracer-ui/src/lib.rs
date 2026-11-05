pub mod commands;
pub mod models;
pub mod updater;

use std::sync::Arc;
pub use commands::AppState;

pub fn create_app() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .manage(Arc::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::trace_ip,
            commands::run_traceroute,
            commands::stop_traceroute,
            commands::start_continuous_ping,
            commands::stop_continuous_ping,
            commands::calculate_subnet,
            commands::get_network_interfaces,
            commands::check_elevation_status,
            commands::request_elevation,
            commands::scan_lan,
            commands::scan_ports,
            commands::query_dns,
            commands::query_whois,
            commands::check_for_updates,
            commands::get_vault_history,
            commands::save_vault_history,
            commands::clear_vault_history,
            commands::get_vault_favorites,
            commands::add_vault_favorite,
            commands::delete_vault_favorite,
            commands::start_watchdog,
            commands::stop_watchdog,
            commands::get_watchdog_status,
            commands::run_multitrace,
            commands::get_historical_paths,
            commands::export_report,
            commands::sync_cloud_telemetry,
            commands::get_enterprise_policy,
        ])
}
