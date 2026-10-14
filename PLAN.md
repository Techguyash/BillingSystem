# Digital Billing & Business Management Platform — Project Plan

## 1. Vision

A fully customizable billing & business management platform that replaces traditional paper/manual billing for businesses of any size, covering **billing/invoicing, inventory management, customer/supplier management, reporting, and role-based access**, with every module configurable per business/industry. Launches with India GST compliance, built on a pluggable tax engine so other countries can be added later.

**Deployment model (revised):** v1 is a **single-business, on-prem/local install** — it runs on the customer's own computer against a local database, so it works with zero dependency on the internet or any central server. It is built as a web app first (runs locally, accessed via browser), architected cleanly enough that we can later (a) wrap it as a native desktop app, and (b) evolve it into a centralized, multi-tenant SaaS product with a monitoring dashboard we operate — without a rewrite. We are **not** building multi-tenancy, offline-sync, or centralized infra now; we're keeping the core domain model and module boundaries clean so those can be layered on later.

## 2. Guiding Principles

- **Configuration over hardcoding**: tax rules, invoice numbering, custom fields, roles/permissions, invoice templates, and enabled modules are all configurable per business, not baked into code.
- **Simple first, extensible later**: build the smallest architecture that works for a single local install; keep module boundaries and data-access patterns clean so multi-tenancy, sync, and centralized monitoring can be added later without a rewrite (see §9 "Future Extension Path").
- **API-first**: every feature exposed via a REST API so the web UI, a future native/mobile client, and third-party integrations (Tally/Zoho) all consume the same backend.
- **Security & auditability by default**: every write is attributable to a user, immutable audit log, principle-of-least-privilege RBAC.

## 3. Proposed Tech Stack (simplified for local install)

| Layer | Choice | Why |
|---|---|---|
| Backend | **Java + Spring Boot** (Maven, Spring Data JPA/Hibernate, Spring Security) | Mature, strongly-typed enterprise stack; Spring Data JPA repositories + `@PreAuthorize("hasAuthority(...)")` map cleanly to our module/RBAC design; widely supported for long-term maintenance. Replaced an earlier NestJS prototype when the team chose to standardize on Java. |
| Database | **Local PostgreSQL** | Relational integrity for ledgers/invoices, JSONB for custom fields. Runs as a local Postgres instance on the customer's machine (bundled installer later); no cloud DB dependency |
| Background work | **In-process async** (direct async/await in request handlers, or a simple in-memory job runner for retries) | No Redis/queue infra needed for a single-user/single-shop install; revisit when centralizing (§9) |
| Web Frontend | **React + TypeScript** (Vite), Tailwind + shadcn/ui | Runs in the browser against the local backend; fastest path to a polished, responsive UI; no PWA/offline-sync complexity needed since the backend is already local |
| Packaging (near-term) | Local backend process + browser UI (`localhost`) | Simplest to build and iterate on now; revisit Electron/native wrapper once core features are solid |
| File/Doc storage | Local filesystem | Product images, exported reports/PDFs stored on disk; swappable for object storage later if centralized |
| PDF/Invoice rendering | Template engine (Handlebars/React-PDF) + headless rendering | Customizable invoice templates |
| Payments | Pluggable gateway adapter (Razorpay first) | Indian market first, extensible; optional since many small shops just record cash/UPI manually |
| GST / e-Invoice | Pluggable compliance adapter (NIC / ClearTax / Cygnet API) | Isolated behind an interface so it can be added without touching core billing logic |
| Auth | JWT (access + refresh), custom roles & permissions | Standard, and already matches the shape needed if we centralize later |

*(Redis/BullMQ, multi-tenant RLS, offline-sync, and cloud object storage are deliberately deferred — see §9. Open to adjusting anything here before we scaffold.)*

## 4. Core Domain Model (high level)

