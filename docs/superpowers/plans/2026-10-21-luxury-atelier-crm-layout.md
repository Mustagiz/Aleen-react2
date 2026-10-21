# Luxury Atelier CRM Layout & UI/UX Redesign Implementation Plan

> **Goal**: Elevate Aleen Clothing into a high-end Luxury Fashion Atelier CRM with Deep Emerald & Champagne Gold palette, collapsible workflow sidebar, topbar breadcrumbs, and reusable CRM primitives.

- **Proposed Changes**:
  - Overhaul `src/contexts/ThemeContext.js` with the Luxury Atelier palette and MUI overrides.
  - Update `src/index.css` with luxury fonts, smooth scrollbars, and modern utility classes.
  - Build `src/components/crm/PageHeader.js`, `src/components/crm/AtelierKpiCard.js`, and `src/components/crm/SlideOverDrawer.js`.
  - Rewrite `src/components/Layout.js` into an interactive collapsible dual-state sidebar with grouped boutique workflows, topbar breadcrumbs, "+ Quick Bill" CTA, and `Cmd+K` trigger.
- **Target Verification**: Clean compilation via `npm run build`, responsive collapse/expand behavior, and smooth light/dark mode transitions.

---

### Task 1: Theme & Visual Tokens Overhaul

**Files Touched**:
- `src/contexts/ThemeContext.js`
- `src/index.css`

**Steps**:
1. Update `src/index.css` to import modern typography (`Plus Jakarta Sans`, `Playfair Display`, `Outfit`) and configure refined scrollbars.
2. Update `src/contexts/ThemeContext.js`:
   - Primary: Deep Emerald (`#0F766E`, light `#F0FDFA`, dark `#042F2E`).
   - Secondary: Champagne Gold (`#D97706`, light `#FEF3C7`, dark `#92400E`).
   - Backgrounds: Crisp Porcelain Alabaster (`#F8FAFC`) in light mode; Midnight Emerald (`#091313`, paper `#112020`) in dark mode.
   - Component overrides for `MuiButton`, `MuiCard`, `MuiPaper`, `MuiTableCell`, `MuiTableHead`, `MuiChip`, and `MuiTextField`.
3. Commit changes to git.

---

### Task 2: Reusable Luxury CRM Primitives

**Files Created**:
- `src/components/crm/PageHeader.js`
- `src/components/crm/AtelierKpiCard.js`
- `src/components/crm/SlideOverDrawer.js`

**Steps**:
1. Implement `PageHeader.js` providing:
   - Dynamic breadcrumb trail.
   - Title and optional subtitle.
   - Right-side action slot (e.g., "+ Add Customer", "Export CSV", "Filter").
2. Implement `AtelierKpiCard.js` providing:
   - Metric title, value, icon container, and trend chip (`+12.4% vs last week`).
   - Champagne gold and emerald metallic hairline borders.
3. Implement `SlideOverDrawer.js` providing:
   - Right-aligned slide-out drawer with backdrop blur and header action controls.
4. Commit changes to git.

---

### Task 3: Collapsible Atelier Layout & Navigation Engine

**Files Touched**:
- `src/components/Layout.js`

**Steps**:
1. Refactor `Layout.js` into a dual-state collapsible layout:
   - `isCollapsed` state persisted in localStorage.
   - Brand crest / monogram in sidebar header.
   - Grouped workflow categories:
     - **Sales & POS**: Dashboard, POS Terminal (`/invoices`), Orders (`/invoices`), Barcode Scanning (`/barcodes`).
     - **Clientele & CRM**: Guests & Customers (`/customers`), VIP Loyalty & Tiers (`/loyalty`), Marketing & Broadcasts (`/marketing`).
     - **Merchandise**: Atelier Inventory (`/inventory`), Purchase Orders (`/purchases`), Fabric & Vendors (`/vendors`).
     - **Finance & Audit**: Daily Ledger & Cash (`/payment-summary`), Profit & Loss (`/profit-loss`), Operating Expenses (`/expenses`), Intelligence & Reports (`/advanced-reports`).
     - **Administration**: Boutique Settings (`/settings`).
2. Build Topbar:
   - Collapse toggle button.
   - Current page breadcrumbs.
   - `Cmd + K` search bar trigger.
   - Store Register status pill (`● Register: Active`).
   - Champagne Gold `+ Quick Bill` button (navigates to `/invoices`).
   - Theme toggle (Porcelain Light / Midnight Emerald Dark).
   - Notification center trigger.
   - User profile dropdown with logout.
3. Mobile drawer fallback for screens `< 900px`.
4. Commit changes to git.

---

### Task 4: Verification & Build Validation

**Steps**:
1. Run `cross-env CI=false npm run build` (or verify with build tool) to ensure zero syntax or compilation errors.
2. Verify responsive layout, collapse toggle, keyboard shortcuts, and theme toggle.
3. Commit and push to git.
