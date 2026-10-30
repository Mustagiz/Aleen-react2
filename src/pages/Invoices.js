import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TextField, MenuItem, Paper, Typography, TableContainer, Chip, Card, CardContent, Grid, Divider, Tooltip, useMediaQuery, useTheme, AppBar, Toolbar, TablePagination, Menu, ListItemIcon, ListItemText, Autocomplete, Switch, FormControlLabel, Avatar, TableSortLabel, CircularProgress, Alert, Snackbar, InputAdornment, List } from '@mui/material';
import { Add, Delete, Print, Visibility, WhatsApp, Download, Search, Receipt, Share, Close, MoreVert, AttachMoney, TrendingUp, CameraAlt, PointOfSale, PersonOutline, ShoppingBagOutlined, PaymentsOutlined, ReceiptLong, Palette, DesignServices, QrCodeScanner, QrCode2, CheckCircle, Sensors, PhoneAndroid, ContentCopy, PauseCircle, PauseCircleOutline, ShoppingCart, RestartAlt, CalendarMonth, Phone, Straighten, Clear, Stars, Redeem, AccountBalanceWallet, Keyboard, Tv, VolumeUp, VolumeOff } from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { generateInvoiceNumber, formatSkuWithHyphen } from '../utils/helpers';
import InvoicePrint from '../components/InvoicePrint';
import InvoiceTemplateDialog from '../components/InvoiceTemplateDialog';
import { INVOICE_TEMPLATES, getStoredInvoiceSettings } from '../constants/invoiceTemplates';
import { generatePdfFromElement } from '../utils/pdfExport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useThemeContext } from '../contexts/ThemeContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import { TableSkeleton } from '../components/crm/AtelierSkeleton';
import InvoiceWhatsAppDialog from '../components/InvoiceWhatsAppDialog';
import BillSuccessModal from '../components/BillSuccessModal';
import { printInvoiceElement } from '../utils/printInvoice';
import CashDrawerShiftModal from '../components/crm/CashDrawerShiftModal';
import { calculateInvoiceTotals, calculateLineItem, calculateTenderSettlement, calculateCashChange, generateQuickCashPresets, generateUpiPaymentUrl } from '../engine/billingEngine';
import AtelierStitchDivider from '../components/common/AtelierStitchDivider';
import ThermalReceipt from '../components/ThermalReceipt';
import CustomerMeasurementModal from '../components/crm/CustomerMeasurementModal';
import UpiPaymentQrModal from '../components/pos/UpiPaymentQrModal';
import PairCustomerDisplayModal from '../components/pos/PairCustomerDisplayModal';
import { speakBillSettlement, getVoiceSettings, setVoiceSettings, playLuxuryChime } from '../utils/posVoiceEngine';

