/**
 * Document Presentation Model (Deep Domain Module)
 * Prepares unified document tokens for printed tax invoices, thermal retail slips,
 * PDF export, and customer public e-bills.
 */

/**
 * Converts a number into Indian Rupee words (e.g., "Twelve Thousand Five Hundred Rupees Only")
 */
export const numberToWordsRupees = (amount) => {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return `${b[Math.floor(n / 10)]} ${digit ? a[digit] : ''}`;
  };

  let str = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = num % 100;

  if (crore) str += `${inWords(crore)}Crore `;
  if (lakh) str += `${inWords(lakh)}Lakh `;
  if (thousand) str += `${inWords(thousand)}Thousand `;
  if (hundred) str += `${inWords(hundred)}Hundred `;
  if (remainder) str += inWords(remainder);

  return `${str.trim()} Rupees Only`;
};

/**
 * Prepares and normalizes a complete document model from an invoice and profile
 */
export const prepareDocumentModel = ({
  invoice = {},
  profile = {},
  templateSettings = {}
}) => {
  const invoiceId = invoice.invoiceNumber || invoice.id || 'N/A';
  const total = Number(invoice.total || 0);
  const subtotal = Number(invoice.subtotal ?? (total - (invoice.tax || 0) + (invoice.discount || 0)));
  const taxAmount = Number(invoice.tax || 0);
  const discount = Number(invoice.discount || 0);
  const paidAmount = Number(invoice.paidAmount ?? (invoice.paymentStatus === 'pending' ? 0 : total));
  const balanceDue = Math.max(0, Number(invoice.balanceDue ?? (total - paidAmount)));

  const cgst = Number((taxAmount / 2).toFixed(2));
  const sgst = Number((taxAmount / 2).toFixed(2));

  // Normalized line items
  const items = (invoice.items || []).map((item, idx) => ({
    srNo: idx + 1,
    id: item.id || `item-${idx}`,
    name: item.name || item.customName || 'Item',
    quantity: Number(item.quantity || 1),
    price: Number(item.price || item.customPrice || 0),
    lineTotal: Number(item.lineTotal || (Number(item.price || item.customPrice || 0) * Number(item.quantity || 1))),
    variantDetails: item.variantDetails || null,
    category: item.category || 'Apparel'
  }));

  // Dynamic UPI Payment Deep Link payload
  const upiId = profile.bankDetails?.upiId || '';
  const businessName = profile.businessName || 'Aleen Clothing';
  const upiPayPayload = upiId && balanceDue > 0
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${balanceDue}&tr=${invoiceId}&cu=INR`
    : '';

  return {
    invoiceId,
    date: invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : null,
    customer: {
      name: invoice.customer || 'Walk-in Patron',
      phone: invoice.phone || '',
      address: invoice.customerAddress || ''
    },
    store: {
      name: businessName,
      tagline: profile.tagline || templateSettings.tagline || 'Boutique & Bespoke Atelier',
      phone: profile.phone || '',
      email: profile.email || '',
      address: profile.address || '',
      gstin: profile.gstin || '',
      pan: profile.pan || '',
      logoUrl: profile.logoUrl || ''
    },
    financials: {
      subtotal,
      taxAmount,
      cgst,
      sgst,
      discount,
      discountPercent: Number(invoice.discountPercent || 0),
      total,
      paidAmount,
      balanceDue,
      isSettled: balanceDue === 0,
      totalInWords: numberToWordsRupees(total),
      balanceInWords: balanceDue > 0 ? numberToWordsRupees(balanceDue) : null
    },
    settlement: {
      paymentMethod: invoice.paymentMethod || 'Cash',
      paymentStatus: invoice.paymentStatus || (balanceDue === 0 ? 'paid' : 'pending'),
      isSplitPayment: Boolean(invoice.isSplitPayment),
      payments: invoice.payments || [],
      tenderDetails: invoice.tenderDetails || null
    },
    upi: {
      upiId,
      payload: upiPayPayload
    },
    items
  };
};
