#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_data = app.path().app_data_dir()?;
            let database_path = app_data.join("database").join("qte-maker.db");
            let connection = db::initialize(&database_path).map_err(|error| -> Box<dyn std::error::Error> { error })?;
            app.manage(db::DbState::new(connection));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::load_settings,
            db::save_settings,
            db::list_quotations,
            db::save_quotation,
            db::delete_quotation,
            db::record_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running Eyelectric QTE Maker");
}
