PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qte_number TEXT NOT NULL UNIQUE,
    revision_of_id INTEGER,
    quote_date TEXT NOT NULL,
    client TEXT NOT NULL DEFAULT '',
    client_address TEXT NOT NULL DEFAULT '',
    attention TEXT NOT NULL DEFAULT '',
    position_department TEXT NOT NULL DEFAULT '',
    project_name TEXT NOT NULL DEFAULT '',
    project_location TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    validity TEXT NOT NULL DEFAULT '',
    salutation TEXT NOT NULL DEFAULT '',
    opening_paragraph TEXT NOT NULL DEFAULT '',
    prepared_by_name TEXT NOT NULL DEFAULT '',
    prepared_by_title TEXT NOT NULL DEFAULT '',
    noted_by_name TEXT NOT NULL DEFAULT '',
    noted_by_title TEXT NOT NULL DEFAULT '',
    terms_conditions TEXT NOT NULL DEFAULT '',
    exclusions TEXT NOT NULL DEFAULT '',
    overall_factor TEXT NOT NULL,
    vat_type TEXT NOT NULL CHECK (vat_type IN ('VAT_INCLUSIVE', 'VAT_EXCLUSIVE', 'NON_VAT')),
    vat_rate TEXT NOT NULL,
    actual_cost TEXT NOT NULL DEFAULT '0.00',
    selling_before_vat TEXT NOT NULL DEFAULT '0.00',
    vat_amount TEXT NOT NULL DEFAULT '0.00',
    final_amount TEXT NOT NULL DEFAULT '0.00',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (revision_of_id) REFERENCES quotations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quote_date DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS quotation_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER NOT NULL,
    section_number TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sections_quotation ON quotation_sections(quotation_id, sort_order);

CREATE TABLE IF NOT EXISTS quotation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    row_type TEXT NOT NULL CHECK (row_type IN ('item', 'heading')),
    item_number TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    quantity TEXT,
    unit TEXT,
    cost_type TEXT CHECK (cost_type IN ('MATERIAL', 'LABOR', 'MATERIAL_LABOR', 'OTHER')),
    material_unit_cost TEXT,
    labor_unit_cost TEXT,
    other_unit_cost TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (section_id) REFERENCES quotation_sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_section ON quotation_items(section_id, sort_order);

CREATE TABLE IF NOT EXISTS quotation_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('COST', 'SELLING')),
    file_path TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_quotation ON quotation_documents(quotation_id, document_type);

CREATE TABLE IF NOT EXISTS quotation_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
