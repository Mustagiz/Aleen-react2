import React, { useState, useRef } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TextField, MenuItem, Paper, Typography, TableContainer, Chip, Card, CardContent, Grid, Divider, Tooltip, useMediaQuery, useTheme, AppBar, Toolbar, TablePagination, Menu, ListItemIcon, ListItemText, Autocomplete, Switch, FormControlLabel, Avatar, TableSortLabel } from '@mui/material';
import { Add, Delete, Print, Visibility, WhatsApp, Download, Search, FilterList, Receipt, Share, Close, MoreVert, AttachMoney, TrendingUp } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { generateInvoiceNumber } from '../utils/helpers';
import InvoicePrint from '../components/InvoicePrint';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useThemeContext } from '../contexts/ThemeContext';

const Invoices = () => {
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
    setSelectedItems([...selectedItems, { id: '', quantity: 1, isCustom: false, customName: '', customPrice: 0, customCost: 0 }]);
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
        return {
          ...item,
          name: invItem?.name || 'Unknown Item',
          price: invItem?.price || 0,
          category: invItem?.category || 'General'
        };
      }),
      subtotal,
      tax: taxAmount,
      gst: parseFloat(tax) || 0,
      discount: absDiscount,
      discountPercent: parseFloat(discountPercent) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      total
    };
    await addInvoice(invoice);
    setOpen(false);
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

  const generatePDF = (invoice) => {
    const doc = new jsPDF();
    const primaryColor = '#F472B6'; // Baby Pink
    const accentColor = '#B76E79'; // Rose Gold

    // Header
    doc.setTextColor(primaryColor);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(profile.businessName, 105, 20, { align: 'center' });

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(profile.address, 105, 27, { align: 'center' });
    doc.text(`Phone: ${profile.phone} | GSTIN: ${profile.gstin}`, 105, 33, { align: 'center' });

    // Horizontal Line
    doc.setDrawColor(accentColor);
    doc.setLineWidth(1);
    doc.line(20, 38, 190, 38);

    // Invoice Info
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('BILL TO:', 20, 50);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.customer || 'Walk-in Customer', 20, 56);
    if (invoice.phone) doc.text(`Phone: ${invoice.phone}`, 20, 62);

    doc.setFont(undefined, 'bold');
    doc.text('INVOICE DETAILS:', 140, 50);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice #: ${invoice.id}`, 140, 56);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}`, 140, 62);
    doc.text(`Payment: ${invoice.paymentMethod}`, 140, 68);

    // Items Table
    const tableData = invoice.items.map(item => [
      { content: item.name, styles: { fontStyle: 'bold' } },
      item.category || '-',
      item.quantity,
      `₹${item.price.toFixed(2)}`,
      `₹${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Item', 'Category', 'Qty', 'Price', 'Amount']],
      body: tableData,
      headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 10, halign: 'center' },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      },
      theme: 'striped',
      styles: { fontSize: 9 }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const rightAlignX = 190;

    doc.setFontSize(10);
    doc.text('Subtotal:', 140, finalY);
    doc.text(`₹${invoice.subtotal.toFixed(2)}`, rightAlignX, finalY, { align: 'right' });

    if (invoice.discount > 0) {
      doc.setTextColor(accentColor);
      doc.text(`Discount (${invoice.discountPercentage || 0}%):`, 140, finalY + 7);
      doc.text(`-₹${invoice.discount.toFixed(2)}`, rightAlignX, finalY + 7, { align: 'right' });
      doc.setTextColor(40, 40, 40);
    }

    doc.text(`GST (${invoice.gst || 18}%):`, 140, finalY + 14);
    doc.text(`₹${invoice.tax.toFixed(2)}`, rightAlignX, finalY + 14, { align: 'right' });

    doc.setDrawColor(200);
    doc.line(140, finalY + 18, 190, finalY + 18);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(primaryColor);
    doc.text('Total Amount:', 140, finalY + 25);
    doc.text(`₹${invoice.total.toFixed(2)}`, rightAlignX, finalY + 25, { align: 'right' });

    // Footer
    doc.setTextColor(100);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Thank you for shopping with ${profile.businessName}!`, 105, 270, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(primaryColor);
    doc.text(`${profile.businessName.toUpperCase()} | ${profile.address}`, 105, 277, { align: 'center' });

    return doc;
  };

  const downloadPDF = (invoice) => {
    const doc = generatePDF(invoice);
    doc.save(`invoice-${invoice.id}.pdf`);
  };

  const sharePDF = async (invoice) => {
    try {
      const doc = generatePDF(invoice);
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
      {/* Header with Stats */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>Invoices</Typography>
            <Typography variant="body2" color="text.secondary">Create, manage and track all your invoices</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={downloadInvoices}
              sx={{ px: 3, py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
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
              size="large"
              sx={{
                width: { xs: '100%', sm: 'auto' },
                px: { xs: 2, sm: 4 },
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
                boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                  boxShadow: `0 6px 16px ${theme.palette.primary.main}4D`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Create Invoice
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(25, 118, 210, 0.15)',
              border: '1px solid rgba(25, 118, 210, 0.2)',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(25, 118, 210, 0.05) 100%)`,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(25, 118, 210, 0.3)' }
            }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#1976d2' }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoices</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{totalInvoices}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', color: '#1976d2', borderRadius: 2 }}>
                    <Receipt fontSize="small" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(46, 125, 50, 0.15)',
              border: '1px solid rgba(46, 125, 50, 0.2)',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(46, 125, 50, 0.05) 100%)`,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(46, 125, 50, 0.3)' }
            }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#2e7d32' }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalAmount.toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', borderRadius: 2 }}>
                    <AttachMoney fontSize="small" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(237, 108, 2, 0.15)',
              border: '1px solid rgba(237, 108, 2, 0.2)',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(237, 108, 2, 0.05) 100%)`,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(237, 108, 2, 0.3)' }
            }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#ed6c02' }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Invoice</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{avgAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02', borderRadius: 2 }}>
                    <TrendingUp fontSize="small" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
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
          <IconButton onClick={() => setShowFilters(!showFilters)} sx={{ bgcolor: showFilters ? 'primary.main' : 'grey.100', color: showFilters ? 'white' : 'text.secondary' }}>
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
      </Paper>

      {/* Invoice List (Mobile) or Table (Desktop) */}
      {
        isMobile ? (
          <Box>
            {sortedInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(inv => (
              <Card key={inv.id} sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <CardContent sx={{ p: 2 }}>
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
                        color: 'primary.main',
                        fontWeight: 700,
                        fontSize: '0.65rem'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {inv.customer || 'Walk-in Customer'}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ₹{inv.total.toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
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
              </Card>
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
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)', borderBottom: '2px solid rgba(136, 14, 79, 0.1)' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <TableSortLabel active={orderBy === 'id'} direction={orderBy === 'id' ? order : 'asc'} onClick={() => handleRequestSort('id')}>
                        Invoice Details
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <TableSortLabel active={orderBy === 'date'} direction={orderBy === 'date' ? order : 'asc'} onClick={() => handleRequestSort('date')}>
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'table-cell' } }}>
                      <TableSortLabel active={orderBy === 'customer'} direction={orderBy === 'customer' ? order : 'asc'} onClick={() => handleRequestSort('customer')}>
                        Customer
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel active={orderBy === 'paymentMethod'} direction={orderBy === 'paymentMethod' ? order : 'asc'} onClick={() => handleRequestSort('paymentMethod')}>
                        Payment
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <TableSortLabel active={orderBy === 'total'} direction={orderBy === 'total' ? order : 'asc'} onClick={() => handleRequestSort('total')}>
                        Amount
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedInvoices.length > 0 ? sortedInvoices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((inv, idx) => (
                      <TableRow
                        key={inv.id}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(136, 14, 79, 0.02)' },
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
                              bgcolor: 'rgba(136, 14, 79, 0.05)',
                              color: 'primary.main',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              textTransform: 'uppercase',
                              borderRadius: 1
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'primary.main' }}>
                          ₹{inv.total.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, inv.id)}
                            sx={{
                              color: 'primary.main',
                              bgcolor: 'rgba(136, 14, 79, 0.05)',
                              '&:hover': { bgcolor: 'rgba(136, 14, 79, 0.1)' }
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
                            <MenuItem onClick={() => { openDeleteDialog(inv.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                              <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                              <ListItemText>Delete</ListItemText>
                            </MenuItem>
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
          </Paper>
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
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            overflow: 'hidden',
            maxHeight: isMobile ? '100%' : '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 800,
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          py: { xs: 2.5, sm: 3 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Create Retail Invoice
          {isMobile && (
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Customer Information</Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Customer Name"
                fullWidth
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  if (selectedCustomerId) setSelectedCustomerId(null);
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
                helperText="Press Enter to search for existing customer phone"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Phone (with country code)"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('+91')) {
                    setPhone(val);
                  } else if (val.length < 3) {
                    setPhone('+91');
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // Fetch customer logic only on Enter
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
                helperText="Press Enter to search for existing customer name"
              />
              <TextField
                label="Invoice Date & Time"
                type="datetime-local"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Invoice Items</Typography>



            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Scan Barcode / Product ID to Quick Add..."
                value={itemSearchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setItemSearchTerm(val);

                  // Auto-select on exact Product ID match (case-insensitive)
                  if (val.trim()) {
                    const matchedProduct = inventory.find(inv =>
                      inv.productId && inv.productId.toLowerCase() === val.toLowerCase().trim() && (parseInt(inv.quantity) || 0) > 0
                    );

                    if (matchedProduct) {
                      // Check if there's an empty item slot
                      const emptyIndex = selectedItems.findIndex(item => !item.id);
                      if (emptyIndex !== -1) {
                        handleItemChange(emptyIndex, 'id', matchedProduct.id);
                      } else {
                        setSelectedItems([...selectedItems, { id: matchedProduct.id, quantity: 1 }]);
                      }
                      setItemSearchTerm(''); // Clear search instantly
                    }
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const matchedProduct = inventory.find(inv =>
                      inv.productId && inv.productId.toLowerCase() === itemSearchTerm.toLowerCase().trim() && (parseInt(inv.quantity) || 0) > 0
                    );
                    if (matchedProduct) {
                      const emptyIndex = selectedItems.findIndex(item => !item.id);
                      if (emptyIndex !== -1) {
                        handleItemChange(emptyIndex, 'id', matchedProduct.id);
                      } else {
                        setSelectedItems([...selectedItems, { id: matchedProduct.id, quantity: 1 }]);
                      }
                      setItemSearchTerm('');
                    }
                  }
                }}
                size="small"
                InputProps={{
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                helperText="Scanning or typing a Product ID adds it automatically"
              />
            </Box>
            {selectedItems.map((item, index) => {
              // Filter inventory based quantity > 0
              const filteredInventory = inventory.filter(inv => (parseInt(inv.currentQty || inv.quantity) || 0) > 0);

              return (
                <Box key={index} sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  mb: 2,
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {!item.isCustom ? (
                        <Autocomplete
                          value={inventory.find(i => i.id === item.id) || null}
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
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {option.productId || 'N/A'} | Stock: {option.quantity} | ₹{option.price}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Search Product (Name or ID)"
                              size="small"
                              fullWidth
                              error={!item.id && selectedItems.length > 0}
                            />
                          )}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
                          <TextField
                            label="Custom Product Name"
                            size="small"
                            fullWidth
                            value={item.customName}
                            onChange={(e) => handleItemChange(index, 'customName', e.target.value)}
                            error={!item.customName && selectedItems.length > 0}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              label="Sale (₹)"
                              size="small"
                              type="number"
                              fullWidth
                              value={item.customPrice}
                              onChange={(e) => handleItemChange(index, 'customPrice', parseFloat(e.target.value) || 0)}
                            />
                            <TextField
                              label="Cost (₹)"
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={item.isCustom}
                            onChange={(e) => {
                              handleItemChange(index, 'isCustom', e.target.checked);
                              if (e.target.checked) handleItemChange(index, 'id', 'custom'); // Placeholder ID
                              else handleItemChange(index, 'id', '');
                            }}
                          />
                        }
                        label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>Custom?</Typography>}
                        labelPlacement="top"
                        sx={{ m: 0 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))}
                        sx={{ color: 'error.main' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="Qty"
                      type="number"
                      size="small"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      sx={{ width: 100 }}
                    />
                    {item.isCustom ? (
                      <Typography variant="body2" sx={{ fontWeight: 700, ml: 'auto', color: 'primary.main' }}>
                        ₹{((item.customPrice || 0) * item.quantity).toLocaleString()}
                      </Typography>
                    ) : (
                      item.id && (
                        <Typography variant="body2" sx={{ fontWeight: 700, ml: 'auto', color: 'primary.main' }}>
                          ₹{(inventory.find(i => i.id === item.id)?.price * item.quantity || 0).toLocaleString()}
                        </Typography>
                      )
                    )}
                  </Box>
                </Box>
              );
            })}
            <Button onClick={handleAddItem} startIcon={<Add />} variant="outlined" fullWidth>Add More Item</Button>
          </Paper>

          <Paper sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Payment & Totals</Typography>
              <FormControlLabel
                control={<Switch checked={isSplitPayment} onChange={(e) => {
                  setIsSplitPayment(e.target.checked);
                  if (e.target.checked) setSplitAmount(Math.round(total / 2));
                }} size="small" />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Split Payment</Typography>}
              />
            </Box>

            {!isSplitPayment ? (
              <TextField select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} fullWidth size="small">
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Net Banking">Net Banking</MenuItem>
              </TextField>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField select label="Method 1" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} fullWidth size="small">
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Net Banking">Net Banking</MenuItem>
                  </TextField>
                  <TextField
                    label="Amount 1"
                    type="number"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(parseFloat(e.target.value) || 0)}
                    fullWidth
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField select label="Method 2" value={paymentMethod2} onChange={(e) => setPaymentMethod2(e.target.value)} fullWidth size="small">
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Net Banking">Net Banking</MenuItem>
                  </TextField>
                  <TextField
                    label="Amount 2"
                    value={(total - splitAmount).toFixed(2)}
                    disabled
                    fullWidth
                    size="small"
                    helperText="Auto-calculated remainder"
                  />
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField label="GST (%)" type="number" size="small" value={tax} onChange={(e) => setTax(e.target.value)} fullWidth />
              <Box sx={{ display: 'flex', gap: 1.5, width: '100%', flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label="Discount (%)"
                  type="number"
                  size="small"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Discount (₹)"
                  type="number"
                  size="small"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  fullWidth
                />
              </Box>
            </Box>
            <Box sx={{ mt: 3, p: 2, bgcolor: mode === 'light' ? 'primary.light' : 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{subtotal.toFixed(2).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">GST ({(parseFloat(tax) || 0)}%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{taxAmount.toFixed(2).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Discount (Total):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>- ₹{absDiscount.toFixed(2).toLocaleString()}</Typography>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Amount:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>₹{total.toFixed(2).toLocaleString()}</Typography>
              </Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: 'grey.50', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <Button onClick={() => setOpen(false)} variant="outlined" fullWidth={isMobile}>Cancel</Button>
          <Button onClick={handleSaveInvoice} variant="contained" size="large" sx={{ px: 4 }} fullWidth={isMobile}>Save Invoice</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
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
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {viewInvoice && <InvoicePrint ref={printRef} invoice={viewInvoice} />}
        </DialogContent>
        <DialogActions sx={{
          p: 2,
          bgcolor: 'grey.50',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          '& > :not(style) + :not(style)': { ml: { xs: 0, sm: 1 } }
        }}>
          <Button onClick={() => setViewInvoice(null)} fullWidth={isMobile} variant="outlined">Close</Button>
          {!isMobile && <Box sx={{ flexGrow: 1 }} />}
          <Button onClick={() => downloadPDF(viewInvoice)} startIcon={<Download />} variant="outlined" fullWidth={isMobile}>Download</Button>
          <Button onClick={() => sharePDF(viewInvoice)} startIcon={<Share />} variant="outlined" color="primary" fullWidth={isMobile}>Share PDF</Button>
          <Button onClick={() => sendWhatsApp(viewInvoice)} startIcon={<WhatsApp />} variant="contained" sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }} fullWidth={isMobile}>Text Message</Button>
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
    </Box >
  );
};

export default Invoices;
