import {
  normalizePhoneNumber,
  buildWhatsAppUrl,
  buildSmsUrl,
  formatInvoiceReceiptMessage,
  buildPublicBillUrl
} from './messageDispatcher';

describe('MessageDispatcher Module Tests', () => {
  test('normalizePhoneNumber formats various phone number styles to standard 91 format', () => {
    expect(normalizePhoneNumber('9876543210')).toBe('919876543210');
    expect(normalizePhoneNumber('+91 98765-43210')).toBe('919876543210');
    expect(normalizePhoneNumber('09876543210')).toBe('919876543210');
    expect(normalizePhoneNumber('')).toBe('');
  });

  test('buildWhatsAppUrl constructs properly encoded wa.me URLs', () => {
    const url = buildWhatsAppUrl('9876543210', 'Hello World & Thank You!');
    expect(url).toBe('https://wa.me/919876543210?text=Hello%20World%20%26%20Thank%20You!');
  });

  test('buildSmsUrl constructs valid sms schema with encoded message', () => {
    const url = buildSmsUrl('9876543210', 'Bill Paid');
    expect(url).toBe('sms:919876543210?body=Bill%20Paid');
  });

  test('formatInvoiceReceiptMessage formats complete receipt with balance and bill link', () => {
    const message = formatInvoiceReceiptMessage({
      invoice: {
        id: 'INV-1001',
        customer: 'Faeez Patel',
        total: 12500,
        balanceDue: 2500,
        paymentMethod: 'Split (Cash + UPI)'
      },
      profile: {
        businessName: 'Aleen Clothing',
        phone: '+91 98765 43210'
      },
      billLink: 'https://aleen.app/bill/INV-1001',
      expiryDateStr: 'Nov 03, 2026'
    });

    expect(message).toContain('ALEEN CLOTHING');
    expect(message).toContain('Faeez Patel');
    expect(message).toContain('12,500');
    expect(message).toContain('2,500');
    expect(message).toContain('https://aleen.app/bill/INV-1001');
    expect(message).toContain('Nov 03, 2026');
  });

  test('buildPublicBillUrl uses configured profile domain or live Firebase default', () => {
    const customUrl = buildPublicBillUrl('INV-5001', { publicBillBaseUrl: 'https://customboutique.com' });
    expect(customUrl).toBe('https://customboutique.com/bill/INV-5001');

    const downloadUrl = buildPublicBillUrl('INV-5001', { publicBillBaseUrl: 'https://customboutique.com' }, { download: true });
    expect(downloadUrl).toBe('https://customboutique.com/bill/INV-5001?download=true');

    // Strips leading hash
    const strippedUrl = buildPublicBillUrl('#INV-999', { publicBillBaseUrl: 'https://aleen.in/' });
    expect(strippedUrl).toBe('https://aleen.in/bill/INV-999');
  });
});
