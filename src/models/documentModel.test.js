import { numberToWordsRupees, prepareDocumentModel } from './documentModel';

describe('DocumentModel Module Tests', () => {
  test('numberToWordsRupees converts integers to Indian currency wording', () => {
    expect(numberToWordsRupees(1500)).toBe('One Thousand Five Hundred Rupees Only');
    expect(numberToWordsRupees(125000)).toBe('One Lakh Twenty Five Thousand Rupees Only');
    expect(numberToWordsRupees(0)).toBe('Zero Rupees Only');
  });

  test('prepareDocumentModel generates unified tokens for print and web', () => {
    const mockInvoice = {
      id: 'INV-550',
      total: 10000,
      paidAmount: 6000,
      balanceDue: 4000,
      customer: 'Ayesha Khan',
      items: [
        { name: 'Anarkali Suit', price: 10000, quantity: 1 }
      ]
    };

    const mockProfile = {
      businessName: 'Aleen Clothing',
      bankDetails: { upiId: 'aleen@upi' }
    };

    const doc = prepareDocumentModel({ invoice: mockInvoice, profile: mockProfile });
    expect(doc.invoiceId).toBe('INV-550');
    expect(doc.customer.name).toBe('Ayesha Khan');
    expect(doc.financials.total).toBe(10000);
    expect(doc.financials.balanceDue).toBe(4000);
    expect(doc.financials.isSettled).toBe(false);
    expect(doc.financials.totalInWords).toBe('Ten Thousand Rupees Only');
    expect(doc.upi.payload).toContain('upi://pay?pa=aleen@upi');
    expect(doc.upi.payload).toContain('am=4000');
  });
});
