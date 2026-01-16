import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Export to CSV (Robust)
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return alert('No data to export');

  const headers = Object.keys(data[0]);

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Quote if contains comma, double quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`; // Escape double quotes with double quotes
    }
    return stringValue;
  };

  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => escapeCSV(row[header])).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().getTime()}.csv`;
  link.click();
};

// Format currency for Display
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format currency for PDF (Avoids Rupee symbol issues)
export const formatCurrencyForPDF = (amount) => {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

// Centralized PDF Export
export const exportToPDF = ({ title, profile, probData, columns, filename }, type = 'generic') => {
  try {
    console.log('Starting PDF Export...');
    const doc = new jsPDF();
    const maroon = '#880e4f'; // Brand color

    // Set Font to Helvetica to avoid encoding issues
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(maroon);

    // Header
    doc.text(`${profile.businessName} - ${title}`, 105, 15, { align: 'center' });

    // Metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 25);

    // Summary Text (if provided in probData array or object)
    // We expect summary to be handled by caller properly passing data, 
    // BUT for simplicity in this refactor, we will allow 'extraText' arg or similar.
    // Actually, let's keep it simple: The specific pages have specific summaries.
    // So we will stick to generating the TABLE here, or we make this generic.
    // For now, let's just expose the DOC generation helper or make a robust shared function.
    // BETTER: Let the pages build the specific content, but use formatting helpers.
    // HOWEVER, to fix the "corrupt" issue, we want to control the SAVE process.

    // Let's create a function that takes the constructed doc and saves it safetly?
    // Or just a full generation function.
  } catch (error) {
    console.error('PDF Generation Error', error);
    alert('Error generating PDF');
  }
};
// Redoing exportToPDF to be fully functional for the reports
export const generateReportPDF = (title, profile, summaryLines, tableHeaders, tableData, filename) => {
  try {
    const doc = new jsPDF();
    const maroon = [136, 14, 79]; // RGB for #880e4f

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text(`${profile.businessName} - ${title}`, 105, 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 25);

    let yPos = 35;
    summaryLines.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 6;
    });

    autoTable(doc, {
      startY: yPos + 5,
      head: [tableHeaders],
      body: tableData,
      headStyles: { fillColor: maroon, font: 'helvetica', fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 9 },
      theme: 'striped'
    });

    doc.save(`${filename}.pdf`);
    console.log(`${filename} saved successfully`);
    return true;
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
    alert('Failed to save PDF. Please check console.');
    return false;
  }
};
