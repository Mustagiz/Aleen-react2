import {
  calculateInvoiceTotals,
  calculateTenderSettlement,
  calculateCashShiftImpact,
  calculateLineItem,
  calculateCashChange,
  generateQuickCashPresets,
  generateUpiPaymentUrl,
  getHeldCarts,
  saveHeldCartSlot,
  releaseHeldCartSlot
} from './billingEngine';

describe('BillingEngine Module Tests', () => {
  const mockInventory = [
    { id: 'item-1', name: 'Raw Silk Sherwani', price: 15000, cost: 7000 },
    {
      id: 'item-2',
      name: 'Bridal Lehenga',
      price: 45000,
      hasVariants: true,
      variants: [
        { sku: 'LEH-M-RED', size: 'M', color: 'Red', price: 48000, cost: 22000 }
      ]
    }
  ];

  test('calculateLineItem resolves catalog and variant items correctly', () => {
    const standard = calculateLineItem({ id: 'item-1', quantity: 2 }, mockInventory);
    expect(standard.price).toBe(15000);
    expect(standard.lineTotal).toBe(30000);

    const variant = calculateLineItem({ id: 'item-2', variantSku: 'LEH-M-RED', quantity: 1 }, mockInventory);
    expect(variant.price).toBe(48000);
    expect(variant.lineTotal).toBe(48000);

    const custom = calculateLineItem({ isCustom: true, customName: 'Bespoke Blouse', customPrice: 3500, quantity: 2 }, mockInventory);
    expect(custom.price).toBe(3500);
    expect(custom.lineTotal).toBe(7000);
  });

  test('calculateInvoiceTotals calculates taxes, discounts, and rounded total', () => {
    const items = [
      { id: 'item-1', quantity: 1 } // 15,000
    ];

    const result = calculateInvoiceTotals({
      items,
      inventory: mockInventory,
      taxPercent: 5, // 5% GST = 750
      discountPercent: 10, // 10% = 1,500
      discountAmount: 200 // Flat = 200
    });

    expect(result.subtotal).toBe(15000);
    expect(result.taxAmount).toBe(750);
    expect(result.cgst).toBe(375);
    expect(result.sgst).toBe(375);
    expect(result.absDiscount).toBe(1700);
    expect(result.total).toBe(14050); // 15000 + 750 - 1700
  });

  test('calculateTenderSettlement handles split payment correctly', () => {
    const result = calculateTenderSettlement({
      total: 10000,
      isSplitPayment: true,
      paymentMethod: 'Cash',
      paymentMethod2: 'UPI',
      splitAmount: 4000
    });

    expect(result.tender1Amount).toBe(4000);
    expect(result.tender2Amount).toBe(6000);
    expect(result.calculatedPaidAmount).toBe(10000);
    expect(result.balanceDue).toBe(0);
    expect(result.computedPaymentStatus).toBe('paid');
    expect(result.payments).toHaveLength(2);
    expect(result.payments[0]).toEqual({ method: 'Cash', amount: 4000, isPending: false });
    expect(result.payments[1]).toEqual({ method: 'UPI', amount: 6000, isPending: false });
  });

  test('calculateCashShiftImpact extracts cash tenders from split and single invoices', () => {
    const splitInvoice = {
      isSplitPayment: true,
      paymentMethod: 'Cash',
      paymentMethod2: 'UPI',
      tenderDetails: { tender1Amount: 3500, tender2Amount: 6500 }
    };
    expect(calculateCashShiftImpact(splitInvoice)).toBe(3500);

    const fullCashInvoice = {
      paymentMethod: 'Cash',
      paymentStatus: 'paid',
      paidAmount: 5000,
      total: 5000
    };
    expect(calculateCashShiftImpact(fullCashInvoice)).toBe(5000);

    const upiInvoice = {
      paymentMethod: 'UPI',
      paymentStatus: 'paid',
      paidAmount: 5000
    };
    expect(calculateCashShiftImpact(upiInvoice)).toBe(0);
  });

  test('calculateInvoiceTotals supports loyalty points redemption and accrual by tier', () => {
    const items = [{ id: 'item-1', quantity: 1 }]; // 15,000

    const result = calculateInvoiceTotals({
      items,
      inventory: mockInventory,
      taxPercent: 0,
      loyaltyPointsRedeemed: 250, // ₹250 discount
      customerTier: 'Gold' // 1.5x points multiplier
    });

    expect(result.subtotal).toBe(15000);
    expect(result.loyaltyDiscount).toBe(250);
    expect(result.absDiscount).toBe(250);
    expect(result.total).toBe(14750);
    // Gold: Math.floor((14750 / 100) * 1.5) = Math.floor(147.5 * 1.5) = Math.floor(221.25) = 221 points
    expect(result.loyaltyPointsEarned).toBe(221);
  });

  test('calculateInvoiceTotals supports custom spend per point ratio and bonus loyalty points', () => {
    const items = [{ id: 'item-1', quantity: 1 }]; // 15,000

    const result = calculateInvoiceTotals({
      items,
      inventory: mockInventory,
      taxPercent: 0,
      customerTier: 'Silver', // 1.25x
      loyaltySettings: {
        spendPerPoint: 50 // Spend ₹50 to get 1 point
      },
      customBonusPoints: 75 // 75 courtesy bonus points
    });

    expect(result.total).toBe(15000);
    // Base: Math.floor((15000 / 50) * 1.25) = 300 * 1.25 = 375
    // Total = 375 + 75 bonus = 450
    expect(result.loyaltyPointsEarned).toBe(450);
  });

  test('calculateCashChange computes tender, change due, and shortages', () => {
    const exact = calculateCashChange({ total: 1450, cashTendered: 1450 });
    expect(exact.changeDue).toBe(0);
    expect(exact.shortAmount).toBe(0);
    expect(exact.isFullyCovered).toBe(true);

    const change = calculateCashChange({ total: 1450, cashTendered: 2000 });
    expect(change.changeDue).toBe(550);
    expect(change.shortAmount).toBe(0);
    expect(change.isFullyCovered).toBe(true);

    const short = calculateCashChange({ total: 1450, cashTendered: 1000 });
    expect(short.changeDue).toBe(0);
    expect(short.shortAmount).toBe(450);
    expect(short.isFullyCovered).toBe(false);
  });

  test('generateQuickCashPresets suggests intuitive currency denominations', () => {
    const presets = generateQuickCashPresets(1680);
    expect(presets[0]).toBe(1680); // Exact
    expect(presets).toContain(1700); // Next 100
    expect(presets).toContain(2000); // Standard note
  });

  test('generateUpiPaymentUrl formats standard UPI payment intent correctly', () => {
    const url = generateUpiPaymentUrl({
      vpa: 'aleen@icici',
      payeeName: 'Aleen Luxury Couture',
      amount: 14500,
      invoiceNumber: 'INV-2026-004'
    });
    expect(url).toContain('upi://pay?');
    expect(url).toContain('pa=aleen%40icici');
    expect(url).toContain('pn=Aleen%20Luxury%20Couture');
    expect(url).toContain('am=14500.00');
    expect(url).toContain('tn=Bill-INV-2026-004');
  });

  test('generateUpiPaymentUrl returns empty string if vpa or amount is missing/invalid', () => {
    expect(generateUpiPaymentUrl({ vpa: '', amount: 100 })).toBe('');
    expect(generateUpiPaymentUrl({ vpa: 'aleen@upi', amount: 0 })).toBe('');
    expect(generateUpiPaymentUrl({ vpa: 'aleen@upi', amount: -50 })).toBe('');
  });

  test('Hold Cart slots manage multi-basket checkout states in storage', () => {
    const mockCart = {
      items: [{ id: 'item-1', quantity: 2 }],
      customer: { name: 'Zoya Khan', phone: '9876543210' },
      discountAmount: 500
    };

    saveHeldCartSlot(1, mockCart, 'Fitting Trial Dress');
    const allHeld = getHeldCarts();
    expect(allHeld['1']).toBeDefined();
    expect(allHeld['1'].customer.name).toBe('Zoya Khan');
    expect(allHeld['1'].note).toBe('Fitting Trial Dress');

    const released = releaseHeldCartSlot(1);
    expect(released.customer.name).toBe('Zoya Khan');
    expect(getHeldCarts()['1']).toBeUndefined();
  });
});

