/**
 * Sales Repository (Deep Seam)
 * Encapsulates persistence for invoices, payments, and shift reconciliation.
 */
import { db } from '../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export const SalesRepository = {
  /**
   * Records a new completed invoice transaction
   */
  async recordInvoice(invoice) {
    if (!invoice || !invoice.id) {
      throw new Error('Invoice record must contain an id');
    }

    try {
      await setDoc(doc(db, 'invoices', invoice.id), {
        ...invoice,
        updatedAt: new Date().toISOString()
      });

      // Synchronize offline fallback cache
      try {
        const cached = JSON.parse(localStorage.getItem('invoices') || '[]');
        const updated = [invoice, ...cached.filter(i => i.id !== invoice.id)];
        localStorage.setItem('invoices', JSON.stringify(updated.slice(0, 100)));
      } catch (e) {
        // Safe cache fallback
      }

      return invoice;
    } catch (err) {
      console.error('SalesRepository.recordInvoice error:', err);
      throw err;
    }
  },

  /**
   * Updates invoice settlement status and recorded payments
   */
  async updateSettlement(invoiceId, { paidAmount, balanceDue, paymentStatus, payments }) {
    try {
      const ref = doc(db, 'invoices', invoiceId);
      const updates = {
        paidAmount,
        balanceDue,
        paymentStatus,
        payments,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(ref, updates);
      return updates;
    } catch (err) {
      console.error('SalesRepository.updateSettlement error:', err);
      throw err;
    }
  },

  /**
   * Persists a cash drawer shift closing report (Z-Report)
   */
  async recordCashShift(shiftRecord) {
    const id = shiftRecord.id || `shift-${Date.now()}`;
    const payload = {
      ...shiftRecord,
      id,
      timestamp: shiftRecord.timestamp || new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'cash_shifts', id), payload);
      try {
        const cached = JSON.parse(localStorage.getItem('aleen_cash_shifts') || '[]');
        localStorage.setItem('aleen_cash_shifts', JSON.stringify([payload, ...cached].slice(0, 50)));
      } catch (e) {}
      return payload;
    } catch (err) {
      console.error('SalesRepository.recordCashShift error:', err);
      throw err;
    }
  }
};
