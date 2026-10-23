import React, { useState, useMemo } from 'react';
import { 
    Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
    Table, TableBody, TableCell, TableHead, TableRow, IconButton, MenuItem, 
    Paper, Typography, TableContainer, Chip, Grid, Autocomplete, 
    InputAdornment, TablePagination, useTheme, useMediaQuery, TableSortLabel, 
    Tabs, Tab, Checkbox, Tooltip, Avatar, LinearProgress
} from '@mui/material';
import { 
    Add, Delete, ReceiptLong, Search, Edit, Close, AttachMoney, 
    Download, LocalShipping, AutoAwesome, Print, CalendarToday,
    CheckCircle, HourglassEmpty, ArrowUpward, ArrowDownward,
    WhatsApp, PictureAsPdf, Visibility, Payment, AccessTime,
    Warning, Phone, Call, Schedule
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import { useFeedback } from '../contexts/FeedbackContext';

const Purchases = () => {
    const navigate = useNavigate();
    const { 
        purchases, vendors, inventory, addPurchase, updatePurchase, 
        deletePurchase, categories, addInventoryItem, updateCategories, 
        getLowStockItems, profile 
    } = useData();
    const { showToast, showConfirm } = useFeedback();
    const [open, setOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [selectedPoId, setSelectedPoId] = useState(null);

    // Quick Add Product State
    const [quickAddDialog, setQuickAddDialog] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const [newCategory, setNewCategory] = useState('');
    const [quickForm, setQuickForm] = useState({
        name: '', category: '', cost: '', price: '', productId: '', size: ''
    });

    // PO Form State
    const [vendorId, setVendorId] = useState('');
    const [status, setStatus] = useState('Ordered');
    const [poItems, setPoItems] = useState([{ productId: '', quantity: 1, cost: 0, variantSku: '' }]);
    const [paymentStatus, setPaymentStatus] = useState('Unpaid');
    const [amountPaid, setAmountPaid] = useState(0);
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [poNotes, setPoNotes] = useState('');
    const [vendorPhoneInput, setVendorPhoneInput] = useState('');

    // Search, Filter and Pipeline State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [pipelineFilter, setPipelineFilter] = useState('All'); // 'All', 'Pending', 'Overdue', 'Received', 'Unpaid'

    // PO Quick-View Modal State
    const [viewPoModalOpen, setViewPoModalOpen] = useState(false);
    const [selectedPoForView, setSelectedPoForView] = useState(null);

    // Record Vendor Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [payingPo, setPayingPo] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        method: 'Bank Transfer (NEFT/RTGS)',
        transactionRef: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Vendor WhatsApp Missing Phone Prompt State
    const [whatsAppPromptOpen, setWhatsAppPromptOpen] = useState(false);
    const [whatsAppTargetPo, setWhatsAppTargetPo] = useState(null);
    const [customWhatsAppPhone, setCustomWhatsAppPhone] = useState('');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Sorting State
    const [orderBy, setOrderBy] = useState('date');
    const [order, setOrder] = useState('desc');

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Delivery Status Resolver Helper
    const getDeliveryStatus = (po) => {
        if (po.status === 'Received') {
            return {
                label: 'Delivered',
                status: 'delivered',
                color: '#059669',
                bgcolor: 'rgba(5, 150, 105, 0.12)',
                borderColor: 'rgba(5, 150, 105, 0.3)',
                icon: <CheckCircle sx={{ fontSize: '0.85rem !important' }} />,
                text: 'Stock inwarded into warehouse'
            };
        }
        if (!po.expectedDeliveryDate) {
            return {
                label: 'Unscheduled',
                status: 'unscheduled',
                color: '#64748B',
                bgcolor: 'rgba(100, 116, 139, 0.1)',
                borderColor: 'rgba(100, 116, 139, 0.25)',
                icon: <Schedule sx={{ fontSize: '0.85rem !important' }} />,
                text: 'No expected date provided'
            };
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(po.expectedDeliveryDate);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: `Overdue (${Math.abs(diffDays)}d)`,
                status: 'overdue',
                color: '#DC2626',
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                icon: <Warning sx={{ fontSize: '0.85rem !important' }} />,
                text: `Expected ${Math.abs(diffDays)} days ago`
            };
        } else if (diffDays === 0) {
            return {
                label: 'Arriving Today',
                status: 'today',
                color: '#D97706',
                bgcolor: 'rgba(217, 119, 6, 0.15)',
                borderColor: 'rgba(217, 119, 6, 0.35)',
                icon: <AccessTime sx={{ fontSize: '0.85rem !important' }} />,
                text: 'Scheduled for delivery today'
            };
        } else {
            return {
                label: `Due in ${diffDays}d`,
                status: 'upcoming',
                color: '#0F766E',
                bgcolor: 'rgba(15, 118, 110, 0.12)',
                borderColor: 'rgba(15, 118, 110, 0.3)',
                icon: <LocalShipping sx={{ fontSize: '0.85rem !important' }} />,
                text: `Expected on ${new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
            };
        }
    };

    // Filtered and Sorted Purchases
    const filteredPurchases = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return purchases.filter((po) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query ||
                (po.id || '').toLowerCase().includes(query) ||
                (po.vendorName || '').toLowerCase().includes(query) ||
                po.items.some(i => (i.productName || '').toLowerCase().includes(query));

            const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
            const matchesPayment = paymentFilter === 'All' || po.paymentStatus === paymentFilter;

            // Pipeline Filter
            let matchesPipeline = true;
            if (pipelineFilter === 'Pending') {
                matchesPipeline = po.status === 'Ordered';
            } else if (pipelineFilter === 'Overdue') {
                if (po.status !== 'Ordered' || !po.expectedDeliveryDate) {
                    matchesPipeline = false;
                } else {
                    const exp = new Date(po.expectedDeliveryDate);
                    exp.setHours(0, 0, 0, 0);
                    matchesPipeline = exp < today;
                }
            } else if (pipelineFilter === 'Received') {
                matchesPipeline = po.status === 'Received';
            } else if (pipelineFilter === 'Unpaid') {
                matchesPipeline = po.paymentStatus !== 'Paid';
            }

            return matchesSearch && matchesStatus && matchesPayment && matchesPipeline;
        });
    }, [purchases, searchQuery, statusFilter, paymentFilter, pipelineFilter]);

    const sortedPurchases = useMemo(() => {
        return [...filteredPurchases].sort((a, b) => {
            if (orderBy === 'total' || orderBy === 'amountPaid') {
                return order === 'asc' ? ((a[orderBy] || 0) - (b[orderBy] || 0)) : ((b[orderBy] || 0) - (a[orderBy] || 0));
            }
            if (orderBy === 'date') {
                return order === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
            }
            if (orderBy === 'expectedDeliveryDate') {
                const dateA = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate) : new Date('9999-12-31');
                const dateB = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate) : new Date('9999-12-31');
                return order === 'asc' ? dateA - dateB : dateB - dateA;
            }
            const valA = (a[orderBy] || '').toString().toLowerCase();
            const valB = (b[orderBy] || '').toString().toLowerCase();
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPurchases, orderBy, order]);

    const handleOpen = (po = null) => {
        if (po) {
            setEditMode(true);
            setSelectedPoId(po.id);
            setVendorId(po.vendorId || '');
            setStatus(po.status || 'Ordered');
            setPoItems(po.items.map(i => ({ 
                productId: i.productId, 
                quantity: i.quantity, 
                cost: i.cost, 
                variantSku: i.variantSku || '' 
            })));
            setPaymentStatus(po.paymentStatus || 'Unpaid');
            setAmountPaid(po.amountPaid || 0);
            setPurchaseDate(po.date ? new Date(po.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setExpectedDeliveryDate(po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : '');
            setPoNotes(po.notes || '');
            setVendorPhoneInput(po.vendorPhone || '');
        } else {
            setEditMode(false);
            setSelectedPoId(null);
            setVendorId('');
            setStatus('Ordered');
            setPoItems([{ productId: '', quantity: 1, cost: 0, variantSku: '' }]);
            setPaymentStatus('Unpaid');
            setAmountPaid(0);
            setPurchaseDate(new Date().toISOString().split('T')[0]);
            // Default expected delivery date: 5 days from today
            const defaultExp = new Date();
            defaultExp.setDate(defaultExp.getDate() + 5);
            setExpectedDeliveryDate(defaultExp.toISOString().split('T')[0]);
            setPoNotes('');
            setVendorPhoneInput('');
        }
        setOpen(true);
    };

    const handleQuickAddOpen = (index) => {
        setActiveRowIndex(index);
        setQuickForm({ name: '', category: categories[0] || 'Fabrics', cost: '', price: '', productId: '', size: '' });
        setQuickAddDialog(true);
    };

    const handleAddCategory = async () => {
        if (newCategory && !categories.includes(newCategory)) {
            const updated = [...categories, newCategory];
            await updateCategories(updated);
            setQuickForm({ ...quickForm, category: newCategory });
            setNewCategory('');
        }
    };

    const handleQuickSave = async () => {
        const id = quickForm.productId.trim() || `PRD-${Date.now()}`;
        const newItem = {
            ...quickForm,
            productId: id,
            price: parseFloat(quickForm.price) || 0,
            cost: parseFloat(quickForm.cost) || 0,
            quantity: 0,
            supplier: vendors.find(v => v.id === vendorId)?.name || ''
        };

        const addedItem = await addInventoryItem(newItem);
        if (activeRowIndex !== null && activeRowIndex < poItems.length) {
            const updated = [...poItems];
            updated[activeRowIndex] = {
                ...updated[activeRowIndex],
                productId: addedItem?.id || id,
                cost: parseFloat(quickForm.cost) || 0
            };
            setPoItems(updated);
        }
        setQuickAddDialog(false);
    };

    const handleAddItem = () => {
        setPoItems([...poItems, { productId: '', quantity: 1, cost: 0, variantSku: '' }]);
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...poItems];
        updated[index][field] = value;

        if (field === 'productId') {
            const product = inventory.find(i => i.id === value);
            if (product) {
                updated[index].cost = product.cost || 0;
            }
        }
        setPoItems(updated);
    };

    const calculateTotal = () => {
        return poItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.cost) || 0)), 0);
    };

    const handleSave = async () => {
        const total = calculateTotal();
        const selectedVendor = vendors.find(v => v.id === vendorId);
        const resolvedPhone = vendorPhoneInput || selectedVendor?.phone || '';

        const poData = {
            vendorId,
            vendorName: selectedVendor?.name || 'Unknown Vendor',
            vendorPhone: resolvedPhone,
            vendorEmail: selectedVendor?.email || '',
            status,
            paymentStatus,
            amountPaid: paymentStatus === 'Paid' ? total : (parseFloat(amountPaid) || 0),
            expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : null,
            notes: poNotes.trim(),
            items: poItems.filter(i => i.productId).map(item => {
                const prod = inventory.find(inv => inv.id === item.productId);
                return {
                    ...item,
                    productName: prod ? prod.name : 'Custom Item',
                    quantity: Number(item.quantity) || 1,
                    cost: Number(item.cost) || 0
                };
            }),
            total,
            date: new Date(purchaseDate).toISOString()
        };

        if (editMode && selectedPoId) {
            const oldPo = purchases.find(p => p.id === selectedPoId);
            await updatePurchase(selectedPoId, { 
                ...poData, 
                date: oldPo?.date || poData.date,
                payments: oldPo?.payments || []
            }, oldPo);
            showToast('Purchase order updated successfully', 'success');
        } else {
            await addPurchase({
                ...poData,
                payments: poData.amountPaid > 0 ? [{
                    id: `PAY-${Date.now()}`,
                    amount: poData.amountPaid,
                    method: 'Initial Advance',
                    date: purchaseDate,
                    notes: 'Advance recorded on PO creation',
                    recordedAt: new Date().toISOString()
                }] : []
            });
            showToast('Purchase order created successfully', 'success');
        }
        setOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteId) {
            await deletePurchase(deleteId);
            setDeleteDialogOpen(false);
            setDeleteId(null);
            showToast('Purchase order deleted', 'info');
        }
    };

    const openDeleteDialog = (id) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleReceiveStock = (po) => {
        showConfirm({
            title: 'Receive Purchase Order Stock',
            message: `Mark PO #${po.id.slice(-6)} as Received? This will update warehouse inventory stock counts and set fulfillment status to Received.`,
            confirmText: 'Mark Received',
            isDanger: false,
            onConfirm: async () => {
                await updatePurchase(po.id, {
                    status: 'Received',
                    paymentStatus: 'Paid',
                    amountPaid: po.total
                }, po);
                showToast(`PO #${po.id.slice(-6)} received and inventory stock updated`, 'success');
            }
        });
    };

    // Official Branded PO PDF Generator
    const generatePurchaseOrderPDF = (po) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [15, 118, 110]; // Atelier Emerald #0F766E
            const darkText = [30, 41, 59];
            const mutedText = [100, 116, 139];

            const businessName = profile?.businessName || 'ALEEN CLOTHING';
            const address = profile?.address || 'Baba Jaan Chawk, Pune, Maharashtra 411001';
            const phone = profile?.phone || '+91 98765 43210';
            const gstin = profile?.gstin || '27XXXXX1234X1ZX';
            const poNumber = `PO-${po.id.length > 8 ? po.id.slice(-6).toUpperCase() : po.id.toUpperCase()}`;
            const orderDateStr = new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const deliveryDateStr = po.expectedDeliveryDate 
                ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'As Agreed';

            // Luxury Header Top Banner
            doc.setFillColor(15, 118, 110);
            doc.rect(0, 0, 210, 32, 'F');

            // Brand Title & Subtitle
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(255, 255, 255);
            doc.text(businessName.toUpperCase(), 14, 18);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(204, 251, 241); // mint
            doc.text('HAUTE COUTURE & READY-TO-WEAR • TEXTILE PROCUREMENT DIVISION', 14, 25);

            // Document Title on Right
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.text('PURCHASE ORDER', 196, 18, { align: 'right' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(253, 230, 138); // warm gold
            doc.text(poNumber, 196, 25, { align: 'right' });

            // Company & Vendor Info Columns
            let yPos = 42;

            // Buyer (Aleen)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...primaryColor);
            doc.text('ISSUED BY (BUYER):', 14, yPos);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...darkText);
            doc.text(businessName, 14, yPos + 6);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...mutedText);
            doc.text(address, 14, yPos + 11, { maxWidth: 85 });
            doc.text(`Phone: ${phone}`, 14, yPos + 20);
            doc.text(`GSTIN: ${gstin}`, 14, yPos + 25);

            // Supplier / Mill
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...primaryColor);
            doc.text('SUPPLIER / VENDOR (MILL):', 110, yPos);

            const vendorObj = vendors.find(v => v.id === po.vendorId);
            const vendorName = po.vendorName || vendorObj?.name || 'Textile Supplier';
            const vendorContact = vendorObj?.contactPerson || 'Sales Department';
            const vendorPhone = po.vendorPhone || vendorObj?.phone || 'N/A';
            const vendorCategory = vendorObj?.category || 'Fabrics & Textiles';

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...darkText);
            doc.text(vendorName, 110, yPos + 6);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...mutedText);
            doc.text(`Category / Type: ${vendorCategory}`, 110, yPos + 11);
            doc.text(`Contact: ${vendorContact} • Phone: ${vendorPhone}`, 110, yPos + 16);
            if (vendorObj?.email) doc.text(`Email: ${vendorObj.email}`, 110, yPos + 21);
            if (vendorObj?.address) doc.text(`Address: ${vendorObj.address}`, 110, yPos + 26, { maxWidth: 85 });

            // Order Metadata Summary Strip
            yPos = 76;
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(14, yPos, 182, 16, 2, 2, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...mutedText);
            doc.text('PO DATE', 20, yPos + 6);
            doc.text('EXPECTED DELIVERY', 65, yPos + 6);
            doc.text('FULFILLMENT STATUS', 118, yPos + 6);
            doc.text('SETTLEMENT STATUS', 160, yPos + 6);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...darkText);
            doc.text(orderDateStr, 20, yPos + 11);
            doc.text(deliveryDateStr, 65, yPos + 11);
            doc.text((po.status || 'Ordered').toUpperCase(), 118, yPos + 11);
            doc.text((po.paymentStatus || 'Unpaid').toUpperCase(), 160, yPos + 11);

            // Itemized autoTable
            const tableBody = (po.items || []).map((item, idx) => {
                const qty = Number(item.quantity) || 1;
                const cost = Number(item.cost) || 0;
                const sub = qty * cost;
                const prod = inventory.find(inv => inv.id === item.productId);
                const name = item.productName || prod?.name || 'Textile Item';
                const sku = item.variantSku || item.productId || '-';
                return [
                    idx + 1,
                    name,
                    sku,
                    qty.toString(),
                    `Rs. ${cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    `Rs. ${sub.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                ];
            });

            autoTable(doc, {
                startY: yPos + 22,
                head: [['#', 'Item / Fabric Description', 'SKU / Variant', 'Qty', 'Unit Cost', 'Subtotal']],
                body: tableBody,
                headStyles: {
                    fillColor: [15, 118, 110],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8.5
                },
                bodyStyles: {
                    fontSize: 8.5,
                    textColor: [30, 41, 59]
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 72 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 18, halign: 'center' },
                    4: { cellWidth: 23, halign: 'right' },
                    5: { cellWidth: 24, halign: 'right' }
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { left: 14, right: 14 }
            });

            const finalY = doc.lastAutoTable.finalY + 8;
            const total = po.total || 0;
            const paid = po.amountPaid || 0;
            const balance = Math.max(0, total - paid);

            // Totals Box on Right
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(120, finalY, 76, 29, 2, 2, 'FD');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...darkText);
            doc.text('Total PO Value:', 125, finalY + 7);
            doc.setFont('helvetica', 'bold');
            doc.text(`Rs. ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 7, { align: 'right' });

            doc.setFont('helvetica', 'normal');
            doc.text('Advance / Amount Paid:', 125, finalY + 14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(5, 150, 105);
            doc.text(`Rs. ${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 14, { align: 'right' });

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...(balance > 0 ? [220, 38, 38] : [5, 150, 105]));
            doc.text('Balance Outstanding:', 125, finalY + 22);
            doc.text(`Rs. ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 22, { align: 'right' });

            // Terms on Left
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...primaryColor);
            doc.text('TERMS & PROCUREMENT CONDITIONS:', 14, finalY + 6);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...mutedText);
            doc.text('1. Goods subject to count and quality inspection upon receipt.', 14, finalY + 12);
            doc.text('2. Please reference this PO number on all shipping challans.', 14, finalY + 17);
            doc.text('3. Any defective lots will be held for debit note adjustment.', 14, finalY + 22);
            if (po.notes) {
                doc.text(`Special Notes: ${po.notes}`, 14, finalY + 27, { maxWidth: 95 });
            }

            // Signatures
            const sigY = finalY + 44;
            doc.setDrawColor(203, 213, 225);
            doc.line(14, sigY, 74, sigY);
            doc.line(136, sigY, 196, sigY);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...mutedText);
            doc.text('Authorized Signatory (Aleen)', 14, sigY + 5);
            doc.text('Vendor Acceptance & Stamp', 136, sigY + 5);

            // Footer
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text('This is a formal electronic Purchase Order issued by Aleen Clothing.', 105, 287, { align: 'center' });

            doc.save(`${poNumber}.pdf`);
            showToast(`Downloaded official PDF: ${poNumber}.pdf`, 'success');
        } catch (err) {
            console.error('PO PDF Error:', err);
            showToast('Error generating PO PDF', 'error');
        }
    };

    // WhatsApp Dispatch Implementation
    const executeSendWhatsApp = (po, rawPhone) => {
        const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '');
        const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const poNumber = po.id.length > 8 ? po.id.slice(-6).toUpperCase() : po.id.toUpperCase();
        const orderDateStr = new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const deliveryDateStr = po.expectedDeliveryDate 
            ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'As earliest scheduled';

        const itemsSummary = (po.items || []).map((item, idx) => {
            const prod = inventory.find(inv => inv.id === item.productId);
            const name = item.productName || prod?.name || 'Fabric Lot';
            const qty = item.quantity || 1;
            const cost = item.cost || 0;
            return `  • *${name}* - ${qty} units @ ₹${cost.toLocaleString('en-IN')} = ₹${(qty * cost).toLocaleString('en-IN')}`;
        }).join('\n');

        const total = po.total || 0;
        const paid = po.amountPaid || 0;
        const balance = Math.max(0, total - paid);

        const message = 
`*PURCHASE ORDER: PO-#${poNumber}*
🏛️ *${profile?.businessName || 'Aleen Clothing'} - Textile Procurement*
━━━━━━━━━━━━━━━━━━━━━━
*Supplier:* ${po.vendorName || 'Valued Supplier'}
*Order Date:* ${orderDateStr}
*Expected Delivery:* ${deliveryDateStr}

*ORDERED ITEMS:*
${itemsSummary}

━━━━━━━━━━━━━━━━━━━━━━
*Total PO Value:* ₹${total.toLocaleString('en-IN')}
*Advance / Paid:* ₹${paid.toLocaleString('en-IN')}
*Balance Payable:* ₹${balance.toLocaleString('en-IN')}
*Order Status:* ${po.status === 'Received' ? 'Received in Warehouse' : 'Pending Mill Dispatch'}

📍 *Delivery Location:* ${profile?.address || 'Baba Jaan Chawk, Pune, Maharashtra 411001'}
📞 *Procurement Desk:* ${profile?.phone || '+91 98765 43210'}

_Please acknowledge this Purchase Order and confirm dispatch tracking number. Thank you!_`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
        showToast(`WhatsApp PO opened for ${po.vendorName || 'Vendor'}`, 'success');
    };

    const handleSendWhatsAppPO = (po) => {
        const vendorObj = vendors.find(v => v.id === po.vendorId);
        const phone = po.vendorPhone || vendorObj?.phone;

        if (!phone) {
            setWhatsAppTargetPo(po);
            setCustomWhatsAppPhone('');
            setWhatsAppPromptOpen(true);
            return;
        }

        executeSendWhatsApp(po, phone);
    };

    // Record Vendor Payment Logic
    const handleOpenPaymentModal = (po) => {
        setPayingPo(po);
        const balance = Math.max(0, (po.total || 0) - (po.amountPaid || 0));
        setPaymentForm({
            amount: balance > 0 ? balance : '',
            method: 'Bank Transfer (NEFT/RTGS)',
            transactionRef: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setPaymentModalOpen(true);
    };

    const handleRecordPaymentSubmit = async () => {
        if (!payingPo) return;
        const paymentAmount = parseFloat(paymentForm.amount);
        if (!paymentAmount || paymentAmount <= 0) {
            showToast('Please enter a valid payment amount', 'error');
            return;
        }

        const currentPaid = Number(payingPo.amountPaid) || 0;
        const newAmountPaid = currentPaid + paymentAmount;
        const newPaymentStatus = newAmountPaid >= payingPo.total ? 'Paid' : 'Partial';

        const newPaymentEntry = {
            id: `PAY-${Date.now()}`,
            amount: paymentAmount,
            method: paymentForm.method,
            transactionRef: paymentForm.transactionRef || '',
            date: paymentForm.date,
            notes: paymentForm.notes || '',
            recordedAt: new Date().toISOString()
        };

        const existingPayments = payingPo.payments || [];
        const updatedPayments = [...existingPayments, newPaymentEntry];

        const updates = {
            amountPaid: newAmountPaid,
            paymentStatus: newPaymentStatus,
            payments: updatedPayments
        };

        await updatePurchase(payingPo.id, updates, payingPo);
        showToast(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully!`, 'success');
        setPaymentModalOpen(false);
        setPayingPo(null);
        if (selectedPoForView && selectedPoForView.id === payingPo.id) {
            setSelectedPoForView({ ...selectedPoForView, ...updates });
        }
    };

    // Open Quick-View
    const handleOpenViewModal = (po) => {
        setSelectedPoForView(po);
        setViewPoModalOpen(true);
    };

    const downloadPurchases = () => {
        const csvData = purchases.map(po => ({
            'PO ID': po.id,
            'Date': new Date(po.date).toLocaleDateString(),
            'Expected Delivery': po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A',
            'Vendor': po.vendorName,
            'Vendor Phone': po.vendorPhone || '',
            'Items Count': po.items.length,
            'Items Detail': po.items.map(i => `${i.productName || 'Item'} (x${i.quantity})`).join('; '),
            'Total Cost': po.total,
            'Paid Amount': po.amountPaid || 0,
            'Balance Due': Math.max(0, (po.total || 0) - (po.amountPaid || 0)),
            'Payment Status': po.paymentStatus,
            'Order Status': po.status,
            'Notes': po.notes || ''
        }));

        if (csvData.length === 0) {
            showToast('No purchase orders to export', 'info');
            return;
        }

        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(h => `"${(row[h] !== undefined && row[h] !== null ? row[h] : '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aleen_purchases_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast('Exported purchase orders CSV', 'success');
    };

    // Summary KPI values
    const totalOrders = purchases.length;
    const pendingCount = purchases.filter(p => p.status === 'Ordered').length;
    const totalSpent = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalPayable = purchases.reduce((sum, p) => sum + Math.max(0, (p.total || 0) - (p.amountPaid || 0)), 0);

    const overdueCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return purchases.filter(p => {
            if (p.status !== 'Ordered' || !p.expectedDeliveryDate) return false;
            const exp = new Date(p.expectedDeliveryDate);
            exp.setHours(0, 0, 0, 0);
            return exp < today;
        }).length;
    }, [purchases]);

    return (
        <Box>
            {/* Atelier Luxury Header with Breadcrumbs & Action */}
            <PageHeader
                title="Purchase Orders & Procurement"
                subtitle="Track textile procurement orders, mill deliveries, stock receipt & supplier payments"
                breadcrumbs={[
                    { label: 'Aleen Clothing', path: '/' },
                    { label: 'Inventory & Stock', path: '/inventory' },
                    { label: 'Purchase Orders' }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Download sx={{ fontSize: 19, color: '#0F766E' }} />}
                            onClick={downloadPurchases}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.75,
                                borderRadius: '24px',
                                border: '1.5px solid #0F766E',
                                color: '#0F766E',
                                bgcolor: 'background.paper',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                textTransform: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    border: '1.5px solid #042F2E',
                                    bgcolor: 'rgba(15, 118, 110, 0.05)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Export CSV
                        </Button>
                        <Button 
                            variant="contained" 
                            startIcon={<Add sx={{ fontSize: 19, color: '#FFFFFF !important' }} />} 
                            onClick={() => handleOpen()} 
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 3,
                                borderRadius: '24px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%) !important',
                                color: '#FFFFFF !important',
                                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                '& .MuiSvgIcon-root': {
                                    color: '#FFFFFF !important'
                                },
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #115E59 0%, #021C1B 100%) !important',
                                    boxShadow: '0 6px 18px rgba(15, 118, 110, 0.45)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Create Purchase Order
                        </Button>
                    </Box>
                }
            />

            {/* View Switching Tabs */}
            <Tabs 
                value={tabValue} 
                onChange={(e, v) => setTabValue(v)} 
                sx={{ 
                    mb: 3, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        minHeight: 48,
                        mr: 2
                    },
                    '& .Mui-selected': {
                        color: '#0F766E !important'
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#0F766E',
                        height: 3,
                        borderRadius: '3px 3px 0 0'
                    }
                }}
            >
                <Tab label="Purchase Orders" icon={<ReceiptLong sx={{ fontSize: '1.2rem' }} />} iconPosition="start" />
                <Tab label="Smart Restock Assistant" icon={<AutoAwesome sx={{ fontSize: '1.2rem', color: '#D97706' }} />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
                <>
                    {/* Atelier KPI Summary Cards (4-Card Procurement Suite) */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }} alignItems="stretch">
                        <Grid item xs={12} sm={6} md={3}>
                            <AtelierKpiCard
                                title="Total Procurement Orders"
                                value={totalOrders}
                                icon={<ReceiptLong fontSize="small" />}
                                subtitle="Lifetime mill orders placed"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <AtelierKpiCard
                                title="Pending Mill Deliveries"
                                value={pendingCount}
                                icon={<LocalShipping fontSize="small" />}
                                goldAccent={true}
                                subtitle="Awaiting receipt into inventory"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <AtelierKpiCard
                                title="Overdue Deliveries"
                                value={overdueCount}
                                icon={<Warning fontSize="small" />}
                                redAccent={overdueCount > 0}
                                subtitle={overdueCount > 0 ? 'Mill shipments past scheduled delivery' : 'All pending orders on schedule'}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <AtelierKpiCard
                                title="Total Procurement Spend"
                                value={`₹${totalSpent.toLocaleString('en-IN')}`}
                                icon={<AttachMoney fontSize="small" />}
                                subtitle={`₹${totalPayable.toLocaleString('en-IN')} pending supplier payment`}
                            />
                        </Grid>
                    </Grid>

                    {/* Pipeline Quick Filter Chips */}
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mr: 0.5 }}>
                            Pipeline Quick Filter:
                        </Typography>
                        <Chip
                            label={`All Orders (${purchases.length})`}
                            onClick={() => { setPipelineFilter('All'); setPage(0); }}
                            variant={pipelineFilter === 'All' ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                bgcolor: pipelineFilter === 'All' ? '#0F766E' : 'transparent',
                                color: pipelineFilter === 'All' ? '#ffffff' : 'text.primary',
                                borderColor: pipelineFilter === 'All' ? '#0F766E' : 'divider',
                                '&:hover': { bgcolor: pipelineFilter === 'All' ? '#0b5650' : 'rgba(15, 118, 110, 0.08)' }
                            }}
                        />
                        <Chip
                            icon={<HourglassEmpty sx={{ fontSize: '0.9rem !important', color: pipelineFilter === 'Pending' ? '#ffffff !important' : '#D97706 !important' }} />}
                            label={`Pending Delivery (${pendingCount})`}
                            onClick={() => { setPipelineFilter('Pending'); setPage(0); }}
                            variant={pipelineFilter === 'Pending' ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                bgcolor: pipelineFilter === 'Pending' ? '#D97706' : 'transparent',
                                color: pipelineFilter === 'Pending' ? '#ffffff' : 'text.primary',
                                borderColor: pipelineFilter === 'Pending' ? '#D97706' : 'divider',
                                '&:hover': { bgcolor: pipelineFilter === 'Pending' ? '#b45309' : 'rgba(217, 119, 6, 0.08)' }
                            }}
                        />
                        <Chip
                            icon={<Warning sx={{ fontSize: '0.9rem !important', color: pipelineFilter === 'Overdue' ? '#ffffff !important' : '#DC2626 !important' }} />}
                            label={`Overdue Deliveries (${overdueCount})`}
                            onClick={() => { setPipelineFilter('Overdue'); setPage(0); }}
                            variant={pipelineFilter === 'Overdue' ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                bgcolor: pipelineFilter === 'Overdue' ? '#DC2626' : (overdueCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'transparent'),
                                color: pipelineFilter === 'Overdue' ? '#ffffff' : (overdueCount > 0 ? '#DC2626' : 'text.primary'),
                                borderColor: pipelineFilter === 'Overdue' ? '#DC2626' : (overdueCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'divider'),
                                '&:hover': { bgcolor: pipelineFilter === 'Overdue' ? '#b91c1c' : 'rgba(239, 68, 68, 0.15)' }
                            }}
                        />
                        <Chip
                            icon={<CheckCircle sx={{ fontSize: '0.9rem !important', color: pipelineFilter === 'Received' ? '#ffffff !important' : '#059669 !important' }} />}
                            label={`Received in Stock (${purchases.filter(p => p.status === 'Received').length})`}
                            onClick={() => { setPipelineFilter('Received'); setPage(0); }}
                            variant={pipelineFilter === 'Received' ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                bgcolor: pipelineFilter === 'Received' ? '#059669' : 'transparent',
                                color: pipelineFilter === 'Received' ? '#ffffff' : 'text.primary',
                                borderColor: pipelineFilter === 'Received' ? '#059669' : 'divider',
                                '&:hover': { bgcolor: pipelineFilter === 'Received' ? '#047857' : 'rgba(5, 150, 105, 0.08)' }
                            }}
                        />
                        <Chip
                            icon={<Payment sx={{ fontSize: '0.9rem !important', color: pipelineFilter === 'Unpaid' ? '#ffffff !important' : '#D97706 !important' }} />}
                            label={`Unpaid / Partial (${purchases.filter(p => p.paymentStatus !== 'Paid').length})`}
                            onClick={() => { setPipelineFilter('Unpaid'); setPage(0); }}
                            variant={pipelineFilter === 'Unpaid' ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                bgcolor: pipelineFilter === 'Unpaid' ? '#4F46E5' : 'transparent',
                                color: pipelineFilter === 'Unpaid' ? '#ffffff' : 'text.primary',
                                borderColor: pipelineFilter === 'Unpaid' ? '#4F46E5' : 'divider',
                                '&:hover': { bgcolor: pipelineFilter === 'Unpaid' ? '#4338CA' : 'rgba(79, 70, 229, 0.08)' }
                            }}
                        />
                    </Box>

                    {/* Filter and Search Bar */}
                    <GlassCard sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4.5}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search by PO number, vendor name, fabric product..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(0);
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchQuery && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                    <Close fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2.5}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Order Status"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(0);
                                    }}
                                >
                                    <MenuItem value="All">All Statuses</MenuItem>
                                    <MenuItem value="Ordered">Ordered (Pending)</MenuItem>
                                    <MenuItem value="Received">Received (In Stock)</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={6} sm={4} md={2.5}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Payment Status"
                                    value={paymentFilter}
                                    onChange={(e) => {
                                        setPaymentFilter(e.target.value);
                                        setPage(0);
                                    }}
                                >
                                    <MenuItem value="All">All Payments</MenuItem>
                                    <MenuItem value="Unpaid">Unpaid</MenuItem>
                                    <MenuItem value="Partial">Partial</MenuItem>
                                    <MenuItem value="Paid">Paid</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4} md={2.5} sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                <TextField
                                    select
                                    size="small"
                                    label="Sort By"
                                    value={orderBy}
                                    onChange={(e) => setOrderBy(e.target.value)}
                                    sx={{ minWidth: 130 }}
                                >
                                    <MenuItem value="date">Date Placed</MenuItem>
                                    <MenuItem value="expectedDeliveryDate">Delivery Date</MenuItem>
                                    <MenuItem value="vendorName">Vendor</MenuItem>
                                    <MenuItem value="total">Total Cost</MenuItem>
                                    <MenuItem value="status">Status</MenuItem>
                                </TextField>
                                <Tooltip title={order === 'asc' ? 'Ascending Order' : 'Descending Order'}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 0.8 }}
                                    >
                                        {order === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                                {(searchQuery || statusFilter !== 'All' || paymentFilter !== 'All' || pipelineFilter !== 'All') && (
                                    <Button 
                                        size="small" 
                                        color="inherit" 
                                        onClick={() => {
                                            setSearchQuery('');
                                            setStatusFilter('All');
                                            setPaymentFilter('All');
                                            setPipelineFilter('All');
                                            setPage(0);
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, minWidth: 'auto', px: 1 }}
                                    >
                                        Reset
                                    </Button>
                                )}
                            </Grid>
                        </Grid>
                    </GlassCard>

                    {/* Aligned Purchase Orders Table */}
                    <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 118, 110, 0.04)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            <TableSortLabel 
                                                active={orderBy === 'date'} 
                                                direction={orderBy === 'date' ? order : 'asc'} 
                                                onClick={() => handleRequestSort('date')}
                                            >
                                                PO Ref & Date
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            <TableSortLabel 
                                                active={orderBy === 'vendorName'} 
                                                direction={orderBy === 'vendorName' ? order : 'asc'} 
                                                onClick={() => handleRequestSort('vendorName')}
                                            >
                                                Vendor / Supplier
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            Items & Quantity
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            <TableSortLabel 
                                                active={orderBy === 'expectedDeliveryDate'} 
                                                direction={orderBy === 'expectedDeliveryDate' ? order : 'asc'} 
                                                onClick={() => handleRequestSort('expectedDeliveryDate')}
                                            >
                                                Expected Delivery
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            <TableSortLabel 
                                                active={orderBy === 'total'} 
                                                direction={orderBy === 'total' ? order : 'asc'} 
                                                onClick={() => handleRequestSort('total')}
                                            >
                                                Total Cost & Paid
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            Order Status
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            Payment Status
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedPurchases.length > 0 ? (
                                        (rowsPerPage > 0
                                            ? sortedPurchases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            : sortedPurchases
                                        ).map((po) => {
                                            const totalUnits = po.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                                            const isReceived = po.status === 'Received';
                                            const isPaid = po.paymentStatus === 'Paid';
                                            const deliveryStatus = getDeliveryStatus(po);
                                            const balanceDue = Math.max(0, (po.total || 0) - (po.amountPaid || 0));

                                            return (
                                                <TableRow 
                                                    key={po.id} 
                                                    hover
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 118, 110, 0.02)' } 
                                                    }}
                                                >
                                                    {/* PO Ref & Date */}
                                                    <TableCell sx={{ py: 2 }} onClick={() => handleOpenViewModal(po)}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ bgcolor: isReceived ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)', color: isReceived ? '#059669' : '#D97706', width: 36, height: 36 }}>
                                                                <ReceiptLong sx={{ fontSize: '1.1rem' }} />
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                                    #{po.id.length > 8 ? po.id.slice(-6).toUpperCase() : po.id.toUpperCase()}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                                                                    <CalendarToday sx={{ fontSize: '0.75rem' }} />
                                                                    {new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Vendor */}
                                                    <TableCell sx={{ py: 2 }} onClick={() => handleOpenViewModal(po)}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                            {po.vendorName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {po.vendorPhone ? `📞 ${po.vendorPhone}` : (po.vendorId ? `ID: #${po.vendorId.slice(-4)}` : 'Direct')}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Items & Quantity */}
                                                    <TableCell sx={{ py: 2 }} onClick={() => handleOpenViewModal(po)}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip 
                                                                label={`${po.items.length} ${po.items.length === 1 ? 'Item' : 'Items'}`} 
                                                                size="small" 
                                                                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                                            />
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                ({totalUnits} units)
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Expected Delivery & Overdue Tracker */}
                                                    <TableCell sx={{ py: 2 }} onClick={() => handleOpenViewModal(po)}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            <Tooltip title={deliveryStatus.text}>
                                                                <Chip
                                                                    icon={deliveryStatus.icon}
                                                                    label={deliveryStatus.label}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: deliveryStatus.bgcolor,
                                                                        color: deliveryStatus.color,
                                                                        border: '1px solid',
                                                                        borderColor: deliveryStatus.borderColor,
                                                                        fontWeight: 800,
                                                                        fontSize: '0.72rem',
                                                                        maxWidth: 140,
                                                                        justifyContent: 'flex-start'
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                            {po.expectedDeliveryDate && po.status !== 'Received' && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                                    {new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>

                                                    {/* Total Cost & Paid (Right-aligned) */}
                                                    <TableCell align="right" sx={{ py: 2 }} onClick={() => handleOpenViewModal(po)}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F766E', fontSize: '0.95rem' }}>
                                                            ₹{(po.total || 0).toLocaleString('en-IN')}
                                                        </Typography>
                                                        {balanceDue > 0 ? (
                                                            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, display: 'block' }}>
                                                                Due: ₹{balanceDue.toLocaleString('en-IN')}
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'block' }}>
                                                                Fully Settled
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Order Status (Center-aligned) */}
                                                    <TableCell align="center" sx={{ py: 2 }} onClick={() => handleOpenViewModal(po)}>
                                                        <Chip
                                                            icon={isReceived ? <CheckCircle sx={{ fontSize: '0.85rem !important' }} /> : <HourglassEmpty sx={{ fontSize: '0.85rem !important' }} />}
                                                            label={isReceived ? 'Received' : 'Ordered'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isReceived ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                                                                color: isReceived ? '#059669' : '#D97706',
                                                                border: isReceived ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                                                                fontWeight: 800,
                                                                fontSize: '0.75rem',
                                                                px: 0.5
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Payment Status (Center-aligned) */}
                                                    <TableCell align="center" sx={{ py: 2 }} onClick={() => handleOpenViewModal(po)}>
                                                        <Chip
                                                            label={po.paymentStatus || 'Unpaid'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isPaid 
                                                                    ? 'rgba(16, 185, 129, 0.12)' 
                                                                    : (po.paymentStatus === 'Partial' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.1)'),
                                                                color: isPaid 
                                                                    ? '#059669' 
                                                                    : (po.paymentStatus === 'Partial' ? '#D97706' : '#DC2626'),
                                                                border: '1px solid',
                                                                borderColor: isPaid 
                                                                    ? 'rgba(16, 185, 129, 0.25)' 
                                                                    : (po.paymentStatus === 'Partial' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'),
                                                                fontWeight: 800,
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Actions (Procurement Action Bar) */}
                                                    <TableCell align="right" sx={{ py: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.6 }}>
                                                            {/* Quick View Button */}
                                                            <Tooltip title="View PO Details">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenViewModal(po); }}
                                                                    sx={{ 
                                                                        color: '#0F766E',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 118, 110, 0.12)' : 'rgba(15, 118, 110, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.2)' }
                                                                    }}
                                                                >
                                                                    <Visibility fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* WhatsApp PO to Vendor */}
                                                            <Tooltip title="Send PO to Vendor via WhatsApp">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => { e.stopPropagation(); handleSendWhatsAppPO(po); }}
                                                                    sx={{ 
                                                                        color: '#25D366',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 211, 102, 0.12)' : 'rgba(37, 211, 102, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.2)' }
                                                                    }}
                                                                >
                                                                    <WhatsApp fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* Download Official Branded PO PDF */}
                                                            <Tooltip title="Download Official PO PDF">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => { e.stopPropagation(); generatePurchaseOrderPDF(po); }}
                                                                    sx={{ 
                                                                        color: '#D97706',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(217, 119, 6, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.2)' }
                                                                    }}
                                                                >
                                                                    <PictureAsPdf fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* Record Vendor Payment */}
                                                            {po.paymentStatus !== 'Paid' && (
                                                                <Tooltip title="Record Vendor Payment">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(po); }}
                                                                        sx={{ 
                                                                            color: '#4F46E5',
                                                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(79, 70, 229, 0.12)' : 'rgba(79, 70, 229, 0.08)',
                                                                            '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.2)' }
                                                                        }}
                                                                    >
                                                                        <Payment fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}

                                                            {/* Receive stock quick action */}
                                                            {po.status === 'Ordered' && (
                                                                <Tooltip title="Receive Stock into Inventory">
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        onClick={(e) => { e.stopPropagation(); handleReceiveStock(po); }}
                                                                        sx={{
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: 800,
                                                                            py: 0.35,
                                                                            px: 1.1,
                                                                            borderRadius: 1.5,
                                                                            textTransform: 'none',
                                                                            bgcolor: '#059669',
                                                                            color: '#ffffff',
                                                                            '&:hover': { bgcolor: '#047857' }
                                                                        }}
                                                                    >
                                                                        Receive
                                                                    </Button>
                                                                </Tooltip>
                                                            )}

                                                            {/* Print Barcode Labels */}
                                                            <Tooltip title="Print Product Barcodes">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => { e.stopPropagation(); navigate('/barcodes', { state: { purchaseOrder: po } }); }}
                                                                    sx={{ 
                                                                        color: '#64748B',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(100, 116, 139, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.2)' }
                                                                    }}
                                                                >
                                                                    <Print fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* Edit PO */}
                                                            <Tooltip title="Edit Purchase Order">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={(e) => { e.stopPropagation(); handleOpen(po); }} 
                                                                    sx={{ 
                                                                        color: '#0F766E',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 118, 110, 0.1)' : 'rgba(15, 118, 110, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.2)' }
                                                                    }}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* Delete PO */}
                                                            <Tooltip title="Delete Purchase Order">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={(e) => { e.stopPropagation(); openDeleteDialog(po.id); }} 
                                                                    sx={{ 
                                                                        color: 'error.main',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                                                                    }}
                                                                >
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                <ReceiptLong sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                                    No purchase orders match your criteria.
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Click "Create Purchase Order" to place a new fabric procurement order.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredPurchases.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                        />
                    </GlassCard>
                </>
            )}

            {tabValue === 1 && (
                <SmartRestockView 
                    getLowStockItems={getLowStockItems} 
                    vendors={vendors} 
                    handleOpen={handleOpen} 
                    setVendorId={setVendorId} 
                    setPoItems={setPoItems} 
                />
            )}

            {/* Create/Edit PO Luxury Dialog */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ 
                    sx: { 
                        borderRadius: isMobile ? 0 : 3.5,
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
                    } 
                }}
            >
                <DialogTitle 
                    sx={{
                        background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                        color: '#ffffff',
                        px: 3,
                        py: 2.25,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                            <ReceiptLong />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.02em' }}>
                                {editMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
                                Procurement & Supplier Stock Inward Management
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: isMobile ? 2 : 3, mt: 1 }}>
                    {/* Step 1: Vendor & Order Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
                            1. Supplier & Order Schedule
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={7}>
                                <Autocomplete
                                    options={vendors}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={vendors.find(v => v.id === vendorId) || null}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(event, newValue) => {
                                        setVendorId(newValue ? newValue.id : '');
                                        if (newValue && newValue.phone && !vendorPhoneInput) {
                                            setVendorPhoneInput(newValue.phone);
                                        }
                                    }}
                                    disablePortal
                                    autoHighlight
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props} key={option.id}>
                                            <Box sx={{ py: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.category || 'Vendor'} • {option.phone || 'No Contact'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select Fabric Vendor / Mill *"
                                            fullWidth
                                            placeholder="Search by vendor name..."
                                            helperText="Select the textile supplier for this order"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                                <TextField
                                    fullWidth
                                    label="Supplier Contact / WhatsApp Phone"
                                    placeholder="e.g. +91 9876543210"
                                    value={vendorPhoneInput}
                                    onChange={(e) => setVendorPhoneInput(e.target.value)}
                                    helperText="Used for 1-click WhatsApp dispatch"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Phone fontSize="small" sx={{ color: '#25D366' }} />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Order Status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <MenuItem value="Ordered">Ordered (Pending)</MenuItem>
                                    <MenuItem value="Received">Received (Stock In)</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Order Date"
                                    type="date"
                                    fullWidth
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Expected Delivery Date"
                                    type="date"
                                    fullWidth
                                    value={expectedDeliveryDate}
                                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Overdue tracking date"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Order Notes & Mill Instructions"
                                    placeholder="e.g. Include color fastness test certificates, pack in waterproof polythene roll..."
                                    value={poNotes}
                                    onChange={(e) => setPoNotes(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Step 2: Line Items */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em' }}>
                                2. Line Items ({poItems.length})
                            </Typography>
                            <Button
                                startIcon={<Add />}
                                onClick={handleAddItem}
                                size="small"
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 700, 
                                    color: '#0F766E',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Add Another Line
                            </Button>
                        </Box>

                        {poItems.map((item, index) => {
                            const selectedProduct = inventory.find(i => i.id === item.productId);
                            const lineTotal = (Number(item.quantity) || 0) * (Number(item.cost) || 0);

                            return (
                                <Paper
                                    key={index}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2.5,
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Grid container spacing={1.5} alignItems="center">
                                        <Grid item xs={12} sm={5}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Autocomplete
                                                    fullWidth
                                                    size="small"
                                                    options={inventory}
                                                    getOptionLabel={(option) => `${option.name} (SKU: ${option.productId || option.id.slice(-4)})`}
                                                    value={selectedProduct || null}
                                                    isOptionEqualToValue={(option, value) => option.id === (typeof value === 'string' ? value : value?.id)}
                                                    onChange={(e, newVal) => handleItemChange(index, 'productId', newVal?.id)}
                                                    renderInput={(params) => <TextField {...params} label="Select Inventory Item *" placeholder="Choose product..." />}
                                                />
                                                <Tooltip title="Quick create new product if not in catalog">
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => handleQuickAddOpen(index)}
                                                        size="small"
                                                        sx={{ 
                                                            minWidth: 40, 
                                                            px: 1,
                                                            borderColor: '#0F766E',
                                                            color: '#0F766E'
                                                        }}
                                                    >
                                                        <Add fontSize="small" />
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={4} sm={2}>
                                            <TextField
                                                fullWidth
                                                label="Quantity"
                                                type="number"
                                                size="small"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                inputProps={{ min: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={4} sm={2.5}>
                                            <TextField
                                                fullWidth
                                                label="Buy / Unit Cost"
                                                type="number"
                                                size="small"
                                                value={item.cost}
                                                onChange={(e) => handleItemChange(index, 'cost', parseFloat(e.target.value) || 0)}
                                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                                inputProps={{ min: 0, step: 0.01 }}
                                            />
                                        </Grid>
                                        <Grid item xs={3} sm={2} sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Line Subtotal
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E' }}>
                                                ₹{lineTotal.toLocaleString('en-IN')}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1} sm={0.5} sx={{ textAlign: 'right' }}>
                                            <IconButton
                                                color="error"
                                                onClick={() => setPoItems(poItems.filter((_, i) => i !== index))}
                                                size="small"
                                                disabled={poItems.length === 1}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Grid>
                                    </Grid>

                                    {/* Variant selector if product has variants */}
                                    {selectedProduct && selectedProduct.hasVariants && selectedProduct.variants && (
                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label="Select Specific Variant (Receive stock into)"
                                                value={item.variantSku || ''}
                                                onChange={(e) => handleItemChange(index, 'variantSku', e.target.value)}
                                            >
                                                <MenuItem value="">General Product (No Variant Specified)</MenuItem>
                                                {selectedProduct.variants.map((v) => (
                                                    <MenuItem key={v.sku} value={v.sku}>
                                                        {v.size} / {v.color} (Current In-Store Stock: {v.quantity})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })}
                    </Box>

                    {/* Step 3: Payment & Financial Summary Card */}
                    <Box 
                        sx={{ 
                            p: 2.5, 
                            borderRadius: 3, 
                            background: theme.palette.mode === 'dark' 
                                ? 'linear-gradient(135deg, rgba(15, 118, 110, 0.2) 0%, rgba(4, 47, 46, 0.3) 100%)' 
                                : 'linear-gradient(135deg, rgba(15, 118, 110, 0.06) 0%, rgba(217, 119, 6, 0.06) 100%)',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(15, 118, 110, 0.15)'
                        }}
                    >
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
                            3. Payment Settlement & Terms
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Payment Status"
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                >
                                    <MenuItem value="Unpaid">Unpaid (Full Credit)</MenuItem>
                                    <MenuItem value="Partial">Partial Payment</MenuItem>
                                    <MenuItem value="Paid">Fully Paid</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Paid Amount"
                                    type="number"
                                    value={paymentStatus === 'Paid' ? calculateTotal() : amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    disabled={paymentStatus === 'Unpaid' || paymentStatus === 'Paid'}
                                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Total Order Value
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F766E' }}>
                                        ₹{calculateTotal().toLocaleString('en-IN')}
                                    </Typography>
                                    {paymentStatus === 'Partial' && (
                                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, display: 'block' }}>
                                            Balance Pending: ₹{(calculateTotal() - (parseFloat(amountPaid) || 0)).toLocaleString('en-IN')}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                        onClick={() => setOpen(false)}
                        sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!vendorId || poItems.length === 0 || !poItems.some(i => i.productId)}
                        sx={{
                            borderRadius: 2,
                            px: 3.5,
                            py: 1,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                            }
                        }}
                    >
                        {editMode ? 'Save PO Changes' : 'Confirm & Create Order'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Quick Add Product Dialog */}
            <Dialog 
                open={quickAddDialog} 
                onClose={() => setQuickAddDialog(false)} 
                maxWidth="sm" 
                fullWidth 
                PaperProps={{ sx: { borderRadius: 3.5, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)', color: 'white', px: 3, py: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Quick Add Product to Inventory</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>Adds product directly to boutique catalog</Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Product SKU / ID"
                                value={quickForm.productId}
                                onChange={(e) => setQuickForm({ ...quickForm, productId: e.target.value })}
                                placeholder="Auto-generated if empty"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Category"
                                value={quickForm.category}
                                onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value })}
                            >
                                {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                            </TextField>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="+ New category name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    fullWidth
                                />
                                <Button 
                                    onClick={handleAddCategory} 
                                    variant="outlined" 
                                    size="small"
                                    disabled={!newCategory.trim()}
                                    sx={{ minWidth: 60, textTransform: 'none' }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Product Name *"
                                value={quickForm.name}
                                onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                                placeholder="e.g. Zari Embroidered Organza Fabric"
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Cost Price (₹)"
                                type="number"
                                value={quickForm.cost}
                                onChange={(e) => setQuickForm({ ...quickForm, cost: e.target.value })}
                                placeholder="Procurement cost"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Selling Price / MRP (₹) *"
                                type="number"
                                value={quickForm.price}
                                onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })}
                                placeholder="Retail sales price"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setQuickAddDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button 
                        onClick={handleQuickSave} 
                        variant="contained" 
                        disabled={!quickForm.name || !quickForm.price}
                        sx={{ 
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Save & Select
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Purchase Order"
                content="Are you sure you want to delete this purchase order? This action cannot be undone."
            />

            {/* PO Quick-View Detail Modal */}
            <Dialog
                open={viewPoModalOpen}
                onClose={() => setViewPoModalOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3.5,
                        overflow: 'hidden',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.25)'
                    }
                }}
            >
                {selectedPoForView && (() => {
                    const po = selectedPoForView;
                    const deliveryStatus = getDeliveryStatus(po);
                    const isReceived = po.status === 'Received';
                    const isPaid = po.paymentStatus === 'Paid';
                    const total = po.total || 0;
                    const paid = po.amountPaid || 0;
                    const balance = Math.max(0, total - paid);
                    const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                    const vendorObj = vendors.find(v => v.id === po.vendorId);
                    const phoneToUse = po.vendorPhone || vendorObj?.phone;

                    return (
                        <>
                            <DialogTitle 
                                sx={{
                                    background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                                    color: '#ffffff',
                                    px: 3,
                                    py: 2.25,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                                        <ReceiptLong />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
                                            PO #{po.id.length > 8 ? po.id.slice(-6).toUpperCase() : po.id.toUpperCase()}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                            Placed on {new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                        label={isReceived ? 'Received in Warehouse' : 'Pending Delivery'}
                                        size="small"
                                        sx={{ 
                                            bgcolor: isReceived ? 'rgba(5, 150, 105, 0.25)' : 'rgba(217, 119, 6, 0.3)',
                                            color: '#ffffff',
                                            fontWeight: 800,
                                            border: '1px solid rgba(255,255,255,0.3)'
                                        }}
                                    />
                                    <IconButton onClick={() => setViewPoModalOpen(false)} sx={{ color: 'white' }}>
                                        <Close />
                                    </IconButton>
                                </Box>
                            </DialogTitle>

                            <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
                                {/* Fulfillment & Delivery Tracker Strip */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        mb: 3,
                                        borderRadius: 2.5,
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
                                        Fulfillment & Delivery Milestone
                                    </Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(5, 150, 105, 0.15)', color: '#059669' }}>
                                                    <CheckCircle sx={{ fontSize: '1rem' }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>1. PO Issued</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: deliveryStatus.bgcolor, color: deliveryStatus.color }}>
                                                    {deliveryStatus.icon}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>2. Delivery Status</Typography>
                                                    <Typography variant="caption" sx={{ color: deliveryStatus.color, fontWeight: 700 }}>
                                                        {deliveryStatus.label}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: isReceived ? 'rgba(5, 150, 105, 0.15)' : 'rgba(100, 116, 139, 0.1)', color: isReceived ? '#059669' : '#64748B' }}>
                                                    <CheckCircle sx={{ fontSize: '1rem' }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>3. Warehouse Stock</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {isReceived ? 'Inward Complete' : 'Awaiting Inspection'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                    {/* Vendor Card */}
                                    <Grid item xs={12} md={6}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2.5,
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                borderRadius: 2.5,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.08em' }}>
                                                    Mill / Supplier Profile
                                                </Typography>
                                                <Chip label={vendorObj?.category || 'Textile Mill'} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                                                {po.vendorName}
                                            </Typography>
                                            {vendorObj?.contactPerson && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                    Contact Person: <strong>{vendorObj.contactPerson}</strong>
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                                                <Phone sx={{ fontSize: '0.9rem', color: '#0F766E' }} />
                                                {phoneToUse || 'No phone registered'}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {phoneToUse && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<Call sx={{ fontSize: '0.9rem' }} />}
                                                        href={`tel:${phoneToUse}`}
                                                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: 2 }}
                                                    >
                                                        Call Supplier
                                                    </Button>
                                                )}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="success"
                                                    startIcon={<WhatsApp sx={{ fontSize: '0.9rem' }} />}
                                                    onClick={() => handleSendWhatsAppPO(po)}
                                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: 2 }}
                                                >
                                                    WhatsApp PO
                                                </Button>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Financial Settlement Card */}
                                    <Grid item xs={12} md={6}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2.5,
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                borderRadius: 2.5,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.08em' }}>
                                                    Financial Settlement
                                                </Typography>
                                                <Chip 
                                                    label={po.paymentStatus || 'Unpaid'} 
                                                    size="small" 
                                                    sx={{ 
                                                        fontWeight: 800, 
                                                        fontSize: '0.7rem',
                                                        bgcolor: isPaid ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                                                        color: isPaid ? '#059669' : '#D97706'
                                                    }} 
                                                />
                                            </Box>
                                            <Grid container spacing={1} sx={{ mb: 1.5 }}>
                                                <Grid item xs={4}>
                                                    <Typography variant="caption" color="text.secondary">Total Value</Typography>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F766E' }}>
                                                        ₹{total.toLocaleString('en-IN')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#059669' }}>
                                                        ₹{paid.toLocaleString('en-IN')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: balance > 0 ? '#DC2626' : '#059669' }}>
                                                        ₹{balance.toLocaleString('en-IN')}
                                                    </Typography>
                                                </Grid>
                                            </Grid>

                                            <Box sx={{ mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" color="text.secondary">Payment Settlement Progress</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E' }}>{percentPaid}%</Typography>
                                                </Box>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={percentPaid} 
                                                    sx={{ 
                                                        height: 7, 
                                                        borderRadius: 4, 
                                                        bgcolor: 'rgba(15, 118, 110, 0.1)',
                                                        '& .MuiLinearProgress-bar': {
                                                            background: 'linear-gradient(90deg, #0F766E 0%, #059669 100%)'
                                                        }
                                                    }} 
                                                />
                                            </Box>

                                            {balance > 0 && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<Payment />}
                                                    onClick={() => handleOpenPaymentModal(po)}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        borderRadius: 2,
                                                        background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                                                        color: '#ffffff'
                                                    }}
                                                >
                                                    Record Payment Installment
                                                </Button>
                                            )}
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* Line Items Table */}
                                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                                    Procurement Line Items ({po.items.length})
                                </Typography>
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 3 }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 118, 110, 0.04)' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>Fabric / Product</TableCell>
                                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>Variant / SKU</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>Quantity</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>Unit Cost</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>Subtotal</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {po.items.map((item, idx) => {
                                                const prod = inventory.find(i => i.id === item.productId);
                                                const lineTotal = (Number(item.quantity) || 1) * (Number(item.cost) || 0);
                                                return (
                                                    <TableRow key={idx} hover>
                                                        <TableCell sx={{ py: 1.25, fontWeight: 700 }}>{idx + 1}</TableCell>
                                                        <TableCell sx={{ py: 1.25 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                {item.productName || prod?.name || 'Custom Textile'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ py: 1.25 }}>
                                                            <Chip label={item.variantSku || item.productId || 'Standard'} size="small" sx={{ fontSize: '0.7rem' }} />
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ py: 1.25, fontWeight: 700 }}>
                                                            {item.quantity}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ py: 1.25 }}>
                                                            ₹{(Number(item.cost) || 0).toLocaleString('en-IN')}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ py: 1.25, fontWeight: 800, color: '#0F766E' }}>
                                                            ₹{lineTotal.toLocaleString('en-IN')}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Payment History Section */}
                                {po.payments && po.payments.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                                            Payment History & Installments ({po.payments.length})
                                        </Typography>
                                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'grey.100' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Date</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Method</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Reference / UTR</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Notes</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Amount Paid</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {po.payments.map((pay, pIdx) => (
                                                        <TableRow key={pay.id || pIdx} hover>
                                                            <TableCell sx={{ py: 1 }}>{pay.date || new Date().toISOString().split('T')[0]}</TableCell>
                                                            <TableCell sx={{ py: 1, fontWeight: 600 }}>{pay.method || 'Bank Transfer'}</TableCell>
                                                            <TableCell sx={{ py: 1 }}>{pay.transactionRef || '-'}</TableCell>
                                                            <TableCell sx={{ py: 1 }}>{pay.notes || '-'}</TableCell>
                                                            <TableCell align="right" sx={{ py: 1, fontWeight: 800, color: '#059669' }}>
                                                                ₹{(Number(pay.amount) || 0).toLocaleString('en-IN')}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {po.notes && (
                                    <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(15, 118, 110, 0.05)', border: '1px dashed rgba(15, 118, 110, 0.2)' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E', display: 'block', mb: 0.5 }}>
                                            Special Instructions & Order Notes:
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {po.notes}
                                        </Typography>
                                    </Box>
                                )}
                            </DialogContent>

                            <DialogActions sx={{ p: 2.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50', borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 1 }}>
                                <Button 
                                    onClick={() => setViewPoModalOpen(false)}
                                    sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                                >
                                    Close
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<PictureAsPdf sx={{ color: '#D97706' }} />}
                                    onClick={() => generatePurchaseOrderPDF(po)}
                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#D97706', color: '#D97706' }}
                                >
                                    Download Official PDF
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<WhatsApp sx={{ color: '#25D366' }} />}
                                    onClick={() => handleSendWhatsAppPO(po)}
                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#25D366', color: '#25D366' }}
                                >
                                    Share on WhatsApp
                                </Button>
                                {po.status === 'Ordered' && (
                                    <Button
                                        variant="contained"
                                        startIcon={<CheckCircle />}
                                        onClick={() => {
                                            handleReceiveStock(po);
                                            setViewPoModalOpen(false);
                                        }}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            bgcolor: '#059669',
                                            color: '#ffffff',
                                            '&:hover': { bgcolor: '#047857' }
                                        }}
                                    >
                                        Mark Stock Received
                                    </Button>
                                )}
                            </DialogActions>
                        </>
                    );
                })()}
            </Dialog>

            {/* Record Vendor Payment Modal */}
            <Dialog
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', color: 'white', px: 3, py: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Record Supplier Payment</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>
                        PO #{payingPo?.id ? (payingPo.id.length > 8 ? payingPo.id.slice(-6).toUpperCase() : payingPo.id.toUpperCase()) : ''} • {payingPo?.vendorName}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    {payingPo && (() => {
                        const total = payingPo.total || 0;
                        const paid = payingPo.amountPaid || 0;
                        const balance = Math.max(0, total - paid);

                        return (
                            <Box>
                                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" color="text.secondary">PO Value</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>₹{total.toLocaleString('en-IN')}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" color="text.secondary">Paid So Far</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669' }}>₹{paid.toLocaleString('en-IN')}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#DC2626' }}>₹{balance.toLocaleString('en-IN')}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Payment Amount *"
                                            type="number"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                            inputProps={{ min: 1, step: 0.01 }}
                                            helperText={`Max remaining: ₹${balance.toLocaleString('en-IN')}`}
                                            autoFocus
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Payment Method *"
                                            value={paymentForm.method}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                        >
                                            <MenuItem value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</MenuItem>
                                            <MenuItem value="UPI / GPay">UPI / GPay</MenuItem>
                                            <MenuItem value="Cheque">Cheque</MenuItem>
                                            <MenuItem value="Cash">Cash</MenuItem>
                                            <MenuItem value="Credit Card">Credit Card</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Payment Date *"
                                            type="date"
                                            fullWidth
                                            value={paymentForm.date}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Transaction Ref / UTR / Cheque #"
                                            placeholder="e.g. UTR-98214812"
                                            value={paymentForm.transactionRef}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Notes / Remittance Advice"
                                            placeholder="e.g. Paid from HDFC Current A/c"
                                            value={paymentForm.notes}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setPaymentModalOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button
                        onClick={handleRecordPaymentSubmit}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Confirm & Record Payment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* WhatsApp Missing Phone Prompt Modal */}
            <Dialog
                open={whatsAppPromptOpen}
                onClose={() => setWhatsAppPromptOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3.5, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: 'white', px: 3, py: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Vendor WhatsApp Contact</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {whatsAppTargetPo?.vendorName || 'Supplier'} has no phone on file
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please enter the supplier's WhatsApp mobile number (with country code, e.g. 9876543210):
                    </Typography>
                    <TextField
                        fullWidth
                        label="WhatsApp Mobile Number *"
                        placeholder="e.g. 9876543210"
                        value={customWhatsAppPhone}
                        onChange={(e) => setCustomWhatsAppPhone(e.target.value)}
                        autoFocus
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Phone sx={{ color: '#25D366' }} />
                                </InputAdornment>
                            )
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setWhatsAppPromptOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={!customWhatsAppPhone.trim()}
                        onClick={() => {
                            setWhatsAppPromptOpen(false);
                            if (whatsAppTargetPo) {
                                executeSendWhatsApp(whatsAppTargetPo, customWhatsAppPhone);
                            }
                        }}
                        sx={{
                            bgcolor: '#25D366',
                            color: '#ffffff',
                            fontWeight: 700,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#128C7E' }
                        }}
                    >
                        Send via WhatsApp
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const SmartRestockView = ({ getLowStockItems, vendors, handleOpen, setVendorId, setPoItems }) => {
    const theme = useTheme();
    const [selectedItems, setSelectedItems] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('All');
    const [urgencyFilter, setUrgencyFilter] = useState('All');

    const lowStockItems = useMemo(() => {
        return getLowStockItems ? getLowStockItems() : [];
    }, [getLowStockItems]);

    // Unique suppliers list
    const uniqueSuppliers = useMemo(() => {
        const suppliers = new Set();
        lowStockItems.forEach(item => {
            if (item.supplier) suppliers.add(item.supplier);
        });
        return Array.from(suppliers);
    }, [lowStockItems]);

    // Filtered items
    const filteredItems = useMemo(() => {
        return lowStockItems.filter(item => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
                (item.name || '').toLowerCase().includes(query) ||
                (item.productId || '').toLowerCase().includes(query) ||
                (item.variantSku || '').toLowerCase().includes(query) ||
                (item.supplier || '').toLowerCase().includes(query);

            const matchesSupplier = supplierFilter === 'All' || item.supplier === supplierFilter;

            const matchesUrgency = urgencyFilter === 'All' || 
                (urgencyFilter === 'OutOfStock' && (item.quantity || 0) <= 0) ||
                (urgencyFilter === 'Critical' && (item.quantity || 0) > 0);

            return matchesSearch && matchesSupplier && matchesUrgency;
        });
    }, [lowStockItems, searchQuery, supplierFilter, urgencyFilter]);

    // Paginated 10 entries per page
    const paginatedItems = useMemo(() => {
        return filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredItems, page, rowsPerPage]);

    // Select/Deselect handlers
    const handleSelectAllOnPage = (checked) => {
        const pageIds = paginatedItems.map(item => item.isVariant ? `${item.id}-${item.variantSku}` : item.id);
        if (checked) {
            setSelectedItems(prev => Array.from(new Set([...prev, ...pageIds])));
        } else {
            setSelectedItems(prev => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const handleSelectItem = (uniqueId) => {
        if (selectedItems.includes(uniqueId)) {
            setSelectedItems(selectedItems.filter(id => id !== uniqueId));
        } else {
            setSelectedItems([...selectedItems, uniqueId]);
        }
    };

    // Quick Order for a single item
    const handleOrderSingle = (item) => {
        const vendor = vendors.find(v => (v.name || '').toLowerCase() === (item.supplier || '').toLowerCase());
        const vendorIdToUse = vendor ? vendor.id : '';
        const recQty = Math.max(10, ((item.minStockLevel || 5) * 2) - (item.quantity || 0));

        setVendorId(vendorIdToUse);
        setPoItems([{
            productId: item.id,
            productName: item.name,
            quantity: recQty,
            cost: item.cost || 0,
            variantSku: item.variantSku || ''
        }]);
        handleOpen();
    };

    // Create bulk PO for selected items
    const handleOrderSelected = () => {
        const itemsToOrder = lowStockItems.filter(item => {
            const uniqueId = item.isVariant ? `${item.id}-${item.variantSku}` : item.id;
            return selectedItems.includes(uniqueId);
        });

        if (itemsToOrder.length === 0) {
            alert("Please select at least one item from the table.");
            return;
        }

        const suppliers = [...new Set(itemsToOrder.map(i => i.supplier || 'Unknown Supplier'))];
        const primarySupplier = suppliers[0];

        const vendor = vendors.find(v => (v.name || '').toLowerCase() === primarySupplier.toLowerCase());
        const vendorIdToUse = vendor ? vendor.id : '';

        // If multiple suppliers, alert user that PO is being prepared for the first group
        const targetItems = itemsToOrder.filter(i => (i.supplier || 'Unknown Supplier') === primarySupplier);

        if (suppliers.length > 1) {
            alert(`Selected items are from multiple suppliers (${suppliers.join(', ')}). A Purchase Order will be created for the first supplier: "${primarySupplier}" (${targetItems.length} items).`);
        }

        const poItemsData = targetItems.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: Math.max(10, ((item.minStockLevel || 5) * 2) - (item.quantity || 0)),
            cost: item.cost || 0,
            variantSku: item.variantSku || ''
        }));

        setVendorId(vendorIdToUse);
        setPoItems(poItemsData);
        handleOpen();
    };

    const isAllPageSelected = paginatedItems.length > 0 && paginatedItems.every(item => {
        const uniqueId = item.isVariant ? `${item.id}-${item.variantSku}` : item.id;
        return selectedItems.includes(uniqueId);
    });

    const isSomePageSelected = paginatedItems.some(item => {
        const uniqueId = item.isVariant ? `${item.id}-${item.variantSku}` : item.id;
        return selectedItems.includes(uniqueId);
    }) && !isAllPageSelected;

    return (
        <Box>
            {/* Header info */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Smart Restock Assistant
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Showing low-stock items below buffer thresholds (10 entries per page). Select items to batch generate Purchase Orders.
                    </Typography>
                </Box>
                {selectedItems.length > 0 && (
                    <Button
                        variant="contained"
                        onClick={handleOrderSelected}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                            }
                        }}
                    >
                        Generate PO for Selected ({selectedItems.length})
                    </Button>
                )}
            </Box>

            {/* Filter and Search Bar */}
            <GlassCard sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by product name, SKU, or supplier..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchQuery && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Filter by Supplier"
                            value={supplierFilter}
                            onChange={(e) => {
                                setSupplierFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="All">All Suppliers ({uniqueSuppliers.length})</MenuItem>
                            {uniqueSuppliers.map(sup => (
                                <MenuItem key={sup} value={sup}>
                                    {sup}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.5}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Stock Urgency"
                            value={urgencyFilter}
                            onChange={(e) => {
                                setUrgencyFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="All">All Deficits</MenuItem>
                            <MenuItem value="OutOfStock">Out of Stock (0 Qty)</MenuItem>
                            <MenuItem value="Critical">Low Stock (&le; Min)</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4} md={1.5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {(searchQuery || supplierFilter !== 'All' || urgencyFilter !== 'All') && (
                            <Button 
                                size="small" 
                                color="inherit" 
                                onClick={() => {
                                    setSearchQuery('');
                                    setSupplierFilter('All');
                                    setUrgencyFilter('All');
                                    setPage(0);
                                }}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                                Reset
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </GlassCard>

            {/* Smart Replenishment Table (10 Entries Per Page) */}
            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 118, 110, 0.04)' }}>
                            <TableRow>
                                <TableCell padding="checkbox" sx={{ pl: 2 }}>
                                    <Checkbox
                                        checked={isAllPageSelected}
                                        indeterminate={isSomePageSelected}
                                        onChange={(e) => handleSelectAllOnPage(e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Product & Variant
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Supplier / Mill
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Unit Buy Cost
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Current Stock
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Min Threshold
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Deficit / Rec. Order
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Status
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75, pr: 2 }}>
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedItems.length > 0 ? (
                                paginatedItems.map((item) => {
                                    const uniqueId = item.isVariant ? `${item.id}-${item.variantSku}` : item.id;
                                    const isSelected = selectedItems.includes(uniqueId);
                                    const isOutOfStock = (item.quantity || 0) <= 0;
                                    const recQty = Math.max(10, ((item.minStockLevel || 5) * 2) - (item.quantity || 0));

                                    return (
                                        <TableRow 
                                            key={uniqueId} 
                                            hover 
                                            selected={isSelected}
                                            sx={{ '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 118, 110, 0.02)' } }}
                                        >
                                            <TableCell padding="checkbox" sx={{ pl: 2 }}>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => handleSelectItem(uniqueId)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.75 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                    {item.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3 }}>
                                                    {item.isVariant ? (
                                                        <Chip 
                                                            label={`Variant: ${item.variantSku} (${item.size || ''} / ${item.color || ''})`} 
                                                            size="small" 
                                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                                        />
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            SKU: {item.productId || item.id.slice(-6)}
                                                        </Typography>
                                                    )}
                                                    {item.category && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            • {item.category}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.75 }}>
                                                <Chip 
                                                    label={item.supplier || 'Unassigned'} 
                                                    size="small" 
                                                    sx={{ 
                                                        height: 22, 
                                                        fontSize: '0.72rem', 
                                                        fontWeight: 600,
                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 118, 110, 0.2)' : 'rgba(15, 118, 110, 0.08)',
                                                        color: '#0F766E'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.75 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                    ₹{(item.cost || 0).toLocaleString('en-IN')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 1.75 }}>
                                                <Chip 
                                                    label={`${item.quantity || 0} Units`} 
                                                    size="small" 
                                                    sx={{ 
                                                        bgcolor: isOutOfStock ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                                                        color: isOutOfStock ? '#DC2626' : '#D97706', 
                                                        fontWeight: 800,
                                                        border: isOutOfStock ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                                                        fontSize: '0.75rem'
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 1.75 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                                    {item.minStockLevel || 5}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 1.75 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E' }}>
                                                    +{recQty} Units
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 1.75 }}>
                                                <Chip
                                                    label={isOutOfStock ? 'Out of Stock' : 'Critical Low'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: isOutOfStock ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: isOutOfStock ? '#DC2626' : '#D97706',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.75, pr: 2 }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleOrderSingle(item)}
                                                    sx={{
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700,
                                                        py: 0.3,
                                                        px: 1.5,
                                                        borderRadius: 1.5,
                                                        textTransform: 'none',
                                                        borderColor: '#0F766E',
                                                        color: '#0F766E',
                                                        '&:hover': {
                                                            borderColor: '#0b5650',
                                                            bgcolor: 'rgba(15, 118, 110, 0.05)'
                                                        }
                                                    }}
                                                >
                                                    Order Now
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <CheckCircle sx={{ fontSize: 44, color: '#059669', opacity: 0.8, mb: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                            {lowStockItems.length === 0 ? 'All Inventory Stock Levels Are Healthy' : 'No low stock items match your filter criteria'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {lowStockItems.length === 0 ? 'No products currently have stock below their minimum buffer.' : 'Try adjusting your supplier or urgency filters.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Table Pagination: 10 entries per page */}
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredItems.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                />
            </GlassCard>
        </Box>
    );
};

export default Purchases;
