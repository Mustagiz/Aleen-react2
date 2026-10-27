# ⚡ OpenWA WhatsApp Gateway Integration for Aleen Boutique

Aleen is fully integrated with **[OpenWA (rmyndharis/OpenWA)](https://github.com/rmyndharis/OpenWA.git)**, a lightweight, self-hosted WhatsApp API Gateway.

This integration empowers Aleen to send automated POS receipts, e-invoices, fitting reminders, and marketing campaigns directly to clients without needing manual click-throughs on WhatsApp Web, while maintaining automatic fallback to WhatsApp Web if the gateway is offline.

---

## 🚀 1. Quickstart (Run OpenWA with Docker)

### Option A: Using Docker Compose (Recommended)
Run the bundled compose file directly from the project root:
```bash
docker compose -f docker-compose.openwa.yml up -d
```

### Option B: Using Standalone Docker CLI
```bash
docker run -d \
  --name aleen_openwa_gateway \
  -p 2785:2785 \
  -e PORT=2785 \
  -e ENGINE_TYPE=baileys \
  -e API_KEY=aleen_secret_key \
  -v openwa_sessions:/app/sessions \
  --restart unless-stopped \
  ghcr.io/rmyndharis/openwa:latest
```

OpenWA will start listening on **`http://localhost:2785`**.

---

## 📱 2. Pairing with WhatsApp (QR Scan)

1. Open Aleen in your browser (`http://localhost:3000` or production URL).
2. Go to **Settings** (`/settings`) > **Tab 6: ⚡ WhatsApp Gateway (OpenWA)**.
3. Configure your gateway settings:
   - **Gateway Server URL**: `http://localhost:2785` (or your remote VPS domain)
   - **Session ID**: `aleen_boutique`
   - **API Key**: `aleen_secret_key` (matches the `API_KEY` set above)
   - **Enable OpenWA Gateway**: Toggle **ON**
   - **Auto Fallback to WhatsApp Web**: Toggle **ON** (recommended so store cashiers are never blocked)
4. Click **"Save Settings"**.
5. Under **"Device Pairing & QR Code"**, click **"Start Session & Scan QR"**.
6. On your mobile phone, open **WhatsApp > Linked Devices > Link a Device**, and scan the QR code displayed on screen.
7. Once paired, the status will turn **"Connected & Active"** (Emerald Green).

---

## 💬 3. Where OpenWA is Integrated in Aleen

| Feature | Location | Behavior |
| :--- | :--- | :--- |
| **Invoice WhatsApp Dialog** | Invoices page > Click WhatsApp icon on any invoice | One-click instant dispatch via OpenWA, with real-time delivery confirmation and QR pairing modal shortcut. |
| **POS Checkout Bill Modal** | POS Checkout > Payment Completed Modal | Sends e-invoice summary instantly in the background without opening WhatsApp Web tabs. |
| **Customer CRM & Campaigns** | Customers page > Message / Campaign Studio | Dual dispatch: **⚡ Send via OpenWA** (direct automated dispatch) or **WhatsApp Web** (`wa.me` browser link). |
| **Fitting & Alteration Alerts** | Fitting & Measurements modal | Direct notifications when bespoke garments are ready for trial. |

---

## 🛡️ 4. Graceful Fallback (Zero POS Downtime)

If the OpenWA server is stopped, offline, or restarting:
- Aleen automatically detects the failure.
- If **"Auto Fallback to WhatsApp Web"** is enabled, it seamlessly opens standard WhatsApp Web (`https://wa.me/91...`) with pre-filled message text.
- Cashiers and staff are never blocked from completing a sale.

---

## 🧪 5. Testing & Verification

Unit tests for the OpenWA service layer are included:
```bash
npm test -- src/services/openwaService.test.js --watchAll=false
```
All 12 unit test cases test:
- WhatsApp JID formatting (`919876543210@c.us`)
- LocalStorage persistence
- Connection timeouts and error recovery
- Text and document payload serialization
