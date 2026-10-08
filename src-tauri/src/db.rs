use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::Path, sync::Mutex};
use tauri::State;

#[derive(Debug)]
pub struct DbState {
    pub connection: Mutex<Connection>,
}

impl DbState {
    pub fn new(connection: Connection) -> Self {
        Self { connection: Mutex::new(connection) }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuotationItemPayload {
    pub id: String,
    pub row_type: String,
    #[serde(default)]
    pub item_number: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub quantity: String,
    #[serde(default)]
    pub unit: String,
    #[serde(default)]
    pub cost_type: String,
    #[serde(default)]
    pub material_unit_cost: String,
    #[serde(default)]
    pub labor_unit_cost: String,
    #[serde(default)]
    pub other_unit_cost: String,
    pub sort_order: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuotationSectionPayload {
    pub id: String,
    #[serde(default)]
    pub section_number: String,
    pub name: String,
    pub sort_order: i32,
    #[serde(default)]
    pub items: Vec<QuotationItemPayload>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuotationPayload {
    pub id: Option<i64>,
    pub qte_number: String,
    pub revision_of_id: Option<i64>,
    pub quote_date: String,
    #[serde(default)]
    pub client: String,
    #[serde(default)]
    pub client_address: String,
    #[serde(default)]
    pub attention: String,
    #[serde(default)]
    pub position_department: String,
    #[serde(default)]
    pub project_name: String,
    #[serde(default)]
    pub project_location: String,
    #[serde(default)]
    pub subject: String,
    #[serde(default)]
    pub validity: String,
    #[serde(default)]
    pub salutation: String,
    #[serde(default)]
    pub opening_paragraph: String,
    #[serde(default)]
    pub prepared_by_name: String,
    #[serde(default)]
    pub prepared_by_title: String,
    #[serde(default)]
    pub noted_by_name: String,
    #[serde(default)]
    pub noted_by_title: String,
    #[serde(default)]
    pub terms_conditions: String,
    #[serde(default)]
    pub exclusions: String,
    pub overall_factor: String,
    pub vat_type: String,
    pub vat_rate: String,
    #[serde(default)]
    pub actual_cost: String,
    #[serde(default)]
    pub selling_before_vat: String,
    #[serde(default)]
    pub vat_amount: String,
    #[serde(default)]
    pub final_amount: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    #[serde(default)]
    pub sections: Vec<QuotationSectionPayload>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculationPayload {
    pub actual_cost: String,
    pub selling_price_before_vat: String,
    pub vat_amount: String,
    pub final_amount: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveQuotationRequest {
    pub quotation: QuotationPayload,
    pub calculation: CalculationPayload,
}

pub fn initialize(path: &Path) -> Result<Connection, Box<dyn std::error::Error>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let connection = Connection::open(path)?;
    connection.execute_batch(include_str!("schema.sql"))?;

    let now = timestamp();
    for (key, value) in default_settings() {
        connection.execute(
            "INSERT OR IGNORE INTO quotation_settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
            params![key, value, now],
        )?;
    }

    Ok(connection)
}

fn default_settings() -> [(&'static str, &'static str); 16] {
    [
        ("company_name", ""),
        ("company_address", ""),
        ("contact_information", ""),
        ("footer_text", ""),
        ("logo_path", ""),
        ("logo_data_url", ""),
        ("prepared_by_name", ""),
        ("prepared_by_title", ""),
        ("noted_by_name", ""),
        ("noted_by_title", ""),
        ("signature_path", ""),
        ("signature_data_url", ""),
        ("signature_enabled", "false"),
        ("default_vat_rate", "12"),
        ("default_terms", ""),
        ("default_exclusions", ""),
    ]
}

fn timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now().duration_since(UNIX_EPOCH).map(|value| value.as_secs().to_string()).unwrap_or_else(|_| "0".to_string())
}

#[tauri::command]
pub fn load_settings(state: State<'_, DbState>) -> Result<HashMap<String, String>, String> {
    let connection = state.connection.lock().map_err(|error| error.to_string())?;
    let mut statement = connection.prepare("SELECT key, value FROM quotation_settings ORDER BY key").map_err(|error| error.to_string())?;
    let rows = statement.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))).map_err(|error| error.to_string())?;
    let mut result = HashMap::new();
    for row in rows {
        let (key, value) = row.map_err(|error| error.to_string())?;
        result.insert(key, value);
    }
    Ok(result)
}

#[tauri::command]
pub fn save_settings(settings: HashMap<String, String>, state: State<'_, DbState>) -> Result<(), String> {
    let connection = state.connection.lock().map_err(|error| error.to_string())?;
    let transaction = connection.unchecked_transaction().map_err(|error| error.to_string())?;
    let now = timestamp();
    for (key, value) in settings {
        transaction.execute(
            "INSERT INTO quotation_settings (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
            params![key, value, now],
        ).map_err(|error| error.to_string())?;
    }
    transaction.commit().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn list_quotations(state: State<'_, DbState>) -> Result<Vec<QuotationPayload>, String> {
    let connection = state.connection.lock().map_err(|error| error.to_string())?;
    let mut statement = connection.prepare(
        "SELECT id, qte_number, revision_of_id, quote_date, client, client_address, attention, position_department, project_name, project_location, subject, validity, salutation, opening_paragraph, prepared_by_name, prepared_by_title, noted_by_name, noted_by_title, terms_conditions, exclusions, overall_factor, vat_type, vat_rate, actual_cost, selling_before_vat, vat_amount, final_amount, created_at, updated_at FROM quotations ORDER BY quote_date DESC, id DESC",
    ).map_err(|error| error.to_string())?;
    let rows = statement.query_map([], quotation_from_row).map_err(|error| error.to_string())?;
    let mut quotations = Vec::new();
    for row in rows {
        quotations.push(row.map_err(|error| error.to_string())?);
    }
    drop(statement);

    for quotation in &mut quotations {
        let quotation_id = quotation.id.ok_or_else(|| "Quotation has no database ID".to_string())?;
        let mut sections_statement = connection.prepare("SELECT id, section_number, name, sort_order FROM quotation_sections WHERE quotation_id = ?1 ORDER BY sort_order, id").map_err(|error| error.to_string())?;
        let sections = sections_statement.query_map(params![quotation_id], |row| {
            Ok(QuotationSectionPayload {
                id: row.get::<_, i64>(0)?.to_string(),
                section_number: row.get(1)?,
                name: row.get(2)?,
                sort_order: row.get(3)?,
                items: Vec::new(),
            })
        }).map_err(|error| error.to_string())?;
        let mut loaded_sections = Vec::new();
        for section in sections {
            loaded_sections.push(section.map_err(|error| error.to_string())?);
        }
        drop(sections_statement);

        for section in &mut loaded_sections {
            let section_id = section.id.parse::<i64>().map_err(|error| error.to_string())?;
            let mut items_statement = connection.prepare("SELECT id, row_type, item_number, description, quantity, unit, cost_type, material_unit_cost, labor_unit_cost, other_unit_cost, sort_order FROM quotation_items WHERE section_id = ?1 ORDER BY sort_order, id").map_err(|error| error.to_string())?;
            let items = items_statement.query_map(params![section_id], |row| {
                Ok(QuotationItemPayload {
                    id: row.get::<_, i64>(0)?.to_string(),
                    row_type: row.get(1)?,
                    item_number: row.get(2)?,
                    description: row.get(3)?,
                    quantity: row.get::<_, Option<String>>(4)?.unwrap_or_else(|| "0".to_string()),
                    unit: row.get::<_, Option<String>>(5)?.unwrap_or_default(),
                    cost_type: row.get::<_, Option<String>>(6)?.unwrap_or_else(|| "MATERIAL".to_string()),
                    material_unit_cost: row.get::<_, Option<String>>(7)?.unwrap_or_else(|| "0".to_string()),
                    labor_unit_cost: row.get::<_, Option<String>>(8)?.unwrap_or_else(|| "0".to_string()),
                    other_unit_cost: row.get::<_, Option<String>>(9)?.unwrap_or_else(|| "0".to_string()),
                    sort_order: row.get(10)?,
                })
            }).map_err(|error| error.to_string())?;
            for item in items {
                section.items.push(item.map_err(|error| error.to_string())?);
            }
        }

        quotation.sections = loaded_sections;
    }

    Ok(quotations)
}

fn quotation_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<QuotationPayload> {
    Ok(QuotationPayload {
        id: row.get(0)?,
        qte_number: row.get(1)?,
        revision_of_id: row.get(2)?,
        quote_date: row.get(3)?,
        client: row.get(4)?,
        client_address: row.get(5)?,
        attention: row.get(6)?,
        position_department: row.get(7)?,
        project_name: row.get(8)?,
        project_location: row.get(9)?,
        subject: row.get(10)?,
        validity: row.get(11)?,
        salutation: row.get(12)?,
        opening_paragraph: row.get(13)?,
        prepared_by_name: row.get(14)?,
        prepared_by_title: row.get(15)?,
        noted_by_name: row.get(16)?,
        noted_by_title: row.get(17)?,
        terms_conditions: row.get(18)?,
        exclusions: row.get(19)?,
        overall_factor: row.get(20)?,
        vat_type: row.get(21)?,
        vat_rate: row.get(22)?,
        actual_cost: row.get(23)?,
        selling_before_vat: row.get(24)?,
        vat_amount: row.get(25)?,
        final_amount: row.get(26)?,
        created_at: row.get(27)?,
        updated_at: row.get(28)?,
        sections: Vec::new(),
    })
}

#[tauri::command]
pub fn save_quotation(request: SaveQuotationRequest, state: State<'_, DbState>) -> Result<i64, String> {
    let connection = state.connection.lock().map_err(|error| error.to_string())?;
    let transaction = connection.unchecked_transaction().map_err(|error| error.to_string())?;
    let quotation = request.quotation;
    let calculation = request.calculation;
    let now = timestamp();
    let created_at = quotation.created_at.clone().unwrap_or_else(|| now.clone());

    let id = if let Some(id) = quotation.id {
        let updated = transaction.execute(
            "UPDATE quotations SET qte_number = ?1, revision_of_id = ?2, quote_date = ?3, client = ?4, client_address = ?5, attention = ?6, position_department = ?7, project_name = ?8, project_location = ?9, subject = ?10, validity = ?11, salutation = ?12, opening_paragraph = ?13, prepared_by_name = ?14, prepared_by_title = ?15, noted_by_name = ?16, noted_by_title = ?17, terms_conditions = ?18, exclusions = ?19, overall_factor = ?20, vat_type = ?21, vat_rate = ?22, actual_cost = ?23, selling_before_vat = ?24, vat_amount = ?25, final_amount = ?26, updated_at = ?27 WHERE id = ?28",
            params![quotation.qte_number, quotation.revision_of_id, quotation.quote_date, quotation.client, quotation.client_address, quotation.attention, quotation.position_department, quotation.project_name, quotation.project_location, quotation.subject, quotation.validity, quotation.salutation, quotation.opening_paragraph, quotation.prepared_by_name, quotation.prepared_by_title, quotation.noted_by_name, quotation.noted_by_title, quotation.terms_conditions, quotation.exclusions, quotation.overall_factor, quotation.vat_type, quotation.vat_rate, calculation.actual_cost, calculation.selling_price_before_vat, calculation.vat_amount, calculation.final_amount, now, id],
        ).map_err(|error| error.to_string())?;
        if updated == 0 {
            insert_quotation(&transaction, &quotation, &calculation, &created_at, &now)?
        } else {
            id
        }
    } else {
        insert_quotation(&transaction, &quotation, &calculation, &created_at, &now)?
    };

    transaction.execute("DELETE FROM quotation_sections WHERE quotation_id = ?1", params![id]).map_err(|error| error.to_string())?;
    for (section_index, section) in quotation.sections.iter().enumerate() {
        transaction.execute("INSERT INTO quotation_sections (quotation_id, section_number, name, sort_order) VALUES (?1, ?2, ?3, ?4)", params![id, section.section_number, section.name, section_index as i32]).map_err(|error| error.to_string())?;
        let section_id = transaction.last_insert_rowid();
        for (item_index, item) in section.items.iter().enumerate() {
            transaction.execute(
                "INSERT INTO quotation_items (section_id, row_type, item_number, description, quantity, unit, cost_type, material_unit_cost, labor_unit_cost, other_unit_cost, sort_order) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![section_id, item.row_type, item.item_number, item.description, item.quantity, item.unit, item.cost_type, item.material_unit_cost, item.labor_unit_cost, item.other_unit_cost, item_index as i32],
            ).map_err(|error| error.to_string())?;
        }
    }

    transaction.commit().map_err(|error| error.to_string())?;
    Ok(id)
}

fn insert_quotation(transaction: &rusqlite::Transaction<'_>, quotation: &QuotationPayload, calculation: &CalculationPayload, created_at: &str, updated_at: &str) -> Result<i64, String> {
    transaction.execute(
        "INSERT INTO quotations (qte_number, revision_of_id, quote_date, client, client_address, attention, position_department, project_name, project_location, subject, validity, salutation, opening_paragraph, prepared_by_name, prepared_by_title, noted_by_name, noted_by_title, terms_conditions, exclusions, overall_factor, vat_type, vat_rate, actual_cost, selling_before_vat, vat_amount, final_amount, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28)",
        params![quotation.qte_number, quotation.revision_of_id, quotation.quote_date, quotation.client, quotation.client_address, quotation.attention, quotation.position_department, quotation.project_name, quotation.project_location, quotation.subject, quotation.validity, quotation.salutation, quotation.opening_paragraph, quotation.prepared_by_name, quotation.prepared_by_title, quotation.noted_by_name, quotation.noted_by_title, quotation.terms_conditions, quotation.exclusions, quotation.overall_factor, quotation.vat_type, quotation.vat_rate, calculation.actual_cost, calculation.selling_price_before_vat, calculation.vat_amount, calculation.final_amount, created_at, updated_at],
    ).map_err(|error| error.to_string())?;
    Ok(transaction.last_insert_rowid())
}

#[tauri::command]
pub fn delete_quotation(id: i64, state: State<'_, DbState>) -> Result<(), String> {
    let connection = state.connection.lock().map_err(|error| error.to_string())?;
    connection.execute("DELETE FROM quotations WHERE id = ?1", params![id]).map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn record_document(quotation_id: i64, document_type: String, file_path: String, state: State<'_, DbState>) -> Result<(), String> {
    let connection = state.connection.lock().map_err(|error| error.to_string())?;
    connection.execute("DELETE FROM quotation_documents WHERE quotation_id = ?1 AND document_type = ?2", params![quotation_id, document_type]) .map_err(|error| error.to_string())?;
    connection.execute("INSERT INTO quotation_documents (quotation_id, document_type, file_path, generated_at) VALUES (?1, ?2, ?3, ?4)", params![quotation_id, document_type, file_path, timestamp()]).map_err(|error| error.to_string())?;
    Ok(())
}

#[allow(dead_code)]
fn quotation_exists(connection: &Connection, id: i64) -> Result<bool, rusqlite::Error> {
    connection.query_row("SELECT 1 FROM quotations WHERE id = ?1", params![id], |row| row.get::<_, i64>(0)).optional().map(|value| value.is_some())
}
