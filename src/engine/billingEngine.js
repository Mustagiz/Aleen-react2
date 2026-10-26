/**
 * Billing Engine Module (Deep Domain Module)
 * Encapsulates financial settlement, tax apportionment, multi-tender split calculations,
 * and invoice payload assembly behind a clean, testable interface.
 */

/**
 * Calculates a single line item's price and line total
 */
export const calculateLineItem = (item, inventory = []) => {
  if (item.isCustom) {
    const price = parseFloat(item.customPrice || 0);
    const cost = parseFloat(item.customCost || 0);
    const quantity = parseInt(item.quantity || 1, 10);
    return {
      id: item.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: item.customName || 'Custom Item',
      price,
      cost,
      quantity,
      lineTotal: Number((price * quantity).toFixed(2)),
      category: 'Custom',
      isCustom: true
    };
  }

  const invItem = inventory.find(i => i.id === item.id);
  const variant = (invItem && invItem.hasVariants && item.variantSku)
    ? invItem.variants.find(v => v.sku === item.variantSku)
    : null;

  const price = variant 
    ? (parseFloat(variant.price) || invItem?.price || 0) 
    : (invItem?.price || 0);
  const cost = variant 
    ? (parseFloat(variant.cost) || invItem?.cost || 0) 
    : (invItem?.cost || 0);
  const quantity = parseInt(item.quantity || 1, 10);

  return {
    ...item,
    id: item.id,
    name: invItem?.name || 'Unknown Item',
    price,
    cost,
    quantity,
    lineTotal: Number((price * quantity).toFixed(2)),
    category: invItem?.category || 'General',
    variantSku: item.variantSku || null,
    variantDetails: variant ? `${variant.size} / ${variant.color}` : null,
    isCustom: false
  };
};

/**
 * Computes subtotal, taxes, discounts, and final total for an invoice cart
 */
export const calculateInvoiceTotals = ({
  items = [],
  inventory = [],
  taxPercent = 0,
  discountPercent = 0,
  discountAmount = 0
}) => {
  const processedItems = items.map(item => calculateLineItem(item, inventory));
  
  const subtotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxRate = parseFloat(taxPercent) || 0;
  const taxAmount = Number((subtotal * (taxRate / 100)).toFixed(2));

  // Apportion half to CGST and half to SGST for intra-state
  const cgst = Number((taxAmount / 2).toFixed(2));
  const sgst = Number((taxAmount / 2).toFixed(2));

  const pctDiscount = Number((subtotal * ((parseFloat(discountPercent) || 0) / 100)).toFixed(2));
  const flatDiscount = parseFloat(discountAmount) || 0;
  const absDiscount = Number((pctDiscount + flatDiscount).toFixed(2));

  const rawTotal = Math.max(0, subtotal + taxAmount - absDiscount);
  const roundedTotal = Math.round(rawTotal);
  const roundOff = Number((roundedTotal - rawTotal).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount,
    cgst,
    sgst,
    absDiscount,
    percentDiscount: pctDiscount,
    flatDiscount,
    rawTotal: Number(rawTotal.toFixed(2)),
    total: roundedTotal,
    roundOff,
    processedItems
  };
};

/**
 * Calculates tender reconciliation, split payment apportionments, and balances
 */
export const calculateTenderSettlement = ({
  total,
  isSplitPayment = false,
  paymentMethod = 'Cash',
  paymentMethod2 = 'UPI',
  splitAmount = 0,
  paymentStatus = 'paid'
}) => {
  const tender1Amount = isSplitPayment 
    ? Number(splitAmount || 0) 
    : total;
  const tender2Amount = isSplitPayment 
    ? Math.max(0, Number((total - (Number(splitAmount) || 0)).toFixed(2))) 
    : 0;

  let calculatedPaidAmount = total;
  let computedPaymentStatus = paymentStatus;

  if (isSplitPayment) {
    const t1Paid = paymentMethod === 'Credit' ? 0 : tender1Amount;
    const t2Paid = paymentMethod2 === 'Credit' ? 0 : tender2Amount;
    calculatedPaidAmount = Number((t1Paid + t2Paid).toFixed(2));

    if (calculatedPaidAmount >= total) {
      computedPaymentStatus = 'paid';
    } else if (calculatedPaidAmount > 0) {
      computedPaymentStatus = 'partial';
    } else {
      computedPaymentStatus = 'pending';
    }
  } else {
    if (paymentMethod === 'Credit' || paymentStatus === 'pending') {
      calculatedPaidAmount = 0;
      computedPaymentStatus = 'pending';
    } else if (paymentStatus === 'partial') {
      calculatedPaidAmount = Number(splitAmount || 0);
      computedPaymentStatus = 'partial';
    } else {
      calculatedPaidAmount = total;
      computedPaymentStatus = 'paid';
    }
  }

  const balanceDue = Math.max(0, Number((total - calculatedPaidAmount).toFixed(2)));

  const payments = [];
  if (isSplitPayment) {
    payments.push({
      method: paymentMethod,
      amount: tender1Amount,
      isPending: paymentMethod === 'Credit'
    });
    if (tender2Amount > 0) {
      payments.push({
        method: paymentMethod2,
        amount: tender2Amount,
        isPending: paymentMethod2 === 'Credit'
      });
    }
  } else {
    payments.push({
      method: paymentMethod,
      amount: calculatedPaidAmount,
      isPending: computedPaymentStatus === 'pending'
    });
  }

  return {
    tender1Amount,
    tender2Amount,
    calculatedPaidAmount,
    balanceDue,
    computedPaymentStatus,
    payments,
    isSettled: balanceDue === 0
  };
};

/**
 * Computes the impact of an invoice on the physical cash drawer shift
 */
export const calculateCashShiftImpact = (invoice) => {
  if (!invoice) return 0;
  
  if (invoice.payments && Array.isArray(invoice.payments)) {
    return invoice.payments
      .filter(p => (p.method || '').toLowerCase() === 'cash' && !p.isPending)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }

  if (invoice.isSplitPayment) {
    let cash = 0;
    if ((invoice.paymentMethod || '').toLowerCase() === 'cash') {
      cash += parseFloat(invoice.tenderDetails?.tender1Amount || 0);
    }
    if ((invoice.paymentMethod2 || '').toLowerCase() === 'cash') {
      cash += parseFloat(invoice.tenderDetails?.tender2Amount || 0);
    }
    return cash;
  }

  if ((invoice.paymentMethod || '').toLowerCase() === 'cash' && invoice.paymentStatus !== 'pending') {
    return parseFloat(invoice.paidAmount ?? invoice.total ?? 0);
  }

  return 0;
};
