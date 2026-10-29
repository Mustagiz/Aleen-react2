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
    const primaryColor = '#d97706'; // Warm Amber

    // Set Font to Helvetica to avoid encoding issues
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);

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
    const amberRGB = [217, 119, 6]; // RGB for #d97706

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(amberRGB[0], amberRGB[1], amberRGB[2]);
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
      headStyles: { fillColor: amberRGB, font: 'helvetica', fontStyle: 'bold' },
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

/**
 * Formats SKU/Product ID in uppercase with a hyphen (-) between letters and digits
 * e.g. ES50 -> ES-50, D000 -> D-000, DC00 -> DC-00, SAR1002 -> SAR-1002, SAR-1002 -> SAR-1002
 */
export const formatSkuWithHyphen = (sku) => {
  if (!sku) return '';
  let str = String(sku).trim().toUpperCase();
  str = str.replace(/^#+/, '');
  str = str.replace(/([A-Z]+)(\d+)/g, '$1-$2');
  str = str.replace(/(\d+)([A-Z]+)/g, '$1-$2');
  str = str.replace(/-+/g, '-');
  return str;
};

/**
 * Curated Luxury Color Palettes for CRM Contact Cards and Avatars
 * Deterministically chosen by name/initials so each client has a distinct, beautiful, vibrant palette
 */
export const LUXURY_CONTACT_PALETTES = [
  {
    name: 'Sapphire Royal',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E3A8A 100%)',
    border: 'rgba(59, 130, 246, 0.45)',
    glow: 'rgba(37, 99, 235, 0.32)',
    accent: '#2563EB',
    chipBg: 'rgba(37, 99, 235, 0.08)',
    chipText: '#1D4ED8'
  },
  {
    name: 'Amethyst Violet',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #5B21B6 100%)',
    border: 'rgba(139, 92, 246, 0.45)',
    glow: 'rgba(124, 58, 237, 0.32)',
    accent: '#7C3AED',
    chipBg: 'rgba(124, 58, 237, 0.08)',
    chipText: '#6D28D9'
  },
  {
    name: 'Rose Velvet',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 50%, #9D174D 100%)',
    border: 'rgba(236, 72, 153, 0.45)',
    glow: 'rgba(219, 39, 119, 0.32)',
    accent: '#DB2777',
    chipBg: 'rgba(219, 39, 119, 0.08)',
    chipText: '#BE185D'
  },
  {
    name: 'Emerald Jade',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #064E3B 100%)',
    border: 'rgba(16, 185, 129, 0.45)',
    glow: 'rgba(5, 150, 105, 0.32)',
    accent: '#059669',
    chipBg: 'rgba(5, 150, 105, 0.08)',
    chipText: '#047857'
  },
  {
    name: 'Ocean Cyan',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 50%, #164E63 100%)',
    border: 'rgba(6, 182, 212, 0.45)',
    glow: 'rgba(8, 145, 178, 0.32)',
    accent: '#0891B2',
    chipBg: 'rgba(8, 145, 178, 0.08)',
    chipText: '#0E7490'
  },
  {
    name: 'Crimson Ruby',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 50%, #881337 100%)',
    border: 'rgba(244, 63, 94, 0.45)',
    glow: 'rgba(225, 29, 72, 0.32)',
    accent: '#E11D48',
    chipBg: 'rgba(225, 29, 72, 0.08)',
    chipText: '#BE123C'
  },
  {
    name: 'Sunset Terracotta',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #9A3412 100%)',
    border: 'rgba(249, 115, 22, 0.45)',
    glow: 'rgba(234, 88, 12, 0.32)',
    accent: '#EA580C',
    chipBg: 'rgba(234, 88, 12, 0.08)',
    chipText: '#C2410C'
  },
  {
    name: 'Royal Indigo',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #312E81 100%)',
    border: 'rgba(99, 102, 241, 0.45)',
    glow: 'rgba(79, 70, 229, 0.32)',
    accent: '#4F46E5',
    chipBg: 'rgba(79, 70, 229, 0.08)',
    chipText: '#4338CA'
  },
  {
    name: 'Teal Peacock',
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #134E4A 100%)',
    border: 'rgba(20, 184, 166, 0.45)',
    glow: 'rgba(13, 148, 136, 0.32)',
    accent: '#0D9488',
    chipBg: 'rgba(13, 148, 136, 0.08)',
    chipText: '#0F766E'
  },
  {
    name: 'Plum Bordeaux',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #581C87 100%)',
    border: 'rgba(168, 85, 247, 0.45)',
    glow: 'rgba(147, 51, 234, 0.32)',
    accent: '#9333EA',
    chipBg: 'rgba(147, 51, 234, 0.08)',
    chipText: '#7E22CE'
  }
];

export const VIP_GOLD_PALETTE = {
  name: 'Imperial Gold VIP',
  gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #78350F 100%)',
  border: 'rgba(245, 158, 11, 0.65)',
  glow: 'rgba(217, 119, 6, 0.42)',
  accent: '#D97706',
  chipBg: 'rgba(217, 119, 6, 0.12)',
  chipText: '#B45309'
};

/**
 * Returns a luxury palette deterministically selected from contact name or phone,
 * with VIP gold tier override.
 */
export const getContactAvatarPalette = (nameOrPhone = '', isVip = false) => {
  if (isVip) return VIP_GOLD_PALETTE;
  const str = String(nameOrPhone || 'Guest').trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  const index = Math.abs(hash) % LUXURY_CONTACT_PALETTES.length;
  return LUXURY_CONTACT_PALETTES[index];
};
