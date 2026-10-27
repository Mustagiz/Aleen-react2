# Atelier Design System & Luxury UI Polish Design Specification

- **Date:** 2026-10-27
- **Project:** Aleen Clothing Atelier ERP/CRM (Aleen-react2)
- **Status:** Approved for Implementation

---

## 1. Objectives & Guiding Principles

This design upgrade transforms the Aleen Clothing ERP/CRM into a cohesive, high-fashion luxury atelier experience:
1. **One Choice Per Axis (Visual Coherence)**: Eliminate radius clashes, mismatched control heights, and ad-hoc color treatments.
2. **Tabular Numerals & High Financial Legibility**: Strict usage of tabular numerals, monospace metrics, and right-aligned currency columns.
3. **Sensory Depth & Refined Micro-Interactions**: Gentle spring physics (`y: -3px`), frosted-glass sticky headers, and accessible soft-tint status badges.

---

## 2. Visual Foundation & Design Tokens

### 2.1 Radius Scale
- **Cards & Modals (`surface-card`)**: `16px`
- **Interactive Controls & Inputs (`control-default`)**: `10px`
- **Inner Pills / Filter Items (`pill-inner`)**: `8px` (abiding by `inner = outer - padding`)
- **Full Pills (`badge-pill`)**: `9999px` strictly for floating counter badges and status tags.

### 2.2 Control Heights & Spacing
- **Standard Controls**: `40px` (Buttons, Search Inputs, Select Triggers)
- **Compact Controls**: `32px` (Table action buttons, segmented filter options)
- **Icon Sizing**: `18px` - `20px` for standard button adornments; `14px` for table row actions.

### 2.3 Color Palette & Contrast
- **Primary Emerald**: Deep Emerald (`#0F766E`), Forest Dark (`#042F2E`), Mint Glow (`#2DD4BF`).
- **Champagne Gold**: `#D97706` (Accent / VIP / Ratings / Warnings).
- **Surfaces (Light)**: Base `#F8FAFC`, Paper `#FFFFFF`, Card `rgba(255, 255, 255, 0.95)`, Border `rgba(15, 118, 110, 0.12)`.
- **Surfaces (Dark / Midnight Atelier)**: Base `#081212`, Paper `#102020`, Card `linear-gradient(180deg, rgba(16, 32, 32, 0.92) 0%, rgba(10, 20, 20, 0.96) 100%)`, Border `rgba(20, 184, 166, 0.18)`.

---

## 3. Component Architecture & Changes

### 3.1 Theme & Global Styles (`ThemeContext.js`, `index.css`)
- Configure standard button styling with consistent `10px` border radius, `40px` height baseline, smooth hover lift, and active haptic scale (`0.985`).
- Ensure `font-variant-numeric: tabular-nums` is globally enforced for currency and numeric fields.
- Configure sleek scrollbars and typography tokens.

### 3.2 GlassCard & AtelierKpiCard (`GlassCard.js`, `AtelierKpiCard.js`)
- Standardize outer radius to `16px` with nested content hierarchy.
- Refine hover state with subtle spring physics and light/dark glow presets.
- Modernize trend chips and metric display using high-contrast soft-tint backgrounds.

### 3.3 Financial Ledger Suite (`PaymentSummary.js`, `FinanceNavTabs.js`)
- Replace disjointed date buttons with a unified segmented pill toolbar (`34px` height).
- Standardize the action bar with primary *Export Audit PDF* (emerald gradient) and secondary actions (*Shift Close*, *Export Excel*, *Print*) aligned at `40px` height.
- Sticky table header with frosted glass backdrop (`backdrop-filter: blur(10px)`).
- Tabular figures for transaction totals, average order values, and UPI references.
- Clean semantic badges for payment methods (Cash, UPI, Card, Net Banking).

### 3.4 Procurement & Vendor Suite (`Vendors.js`, `Purchases.js`)
- Consistent KPI metric presentation on top of vendor listings.
- Polished contact chips (WhatsApp, Phone, Email) with clear touch targets.
- Standardized dialog headers and form controls at `40px` height.

---

## 4. Verification & Testing Criteria
1. **Visual Consistency**: No mismatched button heights in toolbars; radii follow the 16px (card) / 10px (control) / 8px (inner) hierarchy.
2. **Responsive Checks**: Verify desktop and mobile behavior for ledger tables and segmented filters.
3. **Build & Lint Verification**: Run `npm run build` or project test scripts to ensure zero syntax or runtime errors.