- **Business (single row for now)** → **Branch/Store** → **User** (with **Role**, custom **Permissions**)
- **Product** → **ProductVariant**, **Category**, **UOM**, **PriceList**, **TaxRule**
- **Customer**, **Supplier** (with ledgers)
- **Invoice** (sales), **PurchaseOrder/Bill** (purchase), **InvoiceItem**, **CreditNote/DebitNote**
- **Payment** (against invoice/ledger), **Expense**
- **StockLedger** (every stock movement: sale, purchase, transfer, adjustment, with batch/expiry support)
- **AuditLog** (immutable, every mutating action)
- Every major entity carries a `customFields: jsonb` column to support per-business custom attributes without schema migrations.
- We still include a `business_id` foreign key on every table from day one (pointing at the single business row) even though there's only one business per install — this costs nothing now and is exactly what makes multi-tenancy a config change rather than a schema rewrite later (see §9).

## 5. Customization Strategy (single install)

- **Module toggles**: the business can enable/disable modules (e.g., a service business can turn off Inventory entirely) via Settings.
- **Custom roles & permissions**: permissions are granular (`invoice.create`, `inventory.adjust_stock`, `reports.view_gst`, etc.); the business owner composes their own roles instead of fixed Admin/Staff only.
- **Custom fields & templates**: configurable extra fields per entity, and a template builder for invoice/quotation layouts (logo, fields shown, terms, language).
- **Numbering & tax rules**: configurable invoice number formats, multiple tax rules/rate groups, discount rules, price lists (retail/wholesale/distributor tiers).

## 6. Feature Set

**Traditional billing system features (parity):**
Sales & purchase invoicing, quotations/estimates, GST-compliant tax invoices, stock in/out with low-stock alerts, batch & expiry tracking, barcode support, customer/supplier running ledgers & dues, multiple payment modes (cash/card/UPI/cheque), returns & credit/debit notes, multi-branch support, user roles, core reports (sales, purchase, stock, profit & loss, GST returns), discounts/offers, print & PDF export, thermal printer support.

**Additional/modern features:**
Barcode/QR scan via phone camera, automated e-Invoice & e-Way bill generation, invoice sharing via WhatsApp/SMS/email, customer loyalty/rewards, fully custom fields & invoice templates, multi-language UI, low-stock/reorder suggestions & basic sales trends, tamper-evident audit trail, public API for integration with Tally/Zoho/accounting tools, light/dark theming, CSV/Excel/Tally-XML import-export, role-based dashboards, scheduled/emailed reports, multi-currency support for cross-border sellers. (Offline-sync across branches and a plugin marketplace move to the future SaaS phase in §9, since a single local install has no sync problem to solve.)

## 7. Phased Roadmap (local single-install product)

