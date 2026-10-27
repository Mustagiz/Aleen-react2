import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  WhatsApp,
  Refresh,
  QrCode2,
  Send,
  CheckCircle,
  ErrorOutline,
  VpnKey,
  Dns,
  Devices,
  ContentCopy,
  OpenInNew,
  HelpOutline
} from '@mui/icons-material';
import {
  getStoredOpenWASettings,
  saveOpenWASettings,
  checkOpenWASessionStatus,
  startOpenWASession,
  getOpenWAQrCode,
  sendOpenWATextMessage
} from '../../services/openwaService';
import { useFeedback } from '../../contexts/FeedbackContext';

export default function OpenWASettingsSection() {
  const { showToast } = useFeedback();
  const [settings, setSettings] = useState(getStoredOpenWASettings);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [qrData, setQrData] = useState({ qr: null, qrUrl: null, loading: false, error: null });
  const [testPhone, setTestPhone] = useState('+91');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    handleCheckStatus(settings);
  }, []);

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
      showToast('Session started on OpenWA gateway', 'success');
      await handleCheckStatus();
    } else {
      setStatus({ state: 'error', message: res.error || 'Failed to start session.' });
      showToast(res.error || 'Failed to start session', 'error');
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

  const handleSave = () => {
    setIsSaving(true);
    saveOpenWASettings(settings);
    showToast('OpenWA settings saved successfully', 'success');
    setTimeout(() => {
      setIsSaving(false);
      handleCheckStatus(settings);
    }, 300);
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
      message: '✨ Test message from Aleen Haute Couture POS! Your OpenWA WhatsApp gateway is active and connected.',
      overrideSettings: settings
    });

    setTestSending(false);
    if (res.success) {
      setTestResult({
        success: true,
        message: `✓ Message dispatched successfully! Message ID: ${res.messageId || 'sent'}`
      });
      showToast('Test WhatsApp message delivered!', 'success');
    } else {
      setTestResult({
        success: false,
        message: `Delivery failed: ${res.error}`
      });
      showToast(`OpenWA Error: ${res.error}`, 'error');
    }
  };

  const getStatusChip = () => {
    switch (status.state) {
      case 'ready':
      case 'connected':
        return (
          <Chip
            icon={<CheckCircle sx={{ '&&': { color: '#059669' } }} />}
            label="CONNECTED & ACTIVE"
            sx={{ bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 800, fontSize: '0.78rem' }}
          />
        );
      case 'qr_ready':
        return (
          <Chip
            icon={<QrCode2 sx={{ '&&': { color: '#D97706' } }} />}
            label="QR SCAN REQUIRED"
            sx={{ bgcolor: 'rgba(217, 119, 6, 0.1)', color: '#D97706', fontWeight: 800, fontSize: '0.78rem' }}
          />
        );
      case 'checking':
        return (
          <Chip
            icon={<CircularProgress size={14} sx={{ color: '#0F766E' }} />}
            label="CHECKING STATUS..."
            sx={{ bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', fontWeight: 800, fontSize: '0.78rem' }}
          />
        );
      default:
        return (
          <Chip
            icon={<ErrorOutline sx={{ '&&': { color: '#DC2626' } }} />}
            label={status.state === 'offline' ? 'OFFLINE' : (status.state.toUpperCase() || 'DISCONNECTED')}
            sx={{ bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontWeight: 800, fontSize: '0.78rem' }}
          />
        );
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Left Column: Connection Status & Live QR Pairing */}
      <Grid item xs={12} lg={5}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'rgba(37, 211, 102, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#25D366'
              }}>
                <WhatsApp />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Gateway Connection
              </Typography>
            </Box>
            {getStatusChip()}
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {status.message}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => handleCheckStatus()}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Check Health
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

          <Divider sx={{ my: 2.5 }} />

          {/* QR Pairing Area */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.74rem', letterSpacing: '0.04em', color: 'text.secondary', mb: 1.5 }}>
            WhatsApp Device Pairing
          </Typography>

          {status.state === 'qr_ready' ? (
            <Box sx={{
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: 'rgba(217, 119, 6, 0.05)',
              border: '1px dashed rgba(217, 119, 6, 0.3)',
              textAlign: 'center'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706', mb: 1 }}>
                Scan with WhatsApp Mobile
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                WhatsApp &gt; Linked Devices &gt; Link a Device:
              </Typography>

              {qrData.loading ? (
                <CircularProgress size={30} color="warning" />
              ) : qrData.qrUrl ? (
                <Box sx={{ display: 'inline-block', p: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                  <img src={qrData.qrUrl} alt="WhatsApp QR" style={{ width: 180, height: 180 }} />
                </Box>
              ) : (
                <Button size="small" variant="outlined" color="warning" onClick={() => handleFetchQr()}>
                  Fetch Live QR Code
                </Button>
              )}
            </Box>
          ) : status.state === 'ready' || status.state === 'connected' ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              ✓ Store WhatsApp device is linked and authorized. Ready to dispatch automated invoices.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Ensure your OpenWA gateway server is running, then click <b>Start Session</b> to generate a QR pairing code.
            </Alert>
          )}

          <Divider sx={{ my: 2.5 }} />

          {/* Test Dispatch Box */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.74rem', letterSpacing: '0.04em', color: 'text.secondary', mb: 1.5 }}>
            Send Test Message
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <Button
              variant="contained"
              disabled={testSending}
              onClick={handleSendTestMessage}
              startIcon={testSending ? <CircularProgress size={16} /> : <Send />}
              sx={{
                bgcolor: '#25D366',
                color: '#fff',
                fontWeight: 700,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#128C7E' }
              }}
            >
              Send
            </Button>
          </Box>
          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 1.5, py: 0.5, borderRadius: 2 }}>
              {testResult.message}
            </Alert>
          )}
        </Paper>
      </Grid>

      {/* Right Column: Server Parameters & Architecture */}
      <Grid item xs={12} lg={7}>
        <Paper
          elevation={0}
          sx={{
            p: 3.5,
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            mb: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              OpenWA Server Configuration
            </Typography>
            <Button
              variant="contained"
              disabled={isSaving}
              onClick={handleSave}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: '#0F766E',
                color: '#fff',
                '&:hover': { bgcolor: '#042F2E' }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Connect to your self-hosted OpenWA instance (<a href="https://github.com/rmyndharis/OpenWA.git" target="_blank" rel="noreferrer" style={{ color: '#0F766E', fontWeight: 600 }}>rmyndharis/OpenWA</a>) for automated e-bills and client messaging.
          </Typography>

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="OpenWA Server Base URL"
                fullWidth
                size="small"
                value={settings.serverUrl}
                onChange={(e) => setSettings({ ...settings, serverUrl: e.target.value })}
                placeholder="http://localhost:2785"
                helperText="URL pointing to your OpenWA API server or Docker container"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Dns fontSize="small" /></InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Session ID"
                fullWidth
                size="small"
                value={settings.sessionId}
                onChange={(e) => setSettings({ ...settings, sessionId: e.target.value })}
                placeholder="aleen_boutique"
                helperText="Identifier for the WhatsApp session"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Devices fontSize="small" /></InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="API Key (X-API-Key)"
                fullWidth
                size="small"
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Secret API key configured in server environment"
                helperText="Leave empty if OpenWA is configured without API_KEY"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><VpnKey fontSize="small" /></InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(15, 118, 110, 0.04)',
                border: '1px solid rgba(15, 118, 110, 0.15)'
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enabled}
                      onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Enable Direct Automated WhatsApp Dispatch
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        When enabled, POS invoices and client loyalty notices are sent directly through OpenWA in the background.
                      </Typography>
                    </Box>
                  }
                />

                <Divider sx={{ my: 1.5 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoFallbackToWeb}
                      onChange={(e) => setSettings({ ...settings, autoFallbackToWeb: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Fallback to WhatsApp Web / App
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        If the gateway server is temporarily offline or disconnected, automatically open standard WhatsApp Web link so billing is never interrupted.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Self-Hosting Instructions */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HelpOutline sx={{ color: '#0F766E' }} /> Quick Deployment Guide (Docker)
            </Typography>
            <Button
              size="small"
              href="https://github.com/rmyndharis/OpenWA"
              target="_blank"
              endIcon={<OpenInNew />}
              sx={{ textTransform: 'none', fontWeight: 700, color: '#0F766E' }}
            >
              GitHub Repo
            </Button>
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            OpenWA can be hosted on your local machine, store terminal, or cloud VPS with Docker:
          </Typography>

          <Box sx={{
            p: 1.5,
            bgcolor: '#042F2E',
            color: '#A7F3D0',
            borderRadius: 2,
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            overflowX: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5
          }}>
            <span>docker run -d -p 2785:2785 --name openwa -e ENGINE_TYPE=baileys ghcr.io/rmyndharis/openwa:latest</span>
            <Tooltip title="Copy docker run command">
              <IconButton size="small" sx={{ color: '#A7F3D0' }} onClick={() => {
                navigator.clipboard.writeText('docker run -d -p 2785:2785 --name openwa -e ENGINE_TYPE=baileys ghcr.io/rmyndharis/openwa:latest');
                showToast('Docker command copied to clipboard', 'info');
              }}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Supports dual backend engines: <code>baileys</code> (lightweight WebSocket, no browser required) or <code>whatsapp-web.js</code> (headless chromium).
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