const Invoices = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { inventory, invoices, addInvoice, updateInvoice, deleteInvoice, profile, customers, addCustomer, loading, invoiceTemplateSettings, updateInvoiceTemplateSettings, loyaltySettings } = useData();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const [open, setOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [whatsAppInvoice, setWhatsAppInvoice] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState(null);
  const [invoiceSettings, setInvoiceSettings] = useState(() => invoiceTemplateSettings || getStoredInvoiceSettings());
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [cashDrawerModalOpen, setCashDrawerModalOpen] = useState(false);
  const [upiQrModalOpen, setUpiQrModalOpen] = useState(false);
  const [upiQrModalAmount, setUpiQrModalAmount] = useState(0);
  const [upiQrModalLabel, setUpiQrModalLabel] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [offscreenInvoice, setOffscreenInvoice] = useState(null);
  const [clientValidationErrors, setClientValidationErrors] = useState({ customer: false, phone: false });
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [pairModalOpen, setPairModalOpen] = useState(false);
  const offscreenInvoiceRef = useRef(null);

  useEffect(() => {
    if (invoiceTemplateSettings) {
      setInvoiceSettings(invoiceTemplateSettings);
    }
  }, [invoiceTemplateSettings]);


  const toSentenceCase = (text) => {
    if (!text) return '';
    const firstLetterMatch = text.match(/[a-zA-Z]/);
    if (!firstLetterMatch) return text;
    const index = firstLetterMatch.index;
    return (
      text.slice(0, index) +
      text.charAt(index).toUpperCase() +
      text.slice(index + 1).toLowerCase()
    );
  };



  const playVibration = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50); // Short 50ms tactile vibration
    }
  };

  // Interactive Voice & Sound Confirmation Settings
  const [voiceSettings, setPosVoiceSettings] = useState(() => getVoiceSettings());

  const handleToggleVoice = () => {
    const nextState = !voiceSettings.voiceEnabled;
    const updated = {
      ...voiceSettings,
      voiceEnabled: nextState,
      soundEnabled: nextState
    };
    setPosVoiceSettings(updated);
    setVoiceSettings(updated);
  };

  // Customer Facing Display (CFD) - High-Speed Sync & Window Launcher
  const cfdChannelRef = useRef(null);
  const cfdCloudDebounceTimerRef = useRef(null);
  const cfdLastSettledTimeRef = useRef(0);
  const cfdWindowRef = useRef(null);
  const cfdSeqRef = useRef(0);
  const cfdAutoIdleTimerRef = useRef(null);
  const syncCustomerDisplayRef = useRef(null);

  const handleOpenCustomerDisplay = () => {
    if (typeof window !== 'undefined') {
      const cfdWin = window.open('/customer-display', 'AleenCustomerDisplay', 'width=1120,height=760,menubar=no,toolbar=no,location=no');
      cfdWindowRef.current = cfdWin;
      // Proactively sync current cart state as soon as child window mounts
      setTimeout(() => {
        if (syncCustomerDisplayRef.current) {
          syncCustomerDisplayRef.current(null, null, true);
        }
      }, 150);
      setTimeout(() => {
        if (syncCustomerDisplayRef.current) {
          syncCustomerDisplayRef.current(null, null, true);
        }
      }, 600);
    }
  };

  const handleCloseInvoiceModalRef = useRef(null);
  const handleOpenNewInvoiceRef = useRef(null);
  const handleCloseInvoiceModal = () => {
    if (handleCloseInvoiceModalRef.current) {
      handleCloseInvoiceModalRef.current();
    }
  };
  const handleOpenNewInvoice = () => {
    if (handleOpenNewInvoiceRef.current) {
      handleOpenNewInvoiceRef.current();
    }
  };

  // Hold / Park Cart State
  const [parkedCarts, setParkedCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_parked_carts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [heldCartsDialogOpen, setHeldCartsDialogOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('aleen_parked_carts', JSON.stringify(parkedCarts));
    } catch (e) {
      console.error("Failed to save parked carts", e);
    }
  }, [parkedCarts]);

  const handleSaveInvoiceRef = useRef(null);

  // Keyboard-First Hotkeys: F1 (Hotkeys), F2 (New Bill), F4 (Pay / Issue), F7 (Held Carts), ESC (Close)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      // F1 or ? (outside input): Open Hotkeys Legend
      if (e.key === 'F1' || (!isInput && e.key === '?')) {
        e.preventDefault();
        setShortcutHelpOpen(prev => !prev);
        return;
      }

      // F2 or Alt + N: New Invoice
      if (e.key === 'F2' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        handleOpenNewInvoice();
        return;
      }

      // F4 or Alt + P: Issue / Pay current invoice
      if (e.key === 'F4' || (e.altKey && e.key.toLowerCase() === 'p')) {
        if (open && handleSaveInvoiceRef.current) {
          e.preventDefault();
          handleSaveInvoiceRef.current();
        }
        return;
      }

      // F7 or Alt + H: Held Carts
      if (e.key === 'F7' || (e.altKey && e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        setHeldCartsDialogOpen(prev => !prev);
        return;
      }

      // ESC: Close open modals
      if (e.key === 'Escape') {
        if (shortcutHelpOpen) {
          setShortcutHelpOpen(false);
        } else if (heldCartsDialogOpen) {
          setHeldCartsDialogOpen(false);
        } else if (open) {
          handleCloseInvoiceModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, heldCartsDialogOpen, shortcutHelpOpen]);

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
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [cashTendered, setCashTendered] = useState('');
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [measurementCustomer, setMeasurementCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  // Date & Filter States
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Quick Date Range Preset Handler
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const todayStr = toYMD(now);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      setDateFrom(yStr);
      setDateTo(yStr);
    } else if (preset === 'this_week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setDateFrom(toYMD(start));
      setDateTo(toYMD(now));
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(toYMD(start));
      setDateTo(toYMD(now));
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(toYMD(start));
      setDateTo(toYMD(end));
    } else if (preset === 'last_30_days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      setDateFrom(toYMD(start));
      setDateTo(toYMD(now));
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setDatePreset('all');
    setPaymentFilter('All');
  };
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
  const [scanFeedback, setScanFeedback] = useState(null);
  const [unrecognizedScan, setUnrecognizedScan] = useState(null);
  const [phonePairModalOpen, setPhonePairModalOpen] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const lastRemoteScanTimestampRef = useRef(Date.now());
  const quickAddInputRef = useRef(null);

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

  const resetInvoiceForm = useCallback(() => {
    setSelectedItems([{ id: '', quantity: 1, isCustom: false, customName: '', customPrice: 0, customCost: 0, variantSku: '' }]);
    setCustomer('');
    setPhone('+91');
    setSelectedCustomerId(null);
    setDiscountPercent('');
    setDiscountAmount('');
    setTax('');
    setLoyaltyPointsToRedeem(0);
    setCashTendered('');
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
    setInvoiceDate(getCurrentDateTime());
    setItemSearchTerm('');
    setUnrecognizedScan(null);
    setScanFeedback(null);
  }, []);

  const executeCloseInvoiceModal = useCallback(() => {
    if (cfdAutoIdleTimerRef.current) {
      clearTimeout(cfdAutoIdleTimerRef.current);
      cfdAutoIdleTimerRef.current = null;
    }
    cfdLastSettledTimeRef.current = 0;
    setOpen(false);
    resetInvoiceForm();
    if (syncCustomerDisplayRef.current) {
      syncCustomerDisplayRef.current('idle', null, true, []);
    }
  }, [resetInvoiceForm]);

  const executeOpenNewInvoice = useCallback(() => {
    if (cfdAutoIdleTimerRef.current) {
      clearTimeout(cfdAutoIdleTimerRef.current);
      cfdAutoIdleTimerRef.current = null;
    }
    cfdLastSettledTimeRef.current = 0;
    resetInvoiceForm();
    setOpen(true);
    if (syncCustomerDisplayRef.current) {
      syncCustomerDisplayRef.current('idle', null, true, []);
    }
  }, [resetInvoiceForm]);

  handleCloseInvoiceModalRef.current = executeCloseInvoiceModal;
  handleOpenNewInvoiceRef.current = executeOpenNewInvoice;

  // Handle Quick Bill CTA from header navigation or Alt+N shortcut
  useEffect(() => {
    const triggerNewBill = () => {
      executeOpenNewInvoice();
    };

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'new' || location.state?.openNewBill) {
      triggerNewBill();
      // Remove query param and route state to keep history clean
      navigate('/invoices', { replace: true, state: {} });
    }

    const handleCustomEvent = () => {
      triggerNewBill();
    };

    window.addEventListener('open-quick-bill', handleCustomEvent);
    return () => window.removeEventListener('open-quick-bill', handleCustomEvent);
  }, [location.search, location.state, navigate, executeOpenNewInvoice]);

  const [networkHost] = useState(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return '192.168.1.30';
    }
    return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  });

  const getActiveWorkstationToken = () => {
    let t = localStorage.getItem('aleen_workstation_scanner_token');
    if (!t) {
      t = 'aleen_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('aleen_workstation_scanner_token', t);
    }
    return t;
  };

  const phoneBridgeUrl = `${window.location.protocol}//${networkHost}${window.location.port ? ':' + window.location.port : ''}/mobile-scanner?token=${getActiveWorkstationToken()}`;
  const phoneQrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(phoneBridgeUrl)}&color=042F2E&bgcolor=FFFFFF`;

  // Auto-dismiss scan feedback after 6 seconds
  useEffect(() => {
    if (scanFeedback) {
      const timer = setTimeout(() => {
        setScanFeedback(null);
        setUnrecognizedScan(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [scanFeedback]);

  // Universal barcode/QR/product finder with URL, JSON, and tag normalization
  const findProductByCode = (code) => {
    if (!code) return null;
    let clean = String(code).trim();
    if (!clean) return null;

    // 0. Handle JSON formatted QR codes (e.g. {"productId": "ALN-101", ...})
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        const candidate = parsed.productId || parsed.id || parsed.sku || parsed.barcode || parsed.code || parsed.itemCode;
        if (candidate) clean = String(candidate).trim();
      } catch (e) {}
    }

    // 0. Handle URL formatted QR codes (e.g. http://.../product?id=ALN-101 or .../PRD-1001)
    if (clean.includes('://') || clean.includes('?')) {
      try {
        const urlObj = new URL(clean);
        const idParam = urlObj.searchParams.get('id') ||
          urlObj.searchParams.get('productId') ||
          urlObj.searchParams.get('sku') ||
          urlObj.searchParams.get('code') ||
          urlObj.searchParams.get('barcode');
        if (idParam) {
          clean = idParam.trim();
        } else {
          const pathSegments = urlObj.pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            clean = pathSegments[pathSegments.length - 1].trim();
          }
        }
      } catch (e) {}
    }

    // Strip wrapping quotes
    clean = clean.replace(/^["']|["']$/g, '').trim();
    const lower = clean.toLowerCase();

    // 1. Direct match on productId
    let product = inventory.find(inv => inv.productId && String(inv.productId).trim().toLowerCase() === lower);
    let variantSku = null;

    // 2. Direct match on barcode
    if (!product) {
      product = inventory.find(inv => inv.barcode && String(inv.barcode).trim().toLowerCase() === lower);
    }

    // 3. Direct match on database/document id
    if (!product) {
      product = inventory.find(inv => inv.id && String(inv.id).trim().toLowerCase() === lower);
    }

    // 4. Direct match on sku
    if (!product) {
      product = inventory.find(inv => inv.sku && String(inv.sku).trim().toLowerCase() === lower);
    }

    // 5. Direct match on itemCode
    if (!product) {
      product = inventory.find(inv => inv.itemCode && String(inv.itemCode).trim().toLowerCase() === lower);
    }

    // 6. Match within variants (sku, barcode, id)
    if (!product) {
      for (const inv of inventory) {
        if (inv.variants && Array.isArray(inv.variants)) {
          const v = inv.variants.find(varItem =>
            (varItem.sku && String(varItem.sku).trim().toLowerCase() === lower) ||
            (varItem.barcode && String(varItem.barcode).trim().toLowerCase() === lower) ||
            (varItem.id && String(varItem.id).trim().toLowerCase() === lower)
          );
          if (v) {
            product = inv;
            variantSku = v.sku || null;
            break;
          }
        }
      }
    }

    // 7. Case-insensitive exact item name match fallback
    if (!product) {
      product = inventory.find(inv => inv.name && String(inv.name).trim().toLowerCase() === lower);
    }

    // 8. Hyphen-agnostic matching (e.g. barcode scanner reads "ES-50" but DB holds "Es50" or vice-versa)
    if (!product) {
      const strippedClean = lower.replace(/[-\s]/g, '');
      if (strippedClean) {
        product = inventory.find(inv => {
          const pId = String(inv.productId || '').trim().toLowerCase().replace(/[-\s]/g, '');
          const sId = String(inv.sku || '').trim().toLowerCase().replace(/[-\s]/g, '');
          const bId = String(inv.barcode || '').trim().toLowerCase().replace(/[-\s]/g, '');
          return (pId && pId === strippedClean) || (sId && sId === strippedClean) || (bId && bId === strippedClean);
        });
      }
    }

    if (product) {
      return { product, variantSku, resolvedCode: clean };
    }
    return { product: null, variantSku: null, resolvedCode: clean };
  };

  // Main barcode handler that accepts scans from Hardware Scanners, Mobile Phone Camera, or Web Camera
  const handleProcessBarcode = (rawCode, source = 'Scanner') => {
    if (!rawCode) return;
    const cleanCode = String(rawCode).trim();
    if (!cleanCode) return;
    const matchResult = findProductByCode(cleanCode);

    if (matchResult && matchResult.product) {
      const { product, variantSku } = matchResult;

      playLuxuryChime('scan');
      playVibration();

      // Cancel any running post-settlement auto-idle timer and reset settlement tracker
      if (cfdAutoIdleTimerRef.current) {
        clearTimeout(cfdAutoIdleTimerRef.current);
        cfdAutoIdleTimerRef.current = null;
      }
      cfdLastSettledTimeRef.current = 0;

      const baseItems = Array.isArray(selectedItems) ? [...selectedItems] : [];
      let updatedCartItems = [];
      const resolvedVariantSku = variantSku || (product.hasVariants && product.variants?.length ? product.variants[0].sku : '');

      // 1. If item already exists in the cart with the same variantSku, increment quantity
      const existingIndex = baseItems.findIndex(item =>
        item.id === product.id && (!variantSku || item.variantSku === variantSku) && !item.isCustom
      );

      if (existingIndex !== -1) {
        const currentQty = parseInt(baseItems[existingIndex].quantity) || 1;
        baseItems[existingIndex] = {
          ...baseItems[existingIndex],
          quantity: currentQty + 1
        };
        updatedCartItems = baseItems;
      } else {
        // 2. Populate first unselected empty row if present
        const emptyIndex = baseItems.findIndex(item => !item.id && !item.isCustom);
        if (emptyIndex !== -1) {
          baseItems[emptyIndex] = {
            id: product.id,
            quantity: 1,
            variantSku: resolvedVariantSku,
            isCustom: false,
            customName: '',
            customPrice: 0,
            customCost: 0
          };
          updatedCartItems = baseItems;
        } else {
          // 3. Otherwise append new line item
          updatedCartItems = [
            ...baseItems,
            {
              id: product.id,
              quantity: 1,
              variantSku: resolvedVariantSku,
              isCustom: false,
              customName: '',
              customPrice: 0,
              customCost: 0
            }
          ];
        }
      }

      setSelectedItems(updatedCartItems);
      setOpen(true);

      // INSTANT 0ms Customer Facing Display Broadcast upon scanning
      if (syncCustomerDisplayRef.current && updatedCartItems.length > 0) {
        syncCustomerDisplayRef.current('active', product.name, true, updatedCartItems);
      }

      setItemSearchTerm('');
      setUnrecognizedScan(null);
      setScanFeedback({
        type: 'success',
        message: `✓ Added: "${product.name}" (${variantSku || product.productId || cleanCode}) via ${source}`
      });
    } else {
      const codeToShow = matchResult?.resolvedCode || cleanCode;
      playLuxuryChime('error');
      setUnrecognizedScan(codeToShow);
      setScanFeedback({
        type: 'warning',
        message: `⚠️ Code "${codeToShow}" scanned via ${source} was not found in inventory catalog.`
      });
    }
  };

  // Auto-focus quick add barcode input when invoice dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (quickAddInputRef.current) {
          quickAddInputRef.current.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Global Hardware Scanner Gun Listener (Keyboard wedge / HID)
  useEffect(() => {
    let timeout = null;
    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'F2') {
        e.preventDefault();
        quickAddInputRef.current?.focus();
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        setIsSplitPayment(prev => !prev);
        return;
      }

      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 2) {
          e.preventDefault();
          const code = barcodeBufferRef.current;
          barcodeBufferRef.current = '';
          handleProcessBarcode(code, 'Hardware Scanner Gun');
        }
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff < 60 || barcodeBufferRef.current.length > 0 || !isInput) {
          barcodeBufferRef.current += e.key;
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            barcodeBufferRef.current = '';
          }, 250);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      clearTimeout(timeout);
    };
  }, [open, inventory]);

  // Realtime Wireless Smartphone Scanner Bridge (Firebase Firestore + BroadcastChannel + LocalStorage)
  useEffect(() => {
    const token = getActiveWorkstationToken();
    let unsubSession = null;
    let unsubGlobal = null;

    try {
      // 1. Listen to active workstation token doc in Firestore
      const sessionRef = doc(db, 'scanner_sessions', token);
      unsubSession = onSnapshot(sessionRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.code && data.timestamp && data.timestamp > lastRemoteScanTimestampRef.current) {
            lastRemoteScanTimestampRef.current = data.timestamp;
            handleProcessBarcode(data.code, data.deviceName || 'Wireless Phone Camera');
          }
        }
      }, (err) => {
        console.warn('Firestore session listener notice:', err);
      });

      // 2. Also listen to latest_scan document in Firestore as automatic fallback
      const globalRef = doc(db, 'scanner_sessions', 'latest_scan');
      unsubGlobal = onSnapshot(globalRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.code && data.timestamp && data.timestamp > lastRemoteScanTimestampRef.current) {
            lastRemoteScanTimestampRef.current = data.timestamp;
            handleProcessBarcode(data.code, data.deviceName || 'Wireless Phone Camera');
          }
        }
      }, (err) => {
        console.warn('Firestore latest_scan notice:', err);
      });
    } catch (e) {
      console.warn('Error attaching Firestore phone scanner:', e);
    }

    // 3. BroadcastChannel (for testing in another tab)
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('aleen_scanner_bridge');
        bc.onmessage = (event) => {
          if (event.data && event.data.code && event.data.timestamp > lastRemoteScanTimestampRef.current) {
            lastRemoteScanTimestampRef.current = event.data.timestamp;
            handleProcessBarcode(event.data.code, 'Wireless Phone Camera');
          }
        };
      }
    } catch (e) {}

    // 4. LocalStorage event fallback
    const handleStorage = (event) => {
      if (event.key === 'aleen_last_phone_scan' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed && parsed.code && parsed.timestamp > lastRemoteScanTimestampRef.current) {
            lastRemoteScanTimestampRef.current = parsed.timestamp;
            handleProcessBarcode(parsed.code, 'Wireless Phone Camera');
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (unsubSession) unsubSession();
      if (unsubGlobal) unsubGlobal();
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [open, inventory]);

  // Web Camera Scanner in Dialog
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
            handleProcessBarcode(decodedText, 'Workstation Camera');
            stopScanner();
            setScannerOpen(false);
          }
        ).catch(err => {
          console.warn("Environment camera failed, trying default user camera:", err);
          return html5QrCode.start({ facingMode: "user" }, config, (decodedText) => {
            handleProcessBarcode(decodedText, 'Workstation Camera');
            stopScanner();
            setScannerOpen(false);
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
      const timer = setTimeout(() => startScanner(), 400);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [scannerOpen, inventory]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const printRef = useRef();

  const isFiltered = Boolean(dateFrom || dateTo || searchTerm || paymentFilter !== 'All');

  const filteredInvoices = useMemo(() => {
    const s = (searchTerm || '').trim().toLowerCase();

    // From date boundary (start of day local time 00:00:00.000)
    let fromBoundary = null;
    if (dateFrom) {
      const parts = dateFrom.split('-').map(Number);
      if (parts.length === 3) {
        fromBoundary = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime();
      }
    }

    // To date boundary (end of day local time 23:59:59.999)
    let toBoundary = null;
    if (dateTo) {
      const parts = dateTo.split('-').map(Number);
      if (parts.length === 3) {
        toBoundary = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
      }
    }

    return invoices.filter(inv => {
      // 1. Text Search matching invoice ID, customer name, phone
      if (s) {
        const matchesSearch =
          (inv.id && inv.id.toLowerCase().includes(s)) ||
          (inv.customer && inv.customer.toLowerCase().includes(s)) ||
          (inv.phone && String(inv.phone).includes(s));
        if (!matchesSearch) return false;
      }

      // 2. Payment Method Filter
      if (paymentFilter !== 'All') {
        const method = inv.paymentMethod || 'Cash';
        if (method !== paymentFilter) return false;
      }

      // 3. Selected Dates Filter
      if (fromBoundary !== null || toBoundary !== null) {
        if (!inv.date) return false;
        const invTime = new Date(inv.date).getTime();
        if (isNaN(invTime)) return false;

        if (fromBoundary !== null && invTime < fromBoundary) {
          return false;
        }
        if (toBoundary !== null && invTime > toBoundary) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, searchTerm, dateFrom, dateTo, paymentFilter]);

  // Reset pagination to first page whenever search or date filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, dateFrom, dateTo, paymentFilter]);

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const avgAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

  const displayCount = isFiltered ? filteredInvoices.length : totalInvoices;
  const displayRevenue = isFiltered
    ? filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
    : totalAmount;
  const displayAvgAmount = displayCount > 0 ? displayRevenue / displayCount : 0;

  // Sorting State
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc'); // Default to descending for recent invoices first

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
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
  }, [filteredInvoices, orderBy, order]);

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { id: '', quantity: 1, isCustom: false, customName: '', customPrice: 0, customCost: 0, variantSku: '' }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    if (field === 'id') {
      const prod = inventory.find(i => i.id === value);
      const defaultVariantSku = (prod && prod.hasVariants && prod.variants?.length)
        ? (prod.variants.find(v => (parseInt(v.quantity) || 0) > 0)?.sku || prod.variants[0].sku)
        : '';
      updated[index] = {
        ...updated[index],
        id: value,
        variantSku: defaultVariantSku
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    setSelectedItems(updated);
    if (syncCustomerDisplayRef.current) {
      syncCustomerDisplayRef.current('active', null, true, updated);
    }
  };

  const handleRemoveItem = (index) => {
    const updated = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updated);
    if (syncCustomerDisplayRef.current) {
      const remainingValid = updated.filter(item => item && (item.id || (item.isCustom && item.customName && item.customPrice > 0)));
      syncCustomerDisplayRef.current(remainingValid.length > 0 ? 'active' : 'idle', null, true, updated);
    }
  };

  const matchedCustomer = selectedCustomerId
    ? customers.find(c => c.id === selectedCustomerId)
    : customers.find(c => {
        if (!c.phone || !phone) return false;
        const cleanP = phone.replace(/\D/g, '');
        if (cleanP.length < 10) return false;
        const cleanC = c.phone.replace(/\D/g, '');
        return c.phone === phone || cleanC === cleanP || (cleanP.length >= 10 && cleanC.endsWith(cleanP));
      });

  const calculateTotal = () => {
    return calculateInvoiceTotals({
      items: selectedItems,
      inventory,
      taxPercent: tax,
      discountPercent,
      discountAmount,
      loyaltyPointsRedeemed: loyaltyPointsToRedeem,
      customerTier: matchedCustomer?.loyaltyTier || 'Bronze',
      loyaltySettings
    });
  };

  // Realtime BroadcastChannel & Cloud Firestore Sync for Customer Facing Display (CFD)
  const syncCustomerDisplay = (overrideStatus = null, lastScanned = null, isImmediate = false, overrideItems = null) => {
    try {
      const sourceItems = overrideItems !== null ? overrideItems : selectedItems;
      const validItems = (sourceItems || [])
        .filter(item => item && (item.id || (item.isCustom && item.customName && item.customPrice > 0)))
        .map(item => calculateLineItem(item, inventory));

      let totals;
      if (overrideItems !== null) {
        totals = calculateInvoiceTotals({
          items: validItems,
          inventory,
          taxPercent: tax,
          discountPercent,
          discountAmount,
          loyaltyPointsRedeemed: loyaltyPointsToRedeem,
          customerTier: matchedCustomer?.loyaltyTier || 'Bronze',
          loyaltySettings
        });
      } else {
        totals = calculateTotal();
      }

      let status;
      if (overrideStatus === 'settled') {
        cfdLastSettledTimeRef.current = Date.now();
        status = 'settled';
      } else if (overrideStatus === 'idle') {
        cfdLastSettledTimeRef.current = 0;
        status = 'idle';
      } else if (overrideStatus) {
        status = overrideStatus;
      } else if (!open) {
        status = 'idle';
      } else if (validItems.length > 0) {
        // Active cart items present: cancel settlement idle timer and display live bill
        if (cfdAutoIdleTimerRef.current) {
          clearTimeout(cfdAutoIdleTimerRef.current);
          cfdAutoIdleTimerRef.current = null;
        }
        cfdLastSettledTimeRef.current = 0;
        status = 'active';
      } else if (cfdLastSettledTimeRef.current > 0) {
        // Keep settled view on screen during the 4-second thank-you window without clearing items
        if (Date.now() - cfdLastSettledTimeRef.current < 4500) {
          return;
        }
        cfdLastSettledTimeRef.current = 0;
        status = 'idle';
      } else {
        status = 'idle';
      }

      const isIdle = status === 'idle';
      const cfdItems = isIdle ? [] : validItems;
      const cfdCustomer = (isIdle || (!open && status !== 'settled')) ? '' : (customer || matchedCustomer?.name || '');
      const cfdPhone = (isIdle || (!open && status !== 'settled')) ? '' : (phone || matchedCustomer?.phone || '');

      const storeVpa = profile?.bankDetails?.upiId || profile?.upiId || 'aleenclothing@hdfcbank';
      const storeName = profile?.businessName || 'Aleen Clothing';
      const upiUrl = generateUpiPaymentUrl({
        vpa: storeVpa,
        payeeName: storeName,
        amount: isIdle ? 0 : totals.total,
        invoiceNumber: generateInvoiceNumber(invoices?.length || 0)
      });

      // Avoid passing large base64 data URLs in live session sync (CustomerDisplay already syncs and caches logo from crmProfile)
      const cleanStoreLogo = (profile?.logoUrl && !profile.logoUrl.startsWith('data:')) ? profile.logoUrl : null;

      const payload = {
        storeName,
        storeLogo: cleanStoreLogo,
        customerName: cfdCustomer,
        customerPhone: cfdPhone,
        hasCustomer: Boolean(cfdCustomer || matchedCustomer),
        customerTier: matchedCustomer?.loyaltyTier || (cfdCustomer ? 'Bronze' : 'Guest'),
        loyaltyPoints: matchedCustomer?.loyaltyPoints || 0,
        loyaltyPointsRedeemed: isIdle ? 0 : (totals.loyaltyPointsRedeemed || 0),
        loyaltyPointsRemaining: isIdle ? 0 : Math.max(0, (matchedCustomer?.loyaltyPoints || 0) - (totals.loyaltyPointsRedeemed || 0)),
        loyaltyDiscount: isIdle ? 0 : (totals.loyaltyDiscount || 0),
        loyaltyPointsEarned: isIdle ? 0 : (totals.loyaltyPointsEarned ?? 0),
        customerTotalSpent: matchedCustomer?.totalSpent || 0,
        spendPerPoint: totals.loyaltySpendPerPoint || loyaltySettings?.spendPerPoint || 100,
        tierMultiplier: totals.loyaltyMultiplier || 1.0,
        items: cfdItems,
        subtotal: isIdle ? 0 : (totals.subtotal || 0),
        discount: isIdle ? 0 : (totals.absDiscount || 0),
        flatDiscount: isIdle ? 0 : (totals.flatDiscount || 0),
        percentDiscount: isIdle ? 0 : (totals.percentDiscount || 0),
        tax: isIdle ? 0 : (totals.taxAmount || 0),
        cgst: isIdle ? 0 : (totals.cgst || 0),
        sgst: isIdle ? 0 : (totals.sgst || 0),
        taxPercent: isIdle ? 0 : (parseFloat(tax) || 0),
        roundOff: isIdle ? 0 : (totals.roundOff || 0),
        total: isIdle ? 0 : (totals.total || 0),
        paymentMethod: isSplitPayment ? `${paymentMethod} + ${paymentMethod2}` : paymentMethod,
        upiUrl: (!isIdle && (paymentMethod === 'UPI' || (isSplitPayment && (paymentMethod === 'UPI' || paymentMethod2 === 'UPI')))) ? upiUrl : '',
        status,
        lastScannedItem: isIdle ? null : (lastScanned || null),
        currency: 'INR',
        themeColor: theme?.palette?.primary?.main || '#C5A059',
        updatedAt: Date.now(),
        seq: ++cfdSeqRef.current
      };

      // Sanitize payload so Firestore never rejects due to undefined values
      const cleanPayload = JSON.parse(
        JSON.stringify(payload, (key, value) => (value === undefined ? null : value))
      );

      // 1. Direct In-Memory Child Window Message (sub-millisecond instant 0ms sync for popups)
      if (cfdWindowRef.current && !cfdWindowRef.current.closed) {
        try {
          cfdWindowRef.current.postMessage({ type: 'SYNC', payload: cleanPayload }, '*');
        } catch (e) {}
      }

      // 2. Same-device instant BroadcastChannel (0ms, un-throttled cross-tab)
      if (!cfdChannelRef.current && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          cfdChannelRef.current = new BroadcastChannel('aleen_customer_display');
        } catch (e) {}
      }
      if (cfdChannelRef.current) {
        try {
          cfdChannelRef.current.postMessage({ type: 'SYNC', payload: cleanPayload });
        } catch (e) {}
      }

      // 3. LocalStorage fallback with storage event (0ms cross-tab fallback)
      try {
        localStorage.setItem('aleen_cfd_state', JSON.stringify(cleanPayload));
      } catch (e) {}

      // 4. Real-time Cloud Firestore Sync for 2nd Device (iPad, tablet, phone over Wi-Fi)
      const dispatchCloudWrite = () => {
        try {
          setDoc(doc(db, 'cfd_live_sessions', 'primary'), cleanPayload).catch((err) => {
            console.warn('Firestore CFD live sync warning:', err);
          });
        } catch (err) {
          console.warn('Firestore CFD write warning:', err);
        }
      };

      if (cfdCloudDebounceTimerRef.current) {
        clearTimeout(cfdCloudDebounceTimerRef.current);
        cfdCloudDebounceTimerRef.current = null;
      }
      dispatchCloudWrite();
    } catch (err) {
      console.warn('Failed to broadcast to Customer Display:', err);
    }
  };

  syncCustomerDisplayRef.current = syncCustomerDisplay;

  // Stable BroadcastChannel & Direct Window listener initialized ONCE on mount
  useEffect(() => {
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('aleen_customer_display');
        cfdChannelRef.current = bc;

        bc.onmessage = (event) => {
          if (event.data?.type === 'REQUEST_SYNC') {
            if (syncCustomerDisplayRef.current) {
              syncCustomerDisplayRef.current(null, null, true);
            }
          }
        };
      }
    } catch (e) {
      console.warn('CFD BroadcastChannel init error:', e);
    }

    // Direct Window PostMessage listener (allows child popups to request sync on mount)
    const handleDirectMessage = (event) => {
      if (event.data?.type === 'REQUEST_SYNC') {
        if (syncCustomerDisplayRef.current) {
          syncCustomerDisplayRef.current(null, null, true);
        }
      }
    };
    window.addEventListener('message', handleDirectMessage);

    return () => {
      if (bc) {
        bc.close();
        cfdChannelRef.current = null;
      }
      window.removeEventListener('message', handleDirectMessage);
      if (cfdCloudDebounceTimerRef.current) {
        clearTimeout(cfdCloudDebounceTimerRef.current);
      }
    };
  }, []);

  // Sync to CFD whenever cart, payment tender or discount modifies
  useEffect(() => {
    syncCustomerDisplay(null, null, true);
  }, [selectedItems, customer, phone, discountPercent, discountAmount, tax, loyaltyPointsToRedeem, paymentMethod, isSplitPayment, paymentMethod2, open]);

  const handleSaveInvoice = async () => {
    // Validate mandatory customer name and 10-digit phone number
    const isCustomerValid = Boolean(customer && customer.trim());
    const cleanDigits = (phone || '').replace(/[^0-9]/g, '');
    const phoneWithout91 = cleanDigits.startsWith('91') ? cleanDigits.slice(2) : cleanDigits;
    const isPhoneValid = Boolean(phoneWithout91 && phoneWithout91.length === 10);

    if (!isCustomerValid || !isPhoneValid) {
      setClientValidationErrors({
        customer: !isCustomerValid,
        phone: !isPhoneValid
      });
      if (!isCustomerValid && !isPhoneValid) {
        alert('Customer Name and a valid 10-digit Phone Number are mandatory before generating a bill.');
      } else if (!isCustomerValid) {
        alert('Customer Name is mandatory before generating a bill.');
      } else {
        alert('A valid 10-digit mobile number is mandatory before generating a bill.');
      }
      return;
    }
    setClientValidationErrors({ customer: false, phone: false });

    const validItems = selectedItems.filter(item => item.id || (item.isCustom && item.customName && item.customPrice > 0));
    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const { subtotal, taxAmount, total, absDiscount, loyaltyDiscount, loyaltyPointsEarned } = calculateTotal();
    const invoiceNumber = generateInvoiceNumber(invoices.length);

    let finalPaymentMethod = paymentMethod;
    if (isSplitPayment) {
      finalPaymentMethod = `Split: ${paymentMethod} (${splitAmount}) + ${paymentMethod2} (${(total - splitAmount).toFixed(2)})`;
    }

    let finalCustomerId = selectedCustomerId;
    const finalCustomerName = toSentenceCase(customer.trim()) || 'Walk-in';

    // Auto-Customer logic: If no customer ID but we have name/phone, check if exists or add
    if (!finalCustomerId && customer && phone) {
      const existingCustomer = customers.find(c => c.phone === phone);
      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        // Add new customer automatically
        finalCustomerId = await addCustomer({
          name: finalCustomerName,
          phone: phone,
          email: '', // Default empty
          address: '', // Default empty
          loyaltyTier: 'Bronze',
          loyaltyPoints: 0
        });
      }
    }

    // Compute updated customer loyalty points (actual database update is committed atomically in addInvoice batch)
    const updatedCustomerLoyalty = Math.max(0, (matchedCustomer?.loyaltyPoints || 0) - loyaltyPointsToRedeem) + (loyaltyPointsEarned || 0);

    const emiDetails = isEMI ? {
      tenure: emiTenure,
      monthlyInstallment: total / emiTenure,
      startDate: new Date().toISOString()
    } : null;

    const {
      tender1Amount,
      tender2Amount,
      calculatedPaidAmount,
      balanceDue,
      computedPaymentStatus,
      payments
    } = calculateTenderSettlement({
      total,
      isSplitPayment,
      paymentMethod,
      paymentMethod2,
      splitAmount,
      paymentStatus
    });

    // Cash tender & change due
    const cashTenderNum = parseFloat(cashTendered) || (paymentMethod === 'Cash' ? total : 0);
    const cashChange = calculateCashChange({ total, cashTendered: cashTenderNum });

    const invoice = {
      id: invoiceNumber,
      date: new Date(invoiceDate).toISOString(),
      customer: finalCustomerName,
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
      loyaltyPointsRedeemed: loyaltyPointsToRedeem,
      loyaltyDiscount: loyaltyDiscount || 0,
      loyaltyPointsEarned: loyaltyPointsEarned || 0,
      customerLoyaltyBalance: updatedCustomerLoyalty,
      cashTendered: cashChange.cashTendered,
      changeDue: cashChange.changeDue,
      total,
      paymentStatus: computedPaymentStatus,
      paidAmount: calculatedPaidAmount,
      balanceDue,
      isSplitPayment: Boolean(isSplitPayment),
      splitDetails: isSplitPayment ? {
        tender1: { method: paymentMethod, amount: tender1Amount },
        tender2: { method: paymentMethod2, amount: tender2Amount }
      } : null,
      isEMI,
      emiDetails,
      payments: isSplitPayment ? [
        {
          method: paymentMethod,
          amount: tender1Amount,
          transactionId: (paymentMethod === 'UPI' || paymentMethod === 'Card') ? upiTransactionId : '',
          upiProvider: paymentMethod === 'UPI' ? upiProvider : null,
          timestamp: new Date().toISOString()
        },
        {
          method: paymentMethod2,
          amount: tender2Amount,
          transactionId: (paymentMethod2 === 'UPI' || paymentMethod2 === 'Card') ? upiTransactionId2 : '',
          upiProvider: paymentMethod2 === 'UPI' ? upiProvider2 : null,
          timestamp: new Date().toISOString()
        }
      ] : [
        {
          method: paymentMethod,
          amount: calculatedPaidAmount,
          transactionId: (paymentMethod === 'UPI' || paymentMethod === 'Card') ? upiTransactionId : '',
          upiProvider: paymentMethod === 'UPI' ? upiProvider : null,
          timestamp: new Date().toISOString()
        }
      ]
    };
    // Broadcast instant settlement to customer screen before database writes (0ms delay)
    const isPaid = computedPaymentStatus === 'paid';
    if (isPaid) {
      cfdLastSettledTimeRef.current = Date.now();
      syncCustomerDisplay('settled', null, true);
      speakBillSettlement(total);

      // Auto-return customer display to homepage (idle) after 4 seconds
      if (cfdAutoIdleTimerRef.current) {
        clearTimeout(cfdAutoIdleTimerRef.current);
      }
      cfdAutoIdleTimerRef.current = setTimeout(() => {
        cfdLastSettledTimeRef.current = 0;
        if (syncCustomerDisplayRef.current) {
          syncCustomerDisplayRef.current('idle', null, true, []);
        }
        cfdAutoIdleTimerRef.current = null;
      }, 4000);
    } else {
      if (cfdAutoIdleTimerRef.current) {
        clearTimeout(cfdAutoIdleTimerRef.current);
        cfdAutoIdleTimerRef.current = null;
      }
      if (syncCustomerDisplayRef.current) {
        syncCustomerDisplayRef.current('idle', null, true, []);
      }
    }

    const savedInvoice = await addInvoice(invoice);
    setOpen(false);
    setSuccessInvoice(savedInvoice || invoice); // Show success dialog with persisted invoice
    resetInvoiceForm();
  };

  handleSaveInvoiceRef.current = handleSaveInvoice;

  // Park / Hold Cart Handlers
  const handleParkCart = () => {
    const validItems = selectedItems.filter(item => item.id || (item.isCustom && item.customName && item.customPrice > 0));
    if (validItems.length === 0 && !customer && phone === '+91') {
      alert('The current invoice cart is empty. Add products or client details before holding/parking.');
      return;
    }
    const { total } = calculateTotal();
    const newHeldCart = {
      id: `cart_${Date.now()}`,
      parkedAt: new Date().toISOString(),
      customer: customer || 'Walk-in Guest',
      phone: phone || '',
      selectedCustomerId,
      selectedItems: [...selectedItems],
      discountPercent,
      discountAmount,
      tax,
      paymentMethod,
      isSplitPayment,
      splitAmount,
      paymentMethod2,
      totalAmount: total || 0
    };

    setParkedCarts(prev => [newHeldCart, ...prev]);
    setOpen(false);
    resetInvoiceForm();
    if (syncCustomerDisplayRef.current) {
      syncCustomerDisplayRef.current('idle', null, true, []);
    }
  };

  const handleResumeCart = (cart) => {
    setSelectedItems(cart.selectedItems || [{ id: '', quantity: 1 }]);
    setCustomer(cart.customer === 'Walk-in Guest' ? '' : (cart.customer || ''));
    setPhone(cart.phone || '+91');
    setSelectedCustomerId(cart.selectedCustomerId || null);
    setDiscountPercent(cart.discountPercent || '');
    setDiscountAmount(cart.discountAmount || '');
    setTax(cart.tax || '');
    setPaymentMethod(cart.paymentMethod || 'Cash');
    setIsSplitPayment(cart.isSplitPayment || false);
    setSplitAmount(cart.splitAmount || 0);
    setPaymentMethod2(cart.paymentMethod2 || 'Card');

    // Remove from held carts and reopen POS checkout modal
    setParkedCarts(prev => prev.filter(c => c.id !== cart.id));
    setHeldCartsDialogOpen(false);
    setOpen(true);
  };

  const handleDiscardParkedCart = (cartId) => {
    setParkedCarts(prev => prev.filter(c => c.id !== cartId));
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
      doc.text(profile.businessName || 'ALEEN CLOTHING', 20, 22);

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
      const discPct = invoice.discountPercent || invoice.discountPercentage || 0;
      doc.text(`Discount (${discPct}%):`, ledgerX + 5, finalY + 15);
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

  const downloadPDF = async (invoice) => {
    if (!invoice) return;
    try {
      setIsExportingPDF(true);
      const isSlip = invoiceSettings.template === 'boutique-slip';

      // 1. If currently viewing this invoice, capture directly from on-screen preview ref
      if (viewInvoice && viewInvoice.id === invoice.id && printRef.current) {
        const doc = await generatePdfFromElement(printRef.current, isSlip);
        doc.save(`invoice-${invoice.id}.pdf`);
        return;
      }

      // 2. Otherwise render into offscreen container and capture
      setOffscreenInvoice(invoice);
      await new Promise(resolve => setTimeout(resolve, 300));

      if (offscreenInvoiceRef.current) {
        const doc = await generatePdfFromElement(offscreenInvoiceRef.current, isSlip);
        doc.save(`invoice-${invoice.id}.pdf`);
      } else {
        // Fallback to vector generation
        const doc = generatePDF(invoice, invoiceSettings.template, invoiceSettings);
        doc.save(`invoice-${invoice.id}.pdf`);
      }
    } catch (err) {
      console.error('Error generating PDF from template:', err);
      const doc = generatePDF(invoice, invoiceSettings.template, invoiceSettings);
      doc.save(`invoice-${invoice.id}.pdf`);
    } finally {
      setOffscreenInvoice(null);
      setIsExportingPDF(false);
    }
  };

  const sharePDF = async (invoice, customPhone = null, customMessage = null) => {
    if (!invoice) return;
    try {
      setIsExportingPDF(true);
      const isSlip = invoiceSettings.template === 'boutique-slip';
      let doc;

      try {
        if (viewInvoice && viewInvoice.id === invoice.id && printRef.current) {
          doc = await generatePdfFromElement(printRef.current, isSlip);
        } else {
          setOffscreenInvoice(invoice);
          await new Promise(resolve => setTimeout(resolve, 350));
          if (offscreenInvoiceRef.current) {
            doc = await generatePdfFromElement(offscreenInvoiceRef.current, isSlip);
          }
        }
      } catch (domErr) {
        console.warn('DOM PDF capture failed, falling back to vector generator:', domErr);
      }

      if (!doc) {
        doc = generatePDF(invoice, invoiceSettings.template, invoiceSettings);
      }

      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `invoice-${invoice.id}.pdf`, { type: 'application/pdf' });
      const businessName = profile?.businessName || 'Aleen Clothing';
      const shareText = customMessage || `Official Boutique Invoice #${invoice.id} from ${businessName}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${invoice.id}`,
          text: shareText
        });
        return { success: true, method: 'native-share' };
      } else {
        // Desktop / non-WebShare browser fallback: save PDF and open WhatsApp chat
        doc.save(`invoice-${invoice.id}.pdf`);
        const targetPhone = (customPhone || invoice.phone || '').replace(/[^0-9]/g, '');
        let formattedPhone = targetPhone;
        if (formattedPhone && !formattedPhone.startsWith('91') && formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone;
        }
        const encodedText = encodeURIComponent(shareText);
        const waUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
        window.open(waUrl, '_blank');
        return { success: true, method: 'download-and-open-whatsapp' };
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw error;
    } finally {
      setOffscreenInvoice(null);
      setIsExportingPDF(false);
    }
  };

  const handlePrint = (invoice) => {
    if (!invoice) return;
    const isSlip = invoiceSettings.template === 'boutique-slip';

    // If currently viewing this invoice in the modal, print its DOM element directly
    if (viewInvoice && viewInvoice.id === invoice.id && printRef.current) {
      printInvoiceElement(printRef.current, isSlip);
      return;
    }

    // Render offscreen and print seamlessly without popping open full viewInvoice modal
    setOffscreenInvoice(invoice);
    setTimeout(() => {
      if (offscreenInvoiceRef.current) {
        printInvoiceElement(offscreenInvoiceRef.current, isSlip);
      } else if (printRef.current) {
        printInvoiceElement(printRef.current, isSlip);
      } else {
        window.print();
      }
      setTimeout(() => setOffscreenInvoice(null), 1000);
    }, 280);
  };

  const handleUpdateInvoicePhone = async (invoiceId, newPhone) => {
    if (!invoiceId) return;
    try {
      if (updateInvoice) {
        await updateInvoice(invoiceId, { phone: newPhone });
      }
      setSuccessInvoice(prev => prev && prev.id === invoiceId ? { ...prev, phone: newPhone } : prev);
    } catch (err) {
      console.warn('Could not update invoice phone in db:', err);
      setSuccessInvoice(prev => prev && prev.id === invoiceId ? { ...prev, phone: newPhone } : prev);
    }
  };

  const sendWhatsApp = (invoice) => {
    if (!invoice) return;
    setWhatsAppInvoice(invoice);
    setWhatsAppDialogOpen(true);
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

  const { subtotal, taxAmount, total, absDiscount, loyaltyDiscount, loyaltyPointsEarned } = calculateTotal();

  return (
    <Box>
      {/* Atelier Page Header with Breadcrumbs & Actions */}
      <PageHeader
        title="Billing & Invoices"
        subtitle="Create, manage and track all customer boutique invoices and receipts"
        breadcrumbs={[
          { label: 'Aleen Clothing', path: '/' },
          { label: 'Sales & POS', path: '/pos' },
          { label: 'Invoices' }
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', width: '100%', justifyContent: { xs: 'flex-start', lg: 'flex-end' } }}>
            <Button
              variant="outlined"
              startIcon={<Palette sx={{ fontSize: 18, color: (t) => t.palette.primary.main }} />}
              onClick={() => setTemplateModalOpen(true)}
              sx={{
                height: { xs: 36, sm: 40 },
                minHeight: { xs: 36, sm: 40 },
                px: { xs: 1.5, sm: 2 },
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                border: (t) => `1.5px solid ${t.palette.primary.main}`,
                color: (t) => t.palette.primary.main,
                bgcolor: 'background.paper',
                fontWeight: 700,
                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                textTransform: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  border: (t) => `1.5px solid ${t.palette.primary.dark}`,
                  bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Templates
            </Button>
            <Button
              variant="outlined"
              startIcon={<PointOfSale sx={{ fontSize: 18, color: (t) => t.palette.primary.main }} />}
              onClick={() => setCashDrawerModalOpen(true)}
              sx={{
                height: { xs: 36, sm: 40 },
                minHeight: { xs: 36, sm: 40 },
                px: { xs: 1.5, sm: 2 },
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                border: (t) => `1.5px solid ${t.palette.primary.main}`,
                color: (t) => t.palette.primary.main,
                bgcolor: 'background.paper',
                fontWeight: 700,
                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                textTransform: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  border: (t) => `1.5px solid ${t.palette.primary.dark}`,
                  bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Shift Close
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download sx={{ fontSize: 18, color: (t) => t.palette.primary.main }} />}
              onClick={downloadInvoices}
              sx={{
                height: { xs: 36, sm: 40 },
                minHeight: { xs: 36, sm: 40 },
                px: { xs: 1.5, sm: 2 },
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                border: (t) => `1.5px solid ${t.palette.primary.main}`,
                color: (t) => t.palette.primary.main,
                bgcolor: 'background.paper',
                fontWeight: 700,
                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                textTransform: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  border: (t) => `1.5px solid ${t.palette.primary.dark}`,
                  bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Export
            </Button>
            {parkedCarts.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<PauseCircle sx={{ fontSize: 18, color: '#D97706' }} />}
                onClick={() => setHeldCartsDialogOpen(true)}
                sx={{
                  height: { xs: 36, sm: 40 },
                  minHeight: { xs: 36, sm: 40 },
                  px: { xs: 1.5, sm: 2 },
                  borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                  fontWeight: 700,
                  fontSize: { xs: '0.76rem', sm: '0.82rem' },
                  textTransform: 'none',
                  border: '1.5px solid #D97706',
                  color: '#D97706',
                  bgcolor: 'rgba(217, 119, 6, 0.08)',
                  boxSizing: 'border-box',
                  '&:hover': {
                    border: '1.5px solid #B45309',
                    bgcolor: 'rgba(217, 119, 6, 0.16)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Held ({parkedCarts.length})
              </Button>
            )}
            {/* POS Keyboard Accelerators Help */}
            <Button
              variant="outlined"
              startIcon={<Keyboard sx={{ fontSize: 17, color: 'text.secondary' }} />}
              onClick={() => setShortcutHelpOpen(true)}
              sx={{
                height: { xs: 36, sm: 40 },
                minHeight: { xs: 36, sm: 40 },
                px: { xs: 1.25, sm: 1.75 },
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                fontWeight: 700,
                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                textTransform: 'none',
                display: { xs: 'none', md: 'inline-flex' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                border: isDark ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid rgba(15, 118, 110, 0.18)',
                color: 'text.secondary',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  borderColor: isDark ? '#2DD4BF' : '#0F766E',
                  color: isDark ? '#2DD4BF' : '#0F766E',
                  bgcolor: isDark ? 'rgba(20, 184, 166, 0.08)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <span>Hotkeys</span>
              <Chip
                label="F1"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  color: 'text.secondary',
                  borderRadius: '5px'
                }}
              />
            </Button>
            <Button
              variant="outlined"
              startIcon={<QrCode2 sx={{ fontSize: 18, color: (t) => t.palette.primary.main }} />}
              onClick={() => setPairModalOpen(true)}
              sx={{
                height: { xs: 36, sm: 40 },
                minHeight: { xs: 36, sm: 40 },
                px: { xs: 1.5, sm: 2 },
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                border: (t) => `1.5px solid ${t.palette.primary.main}`,
                color: (t) => t.palette.primary.main,
                bgcolor: 'background.paper',
                fontWeight: 700,
                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                textTransform: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  border: (t) => `1.5px solid ${t.palette.primary.dark}`,
                  bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Pair 2nd Screen
            </Button>
            <Button
              variant="outlined"
              startIcon={<Tv sx={{ fontSize: 18, color: (t) => t.palette.primary.main }} />}
              onClick={handleOpenCustomerDisplay}
              sx={{
                height: { xs: 36, sm: 40 },
                minHeight: { xs: 36, sm: 40 },
                px: { xs: 1.5, sm: 2 },
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                border: (t) => `1.5px solid ${t.palette.primary.main}`,
                color: (t) => t.palette.primary.main,
                bgcolor: 'background.paper',
                fontWeight: 700,
                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                textTransform: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  border: (t) => `1.5px solid ${t.palette.primary.dark}`,
                  bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Customer Screen
            </Button>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: 19, color: '#FFFFFF !important' }} />}
              onClick={handleOpenNewInvoice}
              sx={{
                height: { xs: 36, sm: 40 },
                minHeight: { xs: 36, sm: 40 },
                px: { xs: 2, sm: 2.75 },
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                fontWeight: 700,
                fontSize: { xs: '0.78rem', sm: '0.84rem' },
                textTransform: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                boxSizing: 'border-box',
                background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                color: '#FFFFFF !important',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '& .MuiSvgIcon-root': {
                  color: '#FFFFFF !important'
                },
                '&:hover': {
                  background: (t) => t.palette.primary.dark,
                  boxShadow: '0 6px 18px rgba(15, 118, 110, 0.45)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <span>Create Invoice</span>
              <Chip
                label="F2"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  bgcolor: 'rgba(255, 255, 255, 0.22)',
                  color: '#FFFFFF',
                  borderRadius: '6px'
                }}
              />
            </Button>
          </Box>
        }
      />

      {/* Atelier KPI Cards: Responsive Grid on Mobile, 3 Columns on Tablet/Desktop */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3 } }}>
        <Grid item xs={6} sm={4}>
          <AtelierKpiCard
            title={isFiltered ? "Filtered Invoices" : "Total Invoices"}
            value={displayCount}
            icon={<Receipt fontSize="small" />}
            subtitle={isFiltered ? `Filtered count (${totalInvoices} total)` : "Generated records"}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <AtelierKpiCard
            title={isFiltered ? "Filtered Revenue" : "Total Revenue"}
            value={`₹${displayRevenue.toLocaleString('en-IN')}`}
            icon={<AttachMoney fontSize="small" />}
            goldAccent={true}
            subtitle={isFiltered ? "For selected dates / filters" : "Total invoiced gross"}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AtelierKpiCard
            title="Average Ticket"
            value={`₹${displayAvgAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={<TrendingUp fontSize="small" />}
            subtitle={isFiltered ? "Average of selected invoices" : "Per completed invoice"}
          />
        </Grid>
      </Grid>

      {/* Atelier Basting Stitch Divider */}
      <AtelierStitchDivider label="Atelier Invoicing & Financial Studio" gold={true} sx={{ my: 2.5 }} />

      {/* Date Range Selection & Filter Studio */}
      <GlassCard sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: isFiltered ? 'primary.light' : 'divider' }}>
        {/* Row 1: Search Capsule + Quick Date Range Presets */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 0.6,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}>
              <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
              <TextField
                placeholder="Search invoice #, customer, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="standard"
                fullWidth
                InputProps={{ disableUnderline: true }}
                sx={{ fontSize: '0.85rem' }}
              />
              {searchTerm && (
                <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.5 }}>
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* Quick Date Presets */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mr: 0.5, display: { xs: 'none', sm: 'inline' } }}>
                Filter Dates:
              </Typography>
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'this_week', label: 'Last 7 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_30_days', label: 'Last 30 Days' }
              ].map(p => {
                const isSelected = datePreset === p.id && (!dateFrom || p.id !== 'all');
                const isAllSelected = datePreset === 'all' && !dateFrom && !dateTo && p.id === 'all';
                const active = isSelected || isAllSelected;
                return (
                  <Chip
                    key={p.id}
                    label={p.label}
                    size="small"
                    clickable
                    onClick={() => handleDatePreset(p.id)}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 28,
                      borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                      bgcolor: active ? 'primary.main' : 'action.hover',
                      color: active ? '#FFFFFF' : 'text.primary',
                      border: '1px solid',
                      borderColor: active ? 'primary.main' : 'divider',
                      '&:hover': {
                        bgcolor: active ? 'primary.dark' : 'action.selected'
                      }
                    }}
                  />
                );
              })}
            </Box>
          </Grid>
        </Grid>

        {/* Row 2: Selected Dates (From - To), Payment Method, Sorting & Actions */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          pt: 2,
          mt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          {/* From Date Picker */}
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setDatePreset('custom');
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 165 } }}
          />

          {/* To Date Picker */}
          <TextField
            label="To Date"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setDatePreset('custom');
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 165 } }}
          />

          {/* Payment Method Filter */}
          <TextField
            select
            size="small"
            label="Payment Method"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            sx={{ minWidth: 145 }}
          >
            <MenuItem value="All">All Payment Methods</MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Card">Card</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="Net Banking">Net Banking</MenuItem>
            <MenuItem value="Credit">Credit / Due</MenuItem>
          </TextField>

          {/* Sort Column */}
          <TextField
            select
            size="small"
            label="Sort By"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="total">Amount</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="paymentMethod">Payment</MenuItem>
          </TextField>

          {/* Sort Direction */}
          <TextField
            select
            size="small"
            label="Order"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            sx={{ minWidth: 125 }}
          >
            <MenuItem value="desc">Newest First</MenuItem>
            <MenuItem value="asc">Oldest First</MenuItem>
          </TextField>

          {/* Reset Filters CTA */}
          {isFiltered && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RestartAlt fontSize="small" />}
              onClick={handleClearFilters}
              sx={{
                height: 38,
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                px: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                ml: { sm: 'auto' },
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: (t) => `${t.palette.primary.main}12`
                }
              }}
            >
              Reset Filters
            </Button>
          )}
        </Box>

        {/* Row 3: Active Date Filter Summary Badge */}
        {isFiltered && (
          <Box sx={{
            mt: 2,
            p: 1.25,
            px: 2,
            borderRadius: 2,
            bgcolor: 'rgba(15, 118, 110, 0.06)',
            border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1
          }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.82rem' }}>
              Showing <strong>{filteredInvoices.length}</strong> {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
              {(dateFrom || dateTo) && (
                <span>
                  {' '}for <strong>{dateFrom ? new Date(dateFrom.split('-')[0], dateFrom.split('-')[1]-1, dateFrom.split('-')[2]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'All prior dates'}</strong>
                  {' to '}
                  <strong>{dateTo ? new Date(dateTo.split('-')[0], dateTo.split('-')[1]-1, dateTo.split('-')[2]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Present'}</strong>
                </span>
              )}
              {paymentFilter !== 'All' && <span> • Payment: <strong>{paymentFilter}</strong></span>}
              {searchTerm && <span> • Search: "<em>{searchTerm}</em>"</span>}
              {' • Total Value: '}
              <strong style={{ color: (t) => t.palette.primary.main }}>₹{displayRevenue.toLocaleString('en-IN')}</strong>
            </Typography>

            <Chip
              label="Reset Dates"
              size="small"
              onDelete={handleClearFilters}
              onClick={handleClearFilters}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: (t) => t.palette.primary.main,
                color: '#FFFFFF',
                '& .MuiChip-deleteIcon': {
                  color: '#FFFFFF',
                  '&:hover': { color: '#FEE2E2' }
                }
              }}
            />
          </Box>
        )}
      </GlassCard>

      {/* Invoice List (Mobile) or Table (Desktop) */}
      {
        isMobile ? (
          <Box>
            {sortedInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(inv => (
              <GlassCard
                key={inv.id}
                hover
                sx={{
                  mb: 2,
                  p: 0,
                  borderRadius: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(20, 184, 166, 0.18)' : '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.12)',
                  boxShadow: (t) => t.palette.mode === 'dark'
                    ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.35)'
                    : 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 2px 12px rgba(var(--primary-rgb, 15, 118, 110), 0.04)'
                }}
              >
                {/* Top Metallic Accent Bar */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: (t) => `linear-gradient(90deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 50%, ${t.palette.primary.light} 100%)`
                  }}
                />

                <CardContent sx={{ p: 2.25, pt: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: 700,
                          color: (t) => t.palette.primary.main,
                          fontSize: '0.78rem',
                          px: 0.8,
                          py: 0.2,
                          borderRadius: '6px',
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.12)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
                          display: 'inline-block',
                          mb: 0.5
                        }}
                      >
                        #{inv.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.73rem' }}>
                        {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <Chip
                      label={inv.paymentMethod}
                      size="small"
                      sx={{
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        height: 22,
                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.18)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.12)',
                        color: (t) => t.palette.mode === 'dark' ? '#2DD4BF' : '#0F766E',
                        border: (t) => `1px solid ${t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.3)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.2)'}`
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          color: (t) => t.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {(inv.customer || 'W').charAt(0).toUpperCase()}
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.82rem' }}>
                        {inv.customer || 'Walk-in Customer'}
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontWeight: 900,
                        color: 'text.primary',
                        fontSize: '1.05rem',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      ₹{inv.total.toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.25, borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: 'text.secondary',
                        fontSize: '0.72rem',
                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        px: 1,
                        py: 0.3,
                        borderRadius: '6px'
                      }}
                    >
                      {inv.items?.length || 0} {inv.items?.length === 1 ? 'Item' : 'Items'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Tooltip title="View Invoice">
                        <IconButton
                          size="small"
                          onClick={() => setViewInvoice(inv)}
                          sx={{
                            width: 28,
                            height: 28,
                            color: (t) => t.palette.primary.main,
                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.12)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
                            border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)'
                          }}
                        >
                          <Visibility sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Receipt">
                        <IconButton
                          size="small"
                          onClick={() => handlePrint(inv)}
                          sx={{
                            width: 28,
                            height: 28,
                            color: '#0284C7',
                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                            border: '1px solid rgba(2, 132, 199, 0.2)'
                          }}
                        >
                          <Print sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="WhatsApp E-Receipt">
                        <IconButton
                          size="small"
                          onClick={() => sendWhatsApp(inv)}
                          sx={{
                            width: 28,
                            height: 28,
                            color: '#059669',
                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.08)',
                            border: '1px solid rgba(5, 150, 105, 0.25)'
                          }}
                        >
                          <WhatsApp sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, inv.id)}
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF'
                        }}
                      >
                        <MoreVert sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && selectedInvoiceId === inv.id}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        width: 270,
                        p: '8px',
                        borderRadius: '16px',
                        border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(20, 184, 166, 0.22)' : '1px solid rgba(15, 118, 110, 0.16)',
                        background: (t) => t.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 44px -10px rgba(var(--primary-rgb, 15, 118, 110), 0.2), 0 8px 24px -6px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        mb: 0.75,
                        borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)',
                        border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.1)'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            color: (t) => t.palette.primary.main
                          }}
                        >
                          #{inv.invoiceNumber || inv.id?.slice(0, 8)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 900,
                            fontSize: '0.82rem',
                            color: (t) => t.palette.primary.main,
                            fontVariantNumeric: 'tabular-nums'
                          }}
                        >
                          ₹{Number(inv.total || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.3,
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {inv.customer || 'Walk-in Client'} {inv.phone ? `• ${inv.phone}` : ''}
                      </Typography>
                    </Box>

                    <MenuItem
                      onClick={() => { setViewInvoice(inv); handleMenuClose(); }}
                      sx={{
                        py: 0.9,
                        px: 1.2,
                        borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                        my: 0.25,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.12)' : 'rgba(15, 118, 110, 0.07)',
                          transform: 'translateX(3px)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                          color: (t) => t.palette.primary.main,
                          mr: 1.4,
                          flexShrink: 0
                        }}
                      >
                        <Visibility sx={{ fontSize: 17 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                          View Bill
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.69rem' }}>
                          Inspect line items, tax & tenders
                        </Typography>
                      </Box>
                    </MenuItem>

                    <MenuItem
                      onClick={() => { handlePrint(inv); handleMenuClose(); }}
                      sx={{
                        py: 0.9,
                        px: 1.2,
                        borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                        my: 0.25,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: 'rgba(2, 132, 199, 0.07)',
                          transform: 'translateX(3px)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(2, 132, 199, 0.1)',
                          color: '#0284C7',
                          mr: 1.4,
                          flexShrink: 0
                        }}
                      >
                        <Print sx={{ fontSize: 17 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                          Print Receipt
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.69rem' }}>
                          Fast thermal slip or A4 format
                        </Typography>
                      </Box>
                    </MenuItem>

                    <MenuItem
                      onClick={() => { downloadPDF(inv); handleMenuClose(); }}
                      sx={{
                        py: 0.9,
                        px: 1.2,
                        borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                        my: 0.25,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: 'rgba(217, 119, 6, 0.07)',
                          transform: 'translateX(3px)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(217, 119, 6, 0.1)',
                          color: '#D97706',
                          mr: 1.4,
                          flexShrink: 0
                        }}
                      >
                        <Download sx={{ fontSize: 17 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                          Download PDF
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.69rem' }}>
                          Export official customer PDF
                        </Typography>
                      </Box>
                    </MenuItem>

                    <MenuItem
                      onClick={() => { sendWhatsApp(inv); handleMenuClose(); }}
                      sx={{
                        py: 0.9,
                        px: 1.2,
                        borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                        my: 0.25,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: 'rgba(5, 150, 105, 0.08)',
                          transform: 'translateX(3px)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(5, 150, 105, 0.12)',
                          color: '#059669',
                          mr: 1.4,
                          flexShrink: 0
                        }}
                      >
                        <WhatsApp sx={{ fontSize: 17 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                          WhatsApp Bill
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.69rem' }}>
                          Send instant link to {inv.phone ? inv.phone : 'customer'}
                        </Typography>
                      </Box>
                    </MenuItem>

                    {user?.role === 'admin' && (
                      <>
                        <Divider sx={{ my: 0.75, borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                        <MenuItem
                          onClick={() => { openDeleteDialog(inv.id); handleMenuClose(); }}
                          sx={{
                            py: 0.9,
                            px: 1.2,
                            borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                            my: 0.25,
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: 'rgba(220, 38, 38, 0.08)',
                              transform: 'translateX(3px)'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'rgba(220, 38, 38, 0.1)',
                              color: '#DC2626',
                              mr: 1.4,
                              flexShrink: 0
                            }}
                          >
                            <Delete sx={{ fontSize: 17 }} />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2, color: '#DC2626' }}>
                              Delete Invoice
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(220, 38, 38, 0.7)', fontSize: '0.69rem' }}>
                              Permanent ledger removal
                            </Typography>
                          </Box>
                        </MenuItem>
                      </>
                    )}
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
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <TableSortLabel active={orderBy === 'id'} direction={orderBy === 'id' ? order : 'asc'} onClick={() => handleRequestSort('id')}>
                        Invoice Details
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <TableSortLabel active={orderBy === 'date'} direction={orderBy === 'date' ? order : 'asc'} onClick={() => handleRequestSort('date')}>
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: { xs: 'none', sm: 'table-cell' } }}>
                      <TableSortLabel active={orderBy === 'customer'} direction={orderBy === 'customer' ? order : 'asc'} onClick={() => handleRequestSort('customer')}>
                        Customer
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel active={orderBy === 'paymentMethod'} direction={orderBy === 'paymentMethod' ? order : 'asc'} onClick={() => handleRequestSort('paymentMethod')}>
                        Payment
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <TableSortLabel active={orderBy === 'total'} direction={orderBy === 'total' ? order : 'asc'} onClick={() => handleRequestSort('total')}>
                        Amount
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', pr: 2.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableSkeleton rows={rowsPerPage} columns={6} />
                  ) : sortedInvoices.length > 0 ? (
                    sortedInvoices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((inv, idx) => (
                      <TableRow
                        key={inv.id}
                        hover
                        sx={{
                          '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 118, 110, 0.03)' },
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: '"JetBrains Mono", monospace',
                                  fontWeight: 800,
                                  color: (t) => t.palette.primary.main,
                                  fontSize: '0.76rem',
                                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.12)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
                                  px: 0.85,
                                  py: 0.25,
                                  borderRadius: '6px',
                                  border: '1px solid',
                                  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.25)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.15)',
                                  letterSpacing: '0.02em',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                #{inv.id}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <ShoppingBagOutlined sx={{ fontSize: 13, color: 'text.secondary' }} /> {inv.items?.length || 0} {inv.items?.length === 1 ? 'Item' : 'Items'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <CalendarMonth sx={{ fontSize: 16, color: (t) => t.palette.primary.main, opacity: 0.7 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem' }}>
                                {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', fontWeight: 500 }}>
                                {new Date(inv.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.18)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.12)',
                                color: (t) => t.palette.primary.main,
                                border: '1.5px solid rgba(var(--primary-rgb, 15, 118, 110), 0.22)'
                              }}
                            >
                              {(inv.customer || 'W').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.86rem', letterSpacing: '-0.01em', textTransform: 'capitalize' }}>
                                {inv.customer || 'Walk-in Client'}
                              </Typography>
                              {inv.phone && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                  <Phone sx={{ fontSize: 11, opacity: 0.6 }} /> {inv.phone}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {(() => {
                            const pMethod = String(inv.paymentMethod || 'Cash').toLowerCase();
                            const isCash = pMethod.includes('cash');
                            const isUpi = pMethod.includes('upi');
                            const isCard = pMethod.includes('card');
                            const isSplit = pMethod.includes('split');

                            const colorConfig = isCash
                              ? { bg: 'rgba(5, 150, 105, 0.12)', color: '#059669', border: 'rgba(5, 150, 105, 0.3)', dot: '#10B981', label: 'CASH' }
                              : isUpi
                              ? { bg: 'rgba(217, 119, 6, 0.12)', color: '#D97706', border: 'rgba(217, 119, 6, 0.3)', dot: '#F59E0B', label: 'UPI' }
                              : isCard
                              ? { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563EB', border: 'rgba(37, 99, 235, 0.3)', dot: '#3B82F6', label: 'CARD' }
                              : { bg: 'rgba(147, 51, 234, 0.12)', color: '#7C3AED', border: 'rgba(147, 51, 234, 0.3)', dot: '#8B5CF6', label: inv.paymentMethod || 'SPLIT' };

                            return (
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.7,
                                  px: 1.1,
                                  py: 0.35,
                                  borderRadius: '8px',
                                  bgcolor: colorConfig.bg,
                                  border: `1px solid ${colorConfig.border}`,
                                  color: colorConfig.color
                                }}
                              >
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: colorConfig.dot, boxShadow: `0 0 6px ${colorConfig.dot}` }} />
                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                  {colorConfig.label}
                                </Typography>
                              </Box>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 900,
                              fontSize: '0.96rem',
                              color: (t) => t.palette.primary.main,
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          >
                            ₹{Number(inv.total || 0).toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.75,
                              p: '3px 6px',
                              borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.08)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)',
                              border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.12)'
                            }}
                          >
                            <Tooltip title="View Invoice">
                              <IconButton
                                size="small"
                                onClick={() => setViewInvoice(inv)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  color: (t) => t.palette.primary.main,
                                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                  border: '1px solid rgba(15, 118, 110, 0.16)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                  transition: 'all 0.18s ease',
                                  '&:hover': {
                                    bgcolor: (t) => t.palette.primary.main,
                                    color: '#FFFFFF',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 10px rgba(15, 118, 110, 0.3)'
                                  }
                                }}
                              >
                                <Visibility sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print Receipt">
                              <IconButton
                                size="small"
                                onClick={() => handlePrint(inv)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  color: '#0284C7',
                                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                  border: '1px solid rgba(2, 132, 199, 0.18)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                  transition: 'all 0.18s ease',
                                  '&:hover': {
                                    bgcolor: '#0284C7',
                                    color: '#FFFFFF',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)'
                                  }
                                }}
                              >
                                <Print sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Send WhatsApp E-Receipt">
                              <IconButton
                                size="small"
                                onClick={() => sendWhatsApp(inv)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  color: '#059669',
                                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(5, 150, 105, 0.16)' : 'rgba(5, 150, 105, 0.09)',
                                  border: '1px solid rgba(5, 150, 105, 0.28)',
                                  boxShadow: '0 1px 3px rgba(5, 150, 105, 0.1)',
                                  transition: 'all 0.18s ease',
                                  '&:hover': {
                                    bgcolor: '#059669',
                                    color: '#FFFFFF',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
                                  }
                                }}
                              >
                                <WhatsApp sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More Options">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuClick(e, inv.id)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  color: selectedInvoiceId === inv.id ? '#0F766E' : 'text.secondary',
                                  bgcolor: selectedInvoiceId === inv.id
                                    ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.14)'
                                    : (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                  border: '1px solid rgba(0, 0, 0, 0.08)',
                                  transition: 'all 0.18s ease',
                                  '&:hover': {
                                    bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                                    color: (t) => t.palette.primary.main,
                                    borderColor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.25)'
                                  }
                                }}
                              >
                                <MoreVert sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl) && selectedInvoiceId === inv.id}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{
                              elevation: 0,
                              sx: {
                                width: 270,
                                p: '8px',
                                borderRadius: '16px',
                                border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(20, 184, 166, 0.22)' : '1px solid rgba(15, 118, 110, 0.16)',
                                background: (t) => t.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 20px 44px -10px rgba(var(--primary-rgb, 15, 118, 110), 0.2), 0 8px 24px -6px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                          >
                            <Box
                              sx={{
                                px: 1.5,
                                py: 1.1,
                                mb: 0.75,
                                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)',
                                border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.1)'
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    fontSize: '0.74rem',
                                    color: (t) => t.palette.primary.main
                                  }}
                                >
                                  #{inv.invoiceNumber || inv.id?.slice(0, 8)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: '0.82rem',
                                    color: (t) => t.palette.primary.main,
                                    fontVariantNumeric: 'tabular-nums'
                                  }}
                                >
                                  ₹{Number(inv.total || 0).toLocaleString('en-IN')}
                                </Typography>
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mt: 0.3,
                                  color: 'text.secondary',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  textTransform: 'capitalize',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {inv.customer || 'Walk-in Client'} {inv.phone ? `• ${inv.phone}` : ''}
                              </Typography>
                            </Box>

                            <MenuItem
                              onClick={() => { setViewInvoice(inv); handleMenuClose(); }}
                              sx={{
                                py: 0.9,
                                px: 1.2,
                                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                my: 0.25,
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.12)' : 'rgba(15, 118, 110, 0.07)',
                                  transform: 'translateX(3px)'
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                                  color: (t) => t.palette.primary.main,
                                  mr: 1.4,
                                  flexShrink: 0
                                }}
                              >
                                <Visibility sx={{ fontSize: 17 }} />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                                  View Bill
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.69rem' }}>
                                  Inspect line items, tax & tenders
                                </Typography>
                              </Box>
                            </MenuItem>

                            <MenuItem
                              onClick={() => { handlePrint(inv); handleMenuClose(); }}
                              sx={{
                                py: 0.9,
                                px: 1.2,
                                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                my: 0.25,
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  bgcolor: 'rgba(2, 132, 199, 0.07)',
                                  transform: 'translateX(3px)'
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'rgba(2, 132, 199, 0.1)',
                                  color: '#0284C7',
                                  mr: 1.4,
                                  flexShrink: 0
                                }}
                              >
                                <Print sx={{ fontSize: 17 }} />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                                  Print Receipt
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.69rem' }}>
                                  Fast thermal slip or A4 format
                                </Typography>
                              </Box>
                            </MenuItem>

                            <MenuItem
                              onClick={() => { downloadPDF(inv); handleMenuClose(); }}
                              sx={{
                                py: 0.9,
                                px: 1.2,
                                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                my: 0.25,
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  bgcolor: 'rgba(217, 119, 6, 0.07)',
                                  transform: 'translateX(3px)'
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'rgba(217, 119, 6, 0.1)',
                                  color: '#D97706',
                                  mr: 1.4,
                                  flexShrink: 0
                                }}
                              >
                                <Download sx={{ fontSize: 17 }} />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                                  Download PDF
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.69rem' }}>
                                  Export official customer PDF
                                </Typography>
                              </Box>
                            </MenuItem>

                            <MenuItem
                              onClick={() => { sendWhatsApp(inv); handleMenuClose(); }}
                              sx={{
                                py: 0.9,
                                px: 1.2,
                                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                my: 0.25,
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  bgcolor: 'rgba(5, 150, 105, 0.08)',
                                  transform: 'translateX(3px)'
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'rgba(5, 150, 105, 0.12)',
                                  color: '#059669',
                                  mr: 1.4,
                                  flexShrink: 0
                                }}
                              >
                                <WhatsApp sx={{ fontSize: 17 }} />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>
                                  WhatsApp Bill
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.69rem' }}>
                                  Send instant link to {inv.phone ? inv.phone : 'customer'}
                                </Typography>
                              </Box>
                            </MenuItem>

                            {user?.role === 'admin' && (
                              <>
                                <Divider sx={{ my: 0.75, borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                                <MenuItem
                                  onClick={() => { openDeleteDialog(inv.id); handleMenuClose(); }}
                                  sx={{
                                    py: 0.9,
                                    px: 1.2,
                                    borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                    my: 0.25,
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: 'rgba(220, 38, 38, 0.08)',
                                      transform: 'translateX(3px)'
                                    }
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'rgba(220, 38, 38, 0.1)',
                                      color: '#DC2626',
                                      mr: 1.4,
                                      flexShrink: 0
                                    }}
                                  >
                                    <Delete sx={{ fontSize: 17 }} />
                                  </Box>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2, color: '#DC2626' }}>
                                      Delete Invoice
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(220, 38, 38, 0.7)', fontSize: '0.69rem' }}>
                                      Permanent ledger removal
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              </>
                            )}
                          </Menu>
                        </TableCell>
                      </TableRow>
                    ))) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                        <Receipt sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                          {isFiltered ? 'No invoices found for selected dates' : 'No invoices found'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 400, mx: 'auto' }}>
                          {isFiltered
                            ? 'No invoice records match your active date range or search query. Try picking different dates or reset your filters.'
                            : 'Create your first invoice to get started.'}
                        </Typography>
                        {isFiltered && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RestartAlt />}
                            onClick={handleClearFilters}
                            sx={{
                              mt: 2,
                              borderRadius: 2,
                              bordercolor: (t) => t.palette.primary.main,
                              color: (t) => t.palette.primary.main,
                              fontWeight: 700,
                              textTransform: 'none'
                            }}
                          >
                            Reset Date Range
                          </Button>
                        )}
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
        onClose={handleCloseInvoiceModal}
        maxWidth="lg"
        fullWidth
        fullScreen={isTablet}
        PaperProps={{
          sx: {
            borderRadius: isTablet ? 0 : '14px',
            overflow: 'hidden',
            maxHeight: isTablet ? '100%' : '92vh',
            boxShadow: '0 24px 60px rgba(var(--primary-rgb, 15, 118, 110), 0.22)'
          }
        }}
      >
        <DialogTitle sx={{
          background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
          color: '#FFFFFF',
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 1.25, sm: 1.75 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          borderBottom: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          {/* Left: Avatar + Title + Badges */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0, flex: 1 }}>
            <Avatar sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              width: { xs: 34, sm: 40 },
              height: { xs: 34, sm: 40 },
              flexShrink: 0,
              border: '1px solid rgba(255, 255, 255, 0.45)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              <PointOfSale sx={{ fontSize: { xs: 18, sm: 22 }, color: '#FFFFFF !important' }} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography sx={{ 
                  fontWeight: 800, 
                  fontSize: { xs: '0.92rem', sm: '1.15rem' }, 
                  letterSpacing: '-0.01em', 
                  color: '#FFFFFF !important',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap'
                }}>
                  Create Retail Invoice
                </Typography>
                <Chip
                  label={isMobile ? "POS" : "POS Checkout"}
                  size="small"
                  sx={{
                    height: { xs: 18, sm: 20 },
                    fontSize: { xs: '0.62rem', sm: '0.68rem' },
                    fontWeight: 800,
                    bgcolor: 'rgba(255, 255, 255, 0.22)',
                    color: '#FFFFFF !important',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    px: { xs: 0.25, sm: 0.5 }
                  }}
                />
              </Box>
              <Typography 
                variant="caption" 
                noWrap
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.85)', 
                  display: 'block', 
                  fontSize: { xs: '0.68rem', sm: '0.75rem' },
                  mt: 0.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Aleen Clothing Luxury Billing & Client Ledger
              </Typography>
            </Box>
          </Box>

          {/* Right: Sound Voice Toggle + Customer Screen + Park Cart + Close Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.6, sm: 1 }, flexShrink: 0 }}>
            {/* Interactive Voice & Sound Confirmations Toggle */}
            <Tooltip title={voiceSettings.voiceEnabled ? "Voice Confirmations: Active (Click to mute)" : "Voice Confirmations: Muted (Click to enable)"}>
              <IconButton
                size="small"
                onClick={handleToggleVoice}
                className="header-contrast-btn"
                sx={{
                  color: '#FFFFFF !important',
                  bgcolor: voiceSettings.voiceEnabled ? 'rgba(255, 255, 255, 0.28) !important' : 'rgba(255, 255, 255, 0.12) !important',
                  border: '1px solid rgba(255, 255, 255, 0.45) !important',
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  borderRadius: '8px !important',
                  boxShadow: voiceSettings.voiceEnabled ? '0 0 10px rgba(255, 255, 255, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.36) !important',
                    borderColor: '#FFFFFF !important'
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#FFFFFF !important'
                  }
                }}
              >
                {voiceSettings.voiceEnabled ? <VolumeUp sx={{ fontSize: 18 }} /> : <VolumeOff sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            {/* Pair 2nd Device (iPad / Tablet / Phone) QR Launcher */}
            <Tooltip title="Scan QR Code to connect iPad, Tablet or Phone as Customer Screen">
              <Button
                size="small"
                onClick={() => setPairModalOpen(true)}
                startIcon={<QrCode2 sx={{ fontSize: { xs: 15, sm: 17 }, color: '#FFFFFF !important' }} />}
                className="header-contrast-btn"
                sx={{
                  color: '#FFFFFF !important',
                  background: 'rgba(255, 255, 255, 0.2) !important',
                  border: '1px solid rgba(255, 255, 255, 0.45) !important',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px !important',
                  height: { xs: 32, sm: 36 },
                  minHeight: { xs: 32, sm: 36 },
                  px: { xs: 1, sm: 1.5 },
                  py: 0,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '0.72rem', sm: '0.8rem' },
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.2s ease',
                  '& .MuiSvgIcon-root': {
                    color: '#FFFFFF !important'
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.32) !important',
                    borderColor: '#FFFFFF !important',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Pair iPad / Phone</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Pair</Box>
              </Button>
            </Tooltip>

            {/* Customer Facing Display Launcher */}
            <Tooltip title="Launch 2nd Monitor Customer Facing Display (Dual-Screen Mirror)">
              <Button
                size="small"
                onClick={handleOpenCustomerDisplay}
                startIcon={<Tv sx={{ fontSize: { xs: 15, sm: 17 }, color: '#FFFFFF !important' }} />}
                className="header-contrast-btn"
                sx={{
                  color: '#FFFFFF !important',
                  background: 'rgba(255, 255, 255, 0.2) !important',
                  border: '1px solid rgba(255, 255, 255, 0.45) !important',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px !important',
                  height: { xs: 32, sm: 36 },
                  minHeight: { xs: 32, sm: 36 },
                  px: { xs: 1, sm: 1.5 },
                  py: 0,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '0.72rem', sm: '0.8rem' },
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.2s ease',
                  '& .MuiSvgIcon-root': {
                    color: '#FFFFFF !important'
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.32) !important',
                    borderColor: '#FFFFFF !important',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Customer Screen ↗</Box>
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Screen ↗</Box>
              </Button>
            </Tooltip>

            {/* Park Cart Button */}
            <Tooltip title="Park current cart to resume later">
              <Button
                size="small"
                onClick={handleParkCart}
                startIcon={<PauseCircleOutline sx={{ fontSize: { xs: 15, sm: 17 }, color: '#FFFFFF !important' }} />}
                className="header-contrast-btn"
                sx={{
                  color: '#FFFFFF !important',
                  background: 'rgba(255, 255, 255, 0.2) !important',
                  border: '1px solid rgba(255, 255, 255, 0.45) !important',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px !important',
                  height: { xs: 32, sm: 36 },
                  minHeight: { xs: 32, sm: 36 },
                  px: { xs: 1, sm: 1.5 },
                  py: 0,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '0.72rem', sm: '0.8rem' },
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.2s ease',
                  '& .MuiSvgIcon-root': {
                    color: '#FFFFFF !important'
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.32) !important',
                    borderColor: '#FFFFFF !important',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Park Cart</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Park</Box>
              </Button>
            </Tooltip>

            {/* Close Button */}
            <IconButton 
              onClick={handleCloseInvoiceModal} 
              size="small"
              className="header-contrast-btn"
              sx={{ 
                color: '#FFFFFF !important',
                background: 'rgba(255, 255, 255, 0.15) !important',
                border: '1px solid rgba(255, 255, 255, 0.35) !important',
                borderRadius: '8px !important',
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                transition: 'all 0.2s ease',
                '&:hover': { 
                  color: '#FFFFFF !important', 
                  background: 'rgba(255, 255, 255, 0.32) !important', 
                  borderColor: '#FFFFFF !important' 
                },
                '& .MuiSvgIcon-root': {
                  color: '#FFFFFF !important'
                }
              }}
            >
              <Close sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, bgcolor: mode === 'light' ? '#F8FAFC' : 'background.default' }}>
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            {/* Left Column: Customer & Item Cart */}
            <Grid item xs={12} md={7}>
              {/* Customer Information Card */}
              <Paper sx={{
                p: 2.5,
                mb: 2.5,
                bgcolor: 'background.paper',
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonOutline sx={{ color: (t) => t.palette.primary.main, fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                      Client Details
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {matchedCustomer && (
                      <>
                        <Chip
                          size="small"
                          icon={<Stars sx={{ '&&': { color: matchedCustomer.loyaltyTier === 'Platinum' ? '#7C3AED' : matchedCustomer.loyaltyTier === 'Gold' ? '#D97706' : '#0F766E', fontSize: 16 } }} />}
                          label={`${matchedCustomer.loyaltyTier || 'Bronze'} VIP • ${matchedCustomer.loyaltyPoints || 0} pts`}
                          sx={{
                            bgcolor: matchedCustomer.loyaltyTier === 'Platinum' ? 'rgba(124, 58, 237, 0.1)' : matchedCustomer.loyaltyTier === 'Gold' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                            color: matchedCustomer.loyaltyTier === 'Platinum' ? '#7C3AED' : matchedCustomer.loyaltyTier === 'Gold' ? '#D97706' : '#0F766E',
                            fontWeight: 700,
                            height: 24,
                            border: '1px solid',
                            borderColor: matchedCustomer.loyaltyTier === 'Platinum' ? 'rgba(124, 58, 237, 0.25)' : matchedCustomer.loyaltyTier === 'Gold' ? 'rgba(217, 119, 6, 0.25)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.25)'
                          }}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Straighten sx={{ fontSize: 15 }} />}
                          onClick={() => {
                            setMeasurementCustomer(matchedCustomer);
                            setMeasurementModalOpen(true);
                          }}
                          sx={{
                            textTransform: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            py: 0.2,
                            px: 1,
                            bordercolor: (t) => t.palette.primary.main,
                            color: (t) => t.palette.primary.main,
                            '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)', bordercolor: (t) => t.palette.primary.main }
                          }}
                        >
                          {matchedCustomer.measurements ? 'Fitted' : 'Measure'}
                        </Button>
                        <Tooltip title="Reset patron to walk-in">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setCustomer('');
                              setPhone('+91');
                              setSelectedCustomerId(null);
                              setLoyaltyPointsToRedeem(0);
                            }}
                            sx={{ color: 'text.secondary', p: 0.5 }}
                          >
                            <Clear sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Autocomplete
                    freeSolo
                    size="small"
                    options={customers}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return `${option.name || ''} (${option.phone || ''})`;
                    }}
                    value={matchedCustomer || customer}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'object' && newValue !== null) {
                        setCustomer(toSentenceCase(newValue.name || ''));
                        setPhone(newValue.phone || '+91');
                        setSelectedCustomerId(newValue.id);
                        if (clientValidationErrors.customer) {
                          setClientValidationErrors(prev => ({ ...prev, customer: false }));
                        }
                      } else if (typeof newValue === 'string') {
                        setCustomer(toSentenceCase(newValue));
                        setSelectedCustomerId(null);
                      } else {
                        setCustomer('');
                        setPhone('+91');
                        setSelectedCustomerId(null);
                        setLoyaltyPointsToRedeem(0);
                      }
                    }}
                    onInputChange={(event, newInputValue, reason) => {
                      if (reason === 'input') {
                        setCustomer(toSentenceCase(newInputValue));
                        setSelectedCustomerId(null);
                        if (clientValidationErrors.customer) {
                          setClientValidationErrors(prev => ({ ...prev, customer: false }));
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer Name / Lookup Patron"
                        fullWidth
                        required
                        error={clientValidationErrors.customer}
                        placeholder="e.g. Saira banu or search phone"
                        helperText={clientValidationErrors.customer ? "Customer Name is mandatory before generating a bill" : "Type client name or select existing patron from records"}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', py: 0.8 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{option.phone}</Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={`${option.loyaltyTier || 'Bronze'} • ${option.loyaltyPoints || 0} pts`}
                          sx={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: option.loyaltyTier === 'Platinum' ? 'rgba(124, 58, 237, 0.1)' : option.loyaltyTier === 'Gold' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                            color: option.loyaltyTier === 'Platinum' ? '#7C3AED' : option.loyaltyTier === 'Gold' ? '#D97706' : '#0F766E'
                          }}
                        />
                      </Box>
                    )}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="Phone Number"
                    size="small"
                    required
                    error={clientValidationErrors.phone}
                    helperText={clientValidationErrors.phone ? "Valid 10-digit mobile number is mandatory" : undefined}
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
                      if (clientValidationErrors.phone) {
                        setClientValidationErrors(prev => ({ ...prev, phone: false }));
                      }

                      if (newPhone.length === 13) {
                        const matched = customers.find(c => c.phone === newPhone || c.phone === cleanedSuffix);
                        if (matched) {
                          setCustomer(toSentenceCase(matched.name));
                          setSelectedCustomerId(matched.id);
                        }
                      }
                    }}
                    onBlur={() => {
                      const val = phone.trim();
                      if (val.length > 3) {
                        const matched = customers.find(c => c.phone === val || c.phone === val.replace('+91', '').trim());
                        if (matched) {
                          setCustomer(toSentenceCase(matched.name));
                          setSelectedCustomerId(matched.id);
                        }
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const val = phone.trim();
                        const matched = customers.find(c => c.phone === val || c.phone === val.replace('+91', '').trim());
                        if (matched) {
                          setCustomer(toSentenceCase(matched.name));
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
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingBagOutlined sx={{ color: (t) => t.palette.primary.main, fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                      Selected Garments & Merchandise ({selectedItems.filter(i => i.id).length})
                    </Typography>
                  </Box>
                </Box>

                {/* Scan Feedback Banner */}
                {scanFeedback && (
                  <Alert
                    severity={scanFeedback.type}
                    icon={scanFeedback.type === 'success' ? <CheckCircle /> : undefined}
                    onClose={() => {
                      setScanFeedback(null);
                      setUnrecognizedScan(null);
                    }}
                    action={
                      unrecognizedScan ? (
                        <Button
                          color="inherit"
                          size="small"
                          onClick={() => {
                            setSelectedItems(prev => [
                              ...prev.filter(i => i.id || i.isCustom),
                              {
                                id: 'custom_' + Date.now(),
                                quantity: 1,
                                variantSku: '',
                                isCustom: true,
                                customName: `Custom Garment (${unrecognizedScan})`,
                                customPrice: 0,
                                customCost: 0
                              }
                            ]);
                            setScanFeedback({ type: 'success', message: `Added "${unrecognizedScan}" as custom item. Enter sale price below.` });
                            setUnrecognizedScan(null);
                          }}
                          sx={{
                            fontWeight: 800,
                            textTransform: 'none',
                            border: '1px solid currentColor',
                            borderRadius: 1.5,
                            fontSize: '0.72rem',
                            py: 0.3,
                            px: 1
                          }}
                        >
                          + Add to Bill Anyway
                        </Button>
                      ) : undefined
                    }
                    sx={{
                      mb: 2,
                      borderRadius: 2.5,
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                  >
                    {scanFeedback.message}
                  </Alert>
                )}

                {/* Quick Add / Scan Barcode Bar */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <QrCodeScanner sx={{ fontSize: 15 }} /> Scan Barcode or SKU
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Chip
                        icon={<Sensors sx={{ fontSize: '13px !important', color: '#059669' }} />}
                        label="Phone & Scanner Ready"
                        size="small"
                        onClick={() => setPhonePairModalOpen(true)}
                        sx={{
                          cursor: 'pointer',
                          height: 22,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          bgcolor: 'rgba(5, 150, 105, 0.08)',
                          color: '#059669',
                          border: '1px solid rgba(5, 150, 105, 0.25)',
                          '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.16)' }
                        }}
                      />
                    </Box>
                  </Box>

                  <TextField
                    inputRef={quickAddInputRef}
                    fullWidth
                    size="small"
                    placeholder="Aim scanner gun or type barcode / product ID and hit Enter..."
                    value={itemSearchTerm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItemSearchTerm(val);
                      // If exact match found while typing or scanner pasted
                      if (val.trim().length >= 3) {
                        const directMatch = findProductByCode(val.trim());
                        if (directMatch && directMatch.product) {
                          handleProcessBarcode(val.trim(), 'Barcode Scanner');
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (itemSearchTerm.trim()) {
                          handleProcessBarcode(itemSearchTerm.trim(), 'Barcode Quick Add');
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end" sx={{ display: 'flex', gap: 0.5 }}>
                          {itemSearchTerm.trim() && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleProcessBarcode(itemSearchTerm.trim(), 'Barcode Quick Add')}
                              sx={{
                                py: 0.2,
                                px: 1,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                textTransform: 'none',
                                borderRadius: 1.5,
                                bgcolor: (t) => t.palette.primary.main,
                                color: '#fff'
                              }}
                            >
                              Add
                            </Button>
                          )}
                          <Tooltip title="Scan using Camera / Phone Viewfinder">
                            <IconButton size="small" onClick={() => setScannerOpen(true)} sx={{ color: (t) => t.palette.primary.main }}>
                              <CameraAlt fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: '9px', bgcolor: 'background.paper' }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mt: 0.5, pl: 0.5 }}>
                    💡 <em>Tip: Pull the trigger on your Bluetooth scanner gun or scan via phone — items add automatically without clicking!</em>
                  </Typography>
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

                {/* Phone Camera Pairing Dialog */}
                <Dialog
                  open={phonePairModalOpen}
                  onClose={() => setPhonePairModalOpen(false)}
                  maxWidth="xs"
                  fullWidth
                  PaperProps={{ sx: { borderRadius: '14px' } }}
                >
                  <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneAndroid sx={{ color: '#D97706' }} /> Link Phone Camera Scanner
                    </Box>
                    <IconButton size="small" onClick={() => setPhonePairModalOpen(false)}><Close /></IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                      Scan this QR code with your iPhone or Android camera to instantly stream scans into this invoice:
                    </Typography>
                    <Box sx={{ display: 'inline-block', p: 1.5, bgcolor: '#fff', borderRadius: 3, border: '2px solid #0F766E', mb: 2 }}>
                      <Box component="img" src={phoneQrApiUrl} alt="Pairing QR Code" sx={{ width: 200, height: 200, display: 'block' }} />
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2 }}>
                      Connected Workstation: <strong>{getActiveWorkstationToken()}</strong>
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={() => {
                        navigator.clipboard.writeText(phoneBridgeUrl);
                        setPhoneCopied(true);
                        setTimeout(() => setPhoneCopied(false), 2000);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      {phoneCopied ? 'Copied Link!' : 'Copy Scanner Link'}
                    </Button>
                  </DialogContent>
                </Dialog>

                {/* Selected Items List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  {selectedItems.map((item, index) => {
                    const selectedProduct = inventory.find(i => i.id === item.id);
                    const optionsList = inventory;

                    return (
                      <Box key={index} sx={{
                        p: 1.5,
                        bgcolor: mode === 'light' ? '#F8FAFC' : 'background.default',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          bordercolor: (t) => t.palette.primary.main,
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
                                options={optionsList}
                                getOptionLabel={(option) => `${option.name} (₹${option.price})`}
                                filterOptions={(options, { inputValue }) => {
                                  const term = (inputValue || '').toLowerCase().trim();
                                  return options.filter(option =>
                                    (option.name && option.name.toLowerCase().includes(term)) ||
                                    (option.productId && option.productId.toLowerCase().includes(term)) ||
                                    (option.barcode && option.barcode.toLowerCase().includes(term)) ||
                                    (option.sku && option.sku.toLowerCase().includes(term))
                                  );
                                }}
                                renderOption={(props, option) => {
                                  const stock = parseInt(option.currentQty || option.quantity) || 0;
                                  return (
                                    <Box component="li" {...props} key={option.id}>
                                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.name}</Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}>
                                            ID: #{formatSkuWithHyphen(option.productId || option.sku || 'N/A')} • ₹{option.price}
                                          </Typography>
                                        </Box>
                                        <Chip
                                          label={`Stock: ${stock}`}
                                          size="small"
                                          sx={{
                                            height: 18,
                                            fontSize: '0.62rem',
                                            fontWeight: 800,
                                            bgcolor: stock > 0 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                            color: stock > 0 ? '#059669' : '#DC2626'
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  );
                                }}
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
                                onClick={() => handleRemoveItem(index)}
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
                              sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: '8px' }, '& input': { py: 0.5, textAlign: 'center', fontWeight: 800 } }}
                            />
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>Line Total</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>
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
                    borderRadius: '9px',
                    fontWeight: 700,
                    borderStyle: 'dashed',
                    color: (t) => t.palette.primary.main,
                    bordercolor: (t) => t.palette.primary.main,
                    '&:hover': {
                      borderStyle: 'dashed',
                      bgcolor: (t) => `${t.palette.primary.main}10`
                    }
                  }}
                >
                  + Add Another Garment
                </Button>
              </Paper>
            </Grid>

            {/* Right Column: Settlement, Taxes & Luxury Ledger Summary */}
            <Grid item xs={12} md={5}>
              <Paper sx={{
                p: { xs: 2, sm: 2.5 },
                bgcolor: 'background.paper',
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                position: { md: 'sticky' },
                top: 16
              }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentsOutlined sx={{ color: (t) => t.palette.primary.main, fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.78rem', color: (t) => t.palette.primary.main }}>
                        Multi-Tender Settlement Console
                      </Typography>
                    </Box>
                    <Chip 
                      size="small" 
                      label={isSplitPayment ? "SPLIT TENDER ACTIVE" : `${paymentMethod.toUpperCase()}`}
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: '0.68rem',
                        bgcolor: isSplitPayment ? 'rgba(245, 158, 11, 0.12)' : (t) => `${t.palette.primary.main}18`,
                        color: isSplitPayment ? '#d97706' : (t) => t.palette.primary.main,
                        border: '1px solid',
                        borderColor: isSplitPayment ? 'rgba(245, 158, 11, 0.3)' : (t) => `${t.palette.primary.main}40`
                      }} 
                    />
                  </Box>

                  {/* Fast Tender Shortcut Buttons */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1, mb: 2 }}>
                    {[
                      { label: '💵 Cash', method: 'Cash', split: false },
                      { label: '⚡ UPI', method: 'UPI', split: false },
                      { label: '💳 Card', method: 'Card', split: false },
                      { label: '⚖️ Split', method: 'Split', split: true }
                    ].map((tender) => {
                      const isSelected = tender.split ? isSplitPayment : (!isSplitPayment && paymentMethod === tender.method);
                      return (
                        <Button
                          key={tender.label}
                          size="small"
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => {
                            if (tender.split) {
                              setIsSplitPayment(true);
                              if (!splitAmount || splitAmount >= total) setSplitAmount(Math.round(total / 2));
                            } else {
                              setIsSplitPayment(false);
                              setPaymentMethod(tender.method);
                              setPaymentStatus('paid');
                              setIsEMI(false);
                            }
                          }}
                          sx={{
                            py: 0.8,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            borderRadius: '9px',
                            textTransform: 'none',
                            bgcolor: isSelected ? 'primary.main' : 'transparent',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            boxShadow: isSelected ? '0 2px 8px rgba(var(--primary-rgb, 15, 118, 110), 0.25)' : 'none',
                            '&:hover': {
                              bgcolor: isSelected ? (t) => `${t.palette.primary.dark} !important` : (t) => `${t.palette.primary.main}14`,
                              borderColor: (t) => t.palette.primary.main
                            }
                          }}
                        >
                          {tender.label}
                        </Button>
                      );
                    })}
                  </Box>

                  {/* Tactile Quick Cash & Exact Denomination Pills */}
                  {paymentMethod === 'Cash' && !isSplitPayment && (
                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
                      <Typography variant="caption" sx={{ width: '100%', fontWeight: 700, fontSize: '0.68rem', color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Quick Denomination:
                      </Typography>
                      {[
                        { label: `Exact (₹${Math.round(total).toLocaleString('en-IN')})`, amount: Math.round(total) },
                        { label: '₹500', amount: 500 },
                        { label: '₹1,000', amount: 1000 },
                        { label: '₹2,000', amount: 2000 },
                        { label: '₹5,000', amount: 5000 }
                      ].map((denom) => (
                        <Button
                          key={denom.label}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setReceivedAmount(denom.amount);
                          }}
                          sx={{
                            px: 1.2,
                            py: 0.35,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            textTransform: 'none',
                            color: (t) => t.palette.primary.main,
                            borderColor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.25)',
                            bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)',
                            transition: 'all 0.15s ease',
                            '&:active': {
                              transform: 'scale(0.95)'
                            },
                            '&:hover': {
                              bordercolor: (t) => t.palette.primary.main,
                              bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)'
                            }
                          }}
                        >
                          {denom.label}
                        </Button>
                      ))}
                    </Box>
                  )}
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<QrCode2 />}
                          onClick={() => {
                            setUpiQrModalAmount(total);
                            setUpiQrModalLabel('Full Invoice Payment');
                            setUpiQrModalOpen(true);
                          }}
                          sx={{
                            py: 0.9,
                            fontWeight: 800,
                            borderRadius: '9px',
                            background: 'linear-gradient(135deg, #C28D4B 0%, #B45309 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 14px rgba(194, 141, 75, 0.35)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)'
                            }
                          }}
                        >
                          Show Dynamic UPI QR (₹{Number(total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                        </Button>
                        <TextField select label="UPI App / Gateway" value={upiProvider} onChange={(e) => setUpiProvider(e.target.value)} fullWidth size="small">
                          <MenuItem value="PhonePe">PhonePe Business</MenuItem>
                          <MenuItem value="GPay">Google Pay (GPay)</MenuItem>
                          <MenuItem value="Paytm">Paytm Soundbox / QR</MenuItem>
                          <MenuItem value="BHIM">BHIM / Static Standee QR</MenuItem>
                        </TextField>
                      </Box>
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
                    {/* Live Split Progress & Quick Adjustment */}
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)', 
                      border: '1px dashed rgba(var(--primary-rgb, 15, 118, 110), 0.25)' 
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>
                          Split Breakdown (Total: ₹{total.toFixed(2)})
                        </Typography>
                        <Button 
                          size="small" 
                          variant="text" 
                          onClick={() => setSplitAmount(Math.round(total / 2))}
                          sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0, px: 0.8, color: (t) => t.palette.primary.main, fontWeight: 700 }}
                        >
                          50:50 Split
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                        <span>Tender 1: <strong style={{ color: (t) => t.palette.primary.main }}>₹{Number(splitAmount || 0).toFixed(2)}</strong></span>
                        <span>Tender 2: <strong style={{ color: '#D97706' }}>₹{Math.max(0, total - (Number(splitAmount) || 0)).toFixed(2)}</strong></span>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField select label="Primary Method" value={paymentMethod} onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          if (e.target.value === 'Credit') setPaymentStatus('partial');
                        }} fullWidth size="small">
                          <MenuItem value="Cash">💵 Cash</MenuItem>
                          <MenuItem value="Card">💳 Card POS</MenuItem>
                          <MenuItem value="UPI">⚡ UPI QR</MenuItem>
                          <MenuItem value="Credit">📋 Credit / Khata</MenuItem>
                        </TextField>
                        <TextField
                          label="Tender 1 Amount (₹)"
                          type="number"
                          value={splitAmount}
                          onChange={(e) => setSplitAmount(parseFloat(e.target.value) || 0)}
                          fullWidth
                          size="small"
                        />
                      </Box>
                      {paymentMethod === 'UPI' && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<QrCode2 />}
                          onClick={() => {
                            const amt = Number(splitAmount) || 0;
                            setUpiQrModalAmount(amt > 0 ? amt : total);
                            setUpiQrModalLabel('Split Tender 1 (UPI)');
                            setUpiQrModalOpen(true);
                          }}
                          sx={{
                            py: 0.8,
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #C28D4B 0%, #B45309 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 12px rgba(194, 141, 75, 0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)' }
                          }}
                        >
                          ⚡ Receive Tender 1 via UPI QR (₹{Number(splitAmount || 0).toFixed(2)})
                        </Button>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField select label="Secondary Method" value={paymentMethod2} onChange={(e) => {
                          setPaymentMethod2(e.target.value);
                          if (e.target.value === 'Credit') setPaymentStatus('partial');
                        }} fullWidth size="small">
                          <MenuItem value="Cash">💵 Cash</MenuItem>
                          <MenuItem value="Card">💳 Card POS</MenuItem>
                          <MenuItem value="UPI">⚡ UPI QR</MenuItem>
                          <MenuItem value="Credit">📋 Credit / Khata</MenuItem>
                        </TextField>
                        <TextField
                          label="Tender 2 Balance (₹)"
                          value={Math.max(0, total - (Number(splitAmount) || 0)).toFixed(2)}
                          disabled
                          fullWidth
                          size="small"
                          helperText="Calculated remainder"
                        />
                      </Box>
                      {paymentMethod2 === 'UPI' && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<QrCode2 />}
                          onClick={() => {
                            const amt = Math.max(0, total - (Number(splitAmount) || 0));
                            setUpiQrModalAmount(amt);
                            setUpiQrModalLabel('Split Tender 2 (UPI)');
                            setUpiQrModalOpen(true);
                          }}
                          sx={{
                            py: 0.8,
                            fontWeight: 800,
                            background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
                            color: '#FFFFFF',
                            boxShadow: (t) => `0 4px 12px ${t.palette.primary.main}55`,
                            '&:hover': { filter: 'brightness(0.92)' }
                          }}
                        >
                          ⚡ Receive Tender 2 via UPI QR (₹{Math.max(0, total - (Number(splitAmount) || 0)).toFixed(2)})
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Cash Tendered & Change Due Module */}
                {(() => {
                  const targetCashAmount = !isSplitPayment
                    ? (paymentMethod === 'Cash' ? total : 0)
                    : (paymentMethod === 'Cash' ? (Number(splitAmount) || 0) : (paymentMethod2 === 'Cash' ? Math.max(0, total - (Number(splitAmount) || 0)) : 0));
                  
                  if (targetCashAmount <= 0) return null;

                  return (
                    <Box sx={{
                      p: 1.8,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)',
                      border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <AccountBalanceWallet sx={{ color: (t) => t.palette.primary.main, fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, textTransform: 'uppercase' }}>
                            Cash Tender & Change Due
                          </Typography>
                        </Box>
                        {cashTendered > 0 && (
                          <Chip
                            size="small"
                            label={
                              cashTendered >= targetCashAmount
                                ? `Change Due: ₹${(cashTendered - targetCashAmount).toFixed(2)}`
                                : `Short: ₹${(targetCashAmount - cashTendered).toFixed(2)}`
                            }
                            color={cashTendered >= targetCashAmount ? 'success' : 'error'}
                            sx={{ fontWeight: 800, height: 22, fontSize: '0.72rem' }}
                          />
                        )}
                      </Box>

                      <TextField
                        label="Cash Received (₹)"
                        type="number"
                        size="small"
                        fullWidth
                        value={cashTendered || ''}
                        onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                        placeholder={`Due: ₹${targetCashAmount.toFixed(2)}`}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ mb: 1 }}
                      />

                      {/* Quick Cash Tender Presets */}
                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                          Presets:
                        </Typography>
                        {generateQuickCashPresets(targetCashAmount).map((preset) => (
                          <Chip
                            key={preset.label}
                            label={preset.label}
                            clickable
                            size="small"
                            onClick={() => setCashTendered(preset.amount)}
                            variant={cashTendered === preset.amount ? 'filled' : 'outlined'}
                            color={cashTendered === preset.amount ? 'primary' : 'default'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        ))}
                        {cashTendered > 0 && (
                          <Chip
                            label="Clear"
                            size="small"
                            onClick={() => setCashTendered(0)}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  );
                })()}

                {/* Loyalty Rewards & Points Redemption Card */}
                {matchedCustomer && (
                  <Box sx={{
                    p: 1.8,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(217, 119, 6, 0.05)',
                    border: '1px solid rgba(217, 119, 6, 0.25)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Redeem sx={{ color: '#D97706', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>
                          Loyalty Rewards ({matchedCustomer.loyaltyTier || 'Bronze'})
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                        Avail: <strong style={{ color: '#D97706' }}>{matchedCustomer.loyaltyPoints || 0} pts</strong> (₹{(matchedCustomer.loyaltyPoints || 0).toFixed(0)})
                      </Typography>
                    </Box>

                    {(matchedCustomer.loyaltyPoints || 0) > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            label="Redeem Points (1 pt = ₹1)"
                            type="number"
                            size="small"
                            fullWidth
                            value={loyaltyPointsToRedeem || ''}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(matchedCustomer.loyaltyPoints || 0, Math.floor(subtotal), parseInt(e.target.value) || 0));
                              setLoyaltyPointsToRedeem(val);
                            }}
                            placeholder={`Max: ${Math.min(matchedCustomer.loyaltyPoints || 0, Math.floor(subtotal))} pts`}
                          />
                          <Button
                            size="small"
                            variant={loyaltyPointsToRedeem > 0 ? 'contained' : 'outlined'}
                            color="warning"
                            onClick={() => {
                              const maxPoints = Math.min(matchedCustomer.loyaltyPoints || 0, Math.floor(subtotal));
                              if (loyaltyPointsToRedeem > 0) {
                                setLoyaltyPointsToRedeem(0);
                              } else {
                                setLoyaltyPointsToRedeem(maxPoints);
                              }
                            }}
                            sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '90px' }}
                          >
                            {loyaltyPointsToRedeem > 0 ? 'Clear' : 'Use Max'}
                          </Button>
                        </Box>
                        {loyaltyPointsToRedeem > 0 && (
                          <Typography variant="caption" sx={{ color: (t) => t.palette.primary.main, fontWeight: 700 }}>
                            ✓ ₹{loyaltyPointsToRedeem} discount applied from loyalty points.
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {(() => {
                          const tier = matchedCustomer.loyaltyTier || 'Bronze';
                          const mult = tier === 'Platinum' ? (loyaltySettings?.platinumMultiplier ?? loyaltySettings?.tierMultipliers?.Platinum ?? 2)
                            : tier === 'Gold' ? (loyaltySettings?.goldMultiplier ?? loyaltySettings?.tierMultipliers?.Gold ?? 1.5)
                            : tier === 'Silver' ? (loyaltySettings?.silverMultiplier ?? loyaltySettings?.tierMultipliers?.Silver ?? 1.25)
                            : (loyaltySettings?.bronzeMultiplier ?? loyaltySettings?.tierMultipliers?.Bronze ?? 1);
                          const spend = loyaltySettings?.spendPerPoint || 100;
                          return `Patron will earn points automatically on this bill (${mult}x VIP multiplier • ₹${spend} spent = 1 pt).`;
                        })()}
                      </Typography>
                    )}
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
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(15,118,110,0.06) 0%, rgba(217,119,6,0.06) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.15)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Gross Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{subtotal.toFixed(2).toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">GST ({(parseFloat(tax) || 0)}%):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{taxAmount.toFixed(2).toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Discount Applied:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'error.main' }}>
                      - ₹{absDiscount.toFixed(2).toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  {loyaltyDiscount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#D97706', fontWeight: 600 }}>
                        Loyalty Redemption ({loyaltyPointsToRedeem} pts):
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#D97706' }}>
                        - ₹{loyaltyDiscount.toFixed(2).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  )}

                  {cashTendered > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 0.8, borderRadius: 1.5, bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: (t) => t.palette.primary.main }}>
                        Cash Tendered: ₹{cashTendered.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>
                        Change Due: ₹{Math.max(0, cashTendered - total).toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5, borderColor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.2)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 800, color: '#D97706', letterSpacing: '0.04em' }}>
                        Net Payable
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: (t) => t.palette.primary.main, letterSpacing: '-0.02em' }}>
                        ₹{total.toFixed(2).toLocaleString('en-IN')}
                      </Typography>
                      {loyaltyPointsEarned > 0 && (
                        <Typography variant="caption" sx={{ color: (t) => t.palette.primary.main, fontWeight: 700, display: 'block', mt: 0.3 }}>
                          ✨ +{loyaltyPointsEarned} loyalty pts will be earned
                        </Typography>
                      )}
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
          p: { xs: 1.5, sm: 2.5 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: { xs: 'stretch', sm: 'space-between' },
          alignItems: 'center'
        }}>
          <Button
            onClick={handleCloseInvoiceModal}
            variant="text"
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              px: 2,
              display: { xs: 'none', sm: 'inline-flex' }
            }}
          >
            Cancel
          </Button>

          <Box sx={{
            display: 'flex',
            gap: { xs: 1, sm: 1.5 },
            alignItems: 'center',
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' }
          }}>
            <Button
              onClick={handleParkCart}
              variant="outlined"
              size="small"
              startIcon={<PauseCircleOutline sx={{ fontSize: 17 }} />}
              sx={{
                borderRadius: '8px',
                px: { xs: 1.5, sm: 2 },
                py: 0.85,
                fontWeight: 700,
                fontSize: '0.82rem',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                flex: { xs: 1, sm: 'initial' },
                color: (t) => t.palette.mode === 'dark' ? t.palette.primary.light : t.palette.primary.main,
                borderColor: (t) => t.palette.mode === 'dark' ? `${t.palette.primary.light}55` : `${t.palette.primary.main}55`,
                bgcolor: (t) => `${t.palette.primary.main}08`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: (t) => t.palette.primary.main,
                  bgcolor: (t) => `${t.palette.primary.main}18`
                }
              }}
            >
              Park Cart
            </Button>
            <Button
              onClick={handleSaveInvoice}
              variant="contained"
              size="small"
              startIcon={<ReceiptLong sx={{ fontSize: 17, color: '#FFFFFF !important' }} />}
              sx={{
                px: { xs: 2, sm: 2.2 },
                py: 0.85,
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                flex: { xs: 1.4, sm: 'initial' },
                background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                color: '#ffffff !important',
                boxShadow: (t) => `0 4px 14px ${t.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : `${t.palette.primary.main}45`}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.8,
                transition: 'all 0.2s ease',
                '&:hover': {
                  filter: 'brightness(1.08)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <span>Generate Bill</span>
              <Chip
                label="F4"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  borderRadius: '4px'
                }}
              />
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
          className="no-print"
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
                  onClick={async () => {
                    const updated = { ...invoiceSettings, template: tmpl.id };
                    setInvoiceSettings(updated);
                    try {
                      localStorage.setItem('aleen_invoice_template_settings', JSON.stringify(updated));
                    } catch (e) {}
                    if (updateInvoiceTemplateSettings) {
                      try {
                        await updateInvoiceTemplateSettings(updated);
                      } catch (err) {
                        console.error('Failed to sync invoice template:', err);
                      }
                    }
                  }}
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
              color: (t) => t.palette.primary.main,
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
          <Button
            onClick={() => downloadPDF(viewInvoice)}
            startIcon={isExportingPDF ? <CircularProgress size={16} color="inherit" /> : <Download />}
            variant="outlined"
            fullWidth={isMobile}
            disabled={isExportingPDF}
          >
            {isExportingPDF ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          <Button
            onClick={() => sharePDF(viewInvoice)}
            startIcon={<Share />}
            variant="outlined"
            color="primary"
            fullWidth={isMobile}
            disabled={isExportingPDF}
          >
            Share PDF
          </Button>
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

      {/* Post-Billing Instant Dispatch & WhatsApp Pop-up Modal */}
      <BillSuccessModal
        open={!!successInvoice}
        onClose={() => {
          if (cfdAutoIdleTimerRef.current) {
            clearTimeout(cfdAutoIdleTimerRef.current);
            cfdAutoIdleTimerRef.current = null;
          }
          cfdLastSettledTimeRef.current = 0;
          setSuccessInvoice(null);
          if (syncCustomerDisplayRef.current) {
            syncCustomerDisplayRef.current('idle', null, true, []);
          }
        }}
        invoice={successInvoice}
        profile={profile}
        onPrint={handlePrint}
        onDownloadPDF={downloadPDF}
        onSharePDF={sharePDF}
        isDownloadingPDF={isExportingPDF}
        onOpenAdvancedWhatsApp={(inv) => sendWhatsApp(inv)}
        onNewBill={() => {
          if (cfdAutoIdleTimerRef.current) {
            clearTimeout(cfdAutoIdleTimerRef.current);
            cfdAutoIdleTimerRef.current = null;
          }
          cfdLastSettledTimeRef.current = 0;
          setSuccessInvoice(null);
          handleOpenNewInvoice();
        }}
        onUpdateInvoicePhone={handleUpdateInvoicePhone}
      />

      {/* Parked Carts / On-Hold POS Tickets Dialog */}
      <Dialog
        open={heldCartsDialogOpen}
        onClose={() => setHeldCartsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{
          background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
          color: 'white',
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(217, 119, 6, 0.25)', color: '#FBBF24', width: 40, height: 40 }}>
              <PauseCircle />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#FFFFFF' }}>
                Held & Parked Carts ({parkedCarts.length})
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                Resume browsing customers without losing entered cart lines
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setHeldCartsDialogOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, bgcolor: mode === 'light' ? '#F8FAFC' : 'background.default' }}>
          {parkedCarts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ShoppingCart sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                No Carts On Hold
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360, mx: 'auto', mt: 0.5 }}>
                While billing in the Create Invoice modal, click <strong>Park Cart</strong> to temporarily hold a guest's items.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {parkedCarts.map((cart, idx) => (
                <Paper
                  key={cart.id || idx}
                  sx={{
                    p: 2.2,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: 'text.primary' }}>
                        {cart.customer || 'Walk-in Guest'}
                      </Typography>
                      {cart.phone && (
                        <Chip label={cart.phone} size="small" sx={{ height: 20, fontSize: '0.72rem' }} />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.8 }}>
                      Parked {new Date(cart.parkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {cart.selectedItems?.length || 0} line items
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '1.05rem' }}>
                      ₹{Number(cart.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleResumeCart(cart)}
                      sx={{
                        background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                        color: '#fff',
                        fontWeight: 700,
                        borderRadius: '20px',
                        px: 2.5,
                        textTransform: 'none'
                      }}
                    >
                      Resume
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDiscardParkedCart(cart.id)}
                      title="Discard held cart"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Template & Letterhead Studio Dialog */}
      <InvoiceTemplateDialog
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSaveSettings={async (newSettings) => {
          setInvoiceSettings(newSettings);
          if (updateInvoiceTemplateSettings) {
            try {
              await updateInvoiceTemplateSettings(newSettings);
            } catch (err) {
              console.error('Failed to sync invoice settings:', err);
            }
          }
        }}
      />

      {/* Invoice WhatsApp Dispatch Studio & Custom Templates Dialog */}
      <InvoiceWhatsAppDialog
        open={whatsAppDialogOpen}
        onClose={() => {
          setWhatsAppDialogOpen(false);
          setWhatsAppInvoice(null);
        }}
        invoice={whatsAppInvoice}
        profile={profile}
        onSharePDF={sharePDF}
      />

      {/* Cash Drawer & Daily Shift Reconciliation Console (Z-Report) */}
      <CashDrawerShiftModal
        open={cashDrawerModalOpen}
        onClose={() => setCashDrawerModalOpen(false)}
      />

      {/* Client Bespoke Measurement Profile Dialog */}
      <CustomerMeasurementModal
        open={measurementModalOpen}
        onClose={() => {
          setMeasurementModalOpen(false);
          setMeasurementCustomer(null);
        }}
        customer={measurementCustomer}
      />

      {/* Dynamic UPI Payment QR Modal */}
      <UpiPaymentQrModal
        open={upiQrModalOpen}
        onClose={() => setUpiQrModalOpen(false)}
        amount={upiQrModalAmount > 0 ? upiQrModalAmount : total}
        tenderLabel={upiQrModalLabel}
        invoiceNumber={generateInvoiceNumber(invoices?.length || 0)}
        profile={profile}
        invoiceSettings={invoiceSettings}
        onPaymentConfirmed={() => {
          if (!isSplitPayment) {
            setPaymentStatus('paid');
            setReceivedAmount(total);
          } else {
            if (paymentMethod !== 'Credit' && paymentMethod2 !== 'Credit') {
              setPaymentStatus('paid');
            }
          }
        }}
      />

      {/* Customer Facing Display 2nd Device Pairing Modal (QR & Wi-Fi) */}
      <PairCustomerDisplayModal
        open={pairModalOpen}
        onClose={() => setPairModalOpen(false)}
        profile={profile}
        onLaunchSameWindow={handleOpenCustomerDisplay}
      />

      {/* POS Keyboard Accelerators Guide Dialog */}
      <Dialog
        open={shortcutHelpOpen}
        onClose={() => setShortcutHelpOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            overflow: 'hidden',
            bgcolor: mode === 'dark' ? 'background.paper' : '#FFFFFF',
            border: (t) => `1px solid ${t.palette.primary.main}33`,
            boxShadow: (t) => `0 24px 60px ${t.palette.primary.main}40`
          }
        }}
      >
        <DialogTitle
          sx={{
            background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.dark || '#042F2E'} 0%, ${t.palette.primary.main} 100%)`,
            color: '#FFFFFF',
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Keyboard sx={{ color: (t) => t.palette.mode === 'dark' ? t.palette.primary.light : '#FEF08A', fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
              POS Cashier Hotkeys
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShortcutHelpOpen(false)} sx={{ color: '#FFFFFF' }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[
            { key: 'F2', alt: 'Alt+N', label: 'Open New Retail Invoice' },
            { key: 'F4', alt: 'Alt+P', label: 'Instant Pay & Issue Invoice' },
            { key: 'F7', alt: 'Alt+H', label: 'Park or Recall Held Carts' },
            { key: 'F8', alt: '', label: 'Toggle Split Dual-Payment' },
            { key: 'Enter', alt: 'Scanner', label: 'Barcode Gun Auto-Add' },
            { key: 'Esc', alt: '', label: 'Close Active Dialog / Modal' },
            { key: 'F1 / ?', alt: '', label: 'Toggle Hotkeys Legend' }
          ].map((item, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.25,
                borderRadius: 2,
                bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 118, 110, 0.035)',
                border: '1px solid',
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.84rem' }}>
                {item.label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Chip
                  label={item.key}
                  size="small"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                    color: (t) => t.palette.mode === 'dark' ? t.palette.primary.light : t.palette.primary.main,
                    border: '1px solid',
                    borderColor: (t) => `${t.palette.primary.main}44`
                  }}
                />
                {item.alt && (
                  <Chip
                    label={item.alt}
                    size="small"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                      color: 'text.secondary'
                    }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setShortcutHelpOpen(false)} fullWidth variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Got It (Esc)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden offscreen container for pixel-perfect PDF export */}
      <Box sx={{ position: 'fixed', left: '-9999px', top: '-9999px', width: invoiceSettings.template === 'boutique-slip' ? 480 : 840, zIndex: -100 }}>
        {offscreenInvoice && (
          <Box ref={offscreenInvoiceRef}>
            <InvoicePrint
              invoice={offscreenInvoice}
              template={invoiceSettings.template}
              settings={invoiceSettings}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Invoices;
