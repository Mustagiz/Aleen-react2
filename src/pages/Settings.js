import React, { useState, useEffect, useRef } from 'react';
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
  Tab
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
  Draw
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import PageHeader from '../components/crm/PageHeader';
import { INVOICE_TEMPLATES, DEFAULT_INVOICE_SETTINGS, getStoredInvoiceSettings } from '../constants/invoiceTemplates';

export default function Settings() {
  const { profile, updateProfile } = useData();
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

  // Active Tab: 0 = Brand, 1 = Bank, 2 = Invoice & Print Defaults, 3 = Staff & RBAC, 4 = Security
  const [activeTab, setActiveTab] = useState(0);

  // Local Brand & Invoice Profile State
  const [formProfile, setFormProfile] = useState({
    businessName: profile.businessName || 'Aleen Clothing',
    tagline: profile.tagline || 'Bespoke Measurement & Craft Studio',
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
        bankDetails: {
          ...prev.bankDetails,
          ...(profile.bankDetails || {})
        }
      }));
    }
  }, [profile]);

  // Saving indicator
  const [isSaving, setIsSaving] = useState(false);

  // File input refs for signature & letterhead
  const signatureInputRef = useRef(null);
  const letterheadInputRef = useRef(null);

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
      await updateProfile(formProfile);

      // 2. Synchronize localStorage for instant print reflection
      const currentStored = getStoredInvoiceSettings();
      const updatedInvoiceSettings = {
        ...currentStored,
        template: formProfile.defaultTemplate || currentStored.template,
        tagline: formProfile.tagline,
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
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
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
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: '#0F766E',
              color: '#FFFFFF',
              px: 3,
              py: 1,
              boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
              '&:hover': { bgcolor: '#042F2E' }
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
          borderRadius: 3,
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
              '&.Mui-selected': { color: '#0F766E' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0F766E',
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
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 3,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F59E0B',
                  border: '2px solid rgba(217, 119, 6, 0.4)',
                  boxShadow: '0 8px 24px rgba(15, 118, 110, 0.25)'
                }}
              >
                <Store sx={{ fontSize: 42 }} />
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
                  <Phone fontSize="small" sx={{ color: '#0F766E' }} /> {formProfile.phone}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" sx={{ color: '#0F766E' }} /> {formProfile.email}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOn fontSize="small" sx={{ color: '#0F766E', mt: 0.2 }} /> {formProfile.address}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment fontSize="small" sx={{ color: '#0F766E' }} /> GSTIN: <b>{formProfile.gstin}</b>
                </Typography>
              </Box>

              <Box sx={{ mt: 3, p: 1.5, borderRadius: 2, bgcolor: 'rgba(15, 118, 110, 0.05)', border: '1px dashed #0F766E' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F766E', display: 'block' }}>
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
                borderRadius: 3.5,
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
                      startAdornment: <Store sx={{ mr: 1, color: '#0F766E', fontSize: 20 }} />
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
                      startAdornment: <Phone sx={{ mr: 1, color: '#0F766E', fontSize: 20 }} />
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
                      startAdornment: <Email sx={{ mr: 1, color: '#0F766E', fontSize: 20 }} />
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
                      startAdornment: <Payment sx={{ mr: 1, color: '#0F766E', fontSize: 20 }} />
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
                      startAdornment: <LocationOn sx={{ mr: 1, color: '#0F766E', fontSize: 20, mt: 0.5 }} />
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
                    bgcolor: '#0F766E',
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
                borderRadius: 3.5,
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
                    bgcolor: '#0F766E',
                    color: '#FFFFFF'
                  }}
                >
                  Save Bank Details
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
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                🏛️ Invoice Settlement Box Preview
              </Typography>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                  Settlement & Electronic Transfer Details:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, fontSize: '0.8rem' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Bank: <b>{formProfile.bankDetails.bankName || 'HDFC Bank Ltd'}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    A/C Name: <b>{formProfile.bankDetails.accountHolder || formProfile.businessName}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    A/C No: <b>{formProfile.bankDetails.accountNumber || '50200088992211'}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    IFSC: <b>{formProfile.bankDetails.ifsc || 'HDFC0001234'}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 800 }}>
                    UPI VPA: {formProfile.bankDetails.upiId || 'aleenclothing@hdfcbank'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontSize: '0.72rem' }}>
                {formProfile.showBankDetails
                  ? '✓ This box will print on all A4 tax invoices automatically.'
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
                borderRadius: 3.5,
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
                            bgcolor: isSelected ? 'rgba(15, 118, 110, 0.05)' : 'background.paper',
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
                          borderColor: '#0F766E',
                          color: '#0F766E'
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
                  <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'rgba(15, 118, 110, 0.03)', border: '1px solid rgba(15, 118, 110, 0.15)' }}>
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
                              borderColor: '#0F766E',
                              color: '#0F766E',
                              textTransform: 'none',
                              fontWeight: 700,
                              borderRadius: 2,
                              '&:hover': {
                                borderColor: '#042F2E',
                                bgcolor: 'rgba(15, 118, 110, 0.05)'
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
                            <Box sx={{ p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 140, minHeight: 54 }}>
                              <img
                                src={formProfile.signatureImage}
                                alt="Signature preview"
                                style={{ maxHeight: 48, maxWidth: 160, objectFit: 'contain' }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#042F2E', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CheckCircle sx={{ fontSize: 16, color: '#0F766E' }} /> Custom Signature Active
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
                    bgcolor: '#0F766E',
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
                borderRadius: 3.5,
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
                <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 700, color: '#0F766E', fontSize: '0.75rem' }}>
                  {formProfile.customFooterNote}
                </Typography>
                {formProfile.showSignatureStamp && (
                  <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #CBD5E1', textAlign: 'right' }}>
                    {formProfile.signatureImage && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                        <img
                          src={formProfile.signatureImage}
                          alt="Signature Preview"
                          style={{ maxHeight: 46, maxWidth: 140, objectFit: 'contain' }}
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
              borderRadius: 3.5,
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
                  borderRadius: 2.5,
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
                <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.05)' }}>
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
                            sx={{ fontWeight: 800, fontFamily: 'monospace', bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }}
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
                                sx={{ color: '#0F766E' }}
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
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock sx={{ color: '#0F766E' }} /> Master Admin Password
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
                        bgcolor: '#0F766E',
                        color: '#FFFFFF',
                        '&:hover': { bgcolor: '#042F2E' }
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
                borderRadius: 3.5,
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

      {/* MODAL 1: ADD OR EDIT STAFF MEMBER */}
      <Dialog
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
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
                bgcolor: '#0F766E',
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
        PaperProps={{ sx: { borderRadius: 3.5 } }}
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
    </Box>
  );
}
