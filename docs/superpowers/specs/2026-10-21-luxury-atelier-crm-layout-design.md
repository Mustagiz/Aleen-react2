# Design Specification: Aleen Luxury Fashion Atelier CRM & Layout Redesign

**Date**: 2026-10-21  
**Project**: Aleen Clothing (`Aleen-react2`)  
**Status**: Approved for Implementation  
**Architecture Classification**: Architectural  

---

## 1. Overview & Vision
Transform the Aleen Clothing retail management app from a generic, pink-tinted POS template into a **high-end Luxury Fashion Atelier CRM & ERP**. The redesigned system will reflect the elegance of a luxury fashion house (like Chanel, Sabyasachi, or Dior) while delivering the speed and high data density of modern enterprise SaaS (like Linear, HubSpot, and Shopify POS).

---

## 2. Design System: Luxury Fashion Atelier Palette

### 2.1 Color Tokens
| Token | Light Mode (Porcelain Atelier) | Dark Mode (Midnight Emerald) | Role / Usage |
| :--- | :--- | :--- | :--- |
| **Primary (Emerald)** | `#0F766E` (Deep Teal Emerald) | `#14B8A6` (Luminous Teal) | Brand primary, active sidebar links, primary actions |
| **Primary Light** | `#F0FDFA` (Mint Alabaster) | `#132E2B` (Deep Emerald Tint) | Active item background, pill badges |
| **Primary Dark** | `#042F2E` (Royal Forest) | `#021F1E` (Obsidian Green) | Monogram, high-contrast text |
| **Secondary (Gold)** | `#D97706` (Champagne Gold) | `#F59E0B` (Luminous Amber) | VIP accents, "+ New Bill" CTA, loyalty rewards |
| **Secondary Light** | `#FEF3C7` (Warm Gold Cream) | `#2A2006` (Subtle Gold Hue) | VIP guest badges, highlight ribbons |
| **Canvas Background** | `#F8FAFC` (Cool Crisp Porcelain) | `#0B1313` (Midnight Atelier) | Main viewport canvas |
| **Paper / Card Surface** | `#FFFFFF` (Pure Alabaster) | `#112020` (Dark Emerald Surface)| Tables, stat cards, slide-over sheets |
| **Borders & Dividers** | `rgba(15, 118, 110, 0.12)` | `rgba(255, 255, 255, 0.08)` | Delicate hairline dividers |
| **Text Primary** | `#0F172A` (Slate Ink) | `#F8FAFC` (Crisp White) | Main headings, table text, numbers |
| **Text Secondary** | `#64748B` (Cool Slate) | `#94A3B8` (Muted Teal-Grey) | Subtitles, helper text, timestamps |

### 2.2 Typography Hierarchy
- **Brand & Section Headings**: `Playfair Display`, `Outfit`, or `Plus Jakarta Sans` (`font-weight: 800`, letter-spacing `-0.02em`).
- **Body & Data Tables**: `Plus Jakarta Sans`, `Inter`, `-apple-system` (`font-weight: 500, 600`).
- **Numbers, Barcodes & Currencies**: `Geist Mono`, `JetBrains Mono`, `tabular-nums` for precise alignment of amounts and SKU codes.

---

