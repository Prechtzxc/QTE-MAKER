# Eyelectric QTE Maker

Eyelectric QTE Maker is a desktop-first quotation builder for creating, pricing, reviewing, and exporting engineering and construction quotations. It keeps quotation data on the local machine, calculates totals with decimal-safe arithmetic, and produces two PDF documents from the same quotation data:

- **Cost PDF**: an internal cost breakdown with material, labor, other, actual-cost, pricing-factor, and VAT information.
- **Selling PDF**: a customer-facing quotation letter with a selling-price summary and itemized selling attachment.

The application is version `0.1.0` and is built for Eyelectric's local quotation workflow.

## Contents

- [Product Overview](#product-overview)
- [Features](#features)
- [User Workflow](#user-workflow)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Persistence and Tauri Commands](#persistence-and-tauri-commands)
- [Calculation Rules](#calculation-rules)
- [PDF Design](#pdf-design)
- [Visual Design System](#visual-design-system)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Extension Guide](#extension-guide)
- [Privacy, Backup, and Current Limitations](#privacy-backup-and-current-limitations)

## Product Overview

The app replaces spreadsheet-driven quotation preparation with one structured workflow:

1. Configure company identity, defaults, logo, and optional signature.
2. Create a quotation and enter its manual QTE reference.
3. Add project and client information.
4. Organize scope into categories, headings, and priced items.
5. Apply one overall pricing factor and a VAT treatment.
6. Review rounded totals by category and cost component.
7. Preview or export a Cost PDF or Selling PDF.
8. Reopen, duplicate, search, or delete saved quotations.

The desktop application stores data locally through SQLite. When the same frontend is run in a normal browser, it uses `localStorage` as a development fallback.

## Features

- Saved quotation list with search by QTE number, client, or project.
- Manual QTE number validation with case-insensitive duplicate detection.
- Project details, client details, letter text, signatories, terms, and exclusions.
- Multiple reorderable quotation categories.
- Item rows and non-priced heading rows within each category.
- Material, labor, material plus labor, and other cost types.
- Quantity, unit, unit-cost, actual-total, and category-total editing.
- Decimal-safe calculations using `decimal.js`.
- VAT Inclusive, VAT Exclusive, and Non-VAT modes.
- Configurable company name, address, contacts, footer, logo, and signature image.
- Live pricing summary and review screen.
- In-app PDF preview using an embedded PDF viewer.
- Local PDF export through a Tauri save dialog or browser download fallback.
- Document history records for exported Cost and Selling PDFs of saved quotations in the desktop database.
- Browser persistence fallback for frontend-only development and tests.

## User Workflow

### 1. Configure Settings

Open **Settings** from the quotation list and configure:

- Company identity and contact information.
- Footer text.
- Logo image.
- Default prepared-by and noted-by signatories.
- Optional signature image.
- Default VAT rate.
- Default terms and conditions.
- Default exclusions.

These defaults are copied into new quotations. Existing quotations are not rewritten when settings change.

### 2. Create a QTE

Select **New QTE** and enter the manual QTE number. The number is required before saving and must be unique among saved quotations. A new quotation starts with one `General Requirements` category, a default salutation, the current date, and the configured terms and exclusions.

### 3. Complete Project Information

The Project tab captures the quotation reference, date, client, address, attention line, department, validity, project name, location, subject, opening text, and signatories.

### 4. Build the Cost Structure

The Items tab supports:

- Adding, renaming, moving, and deleting categories.
- Adding priced item rows.
- Adding heading rows for sub-groups such as demolition or painting works.
- Reordering and deleting rows.
- Selecting which cost components are enabled for each item.

Disabled component inputs do not participate in the calculation for that cost type.

### 5. Set Pricing

The Pricing tab applies one overall factor to every rounded actual item total. It also controls VAT type and VAT rate. The tab displays material, labor, other, actual cost, selling price before VAT, VAT amount, and final quotation amount.

### 6. Review and Export

The Review tab shows the rounded cost breakdown by category. The PDFs tab can preview or export either document type:

- **Cost PDF** is intended for internal review.
- **Selling PDF** is intended for the customer and does not expose internal cost columns or the overall pricing factor.

## Technology Stack

| Area | Technology |
| --- | --- |
| Desktop shell | Tauri 2 |
| Frontend | React 19, TypeScript 5.7, Vite 6 |
| Styling | Tailwind CSS 3.4, PostCSS, Autoprefixer |
| Icons | Lucide React |
| Decimal arithmetic | Decimal.js |
| PDF generation | pdfmake |
| Local database | SQLite through `rusqlite` with the bundled SQLite feature |
| Native plugins | Tauri dialog and filesystem plugins |
| Testing | Vitest with Node and jsdom test environments |

## Getting Started

### Prerequisites

For frontend development:

- Node.js 18 or newer.
- npm.

For Tauri desktop development on Windows:

- Rust stable and Cargo.
- Tauri's Windows prerequisites, including Microsoft C++ build tools and WebView2.

### Install Dependencies

```bash
npm install
```

### Run the Frontend

```bash
npm run dev
```

The Vite server uses port `1420` and is configured with `strictPort: true`. This mode is useful for fast UI development and exercises the browser `localStorage` persistence fallback.

### Run the Desktop Application

```bash
npm run tauri dev
```

Tauri starts the Vite server at `http://localhost:1420` and opens the configured `Eyelectric QTE Maker` window.

### Build the Frontend

```bash
npm run build
```

This runs TypeScript project compilation followed by `vite build` and writes the frontend bundle to `dist/`.

### Preview the Frontend Build

```bash
npm run preview
```

### Build the Tauri Application

```bash
npm run tauri build
```

The Tauri build pipeline is configured, but installer/bundle generation is currently disabled by `bundle.active: false` in `src-tauri/tauri.conf.json`. Enable and configure bundling before using this as a release build.

## Architecture

The app is organized as a thin React presentation layer over a pure quotation domain, with Tauri providing local persistence and native file operations.

```text
                         +---------------------------+
                         |        React UI            |
                         | App + editor components    |
                         +-------------+-------------+
                                       |
                                       v
                         +---------------------------+
                         |      Quotation domain      |
                         | models, defaults, pricing  |
                         +------+--------------------+
                                |
                +---------------+----------------+
                |                                |
                v                                v
      +---------------------+          +----------------------+
      |   Storage adapter   |          |   PDF document layer  |
      | data/storage.ts     |          | pdfmake definitions   |
      +-----+----------+----+          +----------+-----------+
            |          |                           |
            |          |                           v
            |          |                 Preview Blob / Buffer
            |          |
            v          v
  +---------------+  +------------------+
  | Tauri invoke  |  | Browser fallback |
  | Rust commands |  | window.localStorage|
  +-------+-------+  +------------------+
          |
          v
  +-----------------------+
  | SQLite database       |
  | app data/qte-maker.db|
  +-----------------------+
```

### Runtime Boundaries

**React frontend**

`src/App.tsx` owns application mode, editor tab, loaded quotations, settings, active draft, notices, and loading state. Components receive data and update functions through props rather than accessing persistence directly.

**Domain layer**

`src/domain/` defines the quotation model, defaults, and calculation behavior. The calculation module has no React or Tauri dependency, so it can be tested independently.

**Storage adapter**

`src/data/storage.ts` exposes one frontend API for settings, quotations, deletion, and document records. It selects Tauri commands when `window.__TAURI_INTERNALS__` exists and otherwise uses browser storage.

**PDF layer**

`src/pdf/` converts a draft plus an already calculated result into pdfmake document definitions. PDF generation never recalculates totals, which keeps the on-screen amount and exported amount aligned.

**Native layer**

`src-tauri/src/lib.rs` initializes the SQLite connection, registers plugins, and exposes commands. `src-tauri/src/db.rs` owns SQL queries and request payloads. The connection is kept in a mutex-managed Tauri state.

### Application State

The top-level application has three modes:

| Mode | Purpose |
| --- | --- |
| `list` | Search and manage saved quotations. |
| `editor` | Edit one quotation through the Project, Items, Pricing, Review, or PDFs tab. |
| `settings` | Edit local branding and new-quotation defaults. |

The editor tabs are intentionally ordered as a preparation workflow: Project -> Items -> Pricing -> Review -> PDFs.

### Save Flow

```text
User edits draft
    |
    v
calculateQuotation(draft)
    |
    +-- invalid number or range -> notice and no save
    |
    v
storage.saveQuotation(draft, calculation)
    |
    +-- Tauri -> invoke save_quotation -> SQLite transaction
    |
    +-- Browser -> localStorage JSON round trip
    |
    v
Saved quotation returned to the list and editor
```

The native save command updates the quotation header, deletes and recreates its sections and items, stores calculated summary amounts, and commits the entire operation in one transaction.

## Data Model

The TypeScript model is the source of truth for frontend behavior. Decimal values are represented as strings to avoid JavaScript floating-point surprises.

```text
QuotationSettings
    |-- company identity
    |-- default VAT, terms, exclusions
    |-- logo and signature data URLs

QuotationDraft
    |-- qteNumber, date, client, project, letter text
    |-- pricing factor and VAT mode
    |-- sections[]
          |-- section number, name, sort order
          |-- items[]
                |-- rowType: item | heading
                |-- description, quantity, unit
                |-- costType
                |-- material/labor/other unit costs

QuotationCalculation
    |-- component totals
    |-- actual cost
    |-- selling price before VAT
    |-- VAT amount and final amount
    |-- calculated section and item results
```

### Cost Types

| Cost type | Enabled unit-cost fields |
| --- | --- |
| `MATERIAL` | Material |
| `LABOR` | Labor |
| `MATERIAL_LABOR` | Material and Labor |
| `OTHER` | Other |

Heading rows are structural only. They have no calculated monetary value and are emitted as visual category rows in both PDF types.

## Persistence and Tauri Commands

### Desktop Storage

On startup, Tauri resolves its application data directory and opens:

```text
<Tauri application data directory>/database/qte-maker.db
```

The database schema is initialized from `src-tauri/src/schema.sql`. It contains:

| Table | Purpose |
| --- | --- |
| `quotations` | Quotation header, letter fields, pricing mode, and saved summary amounts. |
| `quotation_sections` | Ordered categories belonging to a quotation. |
| `quotation_items` | Ordered item or heading rows belonging to a category. |
| `quotation_documents` | Last recorded local path for each Cost or Selling document type. |
| `quotation_settings` | Key/value application settings. |

Foreign keys cascade from quotations to sections, items, and document records. QTE numbers are unique at the database level and are also checked before a save in the UI.

### Frontend Commands

| Command | Responsibility |
| --- | --- |
| `load_settings` | Load all settings from SQLite. |
| `save_settings` | Upsert settings in one transaction. |
| `list_quotations` | Load quotation headers, sections, and items in display order. |
| `save_quotation` | Insert or update one quotation and replace its nested rows transactionally. |
| `delete_quotation` | Delete one quotation and its dependent records. |
| `record_document` | Replace the recorded path for a Cost or Selling PDF. |

Rust struct payloads use `camelCase` at the Tauri boundary so they match the TypeScript model. SQLite columns remain `snake_case`; settings are stored as a key/value map.

### Browser Fallback

When the app is not running inside Tauri, the storage adapter uses these keys:

- `eyelectric-qte-maker.settings`
- `eyelectric-qte-maker.quotations`

Browser PDF export downloads through an anchor element. Browser document records are not persisted because `recordDocument` is intentionally a no-op outside Tauri.

## Calculation Rules

All monetary operations use `Decimal.js` with precision `40` and `ROUND_HALF_UP` rounding.

For every priced item:

```text
enabled component total = round(quantity * enabled unit cost, 2)
actual item total        = round(material + labor + other, 2)
selling item total       = round(actual item total * overall factor, 2)
selling unit cost        = round(selling item total / quantity, 2)
```

Section totals and quotation totals are then summed from the rounded item values. This means line rounding happens before aggregation.

VAT behavior in the current implementation:

```text
VAT_INCLUSIVE:
    VAT amount = round(selling price before VAT * VAT rate / 100, 2)
    final      = selling price before VAT + VAT amount

VAT_EXCLUSIVE or NON_VAT:
    VAT amount = 0.00
    final      = selling price before VAT
```

Validation rules:

- Quantity cannot be negative.
- Enabled unit costs cannot be negative.
- Overall pricing factor cannot be negative.
- VAT rate must be between `0` and `100`.
- Blank numeric fields are treated as zero by the calculation layer.
- Invalid numeric values prevent saving and PDF generation.

## PDF Design

The two PDFs deliberately expose different levels of information while sharing the same calculated result.

### Cost PDF

- A4 landscape layout.
- Internal metadata header with project, location, attention, QTE reference, and date.
- Cost banner showing cost mode, overall factor, VAT type, and VAT rate.
- Material, labor, and optional other component columns.
- Category and heading rows with colored fills.
- Actual cost, selling price before VAT, VAT, and final amount summary.
- Optional configured signature image.
- Page number and footer metadata.

### Selling PDF

- A4 portrait cover letter.
- Client, address, attention, subject, salutation, opening paragraph, terms, exclusions, and signatories.
- Customer-facing project amount summary.
- Landscape itemized attachment that shows selling unit cost and selling total only.
- No material total, labor total, actual cost, or overall pricing factor in the public-facing document.
- Optional logo and signature image.

Export file names are sanitized from the QTE number:

```text
<qte-number>-cost.pdf
<qte-number>-selling.pdf
```

## Visual Design System

The visual language is a practical engineering quotation desk: navy structure, red emphasis, pale blue information surfaces, and lightly tinted cost categories. The design favors clear hierarchy and dense data tables over decorative elements.

### Color Palette

| Token | Hex | Primary use |
| --- | --- | --- |
| `eyelectric.navy` | `#172454` | Header, primary buttons, headings, active tabs, final summary bar. |
| `eyelectric.red` | `#e62e3b` | Eyebrows, selling amount emphasis, PDF accent stripe, destructive emphasis. |
| `eyelectric.gold` | `#f6d85b` | Brand mark, pricing callouts, high-value accent text. |
| `eyelectric.blue` | `#c7d8ea` | Information panels, table headers, status surfaces, final PDF total. |
| `eyelectric.ink` | `#1f2937` | Default body text and high-contrast content. |
| `slate.100` | `#f1f5f9` | Application background. |
| `white` | `#ffffff` | Panels, forms, secondary buttons, document surfaces. |
| `category.green` | `#dcecc3` | First section/category highlight in PDF output. |
| `category.orange` | `#f8c98f` | Later section/category highlight in PDF output. |
| `category.peach` | `#f8dec7` | Heading rows and subtotal bands. |
| `pdf.yellow` | `#fff200` | Cost PDF pricing banner. |
| `pdf.muted` | `#667085` | PDF metadata and footer text. |

### Typography

- Primary family: `Arial, Helvetica, sans-serif`.
- Main headings use bold navy text.
- Small section eyebrows use uppercase red text with wide letter spacing.
- Field labels use uppercase, compact, muted text.
- Body copy uses slate or ink tones for readability.
- PDF body text uses the pdfmake `Roboto` font with smaller table-oriented sizing.

### Layout and Components

- Application shell: light slate background, navy header, red bottom border.
- Content width: up to `1600px` with `24px` horizontal padding.
- Tauri window: `1440 x 900` default, `1024 x 700` minimum.
- Panels: white surfaces, `12px` corners, slate borders, and the shared `shadow-panel` value.
- Primary actions: filled navy buttons.
- Secondary actions: white buttons with slate borders.
- Destructive actions: pale red buttons or red hover states.
- Icons: Lucide icons, normally `14px` to `20px`, with tooltip titles on icon-only actions.
- Tables: dense rows, uppercase compact headers, horizontal scrolling for wide cost tables.
- Responsive behavior: editor grids collapse at Tailwind breakpoints; wide tables keep their minimum readable width and scroll horizontally.

### Design Tokens in Code

Web tokens are defined in `tailwind.config.js`. Shared controls are in `src/components/Controls.tsx`. PDF-specific colors are kept close to the document builders in `src/pdf/costPdf.ts` and `src/pdf/sellingPdf.ts` because PDF output has different page and contrast requirements.

## Project Structure

```text
.
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── vitest.config.ts
├── src
│   ├── App.tsx                    # Application modes, tabs, and top-level state
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Tailwind layers and global styles
│   ├── components
│   │   ├── Controls.tsx           # Shared fields, buttons, panels, empty states
│   │   ├── QuotationList.tsx      # Saved QTE table and search
│   │   ├── ProjectForm.tsx        # Project, letter, and signatory fields
│   │   ├── ItemsEditor.tsx        # Categories, headings, items, and ordering
│   │   ├── PricingPanel.tsx       # Factor, VAT, and live totals
│   │   ├── ReviewPanel.tsx        # Internal summary and category totals
│   │   ├── PdfWorkspace.tsx        # Preview and export actions
│   │   └── SettingsPage.tsx       # Branding, defaults, and assets
│   ├── domain
│   │   ├── models.ts              # Draft, item, section, settings, and result types
│   │   ├── defaults.ts            # Empty settings and new quotation defaults
│   │   └── calculation.ts         # Decimal-safe pricing and validation
│   ├── data
│   │   └── storage.ts             # Tauri and browser persistence adapter
│   ├── pdf
│   │   ├── costPdf.ts             # Internal Cost PDF definition
│   │   ├── sellingPdf.ts          # Customer-facing Selling PDF definition
│   │   ├── pdfMake.ts             # pdfmake font setup and blob/buffer helpers
│   │   └── format.ts              # PDF money formatting
│   ├── ui
│   │   └── format.ts              # Currency, date, VAT, and section labels
│   ├── domain/*.test.ts            # Calculation and default tests
│   ├── data/*.test.ts              # Browser persistence tests
│   ├── pdf/*.test.ts               # PDF definition tests
│   └── validation/                 # Reference quotation and output validation
└── src-tauri
    ├── src/main.rs                 # Native entry point
    ├── src/lib.rs                  # Tauri builder and command registration
    ├── src/db.rs                   # SQLite state and command handlers
    ├── src/schema.sql              # SQLite schema and indexes
    ├── Cargo.toml                  # Rust dependencies
    ├── tauri.conf.json             # App identity, window, and build settings
    └── capabilities/default.json   # Tauri capability configuration
```

## Testing

Run the complete test suite:

```bash
npm test
```

Run Vitest in watch mode:

```bash
npm run test:watch
```

Run the type-check and production frontend build:

```bash
npm run build
```

The test suite covers:

- Component-enabled cost calculations.
- Negative and invalid pricing validation.
- Decimal rounding before aggregation.
- VAT mode behavior.
- New quotation defaults.
- Browser settings and quotation persistence.
- Cost and Selling PDF document shape.
- Configured signature inclusion.
- Reference quotation totals and PDF pagination stress cases.

The reference validation suite can write generated PDFs to a custom directory through `QTE_VALIDATION_OUTPUT`:

```powershell
$env:QTE_VALIDATION_OUTPUT = "$pwd\test-output"
npm test
```

## Extension Guide

### Add a New Quotation Field

1. Add the field to the relevant interface in `src/domain/models.ts`.
2. Add its default in `src/domain/defaults.ts`.
3. Normalize it in `src/data/storage.ts`.
4. Add the UI field to the appropriate component.
5. Add the Rust payload field and SQL column if it must persist in Tauri.
6. Include it in both PDF builders if it belongs in exported documents.
7. Add round-trip and PDF tests.

### Add a New Calculation Rule

Keep the rule in `src/domain/calculation.ts` and return it through `QuotationCalculation`. Do not duplicate the formula in a React component or PDF builder. Add a focused unit test for rounding, validation, and each affected VAT mode.

### Add a New Native Persistence Operation

1. Add a Tauri command in `src-tauri/src/db.rs`.
2. Register it in the `generate_handler!` list in `src-tauri/src/lib.rs`.
3. Add the matching adapter function in `src/data/storage.ts`.
4. Decide whether the browser fallback should emulate the operation or intentionally no-op.
5. Test the browser path and, when available, the native path.

### Change the Database Schema

The current startup path runs `CREATE TABLE IF NOT EXISTS`; there is no migration framework. Any schema change that affects existing installations needs an explicit migration/versioning strategy before release.

### Keep PDF Types Separate

The Cost PDF and Selling PDF are different document contracts. Shared data and formatting helpers are appropriate, but internal cost fields must not be introduced into the Selling PDF without an intentional product decision and a regression test.

## Privacy, Backup, and Current Limitations

- The app has no remote API or cloud synchronization layer.
- Desktop quotations, settings, embedded image data, and document records are stored locally.
- Exported PDF files are written to a user-selected local destination.
- Manual QTE references are required; automatic numbering is not implemented.
- The default desktop window is intentionally desktop-first with a `1024px` minimum width.
- Browser fallback data is separate from the desktop SQLite database.
- Bundle generation is disabled until release packaging is configured.
- There is currently no schema migration framework.
- For a manual backup, close the desktop app and copy the SQLite database from its Tauri application data directory, including the `database/qte-maker.db` path.

No license file is currently defined in this repository.
