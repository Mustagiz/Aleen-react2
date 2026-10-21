import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TextField, MenuItem, Paper, Typography, TableContainer, Chip, Card, CardContent, Grid, Divider, Tooltip, useMediaQuery, useTheme, AppBar, Toolbar, TablePagination, Menu, ListItemIcon, ListItemText, Autocomplete, Switch, FormControlLabel, Avatar, TableSortLabel } from '@mui/material';
import { Add, Delete, Print, Visibility, WhatsApp, Download, Search, FilterList, Receipt, Share, Close, MoreVert, AttachMoney, TrendingUp, CameraAlt, PointOfSale, PersonOutline, ShoppingBagOutlined, PaymentsOutlined, ReceiptLong, Palette, DesignServices } from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { generateInvoiceNumber } from '../utils/helpers';
import InvoicePrint from '../components/InvoicePrint';
import InvoiceTemplateDialog from '../components/InvoiceTemplateDialog';
import { INVOICE_TEMPLATES, getStoredInvoiceSettings } from '../constants/invoiceTemplates';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useThemeContext } from '../contexts/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';

const Invoices = () => {
  const { user } = useAuth();
  const { inventory, invoices, addInvoice, deleteInvoice, profile, customers, addCustomer } = useData();
  const { mode } = useThemeContext();
  const [open, setOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState(null);
  const [invoiceSettings, setInvoiceSettings] = useState(() => getStoredInvoiceSettings());
  const [templateModalOpen, setTemplateModalOpen] = useState(false);


  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio beep failed", e);
    }
  };

  const playVibration = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50); // Short 50ms vibration
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + N: New Invoice
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setSelectedItems([{ id: '', quantity: 1, isCustom: false, customName: '', customPrice: 0, customCost: 0 }]);
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMenuClick = (event, invoiceId) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoiceId(invoiceId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoiceId(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const [selectedItems, setSelectedItems] = useState([]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [tax, setTax] = useState('');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('+91');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  // Split Payment State
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitAmount, setSplitAmount] = useState(0);
  const [paymentMethod2, setPaymentMethod2] = useState('Card');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [upiTransactionId2, setUpiTransactionId2] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [upiProvider, setUpiProvider] = useState('PhonePe');
  const [upiProvider2, setUpiProvider2] = useState('GPay');
  const [isEMI, setIsEMI] = useState(false);
  const [emiTenure, setEmiTenure] = useState(3);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scannerStatus, setScannerStatus] = useState('Initializing...');

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      setScannerError('');
      setScannerStatus('Checking permissions...');

      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setScannerError('No cameras found on this device.');
          return;
        }

        html5QrCode = new Html5Qrcode("reader");
        setScannerStatus('Starting camera...');

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            const trimmedCode = decodedText.toLowerCase().trim();
            // Try matching Product ID first
            let matchedProduct = inventory.find(inv =>
              inv.productId && inv.productId.toLowerCase() === trimmedCode && (parseInt(inv.quantity) || 0) > 0
            );
            let matchedVariantSku = null;

            // If not found, try matching Variant SKU
            if (!matchedProduct) {
              for (const inv of inventory) {
                if (inv.hasVariants && inv.variants) {
                  const variant = inv.variants.find(v => v.sku && v.sku.toLowerCase() === trimmedCode);
                  if (variant) {
                    matchedProduct = inv;
                    matchedVariantSku = variant.sku;
                    break;
                  }
                }
              }
            }

            if (matchedProduct) {
              playBeep();
              playVibration();
              const emptyIndex = selectedItems.findIndex(item => !item.id);
              if (emptyIndex !== -1) {
                handleItemChange(emptyIndex, 'id', matchedProduct.id);
                if (matchedVariantSku) handleItemChange(emptyIndex, 'variantSku', matchedVariantSku);
              } else {
                setSelectedItems([...selectedItems, {
                  id: matchedProduct.id,
                  quantity: 1,
                  variantSku: matchedVariantSku || '',
                  isCustom: false,
                  customName: '',
                  customPrice: 0,
                  customCost: 0
                }]);
              }
              stopScanner();
              setScannerOpen(false);
            }
          }
        ).catch(err => {
          // Fallback if environment camera fails
          console.warn("Environment camera failed, trying user camera:", err);
          return html5QrCode.start({ facingMode: "user" }, config, (decodedText) => {
            const matchedProduct = inventory.find(inv =>
              inv.productId && inv.productId.toLowerCase() === decodedText.toLowerCase().trim() && (parseInt(inv.quantity) || 0) > 0
            );

            if (matchedProduct) {
              playBeep();
              playVibration();
              const emptyIndex = selectedItems.findIndex(item => !item.id);
              if (emptyIndex !== -1) {
                handleItemChange(emptyIndex, 'id', matchedProduct.id);
              } else {
                setSelectedItems([...selectedItems, { id: matchedProduct.id, quantity: 1 }]);
              }
              stopScanner();
              setScannerOpen(false);
            }
          });
        });
        setScannerStatus('Scanning...');
      } catch (err) {
        console.error("Scanner error:", err);
        setScannerError(`Camera failed: ${err.message || 'Check permissions'}`);
      }
    };

    const stopScanner = async () => {
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          await html5QrCode.stop();
          html5QrCode.clear();
        } catch (err) {
          console.error("Failed to stop scanner:", err);
        }
      }
    };

    if (scannerOpen) {
      const timer = setTimeout(() => startScanner(), 500);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [scannerOpen, inventory, selectedItems]);

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [invoiceDate, setInvoiceDate] = useState(getCurrentDateTime());

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const printRef = useRef();

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const todayInvoices = invoices.filter(inv => new Date(inv.date).toDateString() === new Date().toDateString()).length;
  const avgAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !dateFilter || new Date(inv.date).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();

    const matchesPayment = paymentFilter === 'All' || inv.paymentMethod === paymentFilter;

    return matchesSearch && matchesDate && matchesPayment;
  });

  // Sorting State
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc'); // Default to descending for recent invoices first

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (orderBy === 'total') {
      return order === 'asc' ? (a[orderBy] - b[orderBy]) : (b[orderBy] - a[orderBy]);
    }
    if (orderBy === 'date') {
      return order === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
    }
    // Handle string sorting (case-insensitive)
    const valA = (a[orderBy] || '').toString().toLowerCase();
    const valB = (b[orderBy] || '').toString().toLowerCase();
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { id: '', quantity: 1, isCustom: false, customName: '', customPrice: 0, customCost: 0, variantSku: '' }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  const calculateTotal = () => {
    const subtotal = selectedItems.reduce((sum, item) => {
      if (item.isCustom) {
        return sum + (parseFloat(item.customPrice || 0) * item.quantity);
      }
      const invItem = inventory.find(i => i.id === item.id);
      if (invItem && invItem.hasVariants && item.variantSku) {
        const variant = invItem.variants.find(v => v.sku === item.variantSku);
        return sum + (variant ? (parseFloat(variant.price) || invItem.price) * item.quantity : invItem.price * item.quantity);
      }
      return sum + (invItem ? invItem.price * item.quantity : 0);
      return sum + (invItem ? invItem.price * item.quantity : 0);
    }, 0);
    const taxValue = parseFloat(tax) || 0;
    const taxAmount = subtotal * (taxValue / 100);

    const percentDisc = subtotal * ((parseFloat(discountPercent) || 0) / 100);
    const absDiscount = percentDisc + (parseFloat(discountAmount) || 0);

    const total = subtotal + taxAmount - absDiscount;
    return { subtotal, taxAmount, total, absDiscount };
  };

  const handleSaveInvoice = async () => {
    const validItems = selectedItems.filter(item => item.id || (item.isCustom && item.customName && item.customPrice > 0));
    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const { subtotal, taxAmount, total, absDiscount } = calculateTotal();
    const invoiceNumber = generateInvoiceNumber(invoices.length);

    let finalPaymentMethod = paymentMethod;
    if (isSplitPayment) {
      finalPaymentMethod = `Split: ${paymentMethod} (${splitAmount}) + ${paymentMethod2} (${(total - splitAmount).toFixed(2)})`;
    }

    let finalCustomerId = selectedCustomerId;

    // Auto-Customer logic: If no customer ID but we have name/phone, check if exists or add
    if (!finalCustomerId && customer && phone) {
      const existingCustomer = customers.find(c => c.phone === phone);
      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        // Add new customer automatically
        finalCustomerId = await addCustomer({
          name: customer,
          phone: phone,
          email: '', // Default empty
          address: '' // Default empty
        });
      }
    }

    const emiDetails = isEMI ? {
      tenure: emiTenure,
      monthlyInstallment: total / emiTenure,
      startDate: new Date().toISOString()
    } : null;

    const invoice = {
      id: invoiceNumber,
      date: new Date(invoiceDate).toISOString(),
      customer,
      phone,
      customerId: finalCustomerId,
      paymentMethod: finalPaymentMethod,
      items: validItems.map(item => {
        if (item.isCustom) {
          return {
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: item.customName || 'Custom Item',
            price: parseFloat(item.customPrice || 0),
            cost: parseFloat(item.customCost || 0),
            quantity: item.quantity,
            category: 'Custom'
          };
        }
        const invItem = inventory.find(i => i.id === item.id);
        const variant = (invItem && invItem.hasVariants && item.variantSku)
          ? invItem.variants.find(v => v.sku === item.variantSku)
          : null;

        return {
          ...item,
          name: invItem?.name || 'Unknown Item',
          price: variant ? (parseFloat(variant.price) || invItem?.price || 0) : (invItem?.price || 0),
          category: invItem?.category || 'General',
          variantSku: item.variantSku || null,
          variantDetails: variant ? `${variant.size} / ${variant.color}` : null
        };
      }),
      subtotal,
      tax: taxAmount,
      gst: parseFloat(tax) || 0,
      discount: absDiscount,
      discountPercent: parseFloat(discountPercent) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      total,
      paymentStatus,
      isEMI,
      emiDetails,
      payments: isSplitPayment ? [
        {
          method: paymentMethod,
          amount: total - splitAmount,
          transactionId: (paymentMethod === 'UPI' || paymentMethod === 'Card') ? upiTransactionId : '',
          upiProvider: paymentMethod === 'UPI' ? upiProvider : null,
          timestamp: new Date().toISOString()
        },
        {
          method: paymentMethod2,
          amount: splitAmount,
          transactionId: (paymentMethod2 === 'UPI' || paymentMethod2 === 'Card') ? upiTransactionId2 : '',
          upiProvider: paymentMethod2 === 'UPI' ? upiProvider2 : null,
          timestamp: new Date().toISOString()
        }
      ] : [
        {
          method: paymentMethod,
          amount: paymentMethod === 'Credit' ? 0 : total,
          transactionId: (paymentMethod === 'UPI' || paymentMethod === 'Card') ? upiTransactionId : '',
          upiProvider: paymentMethod === 'UPI' ? upiProvider : null,
          timestamp: new Date().toISOString()
        }
      ]
    };
    await addInvoice(invoice);
    setOpen(false);
    setSuccessInvoice(invoice); // Show success dialog instead of just closing
    setSelectedItems([{ id: '', quantity: 1, isCustom: false, customName: '', customPrice: 0, customCost: 0 }]);
    setDiscountPercent('');
    setDiscountAmount('');
    setTax('');
    setCustomer('');
    setPhone('+91');
    setInvoiceDate(getCurrentDateTime());
    setSelectedCustomerId(null);
    setPaymentMethod('Cash');
    setIsSplitPayment(false);
    setSplitAmount(0);
    setPaymentMethod2('Card');
    setUpiTransactionId('');
    setUpiTransactionId2('');
    setPaymentStatus('paid');
    setUpiProvider('PhonePe');
    setUpiProvider2('GPay');
    setIsEMI(false);
    setEmiTenure(3);
    setReceivedAmount('');

  };

  const downloadInvoices = () => {
    const csvData = sortedInvoices.map(inv => ({
      'Invoice #': inv.id,
      'Date': new Date(inv.date).toLocaleDateString(),
      'Customer': inv.customer || 'Walk-in',
      'Phone': inv.phone || '',
      'Items': inv.items.map(i => `${i.name} (x${i.quantity})`).join('|'),
      'Subtotal': inv.subtotal,
      'Discount': inv.discount,
      'Total': inv.total,
      'Payment Method': inv.paymentMethod
    }));

    if (csvData.length === 0) {
      alert('No invoices to export');
      return;
    }

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const generatePDF = (invoice, customTemplate, customSettings) => {
    const doc = new jsPDF();
    const activeSettings = customSettings || invoiceSettings;
    const activeTemplate = customTemplate || activeSettings.template || 'atelier-emerald';

    // Theme Colors
    let primaryRGB = [15, 118, 110]; // Atelier Emerald
    let accentRGB = [217, 119, 6];   // Champagne Gold

    if (activeTemplate === 'champagne-gold') {
      primaryRGB = [180, 83, 9];
      accentRGB = [217, 119, 6];
    } else if (activeTemplate === 'minimal-haute') {
      primaryRGB = [24, 24, 27];
      accentRGB = [82, 82, 91];
    } else if (activeTemplate === 'boutique-slip') {
      primaryRGB = [51, 65, 85];
      accentRGB = [15, 118, 110];
    }

    let startY = 18;

    // 1. HEADER: Custom Graphic Letterhead or Luxury Vector Header
    if (activeSettings.useCustomLetterhead && activeSettings.customLetterheadImage) {
      try {
        doc.addImage(activeSettings.customLetterheadImage, 'JPEG', 14, 10, 182, 35);
        startY = 52;
      } catch (err) {
        console.error('Error adding letterhead to PDF:', err);
        startY = 20;
      }
    } else {
      // Luxury Header Banner
      doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.rect(14, 10, 182, 34, 'F');

      // Accent gold flourish line
      doc.setFillColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.rect(14, 44, 182, 1.5, 'F');

      // Left: Atelier Business Info
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(profile.businessName || 'ALEEN ATELIER', 20, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(230, 230, 230);
      doc.text(profile.address || '', 20, 29);
      doc.text(`Phone: ${profile.phone || ''} | GSTIN: ${profile.gstin || ''}`, 20, 36);

      // Right: TAX INVOICE & Meta
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('TAX INVOICE', 190, 22, { align: 'right' });

      doc.setFontSize(10);
      doc.setTextColor(253, 230, 138); // Champagne highlight
      doc.text(`#${invoice.id}`, 190, 29, { align: 'right' });

      doc.setFontSize(8);
      doc.setTextColor(230, 230, 230);
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}`, 190, 36, { align: 'right' });

      startY = 52;
    }

    // 2. CLIENT & INVOICE DETAILS CARD
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, startY, 182, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    doc.text('BILLED TO (CLIENT DETAILS):', 20, startY + 6.5);

    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text(invoice.customer || 'Walk-in Patron', 20, startY + 13.5);

    if (invoice.phone) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Contact: ${invoice.phone}`, 20, startY + 18.5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Payment: ${invoice.paymentMethod || 'Cash'}`, 190, startY + 8, { align: 'right' });
    doc.text(`Status: ${(invoice.status || 'Paid').toUpperCase()}`, 190, startY + 15, { align: 'right' });

    // 3. ITEMS TABLE
    const tableData = invoice.items.map(item => [
      item.name,
      item.category || 'Atelier Wear',
      item.quantity,
      `₹${(item.price || 0).toFixed(2)}`,
      `₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: startY + 26,
      head: [['Garment / Merchandise', 'Category', 'Qty', 'Unit Rate', 'Amount']],
      body: tableData,
      headStyles: {
        fillColor: primaryRGB,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 32, halign: 'right' }
      },
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 3.5 }
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    // 4. FINANCIAL LEDGER BOX (Right Side)
    const ledgerX = 115;
    const ledgerW = 81;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(ledgerX, finalY, ledgerW, 36, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal:', ledgerX + 5, finalY + 8);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${(invoice.subtotal || 0).toFixed(2)}`, 190, finalY + 8, { align: 'right' });

    if (invoice.discount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(217, 119, 6);
      doc.text(`Discount (${invoice.discountPercentage || 0}%):`, ledgerX + 5, finalY + 15);
      doc.text(`-₹${(invoice.discount || 0).toFixed(2)}`, 190, finalY + 15, { align: 'right' });
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`GST (${invoice.gst || 18}%):`, ledgerX + 5, finalY + 22);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${(invoice.tax || 0).toFixed(2)}`, 190, finalY + 22, { align: 'right' });

    // Net Total Banner
    doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    doc.rect(ledgerX, finalY + 26, ledgerW, 10, 'F');
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('NET TOTAL:', ledgerX + 5, finalY + 33);
    doc.text(`₹${(invoice.total || 0).toFixed(2)}`, 190, finalY + 33, { align: 'right' });

    // 5. BANK & UPI DETAILS (Left Side)
    if (activeSettings.showBankDetails) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY, 95, 36, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.text('BANK & UPI SETTLEMENT DETAILS:', 18, finalY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Bank: ${activeSettings.bankDetails?.bankName || ''}`, 18, finalY + 14);
      doc.text(`A/C No: ${activeSettings.bankDetails?.accountNumber || ''}`, 18, finalY + 20);
      doc.text(`IFSC: ${activeSettings.bankDetails?.ifsc || ''}`, 18, finalY + 26);
      doc.setFont('helvetica', 'bold');
      doc.text(`UPI ID: ${activeSettings.bankDetails?.upiId || ''}`, 18, finalY + 32);
    }

    // 6. TERMS & FOOTER
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 32, 196, pageHeight - 32);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(activeSettings.termsText || 'Terms: Goods once sold can be exchanged within 7 days.', 14, pageHeight - 25);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    doc.text(activeSettings.customFooterNote || `Thank you for shopping with ${profile.businessName}!`, 14, pageHeight - 12);

    // Signature stamp
    if (activeSettings.showSignatureStamp) {
      doc.setDrawColor(148, 163, 184);
      doc.line(145, pageHeight - 16, 190, pageHeight - 16);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(activeSettings.signatureLabel || 'Authorized Signatory', 167.5, pageHeight - 11, { align: 'center' });
    }

    return doc;
  };

  const downloadPDF = (invoice) => {
    const doc = generatePDF(invoice, invoiceSettings.template, invoiceSettings);
    doc.save(`invoice-${invoice.id}.pdf`);
  };

  const sharePDF = async (invoice) => {
    try {
      const doc = generatePDF(invoice, invoiceSettings.template, invoiceSettings);
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `invoice-${invoice.id}.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${invoice.id}`,
          text: `Invoice from ${profile.businessName}`
        });
      } else {
        downloadPDF(invoice);
        alert('Sharing is not supported on this browser. The invoice has been downloaded instead.');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
    }
  };

  const handlePrint = (invoice) => {
    setViewInvoice(invoice);
    setTimeout(() => window.print(), 300);
  };

  const sendWhatsApp = (invoice) => {
    const message = `*${profile.businessName}*%0A${profile.address}%0A%0A` +
      `*Invoice: ${invoice.id}*%0A` +
      `Date: ${new Date(invoice.date).toLocaleDateString()}%0A` +
      `Customer: ${invoice.customer || 'Walk-in'}%0A%0A` +
      `*Items:*%0A` +
      invoice.items.map(item => `${item.name} x${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`).join('%0A') +
      `%0A%0A` +
      `Subtotal: ₹${invoice.subtotal.toFixed(2)}%0A` +
      `GST (${invoice.gst}%): ₹${invoice.tax.toFixed(2)}%0A` +
      (invoice.discount > 0 ? `Discount: ₹${invoice.discount.toFixed(2)} (${invoice.discountPercentage || 0}%)%0A` : '') +
      `*Total: ₹${invoice.total.toFixed(2)}*%0A%0A` +
      `Payment: ${invoice.paymentMethod}%0A%0A` +
      `Thank you for shopping with us!%0A%0A` +
      `*${profile.businessName.toUpperCase()} | ${profile.address}*`;

    const phoneNumber = invoice.phone?.replace(/[^0-9]/g, '');
    const whatsappUrl = phoneNumber
      ? `https://wa.me/${phoneNumber.startsWith('91') ? '' : '91'}${phoneNumber}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteInvoice(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const openDeleteDialog = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const { subtotal, taxAmount, total, absDiscount } = calculateTotal();

  return (
    <Box>
      {/* Atelier Page Header with Breadcrumbs & Actions */}
      <PageHeader
        title="Billing & Invoices"
        subtitle="Create, manage and track all customer boutique invoices and receipts"
        breadcrumbs={[
          { label: 'Aleen Atelier', path: '/' },
          { label: 'Sales & POS', path: '/pos' },
          { label: 'Invoices' }
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Palette fontSize="small" />}
              onClick={() => setTemplateModalOpen(true)}
              sx={{
                px: 2.5,
                py: 1,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.82rem',
                borderColor: '#0F766E',
                color: '#0F766E',
                '&:hover': {
                  borderColor: '#0b5650',
                  backgroundColor: 'rgba(15, 118, 110, 0.08)'
                }
              }}
            >
              Templates & Letterhead
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download fontSize="small" />}
              onClick={downloadInvoices}
              sx={{ px: 2.5, py: 1, borderRadius: 2, fontWeight: 700, fontSize: '0.82rem' }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedItems([{ id: '', quantity: 1 }]);
                setOpen(true);
              }}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(217,119,6,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                }
              }}
            >
              Create Invoice (Alt+N)
            </Button>
          </Box>
        }
      />

      {/* Atelier KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <AtelierKpiCard
            title="Total Invoices"
            value={totalInvoices}
            icon={<Receipt fontSize="small" />}
            subtitle="Generated records"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AtelierKpiCard
            title="Total Revenue"
            value={`₹${totalAmount.toLocaleString('en-IN')}`}
            icon={<AttachMoney fontSize="small" />}
            goldAccent={true}
            subtitle="Total invoiced gross"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AtelierKpiCard
            title="Average Ticket"
            value={`₹${avgAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={<TrendingUp fontSize="small" />}
            subtitle="Per completed invoice"
          />
        </Grid>
      </Grid>


      {/* Search and Filter Bar */}
      <GlassCard sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: showFilters ? 2 : 0 }}>
          <Search sx={{ color: 'text.secondary' }} />
          <TextField
            placeholder="Search by invoice ID or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="standard"
            fullWidth
            InputProps={{ disableUnderline: true }}
          />
          <IconButton onClick={() => setShowFilters(!showFilters)} sx={{ bgcolor: showFilters ? 'primary.main' : 'action.hover', color: showFilters ? 'white' : 'text.secondary' }}>
            <FilterList />
          </IconButton>
        </Box>
        {showFilters && (
          <Box sx={{ display: 'flex', gap: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <TextField
              label="Filter by Date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Payment Method"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            >
              <MenuItem value="All">All Methods</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Net Banking">Net Banking</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              onClick={() => { setSearchTerm(''); setDateFilter(''); setPaymentFilter('All'); }}
              size="small"
            >
              Clear
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 2, pt: 2, borderTop: showFilters ? 'none' : '1px solid', borderColor: 'divider', mt: 2 }}>
          <TextField select size="small" label="Sort By" value={orderBy} onChange={(e) => setOrderBy(e.target.value)} sx={{ minWidth: 120 }}>
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="total">Amount</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="paymentMethod">Payment</MenuItem>
          </TextField>
          <TextField select size="small" label="Order" value={order} onChange={(e) => setOrder(e.target.value)} sx={{ minWidth: 100 }}>
            <MenuItem value="asc">Asc</MenuItem>
            <MenuItem value="desc">Desc</MenuItem>
          </TextField>
        </Box>
      </GlassCard>

      {/* Invoice List (Mobile) or Table (Desktop) */}
      {
        isMobile ? (
          <Box>
            {sortedInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(inv => (
              <GlassCard key={inv.id} sx={{ mb: 2, p: 0 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        #{inv.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <Chip
                      label={inv.paymentMethod}
                      size="small"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        fontWeight: 700,
                        fontSize: '0.65rem'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {inv.customer || 'Walk-in Customer'}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      ₹{inv.total.toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {inv.items?.length || 0} Items
                    </Typography>
                    <Box sx={{ display: 'flex' }}>
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, inv.id)}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && selectedInvoiceId === inv.id}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: { width: 200, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                    }}
                  >
                    <MenuItem onClick={() => { setViewInvoice(inv); handleMenuClose(); }}>
                      <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
                      <ListItemText>View</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { downloadPDF(inv); handleMenuClose(); }}>
                      <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                      <ListItemText>Download</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { sendWhatsApp(inv); handleMenuClose(); }}>
                      <ListItemIcon><WhatsApp fontSize="small" /></ListItemIcon>
                      <ListItemText>WhatsApp</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { openDeleteDialog(inv.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                      <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                      <ListItemText>Delete</ListItemText>
                    </MenuItem>
                  </Menu>
                </CardContent>
              </GlassCard>
            ))}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredInvoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: 'none' }}
            />
          </Box>
        ) : (
          <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <TableSortLabel active={orderBy === 'id'} direction={orderBy === 'id' ? order : 'asc'} onClick={() => handleRequestSort('id')}>
                        Invoice Details
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <TableSortLabel active={orderBy === 'date'} direction={orderBy === 'date' ? order : 'asc'} onClick={() => handleRequestSort('date')}>
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'table-cell' } }}>
                      <TableSortLabel active={orderBy === 'customer'} direction={orderBy === 'customer' ? order : 'asc'} onClick={() => handleRequestSort('customer')}>
                        Customer
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel active={orderBy === 'paymentMethod'} direction={orderBy === 'paymentMethod' ? order : 'asc'} onClick={() => handleRequestSort('paymentMethod')}>
                        Payment
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <TableSortLabel active={orderBy === 'total'} direction={orderBy === 'total' ? order : 'asc'} onClick={() => handleRequestSort('total')}>
                        Amount
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedInvoices.length > 0 ? sortedInvoices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((inv, idx) => (
                      <TableRow
                        key={inv.id}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'all 0.2s'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>#{inv.id}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{inv.items?.length || 0} Items</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 700 }}>
                          {inv.customer || 'Walk-in'}
                          {inv.phone && <Typography variant="caption" display="block" color="text.secondary">{inv.phone}</Typography>}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Chip
                            label={inv.paymentMethod}
                            size="small"
                            sx={{
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              textTransform: 'uppercase',
                              borderRadius: 1
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 900, fontSize: '0.95rem', color: 'primary.main' }}>
                          ₹{inv.total.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, inv.id)}
                            sx={{
                              color: 'primary.main',
                              bgcolor: 'action.hover',
                              '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl) && selectedInvoiceId === inv.id}
                            onClose={handleMenuClose}
                            PaperProps={{
                              sx: { width: 200, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                            }}
                          >
                            <MenuItem onClick={() => { setViewInvoice(inv); handleMenuClose(); }}>
                              <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
                              <ListItemText>View</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { downloadPDF(inv); handleMenuClose(); }}>
                              <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                              <ListItemText>Download PDF</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { sendWhatsApp(inv); handleMenuClose(); }}>
                              <ListItemIcon><WhatsApp fontSize="small" /></ListItemIcon>
                              <ListItemText>WhatsApp</ListItemText>
                            </MenuItem>
                            {user?.role === 'admin' && (
                              <MenuItem onClick={() => { openDeleteDialog(inv.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                                <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                                <ListItemText>Delete</ListItemText>
                              </MenuItem>
                            )}
                          </Menu>
                        </TableCell>
                      </TableRow>
                    )) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                        <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No invoices found</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Create your first invoice to get started</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredInvoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </GlassCard>
        )
      }

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        content="Are you sure you want to delete this invoice? This action will remove the record permanently."
      />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3.5,
            overflow: 'hidden',
            maxHeight: isMobile ? '100%' : '92vh',
            boxShadow: '0 24px 60px rgba(15, 118, 110, 0.22)'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
          color: 'white',
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(217, 119, 6, 0.2)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(217, 119, 6, 0.2)', color: '#D97706', width: 40, height: 40, border: '1px solid rgba(217, 119, 6, 0.4)' }}>
              <PointOfSale fontSize="small" />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.25rem' }, letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                  Create Retail Invoice
                </Typography>
                <Chip
                  label="POS Checkout"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(217, 119, 6, 0.25)',
                    color: '#FBBF24',
                    border: '1px solid rgba(251, 191, 36, 0.4)'
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                Aleen Atelier Luxury Billing & Client Ledger
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.8)', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: mode === 'light' ? '#F8FAFC' : 'background.default' }}>
          <Grid container spacing={2.5}>
            {/* Left Column: Customer & Item Cart */}
            <Grid item xs={12} lg={7}>
              {/* Customer Information Card */}
              <Paper sx={{
                p: 2.5,
                mb: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonOutline sx={{ color: '#0F766E', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                      Client Details
                    </Typography>
                  </Box>
                  {selectedCustomerId && (
                    <Chip
                      size="small"
                      label={`VIP Client • ${customers.find(c => c.id === selectedCustomerId)?.loyaltyPoints || 0} pts`}
                      sx={{ bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', fontWeight: 700, height: 22 }}
                    />
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Customer Name"
                    fullWidth
                    size="small"
                    value={customer}
                    placeholder="e.g. Saira Banu"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\b\w/g, (l) => l.toUpperCase());
                      setCustomer(val);
                      if (selectedCustomerId) setSelectedCustomerId(null);
                    }}
                    onBlur={() => {
                      const searchTerm = customer.toLowerCase().trim();
                      if (searchTerm) {
                        const matched = customers.find(c => c.name.toLowerCase() === searchTerm);
                        if (matched) {
                          setCustomer(matched.name);
                          setPhone(matched.phone || '+91');
                          setSelectedCustomerId(matched.id);
                        }
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const searchTerm = customer.toLowerCase().trim();
                        const matched = customers.find(c => c.name.toLowerCase() === searchTerm);
                        if (matched) {
                          setCustomer(matched.name);
                          setPhone(matched.phone || '+91');
                          setSelectedCustomerId(matched.id);
                        }
                      }
                    }}
                    helperText="Search by name. Triggers auto-lookup on Enter or tap away."
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="Phone Number"
                    size="small"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      let suffix = val;
                      if (val.startsWith('+91')) {
                        suffix = val.slice(3);
                      } else if (val.length < 3) {
                        setPhone('+91');
                        return;
                      }

                      const cleanedSuffix = suffix.replace(/[^0-9]/g, '').slice(0, 10);
                      const newPhone = `+91${cleanedSuffix}`;
                      setPhone(newPhone);

                      if (newPhone.length === 13) {
                        const matched = customers.find(c => c.phone === newPhone || c.phone === cleanedSuffix);
                        if (matched) {
                          setCustomer(matched.name);
                          setSelectedCustomerId(matched.id);
                        }
                      }
                    }}
                    onBlur={() => {
                      const val = phone.trim();
                      if (val.length > 3) {
                        const matched = customers.find(c => c.phone === val || c.phone === val.replace('+91', '').trim());
                        if (matched) {
                          setCustomer(matched.name);
                          setSelectedCustomerId(matched.id);
                        }
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const val = phone.trim();
                        const matched = customers.find(c => c.phone === val || c.phone === val.replace('+91', '').trim());
                        if (matched) {
                          setCustomer(matched.name);
                          setSelectedCustomerId(matched.id);
                        }
                      }
                    }}
                    fullWidth
                    placeholder="919876543210"
                    InputProps={{
                      sx: { fontFamily: 'monospace' }
                    }}
                  />
                  <TextField
                    label="Invoice Date & Time"
                    type="datetime-local"
                    size="small"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Paper>

              {/* Items Card */}
              <Paper sx={{
                p: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingBagOutlined sx={{ color: '#0F766E', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                      Selected Garments & Merchandise ({selectedItems.filter(i => i.id).length})
                    </Typography>
                  </Box>
                </Box>

                {/* Quick Add / Scan Barcode Bar */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Scan Barcode / Product ID to Quick Add..."
                    value={itemSearchTerm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItemSearchTerm(val);

                      if (val.trim()) {
                        const trimmed = val.toLowerCase().trim();
                        let matchedProduct = inventory.find(inv =>
                          inv.productId && inv.productId.toLowerCase() === trimmed && (parseInt(inv.quantity) || 0) > 0
                        );
                        let matchedVariantSku = null;

                        if (!matchedProduct) {
                          for (const inv of inventory) {
                            if (inv.hasVariants && inv.variants) {
                              const variant = inv.variants.find(v => v.sku && v.sku.toLowerCase() === trimmed);
                              if (variant) {
                                matchedProduct = inv;
                                matchedVariantSku = variant.sku;
                                break;
                              }
                            }
                          }
                        }

                        if (matchedProduct) {
                          const emptyIndex = selectedItems.findIndex(item => !item.id);
                          if (emptyIndex !== -1) {
                            handleItemChange(emptyIndex, 'id', matchedProduct.id);
                            if (matchedVariantSku) handleItemChange(emptyIndex, 'variantSku', matchedVariantSku);
                          } else {
                            setSelectedItems([...selectedItems, {
                              id: matchedProduct.id,
                              quantity: 1,
                              variantSku: matchedVariantSku || '',
                              isCustom: false,
                              customName: '',
                              customPrice: 0,
                              customCost: 0
                            }]);
                          }
                          setItemSearchTerm('');
                        }
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = itemSearchTerm.toLowerCase().trim();
                        let matchedProduct = inventory.find(inv =>
                          inv.productId && inv.productId.toLowerCase() === trimmed && (parseInt(inv.quantity) || 0) > 0
                        );
                        let matchedVariantSku = null;

                        if (!matchedProduct) {
                          for (const inv of inventory) {
                            if (inv.hasVariants && inv.variants) {
                              const variant = inv.variants.find(v => v.sku && v.sku.toLowerCase() === trimmed);
                              if (variant) {
                                matchedProduct = inv;
                                matchedVariantSku = variant.sku;
                                break;
                              }
                            }
                          }
                        }

                        if (matchedProduct) {
                          const emptyIndex = selectedItems.findIndex(item => !item.id);
                          if (emptyIndex !== -1) {
                            handleItemChange(emptyIndex, 'id', matchedProduct.id);
                            if (matchedVariantSku) handleItemChange(emptyIndex, 'variantSku', matchedVariantSku);
                          } else {
                            setSelectedItems([...selectedItems, {
                              id: matchedProduct.id,
                              quantity: 1,
                              variantSku: matchedVariantSku || '',
                              isCustom: false,
                              customName: '',
                              customPrice: 0,
                              customCost: 0
                            }]);
                          }
                          setItemSearchTerm('');
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
                      endAdornment: (
                        <Tooltip title="Scan using Camera">
                          <IconButton size="small" onClick={() => setScannerOpen(true)} sx={{ color: '#0F766E' }}>
                            <CameraAlt fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Box>

                {/* Scanner Dialog */}
                <Dialog open={scannerOpen} onClose={() => setScannerOpen(false)} maxWidth="xs" fullWidth>
                  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
                    Scan Product Barcode
                    <IconButton onClick={() => setScannerOpen(false)} size="small"><Close /></IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ textAlign: 'center' }}>
                    <Box id="reader" sx={{ width: '100%', minHeight: '250px', bgcolor: '#000', borderRadius: 2, overflow: 'hidden', mb: 2 }} />

                    {scannerError ? (
                      <Box sx={{ color: 'error.main', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{scannerError}</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => setScannerOpen(false)}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Close
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => { setScannerOpen(false); setTimeout(() => setScannerOpen(true), 500); }}
                          sx={{ mt: 1 }}
                        >
                          Retry
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                        {scannerStatus}
                      </Typography>
                    )}

                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      Point your camera at a product barcode.
                    </Typography>
                  </DialogContent>
                </Dialog>

                {/* Selected Items List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  {selectedItems.map((item, index) => {
                    const filteredInventory = inventory.filter(inv => (parseInt(inv.currentQty || inv.quantity) || 0) > 0);
                    const selectedProduct = inventory.find(i => i.id === item.id);

                    return (
                      <Box key={index} sx={{
                        p: 1.5,
                        bgcolor: mode === 'light' ? '#F8FAFC' : 'background.default',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          borderColor: '#0F766E',
                          boxShadow: '0 4px 12px rgba(15,118,110,0.06)'
                        }
                      }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {!item.isCustom ? (
                              <Autocomplete
                                value={selectedProduct || null}
                                onChange={(event, newValue) => {
                                  handleItemChange(index, 'id', newValue ? newValue.id : '');
                                }}
                                options={filteredInventory}
                                getOptionLabel={(option) => `${option.name} (₹${option.price})`}
                                filterOptions={(options, { inputValue }) => {
                                  return options.filter(option =>
                                    option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                                    (option.productId && option.productId.toLowerCase().includes(inputValue.toLowerCase()))
                                  );
                                }}
                                renderOption={(props, option) => (
                                  <Box component="li" {...props} key={option.id}>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        ID: {option.productId || 'N/A'} • Stock: {option.quantity} • ₹{option.price}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Select Garment / Product"
                                    size="small"
                                    fullWidth
                                    error={!item.id && selectedItems.length > 0}
                                  />
                                )}
                              />
                            ) : (
                              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                <TextField
                                  label="Custom Garment Name / Alteration"
                                  size="small"
                                  fullWidth
                                  value={item.customName}
                                  onChange={(e) => handleItemChange(index, 'customName', e.target.value)}
                                  error={!item.customName && selectedItems.length > 0}
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <TextField
                                    label="Sale Price (₹)"
                                    size="small"
                                    type="number"
                                    fullWidth
                                    value={item.customPrice}
                                    onChange={(e) => handleItemChange(index, 'customPrice', parseFloat(e.target.value) || 0)}
                                  />
                                  <TextField
                                    label="Cost Basis (₹)"
                                    size="small"
                                    type="number"
                                    fullWidth
                                    value={item.customCost}
                                    onChange={(e) => handleItemChange(index, 'customCost', parseFloat(e.target.value) || 0)}
                                  />
                                </Box>
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title="Toggle bespoke / custom item without stock decrement">
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={item.isCustom}
                                    onChange={(e) => {
                                      handleItemChange(index, 'isCustom', e.target.checked);
                                      if (e.target.checked) handleItemChange(index, 'id', 'custom');
                                      else handleItemChange(index, 'id', '');
                                    }}
                                  />
                                }
                                label={<Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary' }}>Custom</Typography>}
                                labelPlacement="top"
                                sx={{ m: 0 }}
                              />
                            </Tooltip>
                            {selectedItems.length > 1 && (
                              <IconButton
                                size="small"
                                onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))}
                                sx={{ color: 'error.main', p: 0.5 }}
                              >
                                <Delete fontSize="small" sx={{ fontSize: 18 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>

                        {/* Variant Selector if item has variants */}
                        {!item.isCustom && item.id && selectedProduct?.hasVariants && (
                          <Box sx={{ mt: 1.5 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label="Select Garment Size & Shade Variant"
                              value={item.variantSku || ''}
                              onChange={(e) => handleItemChange(index, 'variantSku', e.target.value)}
                              error={!item.variantSku && selectedItems.length > 0}
                            >
                              {selectedProduct.variants.map((v) => (
                                <MenuItem key={v.sku} value={v.sku} disabled={(parseInt(v.quantity) || 0) <= 0}>
                                  {v.size} / {v.color} (Stock: {v.quantity}) - ₹{v.price}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Box>
                        )}

                        {/* Quantity and Row Subtotal */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Quantity:</Typography>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              sx={{ width: 80, '& input': { py: 0.5, textAlign: 'center', fontWeight: 800 } }}
                            />
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Line Total</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E' }}>
                              ₹{item.isCustom
                                ? ((item.customPrice || 0) * item.quantity).toLocaleString('en-IN')
                                : (selectedProduct ? (selectedProduct.price * item.quantity).toLocaleString('en-IN') : '0')
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Button
                  onClick={handleAddItem}
                  startIcon={<Add />}
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 700,
                    borderStyle: 'dashed',
                    color: '#0F766E',
                    borderColor: '#0F766E',
                    '&:hover': {
                      borderStyle: 'dashed',
                      bgcolor: 'rgba(15, 118, 110, 0.04)'
                    }
                  }}
                >
                  + Add Another Garment
                </Button>
              </Paper>
            </Grid>

            {/* Right Column: Settlement, Taxes & Luxury Ledger Summary */}
            <Grid item xs={12} lg={5}>
              <Paper sx={{
                p: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                position: { lg: 'sticky' },
                top: 16
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentsOutlined sx={{ color: '#D97706', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                      Settlement & Ledger
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isSplitPayment}
                        onChange={(e) => {
                          setIsSplitPayment(e.target.checked);
                          if (e.target.checked) setSplitAmount(Math.round(total / 2));
                        }}
                        size="small"
                      />
                    }
                    label={<Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Split Payment</Typography>}
                    sx={{ m: 0 }}
                  />
                </Box>

                {!isSplitPayment ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    <TextField
                      select
                      label="Payment Method"
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        if (e.target.value === 'Credit') setPaymentStatus('pending');
                        else if (e.target.value === 'EMI') { setPaymentStatus('paid'); setIsEMI(true); }
                        else { setPaymentStatus('paid'); setIsEMI(false); }
                      }}
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="Cash">Cash (Store Counter)</MenuItem>
                      <MenuItem value="Card">Card (POS Terminal)</MenuItem>
                      <MenuItem value="UPI">UPI (QR / PhonePe / GPay)</MenuItem>
                      <MenuItem value="EMI">EMI (Installments)</MenuItem>
                      <MenuItem value="Net Banking">Net Banking</MenuItem>
                      <MenuItem value="Credit">Credit (Pay Later / Khata)</MenuItem>
                    </TextField>

                    {paymentMethod === 'UPI' && (
                      <TextField select label="UPI App / Gateway" value={upiProvider} onChange={(e) => setUpiProvider(e.target.value)} fullWidth size="small">
                        <MenuItem value="PhonePe">PhonePe</MenuItem>
                        <MenuItem value="GPay">Google Pay (GPay)</MenuItem>
                        <MenuItem value="Paytm">Paytm UPI</MenuItem>
                        <MenuItem value="BHIM">BHIM / Static QR</MenuItem>
                      </TextField>
                    )}

                    {paymentMethod === 'EMI' && (
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField select label="Tenure" value={emiTenure} onChange={(e) => {
                          setEmiTenure(e.target.value);
                          setIsEMI(true);
                        }} fullWidth size="small">
                          <MenuItem value={3}>3 Months</MenuItem>
                          <MenuItem value={6}>6 Months</MenuItem>
                          <MenuItem value={9}>9 Months</MenuItem>
                          <MenuItem value={12}>12 Months</MenuItem>
                        </TextField>
                        <TextField label="Monthly Est." value={`₹${(total / (emiTenure || 3)).toFixed(0)}`} disabled fullWidth size="small" />
                      </Box>
                    )}

                    <TextField
                      select
                      label="Payment Status"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="paid">Paid (Fully Settled)</MenuItem>
                      <MenuItem value="partial">Partially Paid</MenuItem>
                      <MenuItem value="pending">Pending Settlement</MenuItem>
                    </TextField>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField select label="Method 1" value={paymentMethod} onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        if (e.target.value === 'Credit') setPaymentStatus('partial');
                      }} fullWidth size="small">
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Card">Card</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                        <MenuItem value="Credit">Credit</MenuItem>
                      </TextField>
                      <TextField
                        label="Amount 1 (₹)"
                        type="number"
                        value={splitAmount}
                        onChange={(e) => setSplitAmount(parseFloat(e.target.value) || 0)}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField select label="Method 2" value={paymentMethod2} onChange={(e) => {
                        setPaymentMethod2(e.target.value);
                        if (e.target.value === 'Credit') setPaymentStatus('partial');
                      }} fullWidth size="small">
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Card">Card</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                        <MenuItem value="Credit">Credit</MenuItem>
                      </TextField>
                      <TextField
                        label="Amount 2 (₹)"
                        value={(total - splitAmount).toFixed(2)}
                        disabled
                        fullWidth
                        size="small"
                        helperText="Remainder balance"
                      />
                    </Box>
                  </Box>
                )}

                {/* Taxes & Discounts */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
                  <TextField label="GST (%)" type="number" size="small" value={tax} onChange={(e) => setTax(e.target.value)} fullWidth />
                  <TextField
                    label="Disc (%)"
                    type="number"
                    size="small"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Disc (₹)"
                    type="number"
                    size="small"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    fullWidth
                  />
                </Box>

                {/* Luxury Ledger Total Box */}
                <Box sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, rgba(15,118,110,0.06) 0%, rgba(217,119,6,0.06) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(15,118,110,0.15)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Gross Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{subtotal.toFixed(2).toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">GST ({(parseFloat(tax) || 0)}%):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{taxAmount.toFixed(2).toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Discount Applied:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'error.main' }}>
                      - ₹{absDiscount.toFixed(2).toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5, borderColor: 'rgba(15,118,110,0.2)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, color: '#D97706', letterSpacing: '0.04em' }}>
                        Net Payable
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F766E', letterSpacing: '-0.02em' }}>
                        ₹{total.toFixed(2).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <Chip
                      label={paymentStatus.toUpperCase()}
                      size="small"
                      color={paymentStatus === 'paid' ? 'success' : paymentStatus === 'partial' ? 'warning' : 'default'}
                      sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{
          p: { xs: 2, sm: 2.5 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Button
            onClick={() => setOpen(false)}
            variant="text"
            sx={{ fontWeight: 700, color: 'text.secondary', px: 2 }}
          >
            Cancel
          </Button>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={handleSaveInvoice}
              variant="contained"
              size="large"
              startIcon={<ReceiptLong />}
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.92rem',
                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #115E59 0%, #022c22 100%)'
                }
              }}
            >
              Issue Retail Invoice • ₹{total.toFixed(0).toLocaleString('en-IN')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: 'hidden' } }}
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative', bgcolor: 'primary.main' }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setViewInvoice(null)} aria-label="close">
                <Close />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                View Invoice
              </Typography>
              <Button autoFocus color="inherit" onClick={() => handlePrint(viewInvoice)}>
                Print
              </Button>
            </Toolbar>
          </AppBar>
        )}

        {/* Template Quick Switcher Header Bar */}
        <Box
          sx={{
            p: 1.5,
            px: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              Template:
            </Typography>
            {INVOICE_TEMPLATES.map(tmpl => {
              const isActive = invoiceSettings.template === tmpl.id;
              return (
                <Chip
                  key={tmpl.id}
                  label={tmpl.name}
                  size="small"
                  onClick={() => setInvoiceSettings(prev => ({ ...prev, template: tmpl.id }))}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    bgcolor: isActive ? tmpl.primaryColor : 'background.paper',
                    color: isActive ? '#ffffff' : 'text.primary',
                    border: '1px solid',
                    borderColor: isActive ? tmpl.primaryColor : 'divider',
                    '&:hover': {
                      bgcolor: isActive ? tmpl.primaryColor : 'action.selected'
                    }
                  }}
                />
              );
            })}
          </Box>

          <Button
            size="small"
            startIcon={<DesignServices fontSize="small" />}
            onClick={() => setTemplateModalOpen(true)}
            sx={{
              fontWeight: 800,
              fontSize: '0.74rem',
              color: '#0F766E',
              textTransform: 'none'
            }}
          >
            🎨 Custom Letterhead & Settings
          </Button>
        </Box>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F8FAFC' }}>
          {viewInvoice && (
            <InvoicePrint
              ref={printRef}
              invoice={viewInvoice}
              template={invoiceSettings.template}
              settings={invoiceSettings}
            />
          )}
        </DialogContent>
        <DialogActions sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          '& > :not(style) + :not(style)': { ml: { xs: 0, sm: 1 } }
        }}>
          <Button onClick={() => setViewInvoice(null)} fullWidth={isMobile} variant="outlined">Close</Button>
          {!isMobile && <Box sx={{ flexGrow: 1 }} />}
          <Button onClick={() => downloadPDF(viewInvoice)} startIcon={<Download />} variant="outlined" fullWidth={isMobile}>Download PDF</Button>
          <Button onClick={() => sharePDF(viewInvoice)} startIcon={<Share />} variant="outlined" color="primary" fullWidth={isMobile}>Share PDF</Button>
          <Button onClick={() => sendWhatsApp(viewInvoice)} startIcon={<WhatsApp />} variant="contained" sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }} fullWidth={isMobile}>WhatsApp</Button>
          {!isMobile && <Button onClick={() => handlePrint(viewInvoice)} variant="contained" startIcon={<Print />}>Print</Button>}
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        content="Are you sure you want to delete this invoice? This action cannot be undone."
      />

      {/* Invoice Success Dialog */}
      <Dialog
        open={!!successInvoice}
        onClose={() => setSuccessInvoice(null)}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 400 } }}
      >
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Box sx={{
            width: 60, height: 60, borderRadius: '50%', bgcolor: 'success.light',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2, color: 'white'
          }}>
            <TrendingUp fontSize="large" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Invoice Saved!</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Invoice #{successInvoice?.id} has been successfully created and saved to your records.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<WhatsApp />}
              onClick={() => { sendWhatsApp(successInvoice); setSuccessInvoice(null); }}
              sx={{ py: 1.5, bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' }, borderRadius: 2, fontWeight: 700 }}
            >
              Share on WhatsApp
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Print />}
              onClick={() => { handlePrint(successInvoice); setSuccessInvoice(null); }}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
            >
              Print Invoice
            </Button>
            <Button
              fullWidth
              onClick={() => setSuccessInvoice(null)}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
            >
              Done
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Invoice Template & Letterhead Studio Dialog */}
      <InvoiceTemplateDialog
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        settings={invoiceSettings}
        onSaveSettings={(newSettings) => setInvoiceSettings(newSettings)}
      />
    </Box>
  );
};

export default Invoices;
