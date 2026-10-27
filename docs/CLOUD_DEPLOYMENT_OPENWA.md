# ☁️ Deploying OpenWA WhatsApp Gateway to the Cloud

### Why Not Vercel?
**WhatsApp gateways cannot run on Vercel Serverless.**
- **Persistent Connection Required**: WhatsApp's companion protocol (Baileys) requires a **24/7 long-lived WebSocket connection** to WhatsApp's encryption servers to maintain the device link and receive real-time message delivery acknowledgments.
- **Serverless Limitation**: Vercel functions are stateless and freeze/terminate within 10–60 seconds after an HTTP request finishes. As soon as the function terminates, WhatsApp detects a disconnection and unlinks the device.

---

### Recommended Cloud Hosts (Free / Low Cost with Persistent WebSocket & Storage)

Your **Aleen React frontend** can remain hosted on **Vercel**, while your **OpenWA gateway** runs on a persistent cloud service.

---

## 1. Deploy on Railway.app (Easiest - ~2 minutes)
Railway provides continuous container runtimes and persistent storage disks:

1. Go to **[Railway.app](https://railway.app)** and log in with GitHub.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select `rmyndharis/OpenWA` (or your fork).
4. In project **Variables**, set:
   - `PORT`: `2785`
   - `ENGINE_TYPE`: `baileys`
   - `API_MASTER_KEY`: `your_custom_secret_key`
   - `DATABASE_TYPE`: `sqlite`
   - `DATABASE_NAME`: `/app/data/openwa.sqlite`
   - `SESSION_DATA_PATH`: `/app/data/sessions`
   - `REDIS_ENABLED`: `false`
   - `QUEUE_ENABLED`: `false`
   - `CACHE_ENABLED`: `false`
5. In **Settings** > **Volumes**, add a Volume mounted at `/app/data` (so your WhatsApp pairing survives restarts).
6. In **Settings** > **Networking**, click **Generate Domain** (e.g. `https://openwa-production.up.railway.app`).
7. Paste that URL into Aleen Settings on Vercel!

---

## 2. Deploy on Render.com
1. Go to **[Render.com](https://render.com)**.
2. Create a **New Web Service** from GitHub.
3. Select Docker runtime.
4. Add a **Persistent Disk** mounted at `/app/data` (1 GB).
5. Add the environment variables (`ENGINE_TYPE=baileys`, `API_MASTER_KEY=...`).
6. Get your public HTTPS URL (`https://your-service.onrender.com`).

---

## 3. Deploy on a $3.50/mo VPS (Hetzner, DigitalOcean, AWS Lightsail)
Run the one-line Docker command:
```bash
docker run -d \
  --name openwa \
  -p 2785:2785 \
  -e PORT=2785 \
  -e ENGINE_TYPE=baileys \
  -e API_MASTER_KEY=aleen_secret_key \
  -v openwa_sessions:/app/data \
  --restart always \
  ghcr.io/rmyndharis/openwa:latest
```

---

## 🔗 Connecting to Aleen on Vercel
Once deployed to Railway, Render, or a VPS:
1. Open your Aleen React app on Vercel (`https://aleen.vercel.app`).
2. Go to **Settings** > **Tab 6: ⚡ WhatsApp Gateway (OpenWA)**.
3. Set **Gateway Server URL** to your cloud domain (e.g. `https://openwa-production.up.railway.app`).
4. Enter your **API Key** and click **Save Settings**.
5. Click **"Start Session & Scan QR"** and scan with WhatsApp on your phone. Done!
