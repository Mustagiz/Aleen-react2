# Atelier Design System & Luxury UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the Aleen Clothing Atelier ERP/CRM design system into a cohesive luxury boutique experience across theme tokens, glass surfaces, financial ledgers, and vendor procurement.

**Architecture:** Standardize visual rules following the "one choice per axis" design law (16px cards, 10px controls, 8px inner tags). Implement spring physics micro-interactions in KPI cards and glass surfaces. Elevate the Payment Summary and Procurement screens with frosted-glass sticky table headers, unified segmented controls, and tabular financial figures.

**Tech Stack:** React 18, Material-UI v5 (MUI), Framer Motion, Emotion, CSS Variables.

**Spec:** `docs/superpowers/specs/2026-10-27-atelier-design-system-overhaul-design.md`

## Global Constraints

- **Card Radius:** 16px (`borderRadius: '16px'`)
- **Control Radius:** 10px (`borderRadius: '10px'`)
- **Inner Tag Radius:** 8px (`borderRadius: '8px'`)
- **Standard Control Height:** 40px
- **Compact Control Height:** 32px
- **Number Formatting:** Strict `font-variant-numeric: tabular-nums` for all financial tables and metric counters

---

### Task 1: Global Theme & Token Foundation

**Files:**
- Modify: `src/contexts/ThemeContext.js`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: MUI `createTheme`, CSS root variables
- Produces: Standardized button overrides, input overrides, tabular typography scales, and surface elevation tokens.

- [ ] **Step 1: Update `src/index.css` with unified design tokens and utility styles**

Add CSS custom properties for radius hierarchy (`--radius-card: 16px; --radius-control: 10px; --radius-inner: 8px;`) and ensure tabular numbers apply to all table cells and currency figures:

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-serif: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
  --emerald-primary: #0F766E;
  --emerald-light: #14B8A6;
  --emerald-dark: #042F2E;
  --gold-accent: #D97706;
  --radius-card: 16px;
  --radius-control: 10px;
  --radius-inner: 8px;
}
```

- [ ] **Step 2: Update `src/contexts/ThemeContext.js` component overrides**

Configure `MuiButton`, `MuiTextField`, `MuiPaper`, and `MuiTableCell` styles:
- `MuiButton`: Set `borderRadius: 10`, height default `40px`, padding `8px 18px`, smooth cubic-bezier transitions, and active scale `0.985`.
- `MuiOutlinedInput`: Set `borderRadius: 10`, height `40px`.
- `MuiTableCell`: Set font family `Plus Jakarta Sans`, tabular numerals, subtle border color.

- [ ] **Step 3: Verify build / syntax**

Run: `CI=false npm run build`
Expected: Compile successfully.

- [ ] **Step 4: Commit**

```bash
git add src/contexts/ThemeContext.js src/index.css
git commit -m "feat(theme): standardize design tokens, control heights, and tabular typography"
```

---

### Task 2: Core Surfaces & KPI Micro-interactions

**Files:**
- Modify: `src/components/GlassCard.js`
- Modify: `src/components/crm/AtelierKpiCard.js`

**Interfaces:**
- Consumes: `useTheme`, `motion.div` from `framer-motion`
- Produces: `GlassCard` and `AtelierKpiCard` with unified 16px radius, spring physics hover, and accessible soft-tint badges.

- [ ] **Step 1: Refine `GlassCard.js` surface & shadow balance**

Update `GlassCard` to enforce strict `16px` border radius, refined light/dark backdrops, and spring transition for `whileHover` (`transition: { type: 'spring', stiffness: 380, damping: 24 }`).

- [ ] **Step 2: Modernize `AtelierKpiCard.js` hierarchy and badges**

- Standardize outer radius to `16px`.
- Trend chip: convert to soft tint pill (`bgcolor: isTrendPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'`, text color `#047857` or `#B91C1C`, `borderRadius: '8px'`).
- Ensure numeric values use `font-variant-numeric: tabular-nums` and font weight 700.

- [ ] **Step 3: Verify build / syntax**

Run: `CI=false npm run build`
Expected: Compile successfully.

- [ ] **Step 4: Commit**

```bash
git add src/components/GlassCard.js src/components/crm/AtelierKpiCard.js
git commit -m "feat(ui): refine GlassCard and AtelierKpiCard with spring physics and luxury badges"
```

---

### Task 3: Financial & Audit Ledger Redesign

**Files:**
- Modify: `src/components/crm/FinanceNavTabs.js`
- Modify: `src/pages/PaymentSummary.js`

**Interfaces:**
- Consumes: `GlassCard`, `AtelierKpiCard`, `FinanceNavTabs`
- Produces: Polished daily cash ledger with segmented date picker, frosted sticky table header, and tabular currency formatting.

- [ ] **Step 1: Polish `FinanceNavTabs.js`**

Align tabs with smooth indicator transition, `10px` pill hover effect, and clean border separator.

- [ ] **Step 2: Redesign toolbar & date selector in `PaymentSummary.js`**

- Replace ad-hoc date buttons with a unified segmented control bar (`height: 38px`, `borderRadius: '10px'`, active item background `#0F766E` with smooth background shift).
- Standardize all action buttons (*Export Audit PDF*, *Shift Close*, *Export Excel*, *Print*) to `height: 40px`, `borderRadius: '10px'`.

- [ ] **Step 3: Upgrade transaction table styling in `PaymentSummary.js`**

- Add frosted glass sticky header: `position: 'sticky', top: 0, zIndex: 2, backdropFilter: 'blur(10px)'`.
- Align financial amount columns to the right with tabular numerals.
- Update payment method chips (Cash, UPI, Card, Net Banking) to use soft tinted backgrounds with corresponding brand hues.

- [ ] **Step 4: Verify build / syntax**

Run: `CI=false npm run build`
Expected: Compile successfully.

- [ ] **Step 5: Commit**

```bash
git add src/components/crm/FinanceNavTabs.js src/pages/PaymentSummary.js
git commit -m "feat(finance): redesign PaymentSummary toolbar, segmented filters, and ledger table"
```

---

### Task 4: Procurement Suite & Dialog Polish

**Files:**
- Modify: `src/pages/Vendors.js`
- Modify: `src/pages/Purchases.js`

**Interfaces:**
- Consumes: `GlassCard`, `AtelierKpiCard`, `useData`
- Produces: Modernized procurement and supplier management with consistent 10px control radii and luxury dialogs.

- [ ] **Step 1: Polish `Vendors.js` filter bar and action buttons**

- Standardize search input and filter selects to `40px` height with `10px` radius.
- Standardize "Add Vendor" primary button to emerald gradient with `40px` height and `10px` radius.
- Style contact chips (WhatsApp, Phone, Email) with rounded-lg buttons and subtle hover glows.

- [ ] **Step 2: Polish `Purchases.js` ledger table and metrics**

- Ensure KPI cards follow the standardized 16px radius.
- Right-align purchase invoice totals and payment status chips.

- [ ] **Step 3: Verify build / syntax**

Run: `CI=false npm run build`
Expected: Compile successfully.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Vendors.js src/pages/Purchases.js
git commit -m "feat(procurement): elevate Vendors and Purchases UI with unified controls and tables"
```

---

### Task 5: End-to-End Build & Visual Verification

**Files:**
- Verification only

- [ ] **Step 1: Run complete production build**

Run: `cross-env CI=false npm run build`
Expected: Build passes with zero errors and clean output bundle.

- [ ] **Step 2: Check git status and final diff**

Run: `git status && git log -n 5 --oneline`
Expected: Clean working tree with structured commits.
