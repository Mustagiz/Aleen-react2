import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Store,
  Phone,
  Email,
  LocationOn,
  Payment,
  Lock,
  Visibility,
  VisibilityOff,
  Save,
  Add,
  Delete,
  Edit,
  VpnKey,
  AccountBalance,
  People,
  CheckCircle,
  Block,
  Security,
  ColorLens,
  CloudUpload,
  Draw,
  AutoAwesome,
  QrCode2,
  Palette
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import PageHeader from '../components/crm/PageHeader';
import { INVOICE_TEMPLATES, DEFAULT_INVOICE_SETTINGS, getStoredInvoiceSettings } from '../constants/invoiceTemplates';
import { PREDEFINED_LOGOS } from '../constants/predefinedLogos';
import instagramQrImg from '../assets/instagram_qr.jpg';
import CrmColorSettings from '../components/settings/CrmColorSettings';

export default function Settings() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { profile, updateProfile, updateInvoiceTemplateSettings } = useData();
  const {
    user,
    changePassword,
    changeCashierPassword,
    staffList = [],
    addStaff,
    updateStaff,
    resetStaffPassword,
    deleteStaff
  } = useAuth();
  const { showToast, showConfirm } = useFeedback();

  const location = useLocation();

  // Active Tab: 0 = Brand, 1 = Bank, 2 = Invoice & Print Defaults, 3 = Staff & RBAC, 4 = Security, 5 = CRM Color & Appearance
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'colors' || tabParam === 'themes' || tabParam === 'appearance') return 5;
    if (tabParam === 'security') return 4;
    if (tabParam === 'staff') return 3;
    if (tabParam === 'invoice') return 2;
    if (tabParam === 'bank') return 1;
    return 0;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'colors' || tabParam === 'themes' || tabParam === 'appearance') {
      setActiveTab(5);
    }
  }, [location.search]);

  // Local Brand & Invoice Profile State
  const [formProfile, setFormProfile] = useState({
    businessName: profile.businessName || 'Aleen Clothing',
    tagline: profile.tagline || 'Bespoke Measurement & Craft Studio',
    logoUrl: profile.logoUrl || '',
    ownerName: profile.ownerName || 'Admin',
    email: profile.email || 'admin@aleen.com',
    phone: profile.phone || '+91 98765 43210',
    address: profile.address || 'Baba Jaan Chawk, Pune, Maharashtra 411001',
    gstin: profile.gstin || '27XXXXX1234X1ZX',
    pan: profile.pan || '',
    stateCode: profile.stateCode || '27 - Maharashtra',
    description: profile.description || 'Premium bespoke couture and luxury apparel studio.',
    
    // Bank & Settlement (reflected on invoices)
    showBankDetails: profile.showBankDetails ?? true,
    leftBoxMode: profile.leftBoxMode || 'luxury-composite',
    bankDetails: {
      bankName: profile.bankDetails?.bankName || 'HDFC Bank Ltd',
      accountHolder: profile.bankDetails?.accountHolder || 'Aleen Clothing',
      accountNumber: profile.bankDetails?.accountNumber || '50200088992211',
      ifsc: profile.bankDetails?.ifsc || 'HDFC0001234',
      upiId: profile.bankDetails?.upiId || 'aleenclothing@hdfcbank'
    },

    // Invoice Customization
    defaultTemplate: profile.defaultTemplate || 'atelier-emerald',
    useCustomLetterhead: profile.useCustomLetterhead || false,
    customLetterheadImage: profile.customLetterheadImage || '',
    showWatermark: profile.showWatermark ?? true,
    watermarkText: profile.watermarkText || 'ALEEN CLOTHING',
    showSignatureStamp: profile.showSignatureStamp ?? true,
    signatureLabel: profile.signatureLabel || 'Authorized Atelier Signatory',
    signatureImage: profile.signatureImage || '',
    termsText: profile.termsText || DEFAULT_INVOICE_SETTINGS.termsText,
    customFooterNote: profile.customFooterNote || DEFAULT_INVOICE_SETTINGS.customFooterNote
  });

  // Sync when profile loads from Firestore
  useEffect(() => {
    if (profile && profile.businessName) {
      setFormProfile(prev => ({
        ...prev,
        ...profile,
        logoUrl: profile.logoUrl || prev.logoUrl || '',
        bankDetails: {
          ...prev.bankDetails,
          ...(profile.bankDetails || {})
        }
      }));
    }
  }, [profile]);

  // Saving indicator
  const [isSaving, setIsSaving] = useState(false);

  // File input refs for logo, signature & letterhead
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const letterheadInputRef = useRef(null);
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  // Upload handler for custom store logo
  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Logo file size should be under 3MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormProfile(prev => ({
        ...prev,
        logoUrl: event.target.result
      }));
      showToast('Store logo loaded! Click "Save Brand Details" to confirm.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPredefinedLogo = (logoUri, logoName) => {
    setFormProfile(prev => ({
      ...prev,
      logoUrl: logoUri
    }));
    setLogoModalOpen(false);
    showToast(`Applied ${logoName}! Click "Save Brand Details" to confirm.`, 'success');
  };

  const handleRemoveLogo = () => {
    setFormProfile(prev => ({ ...prev, logoUrl: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
    showToast('Logo removed. Monogram crest will be displayed.', 'info');
  };

  // Upload handler for custom signature (converted to base64 Data URL)
  const handleSignatureUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Signature file size should be under 2MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormProfile(prev => ({
        ...prev,
        signatureImage: event.target.result
      }));
      showToast('Custom signature loaded! Click "Save Print Configuration" to confirm.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setFormProfile(prev => ({ ...prev, signatureImage: '' }));
    if (signatureInputRef.current) signatureInputRef.current.value = '';
    showToast('Signature removed.', 'info');
  };

  // Upload handler for custom letterhead
  const handleLetterheadUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Letterhead file size should be under 3MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormProfile(prev => ({
        ...prev,
        customLetterheadImage: event.target.result,
        useCustomLetterhead: true
      }));
      showToast('Letterhead artwork uploaded!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Save all profile and invoice changes to Firestore and localStorage
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // 1. Update Firestore Profile
      const cleanUpi = (formProfile.bankDetails?.upiId || '').trim();
      const updatedProfilePayload = {
        ...formProfile,
        leftBoxMode: formProfile.leftBoxMode || 'luxury-composite',
        upiId: cleanUpi,
        bankDetails: {
          ...formProfile.bankDetails,
          upiId: cleanUpi
        }
      };
      await updateProfile(updatedProfilePayload);

      // 2. Synchronize localStorage for instant print reflection
      const currentStored = getStoredInvoiceSettings();
      const updatedInvoiceSettings = {
        ...currentStored,
        leftBoxMode: formProfile.leftBoxMode || 'luxury-composite',
        template: formProfile.defaultTemplate || currentStored.template,
        tagline: formProfile.tagline,
        logoUrl: formProfile.logoUrl,
        showBankDetails: formProfile.showBankDetails,
        bankDetails: formProfile.bankDetails,
        useCustomLetterhead: formProfile.useCustomLetterhead,
        customLetterheadImage: formProfile.customLetterheadImage,
        showWatermark: formProfile.showWatermark,
        watermarkText: formProfile.watermarkText,
        showSignatureStamp: formProfile.showSignatureStamp,
        signatureLabel: formProfile.signatureLabel,
        signatureImage: formProfile.signatureImage,
        termsText: formProfile.termsText,
        customFooterNote: formProfile.customFooterNote
      };
      localStorage.setItem('aleen_invoice_template_settings', JSON.stringify(updatedInvoiceSettings));
      if (updateInvoiceTemplateSettings) {
        await updateInvoiceTemplateSettings(updatedInvoiceSettings);
      }

      showToast('Boutique configuration saved! Invoices will now reflect these details.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error saving configuration: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Staff Management State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    loginId: '',
    password: '',
    role: 'stylist',
    phone: '',
    email: '',
    permissions: {
      dashboard: true,
      invoices: true,
      inventory: true,
      tailoring: true,
      customers: true,
      reports: false,
      purchases: false,
      settings: false
    }
  });

  // Password Reset Modal for Staff
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [targetStaff, setTargetStaff] = useState(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');

  // Admin Password Change State
  const [adminPwdState, setAdminPwdState] = useState({
    current: '',
    new: '',
    confirm: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    error: '',
    success: ''
  });

  // Cashier Quick Passcode State
  const [cashierPwd, setCashierPwd] = useState('');
  const [cashierSuccess, setCashierSuccess] = useState('');

  // Open Add Staff Modal
  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setStaffForm({
      name: '',
      loginId: '',
      password: '',
      role: 'stylist',
      phone: '',
      email: '',
      permissions: {
        dashboard: true,
        invoices: true,
        inventory: true,
        tailoring: true,
        customers: true,
        reports: false,
        purchases: false,
        settings: false
      }
    });
    setStaffModalOpen(true);
  };

  // Open Edit Staff Modal
  const handleOpenEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    setStaffForm({
      name: staff.name,
      loginId: staff.loginId,
      password: staff.password || '',
      role: staff.role || 'stylist',
      phone: staff.phone || '',
      email: staff.email || '',
      permissions: {
        dashboard: staff.permissions?.dashboard ?? true,
        invoices: staff.permissions?.invoices ?? true,
        inventory: staff.permissions?.inventory ?? true,
        tailoring: staff.permissions?.tailoring ?? true,
        customers: staff.permissions?.customers ?? true,
        reports: staff.permissions?.reports ?? false,
        purchases: staff.permissions?.purchases ?? false,
        settings: staff.permissions?.settings ?? false
      }
    });
    setStaffModalOpen(true);
  };

  // Save Staff (Add or Edit)
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.loginId.trim()) {
      showToast('Please provide both Staff Name and a unique Login ID', 'warning');
      return;
    }

    try {
      if (editingStaffId) {
        await updateStaff(editingStaffId, {
          name: staffForm.name,
          loginId: staffForm.loginId,
          role: staffForm.role,
          phone: staffForm.phone,
          email: staffForm.email,
          permissions: staffForm.permissions
        });
        showToast(`Staff member "${staffForm.name}" updated successfully`, 'success');
      } else {
        if (!staffForm.password || staffForm.password.length < 4) {
          showToast('Please provide an initial password of at least 4 characters', 'warning');
          return;
        }
        await addStaff(staffForm);
        showToast(`Staff member "${staffForm.name}" added with Login ID: ${staffForm.loginId}`, 'success');
      }
      setStaffModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Confirm and Reset Staff Password
  const handleConfirmResetStaffPassword = async () => {
    if (!newStaffPassword || newStaffPassword.length < 4) {
      showToast('Password must be at least 4 characters long', 'warning');
      return;
    }
    try {
      await resetStaffPassword(targetStaff.id, newStaffPassword);
      showToast(`Password for ${targetStaff.name} has been reset successfully!`, 'success');
      setResetPwdModalOpen(false);
      setNewStaffPassword('');
      setTargetStaff(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Toggle Staff Suspension
  const handleToggleStaffStatus = async (staff) => {
    const nextStatus = staff.status === 'suspended' ? 'active' : 'suspended';
    await updateStaff(staff.id, { status: nextStatus });
    showToast(`${staff.name} is now ${nextStatus}`, 'info');
  };

  // Delete Staff Member
  const handleDeleteStaff = (staff) => {
    showConfirm({
      title: 'Remove Staff Account',
      message: `Are you sure you want to remove ${staff.name} (${staff.loginId})? They will no longer be able to log in.`,
      confirmText: 'Remove Staff',
      isDanger: true,
      onConfirm: async () => {
        await deleteStaff(staff.id);
        showToast(`Staff account for ${staff.name} removed`, 'info');
      }
    });
  };

  // Admin Master Password Change
  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault();
    setAdminPwdState(prev => ({ ...prev, error: '', success: '' }));

    if (adminPwdState.new !== adminPwdState.confirm) {
      setAdminPwdState(prev => ({ ...prev, error: 'New passwords do not match' }));
      return;
    }
    if (adminPwdState.new.length < 6) {
      setAdminPwdState(prev => ({ ...prev, error: 'Password must be at least 6 characters long' }));
      return;
    }

    const res = await changePassword(adminPwdState.current, adminPwdState.new);
    if (res && res.error) {
      setAdminPwdState(prev => ({ ...prev, error: res.error }));
    } else {
      setAdminPwdState({
        current: '',
        new: '',
        confirm: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false,
        error: '',
        success: 'Master Admin password changed successfully!'
      });
      showToast('Admin password updated', 'success');
    }
  };

  // Cashier Passcode Submit
  const handleCashierPasswordSubmit = async (e) => {
    e.preventDefault();
    if (cashierPwd.length < 4) {
      showToast('Cashier passcode must be at least 4 digits', 'warning');
      return;
    }
    await changeCashierPassword(cashierPwd);
    setCashierSuccess('Cashier counter passcode updated successfully!');
    setCashierPwd('');
    showToast('Counter passcode updated', 'success');
  };

  // Role Protection
  if (user?.role === 'cashier' || (user?.role === 'staff' && !user?.permissions?.settings)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Paper elevation={0} sx={{ p: 5, borderRadius: 4, maxWidth: 500, mx: 'auto', border: '1px solid #E2E8F0' }}>
          <Security sx={{ fontSize: 56, color: '#D97706', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#042F2E', mb: 1 }}>
            Access Restricted
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Only store administrators can configure boutique brand identity and staff access permissions.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1.5, sm: 2.5, md: 3 } }}>
      {/* Page Header */}
      <PageHeader
        title="Boutique Configuration"
        subtitle="Manage atelier brand identity, invoice letterhead, bank settlement, and staff access control"
        actions={
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveProfile}
            disabled={isSaving}
            sx={{
              borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: (t) => t.palette.primary.main,
              color: '#FFFFFF',
              px: 3,
              py: 1,
              boxShadow: '0 4px 14px rgba(var(--primary-rgb, 15, 118, 110), 0.3)',
              '&:hover': { bgcolor: (t) => t.palette.primary.dark }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        }
      />

      {/* Navigation Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 10}px`,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              py: 2,
              minHeight: 56,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab icon={<Store fontSize="small" />} iconPosition="start" label="Atelier Brand Identity" />
          <Tab icon={<AccountBalance fontSize="small" />} iconPosition="start" label="Bank & Settlement" />
          <Tab icon={<ColorLens fontSize="small" />} iconPosition="start" label="Invoice Print & Letterhead" />
          <Tab icon={<People fontSize="small" />} iconPosition="start" label={`Staff & Permissions (${staffList.length})`} />
          <Tab icon={<Lock fontSize="small" />} iconPosition="start" label="Admin Security" />
          <Tab icon={<Palette fontSize="small" />} iconPosition="start" label="CRM Theme & Colors" />
        </Tabs>
      </Paper>

      {/* TAB 0: ATELIER BRAND & IDENTITY */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {/* Live Brand Preview Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}
            >
              {/* Hidden File Input for Custom Store Logo */}
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Dynamic Brand Logo or Monogram Avatar */}
              <Box sx={{ position: 'relative', width: 90, height: 90, mx: 'auto', mb: 2 }}>
                {formProfile.logoUrl ? (
                  <Box
                    component="img"
                    src={formProfile.logoUrl}
                    alt={formProfile.businessName || 'Store Logo'}
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                      objectFit: 'contain',
                      bgcolor: '#FFFFFF',
                      border: '2px solid rgba(217, 119, 6, 0.45)',
                      boxShadow: '0 8px 24px rgba(var(--primary-rgb, 15, 118, 110), 0.2)',
                      p: 0.5
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                      background: (t) => `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F59E0B',
                      border: '2px solid rgba(217, 119, 6, 0.45)',
                      boxShadow: '0 8px 24px rgba(15, 118, 110, 0.25)'
                    }}
                  >
                    <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 900, fontSize: '2.5rem', color: '#F59E0B' }}>
                      {(formProfile.businessName || 'A').charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                )}

                {/* Edit overlay icon button */}
                <Tooltip title="Upload or change logo">
                  <IconButton
                    size="small"
                    onClick={() => logoInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: -6,
                      right: -6,
                      bgcolor: (t) => t.palette.primary.main,
                      color: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      '&:hover': { bgcolor: (t) => t.palette.primary.dark }
                    }}
                  >
                    <Edit sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Logo Action Pills */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CloudUpload sx={{ fontSize: '15px !important' }} />}
                  onClick={() => logoInputRef.current?.click()}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '20px',
                    py: 0.4,
                    px: 1.25,
                    textTransform: 'none',
                    bordercolor: (t) => t.palette.primary.main,
                    color: (t) => t.palette.primary.main
                  }}
                >
                  Upload Logo
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AutoAwesome sx={{ fontSize: '15px !important', color: '#F59E0B' }} />}
                  onClick={() => setLogoModalOpen(true)}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '20px',
                    py: 0.4,
                    px: 1.25,
                    textTransform: 'none',
                    bgcolor: (t) => t.palette.primary.dark,
                    color: '#FFFFFF',
                    '&:hover': { bgcolor: (t) => t.palette.primary.main }
                  }}
                >
                  Choose Predefined
                </Button>
                {formProfile.logoUrl && (
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={<Delete sx={{ fontSize: '14px !important' }} />}
                    onClick={handleRemoveLogo}
                    sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', py: 0.3 }}
                  >
                    Remove
                  </Button>
                )}
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 900, color: '#042F2E', letterSpacing: '-0.02em', mb: 0.5 }}>
                {formProfile.businessName || 'Aleen Clothing'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#D97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
                ✂️ {formProfile.tagline || 'Bespoke Measurement & Craft Studio'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone fontSize="small" sx={{ color: (t) => t.palette.primary.main }} /> {formProfile.phone}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" sx={{ color: (t) => t.palette.primary.main }} /> {formProfile.email}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOn fontSize="small" sx={{ color: (t) => t.palette.primary.main, mt: 0.2 }} /> {formProfile.address}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment fontSize="small" sx={{ color: (t) => t.palette.primary.main }} /> GSTIN: <b>{formProfile.gstin}</b>
                </Typography>
              </Box>

              <Box sx={{ mt: 3, p: 1.5, borderRadius: 2, bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)', border: '1px dashed #0F766E' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: (t) => t.palette.primary.main, display: 'block' }}>
                  ✓ Invoices Automatically Updated
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Every invoice you print or share on WhatsApp uses this brand letterhead.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E', mb: 0.5 }}>
                Boutique Legal & Contact Profile
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                These contact and taxation identifiers are imprinted on all tax invoices, retail slips, and customer statements.
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Boutique / Store Name"
                    value={formProfile.businessName}
                    onChange={(e) => setFormProfile({ ...formProfile, businessName: e.target.value })}
                    InputProps={{
                      startAdornment: <Store sx={{ mr: 1, color: (t) => t.palette.primary.main, fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Brand Tagline / Atelier Subtitle"
                    placeholder="Bespoke Measurement & Craft Studio"
                    value={formProfile.tagline}
                    onChange={(e) => setFormProfile({ ...formProfile, tagline: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Owner / Director Name"
                    value={formProfile.ownerName}
                    onChange={(e) => setFormProfile({ ...formProfile, ownerName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Primary Store Phone"
                    value={formProfile.phone}
                    onChange={(e) => setFormProfile({ ...formProfile, phone: e.target.value })}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: (t) => t.palette.primary.main, fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Official Billing Email"
                    value={formProfile.email}
                    onChange={(e) => setFormProfile({ ...formProfile, email: e.target.value })}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: (t) => t.palette.primary.main, fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="GSTIN Number"
                    value={formProfile.gstin}
                    onChange={(e) => setFormProfile({ ...formProfile, gstin: e.target.value.toUpperCase() })}
                    InputProps={{
                      startAdornment: <Payment sx={{ mr: 1, color: (t) => t.palette.primary.main, fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="State / Jurisdiction Code"
                    value={formProfile.stateCode}
                    onChange={(e) => setFormProfile({ ...formProfile, stateCode: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Income Tax PAN (Optional)"
                    value={formProfile.pan}
                    onChange={(e) => setFormProfile({ ...formProfile, pan: e.target.value.toUpperCase() })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="Registered Store Address (Printed on Invoices)"
                    value={formProfile.address}
                    onChange={(e) => setFormProfile({ ...formProfile, address: e.target.value })}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: (t) => t.palette.primary.main, fontSize: 20, mt: 0.5 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="Boutique Description & Mission"
                    value={formProfile.description}
                    onChange={(e) => setFormProfile({ ...formProfile, description: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: (t) => t.palette.primary.main,
                    color: '#FFFFFF'
                  }}
                >
                  Save Brand Details
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: BANK & SETTLEMENT */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                    Electronic Settlement & Bank Details
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Provide bank wire and UPI payment details to be printed on client invoices.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formProfile.showBankDetails}
                      onChange={(e) => setFormProfile({ ...formProfile, showBankDetails: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Print on Invoices</Typography>}
                />
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bank Name"
                    value={formProfile.bankDetails.bankName}
                    onChange={(e) => setFormProfile({
                      ...formProfile,
                      bankDetails: { ...formProfile.bankDetails, bankName: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Account Holder Name"
                    value={formProfile.bankDetails.accountHolder}
                    onChange={(e) => setFormProfile({
                      ...formProfile,
                      bankDetails: { ...formProfile.bankDetails, accountHolder: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bank Account Number"
                    value={formProfile.bankDetails.accountNumber}
                    onChange={(e) => setFormProfile({
                      ...formProfile,
                      bankDetails: { ...formProfile.bankDetails, accountNumber: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="IFSC Code"
                    value={formProfile.bankDetails.ifsc}
                    onChange={(e) => setFormProfile({
                      ...formProfile,
                      bankDetails: { ...formProfile.bankDetails, ifsc: e.target.value.toUpperCase() }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="UPI Virtual Payment Address (VPA ID)"
                    placeholder="e.g. aleenclothing@hdfcbank"
                    value={formProfile.bankDetails.upiId}
                    onChange={(e) => setFormProfile({
                      ...formProfile,
                      bankDetails: { ...formProfile.bankDetails, upiId: e.target.value.toLowerCase() }
                    })}
                    helperText="Printed with payment instructions for customer online transfers."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Invoice Settlement Card Display"
                    value={formProfile.leftBoxMode || 'luxury-composite'}
                    onChange={(e) => setFormProfile({
                      ...formProfile,
                      leftBoxMode: e.target.value
                    })}
                    helperText="Replaces plain bank numbers with luxury atelier cards or instant UPI QR."
                  >
                    <MenuItem value="luxury-composite">⚜️ Luxury Composite (UPI QR + Loyalty + Care + Concierge) [Recommended]</MenuItem>
                    <MenuItem value="upi-qr">⚡ Dedicated Scan-to-Pay UPI QR Code</MenuItem>
                    <MenuItem value="loyalty-privileges">👑 Patron Loyalty & Atelier Privileges</MenuItem>
                    <MenuItem value="garment-care">✂️ Bespoke Garment Care & Alteration Promise</MenuItem>
                    <MenuItem value="concierge">💬 VIP Social & Concierge Connect</MenuItem>
                    <MenuItem value="banking">🏛️ Traditional Bank Transfer (A/C, IFSC & VPA)</MenuItem>
                    <MenuItem value="none">🚫 Hidden / Blank</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: (t) => t.palette.primary.main,
                    color: '#FFFFFF'
                  }}
                >
                  Save Settlement Settings
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            {/* Visual Bank Box Preview */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                🏛️ Invoice Settlement Box Live Preview
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(15, 118, 110, 0.03)',
                  border: '1.5px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)'
                }}
              >
                {(formProfile.leftBoxMode === 'luxury-composite' || !formProfile.leftBoxMode) && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0.8, mb: 1, borderBottom: '1px dashed rgba(var(--primary-rgb, 15, 118, 110), 0.2)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        ⚜️ Atelier Privileges & Quick Pay
                      </Typography>
                      <Chip label="✦ VIP Patron" size="small" sx={{ bgcolor: 'rgba(194, 141, 75, 0.12)', color: '#B45309', fontWeight: 800, fontSize: '0.62rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', py: 0.75, mb: 1, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <QrCode2 sx={{ fontSize: 48, color: (t) => t.palette.primary.main }} />
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', fontWeight: 800, color: (t) => t.palette.primary.main }}>Scan to Pay</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box component="img" src={instagramQrImg} alt="Instagram QR" sx={{ width: 48, height: 48, objectFit: 'contain', display: 'block', mx: 'auto' }} />
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', fontWeight: 800, color: '#E1306C' }}>Instagram</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, fontSize: '0.72rem', pt: 0.5, borderTop: '1px dashed #E2E8F0' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>🎁 <b>Loyalty Club:</b> Reward points</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>✂️ <b>Tailoring:</b> 30-Day alterations</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>✨ <b>Care:</b> Dry Clean Only</Typography>
                      <Typography variant="caption" sx={{ color: (t) => t.palette.primary.main, fontWeight: 800 }}>UPI: {formProfile.bankDetails.upiId || 'aleenclothing@hdfcbank'}</Typography>
                    </Box>
                  </Box>
                )}

                {formProfile.leftBoxMode === 'upi-qr' && (
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ p: 0.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1.5, textAlign: 'center' }}>
                      <QrCode2 sx={{ fontSize: 52, color: (t) => t.palette.primary.main }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, display: 'block' }}>⚡ Scan & Pay via UPI</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>UPI ID: <b>{formProfile.bankDetails.upiId || 'aleenclothing@hdfcbank'}</b></Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>GPay, PhonePe, Paytm, Cred</Typography>
                    </Box>
                  </Box>
                )}

                {formProfile.leftBoxMode === 'banking' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.75rem' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>Bank Details:</Typography>
                    <Typography variant="caption">Bank: <b>{formProfile.bankDetails.bankName || 'HDFC Bank Ltd'}</b></Typography>
                    <Typography variant="caption">A/C: <b>{formProfile.bankDetails.accountNumber || '50200088992211'}</b></Typography>
                    <Typography variant="caption">IFSC: <b>{formProfile.bankDetails.ifsc || 'HDFC0001234'}</b></Typography>
                    <Typography variant="caption" sx={{ color: (t) => t.palette.primary.main, fontWeight: 800 }}>UPI: {formProfile.bankDetails.upiId || 'aleenclothing@hdfcbank'}</Typography>
                  </Box>
                )}

                {formProfile.leftBoxMode === 'loyalty-privileges' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>👑 Atelier Patron Privileges</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>🎁 VIP reward accruals on every purchase</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>✂️ 30-Day complimentary fitting guarantee</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>✦ Priority access to bespoke seasonal previews</Typography>
                  </Box>
                )}

                {formProfile.leftBoxMode === 'garment-care' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>✂️ Bespoke Care & Alterations</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>✨ Dry clean only with specialized fabric preservation</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>✂️ Complimentary tailoring adjustments within 30 days</Typography>
                  </Box>
                )}

                {formProfile.leftBoxMode === 'concierge' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>💬 VIP Social & Concierge</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>📱 WhatsApp VIP styling concierge</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>📸 Instagram: @aleenclothing</Typography>
                  </Box>
                )}

                {formProfile.leftBoxMode === 'none' && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Card hidden. Box will not print on invoices.
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontSize: '0.72rem' }}>
                {formProfile.showBankDetails
                  ? '✓ This card will print automatically on all A4 customer invoices.'
                  : '⚠️ Currently disabled. Check "Print on Invoices" above to enable.'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: INVOICE PRINT & LETTERHEAD */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E', mb: 0.5 }}>
                Default Invoice Template & Print Styling
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Configure terms & conditions, watermark, and custom letterhead artwork.
              </Typography>

              {/* Default Template Selector */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>
                  Default Print Template:
                </Typography>
                <Grid container spacing={1.5}>
                  {INVOICE_TEMPLATES.map(tmpl => {
                    const isSelected = (formProfile.defaultTemplate || 'atelier-emerald') === tmpl.id;
                    return (
                      <Grid item xs={12} sm={6} key={tmpl.id}>
                        <Box
                          onClick={() => setFormProfile({ ...formProfile, defaultTemplate: tmpl.id })}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: isSelected ? '#0F766E' : 'divider',
                            bgcolor: isSelected ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)' : 'background.paper',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#042F2E' }}>
                              {tmpl.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                              {tmpl.tagline}
                            </Typography>
                          </Box>
                          <Chip label={tmpl.badge} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Custom Letterhead Banner */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formProfile.useCustomLetterhead}
                      onChange={(e) => setFormProfile({ ...formProfile, useCustomLetterhead: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Use Custom Letterhead Artwork</Typography>}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Replace the top header banner with your graphic letterhead banner image (1200 x 240 px recommended).
                </Typography>

                {formProfile.useCustomLetterhead && (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        startIcon={<CloudUpload />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          bordercolor: (t) => t.palette.primary.main,
                          color: (t) => t.palette.primary.main
                        }}
                      >
                        Upload Letterhead Banner
                        <input
                          ref={letterheadInputRef}
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleLetterheadUpload}
                        />
                      </Button>
                      {formProfile.customLetterheadImage && (
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => {
                            setFormProfile({ ...formProfile, customLetterheadImage: '' });
                            if (letterheadInputRef.current) letterheadInputRef.current.value = '';
                          }}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Remove Artwork
                        </Button>
                      )}
                    </Box>

                    <TextField
                      fullWidth
                      size="small"
                      label="Or Letterhead Image URL"
                      placeholder="https://your-domain.com/letterhead.png"
                      value={formProfile.customLetterheadImage}
                      onChange={(e) => setFormProfile({ ...formProfile, customLetterheadImage: e.target.value })}
                      helperText="Direct image URL or upload above"
                    />

                    {formProfile.customLetterheadImage && (
                      <Box sx={{ mt: 1.5, p: 1, borderRadius: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <img
                          src={formProfile.customLetterheadImage}
                          alt="Letterhead Preview"
                          style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Watermark Section */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formProfile.showWatermark}
                      onChange={(e) => setFormProfile({ ...formProfile, showWatermark: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Show Diagonal Background Watermark</Typography>}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Faint luxury watermark printed diagonally behind line items.
                </Typography>

                {formProfile.showWatermark && (
                  <TextField
                    fullWidth
                    size="small"
                    sx={{ mt: 1 }}
                    label="Watermark Text"
                    value={formProfile.watermarkText}
                    onChange={(e) => setFormProfile({ ...formProfile, watermarkText: e.target.value.toUpperCase() })}
                    helperText="e.g. ALEEN COUTURE, ORIGINAL INVOICE, PAID"
                  />
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Authorized Signature & Stamp Section */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formProfile.showSignatureStamp}
                      onChange={(e) => setFormProfile({ ...formProfile, showSignatureStamp: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Draw sx={{ fontSize: 18, color: '#D97706' }} /> Show Signature Stamp & Custom Signature
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Prints an official boutique signature image, stamp line, and signatory title on every bill & PDF export.
                </Typography>

                {formProfile.showSignatureStamp && (
                  <Box sx={{ p: 2.5, borderRadius: (t) => `${t.shape?.borderRadius || 8}px`, bgcolor: 'rgba(15, 118, 110, 0.03)', border: '1px solid rgba(15, 118, 110, 0.15)' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Signatory Title / Label"
                          value={formProfile.signatureLabel}
                          onChange={(e) => setFormProfile({ ...formProfile, signatureLabel: e.target.value })}
                          helperText="e.g. Authorized Atelier Signatory, Proprietor, Creative Director"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Or Signature Image URL"
                          placeholder="https://.../signature.png"
                          value={formProfile.signatureImage || ''}
                          onChange={(e) => setFormProfile({ ...formProfile, signatureImage: e.target.value })}
                          helperText="Direct image URL or upload file below"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUpload />}
                            sx={{
                              bordercolor: (t) => t.palette.primary.main,
                              color: (t) => t.palette.primary.main,
                              textTransform: 'none',
                              fontWeight: 700,
                              borderRadius: 2,
                              '&:hover': {
                                borderColor: '#042F2E',
                                bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)'
                              }
                            }}
                          >
                            Upload Custom Signature (PNG / JPG)
                            <input
                              ref={signatureInputRef}
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleSignatureUpload}
                            />
                          </Button>

                          {formProfile.signatureImage && (
                            <Button
                              variant="text"
                              color="error"
                              startIcon={<Delete />}
                              onClick={handleRemoveSignature}
                              sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                              Remove Signature
                            </Button>
                          )}
                        </Box>

                        {/* Signature Preview Card */}
                        {formProfile.signatureImage ? (
                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2.5, p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px dashed #CBD5E1' }}>
                            <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 160, minHeight: 65 }}>
                              <img
                                src={formProfile.signatureImage}
                                alt="Signature preview"
                                style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#042F2E', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CheckCircle sx={{ fontSize: 16, color: (t) => t.palette.primary.main }} /> Custom Signature Active
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                This signature will render directly above "{formProfile.signatureLabel}" on printed invoices and PDF downloads.
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                            Tip: For the cleanest luxury look, upload a transparent PNG of your handwritten signature or boutique stamp.
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Terms and Conditions */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>
                  Invoice Terms & Conditions (Printed at Footer):
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  size="small"
                  value={formProfile.termsText}
                  onChange={(e) => setFormProfile({ ...formProfile, termsText: e.target.value })}
                />
              </Box>

              {/* Custom Footer Note */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>
                  Custom Thank You Note:
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formProfile.customFooterNote}
                  onChange={(e) => setFormProfile({ ...formProfile, customFooterNote: e.target.value })}
                />
              </Box>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: (t) => t.palette.primary.main,
                    color: '#FFFFFF'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Print Configuration'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E', mb: 1 }}>
                Live Invoice Footer Preview
              </Typography>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', mb: 0.5 }}>
                  Terms & Conditions:
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'pre-line', display: 'block', fontSize: '0.68rem', lineHeight: 1.4 }}>
                  {formProfile.termsText}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 700, color: (t) => t.palette.primary.main, fontSize: '0.75rem' }}>
                  {formProfile.customFooterNote}
                </Typography>
                {formProfile.showSignatureStamp && (
                  <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #CBD5E1', textAlign: 'right' }}>
                    {formProfile.signatureImage && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                        <img
                          src={formProfile.signatureImage}
                          alt="Signature Preview"
                          style={{ maxHeight: 68, maxWidth: 200, objectFit: 'contain' }}
                        />
                      </Box>
                    )}
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
                      {formProfile.signatureLabel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {formProfile.businessName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: STAFF & ROLE-BASED ACCESS CONTROL (RBAC) */}
      {activeTab === 3 && (
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                  Staff Roster & Access Permissions ({staffList.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Create custom login IDs for staff members, configure individual passwords, and grant module permissions.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenAddStaff}
                sx={{
                  borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                  fontWeight: 800,
                  textTransform: 'none',
                  bgcolor: '#D97706',
                  color: '#FFFFFF',
                  px: 2.5,
                  '&:hover': { bgcolor: '#B45309' }
                }}
              >
                + Add Staff Member
              </Button>
            </Box>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Staff Member</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Login ID</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Allowed Modules</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffList.map((staff) => {
                    const isSuspended = staff.status === 'suspended';
                    const perms = staff.permissions || {};
                    return (
                      <TableRow key={staff.id} hover sx={{ opacity: isSuspended ? 0.6 : 1 }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: isSuspended ? '#94A3B8' : '#0F766E', width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700 }}>
                              {staff.name?.slice(0, 2).toUpperCase() || 'ST'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {staff.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {staff.phone || staff.email || 'No contact specified'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={staff.loginId}
                            size="small"
                            sx={{ fontWeight: 800, fontFamily: 'monospace', bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)', color: (t) => t.palette.primary.main }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={staff.role?.toUpperCase() || 'STYLIST'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.68rem', borderColor: '#CBD5E1' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isSuspended ? 'Suspended' : 'Active'}
                            size="small"
                            color={isSuspended ? 'error' : 'success'}
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.68rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 300 }}>
                            {perms.invoices && <Chip label="POS Billing" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                            {perms.inventory && <Chip label="Inventory" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                            {perms.tailoring && <Chip label="Tailoring" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                            {perms.customers && <Chip label="Customers" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                            {perms.reports && <Chip label="Reports" color="primary" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                            {perms.purchases && <Chip label="Purchases" color="primary" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                            {perms.settings && <Chip label="Settings" color="warning" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Reset Password">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setTargetStaff(staff);
                                  setNewStaffPassword('');
                                  setResetPwdModalOpen(true);
                                }}
                                sx={{ color: '#D97706' }}
                              >
                                <VpnKey fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Permissions">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditStaff(staff)}
                                sx={{ color: (t) => t.palette.primary.main }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isSuspended ? 'Reactivate' : 'Suspend Account'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleStaffStatus(staff)}
                                color={isSuspended ? 'success' : 'warning'}
                              >
                                {isSuspended ? <CheckCircle fontSize="small" /> : <Block fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Staff">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteStaff(staff)}
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {staffList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No custom staff accounts registered. Click "+ Add Staff Member" to set up logins for your team.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* TAB 4: ADMIN SECURITY */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock sx={{ color: (t) => t.palette.primary.main }} /> Master Admin Password
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Change the master password used to authenticate as Administrator (<code>admin@aleen.com</code>).
              </Typography>

              {adminPwdState.error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{adminPwdState.error}</Alert>}
              {adminPwdState.success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{adminPwdState.success}</Alert>}

              <Box component="form" onSubmit={handleAdminPasswordSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Current Master Password"
                      type={adminPwdState.showCurrent ? 'text' : 'password'}
                      value={adminPwdState.current}
                      onChange={(e) => setAdminPwdState({ ...adminPwdState, current: e.target.value })}
                      required
                      InputProps={{
                        endAdornment: (
                          <IconButton size="small" onClick={() => setAdminPwdState({ ...adminPwdState, showCurrent: !adminPwdState.showCurrent })}>
                            {adminPwdState.showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="New Master Password"
                      type={adminPwdState.showNew ? 'text' : 'password'}
                      value={adminPwdState.new}
                      onChange={(e) => setAdminPwdState({ ...adminPwdState, new: e.target.value })}
                      required
                      InputProps={{
                        endAdornment: (
                          <IconButton size="small" onClick={() => setAdminPwdState({ ...adminPwdState, showNew: !adminPwdState.showNew })}>
                            {adminPwdState.showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Confirm New Password"
                      type={adminPwdState.showConfirm ? 'text' : 'password'}
                      value={adminPwdState.confirm}
                      onChange={(e) => setAdminPwdState({ ...adminPwdState, confirm: e.target.value })}
                      required
                      InputProps={{
                        endAdornment: (
                          <IconButton size="small" onClick={() => setAdminPwdState({ ...adminPwdState, showConfirm: !adminPwdState.showConfirm })}>
                            {adminPwdState.showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 800,
                        bgcolor: (t) => t.palette.primary.main,
                        color: '#FFFFFF',
                        '&:hover': { bgcolor: (t) => t.palette.primary.dark }
                      }}
                    >
                      Update Master Password
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 12}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VpnKey sx={{ color: '#D97706' }} /> Counter Terminal Quick Passcode
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Fast 4-digit passcode for generic counter cashier terminal (<code>cashier@aleen.com</code>).
              </Typography>

              {cashierSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{cashierSuccess}</Alert>}

              <Box component="form" onSubmit={handleCashierPasswordSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label="New Counter Passcode"
                      value={cashierPwd}
                      onChange={(e) => setCashierPwd(e.target.value)}
                      placeholder="e.g. 1234"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{
                        height: 40,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 800,
                        bgcolor: '#D97706',
                        color: '#FFFFFF',
                        '&:hover': { bgcolor: '#B45309' }
                      }}
                    >
                      Set Passcode
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 5: CRM HAUTE COUTURE COLOR PALETTE */}
      {activeTab === 5 && (
        <CrmColorSettings />
      )}

      {/* MODAL 1: ADD OR EDIT STAFF MEMBER */}
      <Dialog
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#042F2E', borderBottom: '1px solid', borderColor: 'divider' }}>
          {editingStaffId ? 'Edit Staff Member & Permissions' : 'Register New Staff Member'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSaveStaff}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Full Name"
                  placeholder="e.g. Sara Khan"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unique Login ID / Username"
                  placeholder="e.g. sara_stylist"
                  value={staffForm.loginId}
                  onChange={(e) => setStaffForm({ ...staffForm, loginId: e.target.value.toLowerCase().trim() })}
                  disabled={Boolean(editingStaffId)}
                  required
                  helperText={editingStaffId ? 'Login ID cannot be modified once created' : 'Used by staff to sign in to the terminal'}
                />
              </Grid>

              {!editingStaffId && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Initial Password"
                    placeholder="e.g. sara123"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    required
                    helperText="Staff will use this password to log in. You can reset it at any time."
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="staff-role-label">Staff Role</InputLabel>
                  <Select
                    labelId="staff-role-label"
                    value={staffForm.role}
                    label="Staff Role"
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  >
                    <MenuItem value="stylist">Sales Stylist</MenuItem>
                    <MenuItem value="cashier">Counter Cashier</MenuItem>
                    <MenuItem value="tailor">Master Tailor & Craftsman</MenuItem>
                    <MenuItem value="manager">Store Manager</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone (Optional)"
                  placeholder="+91 98765 00000"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email (Optional)"
                  placeholder="sara@aleen.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E', mb: 0.5 }}>
                  Granular Module Permissions
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Select which areas of Aleen Clothing CRM this staff member is authorized to access:
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffForm.permissions.invoices}
                          onChange={(e) => setStaffForm({
                            ...staffForm,
                            permissions: { ...staffForm.permissions, invoices: e.target.checked }
                          })}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Sales & Invoicing (POS)</Typography>}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffForm.permissions.inventory}
                          onChange={(e) => setStaffForm({
                            ...staffForm,
                            permissions: { ...staffForm.permissions, inventory: e.target.checked }
                          })}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Atelier Inventory & Barcodes</Typography>}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffForm.permissions.tailoring}
                          onChange={(e) => setStaffForm({
                            ...staffForm,
                            permissions: { ...staffForm.permissions, tailoring: e.target.checked }
                          })}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Tailoring & Craft Orders</Typography>}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffForm.permissions.customers}
                          onChange={(e) => setStaffForm({
                            ...staffForm,
                            permissions: { ...staffForm.permissions, customers: e.target.checked }
                          })}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Clientele & VIP Loyalty</Typography>}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffForm.permissions.reports}
                          onChange={(e) => setStaffForm({
                            ...staffForm,
                            permissions: { ...staffForm.permissions, reports: e.target.checked }
                          })}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#B45309' }}>Sales & Profit Reports</Typography>}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffForm.permissions.purchases}
                          onChange={(e) => setStaffForm({
                            ...staffForm,
                            permissions: { ...staffForm.permissions, purchases: e.target.checked }
                          })}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#B45309' }}>Purchases & Vendors</Typography>}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffForm.permissions.settings}
                          onChange={(e) => setStaffForm({
                            ...staffForm,
                            permissions: { ...staffForm.permissions, settings: e.target.checked }
                          })}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>Boutique Configuration & Admin</Typography>}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setStaffModalOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: (t) => t.palette.primary.main,
                color: '#FFFFFF'
              }}
            >
              {editingStaffId ? 'Update Staff Member' : 'Register Staff Member'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* MODAL 2: RESET STAFF PASSWORD */}
      <Dialog
        open={resetPwdModalOpen}
        onClose={() => setResetPwdModalOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#042F2E', display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKey sx={{ color: '#D97706' }} /> Reset Staff Password
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set a new login password for <b>{targetStaff?.name}</b> (<code>{targetStaff?.loginId}</code>):
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="New Password"
            type="text"
            placeholder="Minimum 4 characters"
            value={newStaffPassword}
            onChange={(e) => setNewStaffPassword(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setResetPwdModalOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmResetStaffPassword}
            variant="contained"
            sx={{
              borderRadius: 2,
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: '#D97706',
              color: '#FFFFFF',
              '&:hover': { bgcolor: '#B45309' }
            }}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Predefined Luxury Atelier Logos Selection Modal */}
      <Dialog
        open={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isTablet}
        PaperProps={{
          sx: {
            borderRadius: isTablet ? 0 : 3.5,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
              }}
            >
              <AutoAwesome fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#042F2E', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Predefined Luxury Atelier Logos
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Select an exclusive vector crest crafted for haute couture & bridal studios
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setLogoModalOpen(false)}>
            <Block fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 3 }}>
          <Grid container spacing={2.5}>
            {PREDEFINED_LOGOS.map((logo) => {
              const isSelected = formProfile.logoUrl === logo.dataUri;
              return (
                <Grid item xs={12} sm={6} md={4} key={logo.id}>
                  <Paper
                    elevation={0}
                    onClick={() => handleSelectPredefinedLogo(logo.dataUri, logo.name)}
                    sx={{
                      p: 2.5,
                      borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 10}px`,
                      border: '2px solid',
                      borderColor: isSelected ? '#0F766E' : 'divider',
                      bgcolor: isSelected ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)' : 'background.paper',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 10px 25px rgba(15, 118, 110, 0.15)',
                        bordercolor: (t) => t.palette.primary.main
                      }
                    }}
                  >
                    {isSelected && (
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#FFFFFF !important' }} />}
                        label="Active Logo"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          bgcolor: (t) => t.palette.primary.main,
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 22
                        }}
                      />
                    )}

                    {/* Logo SVG Preview */}
                    <Box
                      component="img"
                      src={logo.dataUri}
                      alt={logo.name}
                      sx={{
                        width: 90,
                        height: 90,
                        borderRadius: (t) => `${t.custom?.designSystem?.shape?.cardRadius || 10}px`,
                        mx: 'auto',
                        mb: 1.5,
                        display: 'block',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
                      }}
                    />

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E', mb: 0.5 }}>
                      {logo.name}
                    </Typography>

                    <Chip
                      label={logo.category}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: 'rgba(217, 119, 6, 0.12)',
                        color: '#B45309',
                        mb: 1
                      }}
                    />

                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem', minHeight: 32 }}>
                      {logo.description}
                    </Typography>

                    <Button
                      fullWidth
                      size="small"
                      variant={isSelected ? 'contained' : 'outlined'}
                      sx={{
                        mt: 1.5,
                        borderRadius: '20px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        bgcolor: isSelected ? '#0F766E' : 'transparent',
                        bordercolor: (t) => t.palette.primary.main,
                        color: isSelected ? '#FFFFFF' : '#0F766E',
                        '&:hover': {
                          bgcolor: isSelected ? '#042F2E' : 'rgba(15, 118, 110, 0.08)'
                        }
                      }}
                    >
                      {isSelected ? 'Active Selection' : 'Use This Logo'}
                    </Button>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button
            startIcon={<CloudUpload />}
            onClick={() => {
              setLogoModalOpen(false);
              logoInputRef.current?.click();
            }}
            sx={{ fontWeight: 700, textTransform: 'none', color: (t) => t.palette.primary.main }}
          >
            Or Upload Custom File from Device
          </Button>
          <Button
            onClick={() => setLogoModalOpen(false)}
            variant="contained"
            sx={{
              bgcolor: (t) => t.palette.primary.dark,
              color: '#FFFFFF',
              fontWeight: 800,
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: (t) => t.palette.primary.main }
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
