// GST Calculation
export const calculateGST = (amount, rate = 18) => {
  return (amount * rate) / 100;
};

// Calculate discount
export const calculateDiscount = (amount, percentage) => {
  return (amount * percentage) / 100;
};

// Calculate invoice totals
export const calculateInvoiceTotals = (items, discountPercent = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = calculateDiscount(subtotal, discountPercent);
  const afterDiscount = subtotal - discount;
  const tax = calculateGST(afterDiscount);
  const total = afterDiscount + tax;
  
  return { subtotal, discount, tax, total };
};

// Generate Invoice Number
export const generateInvoiceNumber = (lastNumber = 0) => {
  const prefix = 'INV';
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const number = String(lastNumber + 1).padStart(4, '0');
  return `${prefix}${year}${month}${number}`;
};

// Export to CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return alert('No data to export');
  
  const headers = Object.keys(data[0]);
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    csvContent += values.join(',') + '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().getTime()}.csv`;
  link.click();
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};
