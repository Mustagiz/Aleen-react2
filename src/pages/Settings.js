import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Grid, Paper } from '@mui/material';
import { Store, Email, Phone, LocationOn, Edit, Save, Payment, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { profile, updateProfile, inventory, invoices } = useData();
  const { changePassword, changeCashierPassword, user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

  // Cashier password state
  const [cashierPwd, setCashierPwd] = useState('');
  const [cashierStatus, setCashierStatus] = useState({ error: '', success: '' });

  // Password change state
  const [pwdState, setPwdState] = useState({
    current: '',
    new: '',
    confirm: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    error: '',
    success: ''
  });

  const handleSave = () => {
    updateProfile(localProfile);
    setEditMode(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdState({ ...pwdState, error: '', success: '' });

    if (pwdState.new !== pwdState.confirm) {
      setPwdState({ ...pwdState, error: 'New passwords do not match' });
      return;
    }

    if (pwdState.new.length < 6) {
      setPwdState({ ...pwdState, error: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      await changePassword(pwdState.current, pwdState.new);
      setPwdState({
        current: '',
        new: '',
        confirm: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false,
        error: '',
        success: 'Password changed successfully!'
      });
    } catch (err) {
      setPwdState({ ...pwdState, error: err.message, success: '' });
    }
  };

  const handleCashierPasswordChange = async (e) => {
    e.preventDefault();
    setCashierStatus({ error: '', success: '' });

    if (cashierPwd.length < 4) {
      setCashierStatus({ error: 'Cashier password must be at least 4 characters long', success: '' });
      return;
    }

    try {
      await changeCashierPassword(cashierPwd);
      setCashierStatus({ error: '', success: 'Cashier password updated successfully!' });
      setCashierPwd('');
    } catch (err) {
      setCashierStatus({ error: err.message, success: '' });
    }
  };

  if (user?.role === 'cashier') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Access Restricted
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Only administrators can access the Settings page.
        </Typography>
      </Box>
    );
  }

  const totalYears = new Date().getFullYear() - (parseInt(profile.established) || 2020);
  const totalProducts = inventory.length;
  const uniqueCustomers = new Set(invoices.map(inv => inv.customer || 'Walk-in')).size;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#1a1a1a' }}>
        Settings & Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Box sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
              }}>
                <Store sx={{ fontSize: 60, color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {localProfile.businessName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {localProfile.specialization}
              </Typography>
              <Button
                variant={editMode ? 'contained' : 'outlined'}
                startIcon={editMode ? <Save /> : <Edit />}
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: editMode ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' : 'transparent',
                  borderColor: '#8b5cf6'
                }}
              >
                {editMode ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Business Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={localProfile.businessName}
                    onChange={(e) => setLocalProfile({ ...localProfile, businessName: e.target.value })}
                    disabled={!editMode}
                    InputProps={{ startAdornment: <Store sx={{ mr: 1, color: '#8b5cf6' }} /> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Owner Name"
                    value={localProfile.ownerName}
                    onChange={(e) => setLocalProfile({ ...localProfile, ownerName: e.target.value })}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={localProfile.email}
                    onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
                    disabled={!editMode}
                    InputProps={{ startAdornment: <Email sx={{ mr: 1, color: '#8b5cf6' }} /> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={localProfile.phone}
                    onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })}
                    disabled={!editMode}
                    InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: '#8b5cf6' }} /> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={localProfile.address}
                    onChange={(e) => setLocalProfile({ ...localProfile, address: e.target.value })}
                    disabled={!editMode}
                    InputProps={{ startAdornment: <LocationOn sx={{ mr: 1, color: '#8b5cf6' }} /> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GSTIN"
                    value={localProfile.gstin}
                    onChange={(e) => setLocalProfile({ ...localProfile, gstin: e.target.value })}
                    disabled={!editMode}
                    InputProps={{ startAdornment: <Payment sx={{ mr: 1, color: '#8b5cf6' }} /> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Established Year"
                    value={localProfile.established}
                    onChange={(e) => setLocalProfile({ ...localProfile, established: e.target.value })}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Business Description"
                    value={localProfile.description}
                    onChange={(e) => setLocalProfile({ ...localProfile, description: e.target.value })}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', mt: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Lock sx={{ mr: 1, color: '#8b5cf6' }} /> Admin Security
              </Typography>

              {pwdState.error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{pwdState.error}</Typography>}
              {pwdState.success && <Typography color="success.main" variant="body2" sx={{ mb: 2 }}>{pwdState.success}</Typography>}

              <Box component="form" onSubmit={handlePasswordChange}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type={pwdState.showCurrent ? 'text' : 'password'}
                      value={pwdState.current}
                      onChange={(e) => setPwdState({ ...pwdState, current: e.target.value })}
                      required
                      InputProps={{
                        endAdornment: (
                          <Button onClick={() => setPwdState({ ...pwdState, showCurrent: !pwdState.showCurrent })}>
                            {pwdState.showCurrent ? <VisibilityOff /> : <Visibility />}
                          </Button>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type={pwdState.showNew ? 'text' : 'password'}
                      value={pwdState.new}
                      onChange={(e) => setPwdState({ ...pwdState, new: e.target.value })}
                      required
                      InputProps={{
                        endAdornment: (
                          <Button onClick={() => setPwdState({ ...pwdState, showNew: !pwdState.showNew })}>
                            {pwdState.showNew ? <VisibilityOff /> : <Visibility />}
                          </Button>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type={pwdState.showConfirm ? 'text' : 'password'}
                      value={pwdState.confirm}
                      onChange={(e) => setPwdState({ ...pwdState, confirm: e.target.value })}
                      required
                      InputProps={{
                        endAdornment: (
                          <Button onClick={() => setPwdState({ ...pwdState, showConfirm: !pwdState.showConfirm })}>
                            {pwdState.showConfirm ? <VisibilityOff /> : <Visibility />}
                          </Button>
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
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
                      }}
                    >
                      Update Admin Password
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', mt: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Lock sx={{ mr: 1, color: '#f59e0b' }} /> Staff Security (Cashier Access)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Set the password used for cashier-level access to the store.
              </Typography>

              {cashierStatus.error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{cashierStatus.error}</Typography>}
              {cashierStatus.success && <Typography color="success.main" variant="body2" sx={{ mb: 2 }}>{cashierStatus.success}</Typography>}

              <Box component="form" onSubmit={handleCashierPasswordChange}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="New Cashier Password"
                      type="text"
                      value={cashierPwd}
                      onChange={(e) => setCashierPwd(e.target.value)}
                      placeholder="e.g., 1234"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{
                        height: '56px',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: '#f59e0b',
                        '&:hover': { background: '#d97706' }
                      }}
                    >
                      Set Staff Password
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', mt: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fef3c7', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#92400e' }}>{totalYears}+</Typography>
                    <Typography variant="caption" color="text.secondary">Years</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#dbeafe', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e40af' }}>{totalProducts}+</Typography>
                    <Typography variant="caption" color="text.secondary">Products</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#dcfce7', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#166534' }}>{uniqueCustomers}+</Typography>
                    <Typography variant="caption" color="text.secondary">Customers</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fce7f3', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#9f1239' }}>5★</Typography>
                    <Typography variant="caption" color="text.secondary">Rating</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
