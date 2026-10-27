import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  WhatsApp,
  Close,
  Refresh,
  QrCode2,
  Send,
  CheckCircle,
  ErrorOutline,
  VpnKey,
  Dns,
  Devices,
  ContentCopy
} from '@mui/icons-material';
import {
  getStoredOpenWASettings,
  saveOpenWASettings,
  checkOpenWASessionStatus,
  startOpenWASession,
  getOpenWAQrCode,
  sendOpenWATextMessage
} from '../../services/openwaService';

export default function OpenWASessionModal({ open, onClose, onSettingsUpdated }) {
  const [settings, setSettings] = useState(getStoredOpenWASettings);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [qrData, setQrData] = useState({ qr: null, qrUrl: null, loading: false, error: null });
  const [testPhone, setTestPhone] = useState('+91');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const current = getStoredOpenWASettings();
      setSettings(current);
      handleCheckStatus(current);
    }
  }, [open]);

  const handleCheckStatus = async (cfg = settings) => {
    setStatus({ state: 'checking', message: 'Connecting to OpenWA gateway...' });
    const res = await checkOpenWASessionStatus(cfg);
    if (res.success) {
      setStatus({ state: res.status, message: `Session status: ${res.status.toUpperCase()}`, details: res.details });
      if (res.status === 'qr_ready') {
        handleFetchQr(cfg);
      }
    } else {
      setStatus({ state: res.status, message: res.message || 'Unable to connect to gateway.' });
    }
  };

  const handleStartSession = async () => {
    setStatus({ state: 'checking', message: 'Starting WhatsApp session...' });
    const res = await startOpenWASession(settings);
    if (res.success) {
      await handleCheckStatus();
    } else {
      setStatus({ state: 'error', message: res.error || 'Failed to start session.' });
    }
  };

  const handleFetchQr = async (cfg = settings) => {
    setQrData(prev => ({ ...prev, loading: true, error: null }));
    const res = await getOpenWAQrCode(cfg);
    if (res.success) {
      setQrData({ qr: res.qr, qrUrl: res.qrUrl, loading: false, error: null });
    } else {
      setQrData({ qr: null, qrUrl: null, loading: false, error: res.error });
    }
  };

  const handleSaveSettings = () => {
    setSaving(true);
    saveOpenWASettings(settings);
    if (onSettingsUpdated) onSettingsUpdated(settings);
    setTimeout(() => {
      setSaving(false);
      handleCheckStatus(settings);
    }, 400);
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || testPhone.length < 10) {
      setTestResult({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    setTestSending(true);
    setTestResult(null);

    const res = await sendOpenWATextMessage({
      phone: testPhone,
      message: '✨ Test message from Aleen Atelier POS via OpenWA Gateway! Your WhatsApp integration is connected successfully.',
      overrideSettings: settings
    });

    setTestSending(false);
    if (res.success) {
      setTestResult({
        success: true,
        message: `✓ Test message delivered! Message ID: ${res.messageId || 'sent'}`
      });
    } else {
      setTestResult({
        success: false,
        message: `Failed to deliver: ${res.error}`
      });
    }
  };

  const getStatusChip = () => {
    switch (status.state) {
      case 'ready':
      case 'connected':
        return (
          <Chip
            icon={<CheckCircle sx={{ '&&': { color: '#059669' } }} />}
            label="CONNECTED & READY"
            sx={{ bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 800, fontSize: '0.74rem' }}
          />
        );
      case 'qr_ready':
        return (
          <Chip
            icon={<QrCode2 sx={{ '&&': { color: '#D97706' } }} />}
            label="SCAN QR CODE"
            sx={{ bgcolor: 'rgba(217, 119, 6, 0.1)', color: '#D97706', fontWeight: 800, fontSize: '0.74rem' }}
          />
        );
      case 'checking':
        return (
          <Chip
            icon={<CircularProgress size={14} sx={{ color: '#0F766E' }} />}
            label="CONNECTING..."
            sx={{ bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', fontWeight: 800, fontSize: '0.74rem' }}
          />
        );
      default:
        return (
          <Chip
            icon={<ErrorOutline sx={{ '&&': { color: '#DC2626' } }} />}
            label={status.state === 'offline' ? 'OFFLINE' : (status.state.toUpperCase() || 'DISCONNECTED')}
            sx={{ bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontWeight: 800, fontSize: '0.74rem' }}
          />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: 2.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            bgcolor: 'rgba(37, 211, 102, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#25D366'
          }}>
            <WhatsApp sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              OpenWA WhatsApp Gateway Console
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Self-hosted WhatsApp API Gateway for direct invoice dispatch & client automation
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Status Banner */}
        <Paper sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Live Gateway State:
              </Typography>
              {getStatusChip()}
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {status.message}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => handleCheckStatus()}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Refresh
            </Button>
            {status.state !== 'ready' && status.state !== 'connected' && (
              <Button
                size="small"
                variant="contained"
                onClick={handleStartSession}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#0F766E',
                  '&:hover': { bgcolor: '#042F2E' }
                }}
              >
                Start Session
              </Button>
            )}
          </Box>
        </Paper>

        {/* QR Code Section (When in qr_ready mode or requested) */}
        {status.state === 'qr_ready' && (
          <Paper sx={{
            p: 3,
            mb: 3,
            borderRadius: 2.5,
            bgcolor: 'rgba(217, 119, 6, 0.04)',
            border: '1px dashed rgba(217, 119, 6, 0.4)',
            textAlign: 'center'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#D97706', mb: 1 }}>
              📱 Scan with WhatsApp
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Open WhatsApp on your boutique phone &gt; Linked Devices &gt; Link a Device, and scan this QR code:
            </Typography>

            {qrData.loading ? (
              <Box sx={{ py: 4 }}><CircularProgress size={32} color="warning" /></Box>
            ) : qrData.qrUrl ? (
              <Box sx={{ display: 'inline-block', p: 1.5, bgcolor: '#fff', borderRadius: 2, boxShadow: 2 }}>
                <img src={qrData.qrUrl} alt="WhatsApp QR Code" style={{ width: 220, height: 220 }} />
              </Box>
            ) : qrData.qr ? (
              <Box sx={{ display: 'inline-block', p: 1.5, bgcolor: '#fff', borderRadius: 2, boxShadow: 2 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {qrData.qr}
                </Typography>
              </Box>
            ) : (
              <Button variant="outlined" color="warning" onClick={() => handleFetchQr()}>
                Load QR Code
              </Button>
            )}
          </Paper>
        )}

        {/* Configuration Form */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', mb: 1.5 }}>
          Gateway Connection Settings
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <TextField
            label="OpenWA Gateway Server URL"
            size="small"
            value={settings.serverUrl}
            onChange={(e) => setSettings({ ...settings, serverUrl: e.target.value })}
            placeholder="http://localhost:2785"
            helperText="Address where OpenWA Docker/Node is running"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Dns fontSize="small" /></InputAdornment>
            }}
          />

          <TextField
            label="API Key (X-API-Key)"
            size="small"
            type="password"
            value={settings.apiKey}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            placeholder="Optional secret API key"
            helperText="Matches API_KEY environment variable on server"
            InputProps={{
              startAdornment: <InputAdornment position="start"><VpnKey fontSize="small" /></InputAdornment>
            }}
          />

          <TextField
            label="Session ID"
            size="small"
            value={settings.sessionId}
            onChange={(e) => setSettings({ ...settings, sessionId: e.target.value })}
            placeholder="aleen_boutique"
            helperText="Unique identifier for your boutique's session"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Devices fontSize="small" /></InputAdornment>
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Enable OpenWA for Automated Dispatch
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoFallbackToWeb}
                  onChange={(e) => setSettings({ ...settings, autoFallbackToWeb: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Fallback to WhatsApp Web if gateway is unreachable
                </Typography>
              }
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Test Message Dispatch */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', mb: 1.5 }}>
          Test Gateway Dispatch
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <TextField
            label="Test Mobile Number"
            size="small"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+91 98765 43210"
            sx={{ maxWidth: 280 }}
            helperText="Enter 10-digit number with or without +91"
          />
          <Button
            variant="contained"
            onClick={handleSendTestMessage}
            disabled={testSending}
            startIcon={testSending ? <CircularProgress size={16} /> : <Send />}
            sx={{
              mt: 0.2,
              px: 2.5,
              fontWeight: 700,
              bgcolor: '#25D366',
              color: '#fff',
              '&:hover': { bgcolor: '#128C7E' }
            }}
          >
            {testSending ? 'Sending...' : 'Send Test'}
          </Button>
        </Box>

        {testResult && (
          <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 1.5, py: 0.5, borderRadius: 2 }}>
            {testResult.message}
          </Alert>
        )}

        <Divider sx={{ my: 2.5 }} />

        {/* Docker Quickstart Guide Box */}
        <Paper sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(15, 118, 110, 0.04)',
          border: '1px solid rgba(15, 118, 110, 0.15)'
        }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E', display: 'block', mb: 0.5 }}>
            HOSTING OPENWA LOCALLY OR ON VPS (DOCKER)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Run OpenWA in 1 command using Docker:
          </Typography>
          <Box sx={{
            p: 1.2,
            bgcolor: '#042F2E',
            color: '#A7F3D0',
            borderRadius: 1.5,
            fontFamily: 'monospace',
            fontSize: '0.74rem',
            overflowX: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>docker run -d -p 2785:2785 --name openwa -e ENGINE_TYPE=baileys ghcr.io/rmyndharis/openwa:latest</span>
            <Tooltip title="Copy docker command">
              <IconButton size="small" sx={{ color: '#A7F3D0' }} onClick={() => navigator.clipboard.writeText('docker run -d -p 2785:2785 --name openwa -e ENGINE_TYPE=baileys ghcr.io/rmyndharis/openwa:latest')}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: 'text.secondary' }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{
            px: 3,
            borderRadius: 2,
            fontWeight: 700,
            bgcolor: '#0F766E',
            '&:hover': { bgcolor: '#042F2E' }
          }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