0. **Foundations** — repo scaffolding, local Postgres setup, auth, base RBAC.
1. **MVP core** — products, customers, basic sales invoicing, single branch, essential reports.
2. **GST & payments** — tax engine, e-Invoice/e-Way bill integration, payment gateway, customizable PDF templates.
3. **Advanced inventory & multi-branch** — ✅ purchase orders (suppliers → stock-in, auto cost-price update), manual stock adjustments with reason tracking, barcode included in product search, configurable units of measure (seeded defaults + business-defined custom units), composite/bundle products (a virtual SKU made of other products — selling/voiding/returning one adjusts each component's stock, with insufficient-stock validation across the whole bundle). Remaining: stock transfers between branches, batch/expiry tracking.
4. **Reporting & analytics** — ✅ real sales/GST/top-products/payment-method/low-stock reports with date-range filtering, dashboard wired to live data, CSV export per report, expense tracking (non-inventory costs with CSV export), a functional global search (products/customers/suppliers/invoices) in the topbar. Remaining: scheduled/emailed reports (needs an SMTP/background-job decision — deferred), COGS-based gross-profit reporting.
5. **Customization engine** — ✅ custom fields (business-defined extra fields on products/customers/suppliers, rendered dynamically in forms), module toggles (hide unused sidebar sections), custom roles & team management UI (create roles with arbitrary permission sets, invite/manage users). Remaining: a true invoice/receipt template builder (today: logo, terms, footer, number prefix, HSN toggle — configurable but not a visual editor).
5b. **Quotations, returns & ledgers** — ✅ quotations/estimates with one-click convert-to-invoice (locks in quoted prices), sales returns (credit notes against specific invoice lines, capped at quantity remaining, restocks on the sale side — including bundle components), purchase returns (debit notes against purchase order lines, same capping, decrements stock), customer and supplier running ledgers/statement-of-account (opening balance + invoices/purchases + payments + returns, chronological running balance), supplier payment tracking (mirrors invoice payments on the purchase side). ✅ An append-only audit log (who did what, when) covering all the mutating actions above plus products/customers/suppliers/users/roles/settings, with its own page and CSV export.
6. **Packaging & distribution** — installer/setup script for customer machines (Postgres + backend + frontend), licensing.
7. **Native/offline-capable client** — revisit Electron or similar wrapper once the web app is feature-complete.
8. **Centralize & monitor** — see §9: multi-tenancy, cross-branch sync, centralized ops dashboard, subscription billing.
9. **Scale & hardening** — performance tuning, backups/DR, observability, security audit.

## 8. Non-Functional Requirements

- **Security**: encryption at rest where practical, no raw card data stored (use gateway tokens), principle-of-least-privilege RBAC.
- **Reliability**: automated local backups (scheduled DB dump) since there's no cloud redundancy yet.
- **Observability**: structured local logging from day one so issues are diagnosable remotely once we add central monitoring (§9).
- **Testing**: unit tests for tax/invoice calculation logic (money math is unforgiving), integration tests for core billing flows, e2e tests for the POS screen.
- **Compliance**: GST invoice format rules, data retention requirements, exportable audit trail.

## 9. Future Extension Path (not built now, designed for)

These are explicitly deferred, but the §3–§5 choices (business_id on every table, API-first backend, pluggable adapters) are picked so none of this requires a rewrite:

- **Multi-tenancy**: turn the existing `business_id` column into a real foreign key to multiple `Business` rows, add Postgres Row-Level Security, add a tenant-resolution layer (subdomain/login-based) to the API.
- **Centralized monitoring dashboard**: each install gets a lightweight heartbeat/telemetry client (version, health, usage stats) that reports to a central service you operate — opt-in, minimal, added as its own module without touching core billing code.
- **Cross-branch/cloud sync**: once a business has multiple locations needing a shared view, introduce a sync protocol (local Postgres ⇄ central Postgres) with conflict resolution — this is where "offline-first" concerns return, scoped only to sync, not the whole app.
- **Redis/queues**: reintroduced only when concurrent load (many tenants, scheduled jobs at scale) actually requires it.
- **Licensing/subscription billing**: once distributing to many customers, add a license-key/activation flow and (if moving to subscription pricing) a billing-for-the-product-itself module.

## 10. UI/UX Design System (production-grade, customer-facing)

Design research was run through the UI/UX Pro Max design-intelligence skill and persisted so every future screen stays consistent. Files:
- `design-system/billing-system/MASTER.md` — global source of truth (marketing/auth/onboarding surfaces)
- `design-system/billing-system/pages/app-dashboard.md` — override for the core app (billing counter, inventory, reports)

**Two deliberately different visual modes, one shared design language:**

| Surface | Style | Density | Motion |
|---|---|---|---|
| Marketing site, login/signup, onboarding wizard | Glassmorphism-accented SaaS look, warm CTA, spacious | Standard (7/10) | Standard — entrance animations, stagger on feature grids |
| Core app (POS/billing screen, inventory, reports, settings) | **Data-Dense Dashboard** — data tables, KPI cards, minimal chrome, max information visibility | Dense (8/10) | Subtle — scroll reveal only, no flashy motion that slows down a cashier |

This split matters: a customer deciding to *buy* the product sees a polished, premium brand; a cashier *using* the product all day needs speed, density, and zero animation friction. Both share the same color tokens, type scale, and component primitives so it never feels like two different products.

**Design tokens (both modes):**
- Primary: `#1E40AF`/`#2563EB` (trust blue), Accent/CTA: amber/orange, Destructive: `#DC2626`, neutral slate background/foreground — full token table in `MASTER.md`.
- Typography: **Plus Jakarta Sans** across the whole product (friendly, modern, highly legible at small sizes — important for dense invoice tables); a monospace (Fira Code/JetBrains Mono) reserved only for numeric/currency columns in tables and reports for alignment, not full UI text.
- 8px-based spacing scale, consistent border radius (8px controls / 12px cards), elevation via the shadow scale in `MASTER.md`.
- Icons: a single consistent SVG set (Lucide/Heroicons) — no emojis anywhere in the product UI.

**Navigation & IA (what will actually impress a buyer: things work the way they expect):**
- **App shell**: persistent left sidebar (collapsible) grouped by module — Dashboard, Billing/POS, Inventory, Customers, Reports, Settings — only showing modules enabled in Settings (ties into the module-toggle system from §5).
- **Top bar**: global search (products/customers/invoices), branch switcher, notifications, user/account menu.
- Breadcrumbs on any screen 3+ levels deep; sidebar item always reflects current section (no "lost in the app" moments).
- **POS/billing screen** is treated as its own focused, full-height layout (not boxed inside the standard dashboard chrome) — large touch targets (44×44px minimum) for fast item entry, big total display, keyboard-shortcut friendly for power users on a counter.
- Keyboard navigation and visible focus rings everywhere (critical for both accessibility and power-user speed).

**Component system & stack:**
- React + TypeScript, **Tailwind CSS** + **shadcn/ui** (Radix-based) for accessible, themeable primitives (buttons, dialogs, forms, tables) — avoids building a design system from scratch and gives us accessible components (focus traps, ARIA) for free.
- Data tables: TanStack Table (virtualized for large inventory/invoice lists) + the dense-dashboard styling tokens.
- Charts: KPI cards use bullet/gauge-style widgets for single metrics; trend data uses line/bar charts (Recharts or ApexCharts) — legends and tooltips always paired with a visible data point, never color-only.
- Dark mode supported (toggle, not default) using the same token set with a dark palette variant.

**Accessibility & quality bar (non-negotiable for "production-grade"):**
- WCAG AA: 4.5:1 text contrast minimum, full keyboard operability, visible focus states, `prefers-reduced-motion` respected.
- Responsive breakpoints tested at 375 / 768 / 1024 / 1440px; POS screen also tested on common tablet sizes used at physical counters.
- No layout shift on load (CLS < 0.1), skeleton loaders instead of blank/spinner-only states for tables and dashboards.
- Every destructive action (delete product, void invoice) requires confirmation with clear, specific copy (not just "Are you sure?").

**Next step for implementation**: once we scaffold the frontend, each new screen should check `design-system/billing-system/pages/<page>.md` first (create one if a screen needs to deviate, e.g. the POS screen itself), falling back to `MASTER.md` otherwise — this keeps the UI consistent as more engineers/agents touch the codebase over time.

## 11. Open Decisions (need your input before/while building)

- Whether card/UPI payment collection is handled fully by a gateway (recommended) or needs in-house reconciliation.
- When to revisit native packaging (Electron) vs. continuing as a local-server + browser app (Phase 7).
- Licensing/distribution model for customers once we package an installer (Phase 6).
- **Java runtime on customer machines**: since the backend now runs on the JVM, the installer (Phase 6) needs to bundle a JRE (e.g. via `jlink`/jpackage) so customers don't need Java pre-installed — same local-install principle as before, just a different runtime to bundle than Node's.

---

**Current status**: Phase 0, Phase 1 (MVP core), Phase 2 (GST & payments), the core of Phase 3 (advanced inventory), the core of Phase 4 (reporting & analytics), the core of Phase 5 (customization engine), and Phase 5b (quotations, returns & ledgers) are implemented end-to-end — auth/RBAC, business profile, products (incl. configurable units and composite/bundle products), customers, suppliers, billing/POS, invoices with partial payments, GST CGST/SGST/IGST display, purchase orders with supplier payment tracking, manual stock adjustments, quotations/estimates with convert-to-invoice, sales returns (credit notes) and purchase returns (debit notes), customer/supplier statements of account, expense tracking, a functional global search, an audit log, a full Reports page with CSV export, business-defined custom fields on products/customers/suppliers, module toggles, and a Team page for managing custom roles (arbitrary permission sets) and users. The backend was migrated from an initial NestJS prototype to **Java + Spring Boot** (Maven), which lives at `backend/` and exposes the same REST contract the frontend depends on (same routes, JSON shapes, and JWT auth flow), verified via automated browser testing after the migration and after each subsequent phase.
