# POS Invoicing Flow & Customer CRM/Loyalty Implementation Plan

> **Goal:** Enhance the Aleen Atelier POS billing workflow with rapid barcode scanning, instant customer autocomplete, loyalty points redemption at checkout, cash tender/change calculation, continuous thermal receipt printing (80mm & 58mm), bespoke client measurement profiles accessible directly from billing, and rich WhatsApp automation.

---

## Architecture & System Overview

```
                      ┌────────────────────────────────────────┐
                      │            POS Invoicing Flow          │
                      └───────────────────┬────────────────────┘
                                          │
            ┌─────────────────────────────┼────────────────────────────┐
            ▼                             ▼                            ▼
  ┌──────────────────┐          ┌──────────────────┐         ┌──────────────────┐
  │  Barcode Scanner │          │ Customer Lookup  │         │   Tender & Pay   │
  │  • USB Gun buffer│          │ • Autocomplete   │         │ • Quick Cash     │
  │  • Camera view   │          │ • Tier & Points  │         │ • Split Tender   │
  │  • Auto-qty inc  │          │ • 1-Click Measure│         │ • Change Due calc│
  └──────────────────┘          └─────────┬────────┘         └─────────┬────────┘
                                          │                            │
                                          ▼                            ▼
                                ┌──────────────────┐         ┌──────────────────┐
                                │ Loyalty Redeem   │         │ Thermal Receipt  │
                                │ • 1-Click Redeem │         │ • 80mm & 58mm    │
                                │ • Net Adjustment │         │ • UPI QR code    │
                                │ • Points Accrual │         │ • Points summary │
                                └──────────────────┘         └──────────────────┘
```

---

## Phase 1: Billing Engine & Document Model Enhancements

### 1.1 Update `billingEngine.js`
* Add support for `loyaltyPointsRedeemed` (₹1 per point) in `calculateInvoiceTotals`.
* Calculate `loyaltyPointsEarned` (default 1 point per ₹100 spent on net total, with tier multipliers: Silver 1.25x, Gold 1.5x, Platinum 2.0x).
* Compute cash tender change: `changeDue = Math.max(0, cashTendered - netTotal)`.
* Add unit tests in `src/engine/billingEngine.test.js`.

### 1.2 Update `documentModel.js`
* Include `loyaltyPoints`: `{ redeemed, pointsDiscount, earned, balance }`.
* Include `tender`: `{ cashTendered, changeDue, method }`.
* Include `thermalDetails`: formatted lines with dashed rules, compact line item columns for 80mm & 58mm printers.
* Add unit tests in `src/models/documentModel.test.js`.

---

## Phase 2: Rapid Barcode & Item Addition in POS

### 2.1 Scanner Enhancements in `src/pages/Invoices.js`
* Ensure the barcode input field has high-contrast styling and autofocus (`quickAddInputRef`).
* Rapid buffer: When a barcode/SKU is scanned or entered, if the item is already in `selectedItems`, immediately increment its `quantity` by 1 instead of duplicating rows, and trigger the success audio chime (`playBeep('success')`).
* Real-time stock display: Show available inventory stock next to line items, with low-stock / zero-stock warning chips.

---

## Phase 3: Customer Lookup, CRM & Loyalty Redemption in Checkout

### 3.1 Smart Patron Autocomplete in `src/pages/Invoices.js`
* Replace separate static inputs with an MUI `Autocomplete` selector:
  * Fast search by Phone, Full Name, or Member ID.
  * Dropdown options display Customer Avatar, Name, Mobile, Tier badge, and Points balance.
  * Instant "＋ Quick Add Patron" if not in the database.
* Right next to the customer chip, add a **"📏 Measurements"** button:
  * Opens the customer's bespoke measurement profile without closing or resetting the active invoice cart.

### 3.2 In-Checkout Loyalty Points Redemption
* When a customer with loyalty points is selected:
  * Display an Emerald VIP card in the bill totals section:
    `⭐ {name} has {points} Loyalty Points (₹{points} value)`.
  * Provide **"🎁 Redeem Max Points"** and custom points input.
  * Directly deduct points discount from Net Payable.
* On saving the invoice:
  * Automatically call `redeemLoyaltyPoints(selectedCustomerId, pointsRedeemed)`.
  * Award new loyalty points earned for this invoice and record them in customer history.

---

## Phase 4: Cash Tender & Change Due Calculator

### 4.1 Quick Cash Tender in `src/pages/Invoices.js`
* When payment method is `Cash` (or Tender 1 is `Cash`):
  * Display `Cash Tendered` input with instant smart shortcut buttons:
    * `Exact (₹{netTotal})`
    * `+₹100` / `+₹500`
    * `Next ₹100` / `Next ₹500` (e.g. if bill is ₹1,680, button offers ₹1,700 and ₹2,000)
    * `₹2,000` / `₹5,000` notes.
  * Display a prominent emerald badge: **"Change to Return: ₹{changeDue}"**.

---

## Phase 5: Thermal Receipt Printing (80mm & 58mm)

### 5.1 Thermal Slip Template Component (`src/components/ThermalReceipt.js`)
* Design a clean, continuous-roll thermal print component:
  * Supports both **80mm** (standard POS) and **58mm** (portable bluetooth POS).
  * Atelier header, invoice details, item table (Qty, Rate, Amt), tax summary, discount breakdown, loyalty points earned and total balance, UPI QR code.
  * CSS print rules with `@page { size: 80mm auto; margin: 2mm 3mm; }` ensuring clean cuts and no blank page ejections.
* Integrate into:
  * `src/components/BillSuccessModal.js` with dedicated "🖨️ 80mm Thermal" & "🖨️ 58mm Thermal" buttons.
  * `src/utils/printInvoice.js` with `printThermalReceipt(invoice, profile, width)`.

---

## Phase 6: WhatsApp Automation & Bespoke Measurement Profiles

### 6.1 WhatsApp Multi-Template Dispatcher
* In `BillSuccessModal.js`:
  * Enhance the automated WhatsApp message with loyalty points earned and digital invoice link:
    ```
    ✨ *Aleen Haute Couture* ✨
    Hello {Customer}, your invoice #{InvoiceNo} for ₹{Total} is ready!
    🛍️ Items: {ItemCount} garments
    ⭐ Loyalty Points Earned: +{PointsEarned} pts
    💎 New Points Balance: {NewBalance} pts
    🔗 View Your Atelier E-Bill: {BillLink}
    Thank you for shopping with us!
    ```
* In `src/pages/Customers.js` & `src/components/crm/Customer360Drawer.js`:
  * Add quick WhatsApp action menu with 4 pre-composed templates:
    1. Fitting & Alteration Trial Ready.
    2. Festive / New Collection VIP Preview.
    3. Loyalty Points Balance & Rewards Reminder.
    4. Custom Order Update.

### 6.2 Standalone Bespoke Measurement Modal (`src/components/crm/CustomerMeasurementModal.js`)
* Extract the comprehensive measurement interface into a modal usable from anywhere (Checkout dialog, Customers page, Tailoring Kanban).
* Allows instant live saving to Firebase / local state with immediate feedback.

---

## Verification & Testing
* Run `npm test -- --watchAll=false` to verify domain engine tests.
* Run `CI=false npm run build` to verify clean compilation with zero warnings/errors.
* Test POS checkout with barcode scanning, loyalty redemption, cash change calculator, and thermal print preview.
