/**
 * OpenWA Gateway Service
 * Integrates with self-hosted OpenWA WhatsApp API Gateway (https://github.com/rmyndharis/OpenWA.git)
 * Supports REST API session management, live QR code retrieval, direct text messages, and PDF invoice delivery.
 */

const STORAGE_KEY = 'aleen_openwa_settings';

export const DEFAULT_OPENWA_SETTINGS = {
  enabled: false,
  serverUrl: 'http://localhost:2785',
  apiKey: '',
  sessionId: 'aleen_boutique',
  autoFallbackToWeb: true
};

/**
 * Retrieves OpenWA settings from localStorage or defaults
 */
export const getStoredOpenWASettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OPENWA_SETTINGS;
    return { ...DEFAULT_OPENWA_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load OpenWA settings:', err);
    return DEFAULT_OPENWA_SETTINGS;
  }
};

/**
 * Saves OpenWA settings to localStorage
 */
export const saveOpenWASettings = (settings) => {
  try {
    const merged = { ...DEFAULT_OPENWA_SETTINGS, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('Failed to save OpenWA settings:', err);
    return settings;
  }
};

/**
 * Formats a phone number into WhatsApp JID (e.g., 919876543210@c.us)
 */
export const formatWhatsAppChatId = (phone = '', defaultCountryCode = '91') => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = `${defaultCountryCode}${digits.slice(1)}`;
  }
  return `${digits}@c.us`;
};

/**
 * Builds request headers for OpenWA API
 */
const buildHeaders = (apiKey) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (apiKey && apiKey.trim()) {
    headers['X-API-Key'] = apiKey.trim();
  }
  return headers;
};

/**
 * Normalizes baseUrl by trimming trailing slashes
 */
const cleanUrl = (url) => (url || 'http://localhost:2785').replace(/\/+$/, '');

/**
 * Checks connection health & session status with OpenWA gateway
 * Returns { success: boolean, status: string, error?: string }
 */
export const checkOpenWASessionStatus = async (overrideSettings = null) => {
  const cfg = overrideSettings || getStoredOpenWASettings();
  const url = `${cleanUrl(cfg.serverUrl)}/api/sessions/${encodeURIComponent(cfg.sessionId)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(cfg.apiKey),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, status: 'not_found', message: `Session "${cfg.sessionId}" does not exist yet.` };
      }
      return { success: false, status: 'error', message: `Server returned HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      success: true,
      status: data.status || data.state || 'unknown',
      details: data
    };
  } catch (err) {
    const isAborted = err.name === 'AbortError';
    return {
      success: false,
      status: 'offline',
      message: isAborted ? 'Connection timed out (check if OpenWA server is running)' : err.message
    };
  }
};

/**
 * Starts or creates an OpenWA session
 */
export const startOpenWASession = async (overrideSettings = null) => {
  const cfg = overrideSettings || getStoredOpenWASettings();
  const baseUrl = cleanUrl(cfg.serverUrl);

  try {
    // 1. Try to start existing session
    const startUrl = `${baseUrl}/api/sessions/${encodeURIComponent(cfg.sessionId)}/start`;
    const res = await fetch(startUrl, {
      method: 'POST',
      headers: buildHeaders(cfg.apiKey)
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }

    // 2. If not found, create session
    if (res.status === 404) {
      const createUrl = `${baseUrl}/api/sessions`;
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: buildHeaders(cfg.apiKey),
        body: JSON.stringify({ id: cfg.sessionId })
      });
      if (createRes.ok) {
        const createData = await createRes.json();
        return { success: true, data: createData };
      }
    }

    return { success: false, error: `Failed with HTTP ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Fetches QR code data for an OpenWA session
 */
export const getOpenWAQrCode = async (overrideSettings = null) => {
  const cfg = overrideSettings || getStoredOpenWASettings();
  const url = `${cleanUrl(cfg.serverUrl)}/api/sessions/${encodeURIComponent(cfg.sessionId)}/qr`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(cfg.apiKey)
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: QR code not available yet.` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return {
        success: true,
        qr: json.qr || json.data || json.code,
        qrUrl: json.qrUrl || null
      };
    } else {
      const blob = await res.blob();
      const qrUrl = URL.createObjectURL(blob);
      return { success: true, qrUrl };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Dispatches a text message directly via OpenWA
 */
export const sendOpenWATextMessage = async ({ phone, message, overrideSettings = null }) => {
  const cfg = overrideSettings || getStoredOpenWASettings();
  const chatId = formatWhatsAppChatId(phone);

  if (!chatId || !message) {
    return { success: false, error: 'Recipient phone number and message text are required.' };
  }

  const url = `${cleanUrl(cfg.serverUrl)}/api/sessions/${encodeURIComponent(cfg.sessionId)}/messages/send-text`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(cfg.apiKey),
      body: JSON.stringify({
        chatId,
        text: message
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        success: false,
        error: `OpenWA error (${res.status}): ${errText || res.statusText}`
      };
    }

    const data = await res.json().catch(() => ({}));
    return {
      success: true,
      messageId: data.messageId || data.id,
      timestamp: data.timestamp || Date.now()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Dispatches a document (PDF invoice) directly via OpenWA
 */
export const sendOpenWADocumentMessage = async ({
  phone,
  filename = 'invoice.pdf',
  base64 = '',
  url = '',
  mimetype = 'application/pdf',
  caption = '',
  overrideSettings = null
}) => {
  const cfg = overrideSettings || getStoredOpenWASettings();
  const chatId = formatWhatsAppChatId(phone);

  if (!chatId) {
    return { success: false, error: 'Recipient phone number is required.' };
  }

  const endpoint = `${cleanUrl(cfg.serverUrl)}/api/sessions/${encodeURIComponent(cfg.sessionId)}/messages/send-document`;

  const payload = {
    chatId,
    filename,
    mimetype,
    caption: caption || undefined
  };

  if (base64) {
    // Strip data URI prefix if present
    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    payload.base64 = cleanBase64;
  } else if (url) {
    payload.url = url;
  } else {
    return { success: false, error: 'Either base64 or url document data must be provided.' };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(cfg.apiKey),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        success: false,
        error: `OpenWA document error (${res.status}): ${errText || res.statusText}`
      };
    }

    const data = await res.json().catch(() => ({}));
    return {
      success: true,
      messageId: data.messageId || data.id,
      timestamp: data.timestamp || Date.now()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
