/**
 * Message Dispatcher Module (Deep Domain Module)
 * Encapsulates phone sanitization, intent templating, link generation, and transport adapters
 * for WhatsApp, SMS, and public e-bill links.
 */

/**
 * Normalizes phone numbers to standard international format (default: +91 India)
 */
export const normalizePhoneNumber = (phone = '', defaultCountryCode = '91') => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${defaultCountryCode}${digits.slice(1)}`;
  }
  return digits;
};

/**
 * Builds reliable public bill viewing / downloading URL
 * Resolves boutique domain or live Firebase Hosting endpoint if running on localhost,
 * ensuring links sent on WhatsApp work flawlessly on mobile devices.
 */
export const buildPublicBillUrl = (invoiceId = '', profile = {}, options = {}) => {
  if (!invoiceId || invoiceId === 'N/A') return '';
  const cleanId = String(invoiceId).replace(/^#/, '').trim();

  // 1. Explicitly configured domain/URL from boutique profile settings
  let base = (profile?.publicBillBaseUrl || profile?.websiteUrl || profile?.website || '').trim();

  // 2. Runtime inspection fallback
  if (!base && typeof window !== 'undefined') {
    const hostname = window.location.hostname || '';
    const isLocalhost = hostname === 'localhost' ||
                        hostname === '127.0.0.1' ||
                        hostname.startsWith('192.168.') ||
                        hostname.startsWith('10.');

    if (isLocalhost) {
      // Localhost/LAN IP cannot be resolved on customer smartphones over WhatsApp.
      // Fallback to the production live Firebase Hosting endpoint for this atelier:
      base = 'https://aleen-55164.web.app';
    } else {
      const origin = window.location.origin || '';
      const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
      base = `${origin}${publicUrl}`;
    }
  }

  if (!base) {
    base = 'https://aleen-55164.web.app';
  }

  base = base.replace(/\/+$/, '');
  const downloadParam = options.download ? '?download=true' : '';
  return `${base}/bill/${encodeURIComponent(cleanId)}${downloadParam}`;
};

/**
 * Builds standard WhatsApp Web / App deep link
 */
export const buildWhatsAppUrl = (phone = '', message = '') => {
  const cleanPhone = normalizePhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

/**
 * Builds native SMS intent URL
 */
export const buildSmsUrl = (phone = '', message = '') => {
  const cleanPhone = normalizePhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  return `sms:${cleanPhone}?body=${encodedText}`;
};

/**
 * Dispatches message via browser window or direct intent
 */
export const dispatchMessage = ({
  channel = 'whatsapp',
  phone = '',
  message = '',
  openWindow = true
}) => {
  const url = channel === 'sms' 
    ? buildSmsUrl(phone, message) 
    : buildWhatsAppUrl(phone, message);

  if (openWindow && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return { channel, phone: normalizePhoneNumber(phone), url, message };
};

/**
 * Formats standardized WhatsApp Invoice receipt message
 */
export const formatInvoiceReceiptMessage = ({
  invoice,
  profile = {},
  billLink = '',
  expiryDateStr = '',
  includePdfNotice = true
}) => {
  const storeName = profile.businessName || 'Aleen Clothing';
  const customerName = invoice.customer || 'Patron';
  const invoiceId = invoice.invoiceNumber || invoice.id || 'N/A';
  const total = Number(invoice.total || 0).toLocaleString('en-IN');
  const balanceDue = Number(invoice.balanceDue || 0);

  const lines = [
    `✨ *OFFICIAL RECEIPT • ${storeName.toUpperCase()}* ✨`,
    `Hello *${customerName}*, thank you for choosing our bespoke atelier.`,
    ``,
    `📄 *Invoice Reference:* #${invoiceId}`,
    `📅 *Date:* ${invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : 'Today'}`,
    `💰 *Total Amount:* ₹${total}`
  ];

  if (balanceDue > 0) {
    lines.push(`⚠️ *Outstanding Balance Due:* *₹${balanceDue.toLocaleString('en-IN')}*`);
  } else {
    lines.push(`✅ *Settlement Status:* Paid via ${invoice.paymentMethod || 'Cash/UPI'}`);
  }

  if (billLink) {
    lines.push(``);
    lines.push(`📥 *Download & View Digital E-Bill:*`);
    lines.push(billLink);
    if (includePdfNotice && expiryDateStr) {
      lines.push(`⏰ _Note: Link remains active for 7 days (expires ${expiryDateStr})._`);
    }
  }

  if (profile.address || profile.phone) {
    lines.push(``);
    if (profile.address) lines.push(`📍 *Atelier:* ${profile.address}`);
    if (profile.phone) lines.push(`📞 *Helpdesk:* ${profile.phone}`);
  }

  lines.push(``);
  lines.push(`Have a splendid day! 🌸`);

  return lines.join('\n');
};
