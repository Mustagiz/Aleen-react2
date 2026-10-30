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
    variantSku: item.variantSku ? String(item.variantSku).toUpperCase() : null,
    productId: invItem?.productId ? String(invItem.productId).toUpperCase() : undefined,
    variantDetails: variant ? `${variant.size} / ${variant.color}` : null,
    isCustom: false
  };
};

/**
 * Computes subtotal, taxes, discounts, loyalty points, and final total for an invoice cart
 */
export const calculateInvoiceTotals = ({
  items = [],
  inventory = [],
  taxPercent = 0,
  discountPercent = 0,
  discountAmount = 0,
  loyaltyPointsRedeemed = 0,
  customerTier = 'Bronze',
  loyaltySettings = null,
  customBonusPoints = 0
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
  const pointsRedeemed = Math.max(0, parseInt(loyaltyPointsRedeemed, 10) || 0);
  const pointsRedeemRate = loyaltySettings?.pointsRedeemRate !== undefined && !isNaN(parseFloat(loyaltySettings.pointsRedeemRate))
    ? Math.max(0, parseFloat(loyaltySettings.pointsRedeemRate))
    : 1.0;
  const loyaltyDiscount = Number((pointsRedeemed * pointsRedeemRate).toFixed(2));

  const absDiscount = Number((pctDiscount + flatDiscount + loyaltyDiscount).toFixed(2));

  const rawTotal = Math.max(0, subtotal + taxAmount - absDiscount);
  const roundedTotal = Math.round(rawTotal);
  const roundOff = Number((roundedTotal - rawTotal).toFixed(2));

  // Loyalty Points Accrual: Configurable points per rupee, scaled by VIP Tier and program validity
  const isProgramActive = (() => {
    if (!loyaltySettings) return true;
    if (loyaltySettings.enabled === false) return false;
    const today = new Date().toISOString().split('T')[0];
    if (loyaltySettings.programStartDate && today < loyaltySettings.programStartDate) return false;
    if (loyaltySettings.programExpiryDate && today > loyaltySettings.programExpiryDate) return false;
    return true;
  })();

  const spendPerPoint = loyaltySettings?.spendPerPoint > 0
    ? Number(loyaltySettings.spendPerPoint)
    : (loyaltySettings?.pointsPerRupee > 0 ? (1 / Number(loyaltySettings.pointsPerRupee)) : 100);

  const tierMultipliers = {
    Bronze: Number(loyaltySettings?.bronzeMultiplier ?? loyaltySettings?.tierMultipliers?.Bronze) || 1.0,
    Silver: Number(loyaltySettings?.silverMultiplier ?? loyaltySettings?.tierMultipliers?.Silver) || 1.25,
    Gold: Number(loyaltySettings?.goldMultiplier ?? loyaltySettings?.tierMultipliers?.Gold) || 1.5,
    Platinum: Number(loyaltySettings?.platinumMultiplier ?? loyaltySettings?.tierMultipliers?.Platinum) || 2.0
  };
  const multiplier = tierMultipliers[customerTier] || 1.0;
  const basePointsEarned = isProgramActive ? Math.floor((roundedTotal / spendPerPoint) * multiplier) : 0;
  const customBonus = Math.max(0, parseInt(customBonusPoints, 10) || 0);
  const loyaltyPointsEarned = basePointsEarned + customBonus;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount,
    cgst,
    sgst,
    absDiscount,
    percentDiscount: pctDiscount,
    flatDiscount,
    loyaltyPointsRedeemed: pointsRedeemed,
    loyaltyDiscount,
    loyaltyPointsEarned,
    loyaltySpendPerPoint: spendPerPoint,
    loyaltyMultiplier: multiplier,
    loyaltyProgramActive: isProgramActive,
    pointsRedeemRate,
    rawTotal: Number(rawTotal.toFixed(2)),
    total: roundedTotal,
    roundOff,
    processedItems
  };
};

/**
 * Calculates physical cash tendered, change due, and balance
 */
export const calculateCashChange = ({ total = 0, cashTendered = 0 }) => {
  const tendered = Math.max(0, Number(cashTendered) || 0);
  const net = Math.max(0, Number(total) || 0);
  const changeDue = Math.max(0, Number((tendered - net).toFixed(2)));
  const shortAmount = Math.max(0, Number((net - tendered).toFixed(2)));

  return {
    cashTendered: tendered,
    changeDue,
    shortAmount,
    isFullyCovered: tendered >= net
  };
};

/**
 * Generates quick cash tender preset denominations for rapid 1-click POS cashier selection
 */
export const generateQuickCashPresets = (total = 0) => {
  const net = Math.round(Number(total) || 0);
  if (net <= 0) return [100, 200, 500, 1000];

  const presets = new Set();
  // Exact amount
  presets.add(net);

  // Next round 100
  if (net % 100 !== 0) {
    presets.add(Math.ceil(net / 100) * 100);
  }

  // Next round 500
  if (net % 500 !== 0) {
    presets.add(Math.ceil(net / 500) * 500);
  }

  // Standard Indian currency note denominations above net
  [500, 1000, 2000, 5000].forEach(note => {
    if (note > net) presets.add(note);
  });

  return Array.from(presets).sort((a, b) => a - b).slice(0, 5);
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

/**
 * Generates standard UPI payment intent link for QR code rendering
 */
export const generateUpiPaymentUrl = ({
  vpa = '',
  payeeName = 'Aleen Clothing',
  amount = 0,
  invoiceNumber = '',
  currency = 'INR'
}) => {
  const numericAmount = parseFloat(amount);
  if (!vpa || !vpa.trim() || isNaN(numericAmount) || numericAmount <= 0) {
    return '';
  }

  const cleanVpa = String(vpa).trim();
  const cleanName = String(payeeName || 'Aleen Boutique').trim();
  const cleanAmount = numericAmount.toFixed(2);
  const note = invoiceNumber ? `Bill-${invoiceNumber}` : 'Boutique Purchase';

  return `upi://pay?pa=${encodeURIComponent(cleanVpa)}&pn=${encodeURIComponent(cleanName)}&am=${cleanAmount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
};

const HELD_CARTS_STORAGE_KEY = 'aleen_pos_held_carts';

/**
 * Retrieves all held carts from storage
 */
export const getHeldCarts = () => {
  try {
    const raw = localStorage.getItem(HELD_CARTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to load held carts:', err);
    return {};
  }
};

/**
 * Saves a drafted cart into a numbered slot (e.g. 1, 2, 3)
 */
export const saveHeldCartSlot = (slotId, cartData, note = '') => {
  try {
    const all = getHeldCarts();
    all[String(slotId)] = {
      ...cartData,
      note: note || `Basket #${slotId}`,
      heldAt: new Date().toISOString()
    };
    localStorage.setItem(HELD_CARTS_STORAGE_KEY, JSON.stringify(all));
    return all;
  } catch (err) {
    console.error('Failed to save held cart:', err);
    return {};
  }
};

/**
 * Releases/restores a held cart slot and clears it from storage
 */
export const releaseHeldCartSlot = (slotId) => {
  try {
    const all = getHeldCarts();
    const target = all[String(slotId)];
    if (target) {
      delete all[String(slotId)];
      localStorage.setItem(HELD_CARTS_STORAGE_KEY, JSON.stringify(all));
    }
    return target || null;
  } catch (err) {
    console.error('Failed to release held cart:', err);
    return null;
  }
};

