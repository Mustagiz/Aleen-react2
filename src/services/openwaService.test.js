import {
  formatWhatsAppChatId,
  getStoredOpenWASettings,
  saveOpenWASettings,
  DEFAULT_OPENWA_SETTINGS,
  sendOpenWATextMessage,
  sendOpenWADocumentMessage,
  checkOpenWASessionStatus
} from './openwaService';

describe('openwaService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('formatWhatsAppChatId', () => {
    it('formats a 10-digit Indian number to @c.us format', () => {
      expect(formatWhatsAppChatId('9876543210')).toBe('919876543210@c.us');
    });

    it('formats numbers with +91 or spaces correctly', () => {
      expect(formatWhatsAppChatId('+91 98765 43210')).toBe('919876543210@c.us');
    });

    it('formats numbers starting with 0 correctly', () => {
      expect(formatWhatsAppChatId('09876543210')).toBe('919876543210@c.us');
    });

    it('handles already-country-coded numbers', () => {
      expect(formatWhatsAppChatId('919876543210')).toBe('919876543210@c.us');
    });

    it('returns empty string if phone is empty', () => {
      expect(formatWhatsAppChatId('')).toBe('');
      expect(formatWhatsAppChatId(null)).toBe('');
    });
  });

  describe('settings management', () => {
    it('returns defaults when localStorage is empty', () => {
      expect(getStoredOpenWASettings()).toEqual(DEFAULT_OPENWA_SETTINGS);
    });

    it('saves and retrieves updated settings', () => {
      const updated = {
        enabled: true,
        serverUrl: 'https://wa.aleenclothing.com',
        apiKey: 'secret_key_123',
        sessionId: 'pos_cashier_1',
        autoFallbackToWeb: true
      };
      saveOpenWASettings(updated);
      expect(getStoredOpenWASettings()).toEqual(updated);
    });
  });

  describe('checkOpenWASessionStatus', () => {
    it('returns session ready status on HTTP 200', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ready', phone: '919876543210' })
      });

      const res = await checkOpenWASessionStatus({
        serverUrl: 'http://localhost:2785',
        sessionId: 'test_session',
        apiKey: 'key'
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('ready');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:2785/api/sessions/test_session',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ 'X-API-Key': 'key' })
        })
      );
    });

    it('returns offline when fetch throws network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

      const res = await checkOpenWASessionStatus();
      expect(res.success).toBe(false);
      expect(res.status).toBe('offline');
      expect(res.message).toContain('Connection refused');
    });
  });

  describe('sendOpenWATextMessage', () => {
    it('sends text message with correctly formatted payload', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messageId: 'msg_123', timestamp: 1719312000 })
      });

      const res = await sendOpenWATextMessage({
        phone: '9876543210',
        message: 'Hello from Aleen Atelier!',
        overrideSettings: {
          serverUrl: 'http://localhost:2785',
          sessionId: 'aleen_boutique',
          apiKey: 'test_api_key'
        }
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe('msg_123');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:2785/api/sessions/aleen_boutique/messages/send-text',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'X-API-Key': 'test_api_key' }),
          body: JSON.stringify({
            chatId: '919876543210@c.us',
            text: 'Hello from Aleen Atelier!'
          })
        })
      );
    });

    it('returns error when phone or message is missing', async () => {
      const res = await sendOpenWATextMessage({ phone: '', message: '' });
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('sendOpenWADocumentMessage', () => {
    it('sends document with base64 data and stripped prefix', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messageId: 'doc_123' })
      });

      const res = await sendOpenWADocumentMessage({
        phone: '9876543210',
        filename: 'Invoice_101.pdf',
        base64: 'data:application/pdf;base64,JVBERi0xLjQK...',
        caption: 'Here is your official invoice'
      });

      expect(res.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages/send-document'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            chatId: '919876543210@c.us',
            filename: 'Invoice_101.pdf',
            mimetype: 'application/pdf',
            caption: 'Here is your official invoice',
            base64: 'JVBERi0xLjQK...'
          })
        })
      );
    });
  });
});