## 3. Workspace Layout Architecture (`src/components/Layout.js`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] ALEEN CLOTHING   🔍 Search guests, SKUs, bills (Cmd+K)    [● Register: Open] [+ New Bill] │
├─────────────────────┬──────────────────────────────────────────────────────────────────┤
│ ▼ SALES & POS       │ Breadcrumbs: Atelier CRM / Guests / VIP Directory                 │
│   • POS Terminal    │                                                                  │
│   • Invoices        │ Page Title: Customer 360° Management                             │
│   • Barcodes        │ ┌───────────────┐ ┌───────────────┐ ┌──────────────────────────┐ │
│ ▼ CLIENTELE & CRM   │ │ Total Guests  │ │ VIP Champions │ │ Outstanding Store Credit │ │
│   • Customers       │ │ 1,280         │ │ 142 Guests    │ │ ₹ 42,500                 │ │
│   • VIP Loyalty     │ └───────────────┘ └───────────────┘ └──────────────────────────┘ │
│   • Marketing       │                                                                  │
│ ▼ MERCHANDISE       │ ┌──────────────────────────────────────────────────────────────┐ │
│   • Inventory       │ │ [High-Density Customer CRM Table with Filter Bar]            │ │
│   • Purchases       │ │ • Guest Name & Tier    • Sizing/Fit   • Total LTV   • Actions  │ │
│   • Vendors         │ └──────────────────────────────────────────────────────────────┘ │
│ ▼ FINANCE & AUDIT   │                                                                  │
│   • P & L Ledger    │                                                                  │
│   • Cash Summary    │                                                                  │
│ ▼ SETTINGS          │                                                                  │
├─────────────────────┤                                                                  │
│ [👤 Store Manager] │                                                                  │
└─────────────────────┴──────────────────────────────────────────────────────────────────┘
```

### 3.1 Collapsible Sidebar Structure
- **Dual-State Mode**:
  - **Expanded Mode (260px)**: Displays the full boutique crest, section headers, badges, and titles.
  - **Collapsed Mode (74px)**: Minimalist icon-only dock with interactive hover tooltips for maximum screen real estate during billing.
- **Grouped Workflow Navigation**:
  1. **Sales & POS**: Dashboard, POS Terminal (`/invoices`), Sales Register (`/invoices`), Barcode Scanning (`/barcodes`).
  2. **Clientele & CRM**: Guest Directory (`/customers`), VIP Loyalty & Tiers (`/loyalty`), Marketing & Broadcasts (`/marketing`).
  3. **Merchandise**: Atelier Inventory (`/inventory`), Purchase Orders (`/purchases`), Fabric & Vendors (`/vendors`).
  4. **Finance & Audit**: Daily Ledger & Cash (`/payment-summary`), Profit & Loss (`/profit-loss`), Operating Expenses (`/expenses`), Intelligence & Reports (`/advanced-reports`).
  5. **Boutique Administration**: Settings & Tax Config (`/settings`).
- **Footer Capsule**: Displays the active store associate's avatar, initials, role pill (`Store Manager`), and quick logout trigger.

### 3.2 Top Navigation Bar (Header)
- **Sidebar Collapse Toggle**: Smooth button with icon rotation.
- **Dynamic Breadcrumbs**: Reflects current page hierarchy (`Atelier CRM > Sales > Invoices`).
- **Global Search Capsule (`Cmd + K`)**: Instant trigger for the `GlobalSearch` dialog.
- **Live Register Status Badge**: Shows whether the current cashier session is active (`● Register: Active`).
- **Quick Action ("+ New Bill")**: Prominent champagne gold pill button opening the POS terminal directly from anywhere in the app.
- **Theme Toggle**: Switch between Luxury Porcelain Light Mode and Midnight Emerald Dark Mode.
- **Notification Center**: Bell icon with unread badge count for low-stock and payment alerts.

---

## 4. Reusable CRM Component Primitives

### 4.1 `PageHeader` (`src/components/crm/PageHeader.js`)
Standardizes every page with:
- Title + Subtitle
- Breadcrumb navigation
- Action button group (e.g., `Export CSV`, `Filter`, `+ Primary Action`)

### 4.2 `AtelierKpiCard` (`src/components/crm/AtelierKpiCard.js`)
Elevates dashboard metrics with:
- Delicate 1px emerald/gold hairline border
- Metric value in high-visibility typography
- Trend pill (e.g., `+18% vs last week`)
- Background watermark icon / subtle gradient glow

### 4.3 `SlideOverDrawer` (`src/components/crm/SlideOverDrawer.js`)
A modern right-side sliding sheet drawer that replaces full-screen popup modals, allowing users to inspect customer profiles, invoice line items, or vendor history while keeping the background context visible.

---

## 5. Implementation Files & Scope

1. **`src/contexts/ThemeContext.js`**:
   - Complete replacement of the color palette with Luxury Emerald, Champagne Gold, and Porcelain tokens.
   - Global component style overrides for `MuiButton`, `MuiCard`, `MuiPaper`, `MuiTableCell`, `MuiTableHead`, `MuiChip`, and `MuiTextField`.
2. **`src/components/Layout.js`**:
   - Implement the collapsible dual-state Luxury Atelier sidebar with grouped workflow navigation, breadcrumbs, `Cmd + K` search trigger, and "+ New Bill" CTA.
3. **`src/components/crm/PageHeader.js`**:
   - New reusable header component with breadcrumbs and contextual actions.
4. **`src/components/crm/AtelierKpiCard.js`**:
   - New luxury metric card primitive.
5. **`src/index.css` & Global Styles**:
   - Modern scrollbars, smooth transitions, font family definitions, and table density styling.
6. **Validation**:
   - Build validation via `npm run build` or development bundle verification.
   - Visual verification of layout transitions, responsive behavior on mobile/tablet, and light/dark theme toggle.

---

## 6. Verification Criteria
- [ ] No compilation or runtime errors during build.
- [ ] Sidebar collapses smoothly between 260px and 74px with responsive drawer support on mobile.
- [ ] `Cmd + K` opens the Global Search dialog instantly.
- [ ] Theme toggle switches seamlessly between Porcelain Atelier and Midnight Emerald.
- [ ] All 17 routes remain 100% accessible and functional.
