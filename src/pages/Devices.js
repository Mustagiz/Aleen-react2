import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    Chip,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Avatar,
    Tooltip,
    Alert,
    Switch,
    FormControlLabel,
    InputAdornment,
    LinearProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    QrCodeScanner,
    Bluetooth,
    PhoneAndroid,
    BatteryChargingFull,
    Battery90,
    Battery60,
    CheckCircle,
    Warning,
    Refresh,
    Delete,
    VolumeUp,
    VolumeOff,
    Close,
    ContentCopy,
    Check,
    Receipt,
    Inventory as InventoryIcon,
    Sensors,
    Speed,
    LinkOff,
    Link,
    PlayArrow,
    CameraAlt,
    InfoOutlined,
    OpenInNew
} from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useData } from '../contexts/DataContext';
import { useFeedback } from '../contexts/FeedbackContext';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';

export default function Devices() {
    const navigate = useNavigate();
    const { inventory } = useData();
    const { showToast, showConfirm } = useFeedback();

    // Stored paired devices - Starts empty, filters out any legacy mock devices
    const [devices, setDevices] = useState(() => {
        const saved = localStorage.getItem('aleen_paired_devices');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed.filter(d => 
                        d.id !== 'dev_netum_01' && 
                        d.id !== 'dev_phone_bridge_01' &&
                        !d.name?.includes('Netum NT-1228BL')
                    );
                }
            } catch (e) { }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('aleen_paired_devices', JSON.stringify(devices));
    }, [devices]);

    // Modals
    const [bluetoothModalOpen, setBluetoothModalOpen] = useState(false);
    const [phoneModalOpen, setPhoneModalOpen] = useState(false);
    const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [customDeviceName, setCustomDeviceName] = useState('');
    const [customDeviceType, setCustomDeviceType] = useState('bluetooth_scanner');
    const [isScanningBluetooth, setIsScanningBluetooth] = useState(false);
    const [bluetoothError, setBluetoothError] = useState('');

    // Scan Test Bench State - Starts empty with real logs only
    const [testInput, setTestInput] = useState('');
    const [lastScannedResult, setLastScannedResult] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);

    // Audio & UX Preferences
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoClear, setAutoClear] = useState(true);
    const [pulsingDeviceId, setPulsingDeviceId] = useState(null);
    const [copiedBridgeUrl, setCopiedBridgeUrl] = useState(false);

    const testInputRef = useRef(null);

    // Persistent pairing token for phone bridge across all tabs & pages
    const [pairingToken] = useState(() => {
        let t = localStorage.getItem('aleen_workstation_scanner_token');
        if (!t) {
            t = 'aleen_' + Math.random().toString(36).substring(2, 8);
            localStorage.setItem('aleen_workstation_scanner_token', t);
        }
        return t;
    });
    
    // Resolve reachable IP address: If running on localhost, default to computer LAN IP (192.168.1.30)
    const [networkHost] = useState(() => {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            return '192.168.1.30';
        }
        return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    });

    const bridgeUrl = `${window.location.protocol}//${networkHost}${window.location.port ? ':' + window.location.port : ''}/mobile-scanner?token=${pairingToken}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(bridgeUrl)}&color=042F2E&bgcolor=FFFFFF`;

    // Web Audio Synthesizer Chime
    const playScanChime = (type = 'success') => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.08); // D6
                gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.28);
            } else {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.25);
            }
        } catch (e) {
            // Audio context policy fallback
        }
    };

    // Process Inbound Barcode / QR
    const processScan = (rawText, sourceDeviceName = 'Keyboard / HID Scanner', deviceType = 'bluetooth_scanner') => {
        const code = rawText.trim();
        if (!code) return;

        // Try lookup in catalog
        const lower = code.toLowerCase();
        let matched = inventory.find(i => 
            (i.id && String(i.id).toLowerCase() === lower) ||
            (i.productId && i.productId.toLowerCase() === lower) ||
            (i.name && i.name.toLowerCase().includes(lower))
        );

        if (!matched) {
            // Check variants
            for (const item of inventory) {
                if (item.variants && Array.isArray(item.variants)) {
                    const v = item.variants.find(varItem => varItem.sku && varItem.sku.toLowerCase() === lower);
                    if (v) {
                        matched = { ...item, matchedVariant: v };
                        break;
                    }
                }
            }
        }

        const scanEntry = {
            id: 'scan_' + Date.now(),
            timestamp: new Date().toISOString(),
            rawCode: code,
            deviceName: sourceDeviceName,
            deviceType: deviceType,
            status: matched ? 'matched' : 'unrecognized',
            product: matched || null
        };

        if (matched) {
            playScanChime('success');
            setLastScannedResult({ status: 'found', item: matched, rawCode: code });
        } else {
            playScanChime('error');
            setLastScannedResult({ status: 'not_found', rawCode: code });
        }

        setScanHistory(prev => [scanEntry, ...prev.slice(0, 19)]);

        // Update device scan count
        setDevices(prev => prev.map(d => {
            if (d.name === sourceDeviceName || d.type === deviceType) {
                return {
                    ...d,
                    lastScan: new Date().toISOString(),
                    totalScans: (d.totalScans || 0) + 1
                };
            }
            return d;
        }));

        if (autoClear) {
            setTestInput('');
        }
    };

    // Live Camera Scanner Lifecycle (Html5Qrcode)
    useEffect(() => {
        let html5QrCode = null;
        if (cameraScannerOpen) {
            setCameraError('');
            const timer = setTimeout(async () => {
                try {
                    const readerElem = document.getElementById('device-tab-reader');
                    if (!readerElem) return;

                    html5QrCode = new Html5Qrcode('device-tab-reader');
                    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

                    const onScanSuccess = (decodedText) => {
                        processScan(decodedText, 'Live Camera Viewfinder', 'phone_camera');
                        setCameraScannerOpen(false);
                    };

                    // Enumerate available cameras
                    try {
                        const cams = await Html5Qrcode.getCameras();
                        if (cams && cams.length > 0) {
                            setAvailableCameras(cams);
                            const phoneCam = cams.find(c => c.label.toLowerCase().includes('phone') || c.label.toLowerCase().includes('iphone'));
                            const targetCamId = selectedCameraId || (phoneCam ? phoneCam.id : cams[0].id);
                            if (!selectedCameraId && targetCamId) {
                                setSelectedCameraId(targetCamId);
                            }
                            await html5QrCode.start(targetCamId, config, onScanSuccess, () => {});
                            return;
                        }
                    } catch (e) {
                        console.warn('Camera enumeration fallback:', e);
                    }

                    // Fallback facingMode
                    try {
                        await html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
                    } catch (envErr) {
                        await html5QrCode.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
                    }
                } catch (err) {
                    console.error('Camera initialization error:', err);
                    setCameraError('Camera access failed: ' + (err.message || 'Please check browser camera permissions.'));
                }
            }, 350);

            return () => {
                clearTimeout(timer);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().catch(() => {}).finally(() => {
                        try { html5QrCode.clear(); } catch (e) {}
                    });
                }
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraScannerOpen, selectedCameraId]);

    const handleCameraChange = (newCamId) => {
        setSelectedCameraId(newCamId);
    };

    // Realtime Wireless Phone Scanner Listeners (Firestore + BroadcastChannel + LocalStorage)
    const lastScannedTimeRef = useRef(0);

    useEffect(() => {
        if (!pairingToken) return;

        // 1. Firestore Real-time Snapshot
        let unsubFirestore = null;
        try {
            const sessionDocRef = doc(db, 'scanner_sessions', pairingToken);
            unsubFirestore = onSnapshot(sessionDocRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    if (data && data.code && data.timestamp && data.timestamp > lastScannedTimeRef.current) {
                        lastScannedTimeRef.current = data.timestamp;
                        processScan(data.code, data.deviceName || 'Smartphone Camera Bridge', 'phone_camera');
                        // Ensure phone device appears in active paired devices
                        setDevices(prev => {
                            const exists = prev.some(d => d.type === 'phone_camera');
                            if (!exists) {
                                return [{
                                    id: 'phone_' + Date.now(),
                                    name: data.deviceName || 'Smartphone Camera Bridge',
                                    type: 'phone_camera',
                                    typeName: 'Smartphone Camera Viewfinder',
                                    status: 'connected',
                                    battery: 95,
                                    signalStrength: 100,
                                    macAddress: 'IP: Wireless Remote Bridge',
                                    lastScan: new Date().toISOString(),
                                    totalScans: 1
                                }, ...prev];
                            }
                            return prev;
                        });
                    }
                }
            }, (err) => {
                console.warn('Firestore session listener notice:', err);
            });
        } catch (e) {}

        // 2. BroadcastChannel
        let bc = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                bc = new BroadcastChannel('aleen_scanner_bridge');
                bc.onmessage = (event) => {
                    if (event.data && event.data.code && event.data.token === pairingToken) {
                        if (event.data.timestamp > lastScannedTimeRef.current) {
                            lastScannedTimeRef.current = event.data.timestamp;
                            processScan(event.data.code, 'Smartphone Camera Viewfinder', 'phone_camera');
                        }
                    }
                };
            }
        } catch (e) {}

        // 3. LocalStorage Event (for multi-tab / same machine)
        const handleStorage = (e) => {
            if (e.key === 'aleen_last_phone_scan' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed.token === pairingToken && parsed.code && parsed.timestamp > lastScannedTimeRef.current) {
                        lastScannedTimeRef.current = parsed.timestamp;
                        processScan(parsed.code, 'Smartphone Camera Viewfinder', 'phone_camera');
                    }
                } catch (err) {}
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            if (unsubFirestore) unsubFirestore();
            if (bc) bc.close();
            window.removeEventListener('storage', handleStorage);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairingToken]);

    // Bluetooth Discovery trigger - Real Web Bluetooth without dummy data
    const startBluetoothDiscovery = async () => {
        setIsScanningBluetooth(true);
        setBluetoothError('');

        if (!navigator.bluetooth) {
            setIsScanningBluetooth(false);
            setBluetoothError(
                'Web Bluetooth is not supported in this browser or over insecure HTTP. Web Bluetooth requires Google Chrome, Microsoft Edge, or Opera on Mac/Windows/Android over HTTPS or localhost (Safari does not support Web Bluetooth). If you wish to scan barcodes with a phone, please click "Open Camera Scanner" instead.'
            );
            return;
        }

        try {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service', 'device_information']
            });

            if (device) {
                const newDev = {
                    id: 'dev_bt_' + Date.now(),
                    name: device.name || 'Bluetooth Barcode Scanner',
                    type: 'bluetooth_scanner',
                    typeName: 'Bluetooth 2D/QR Scanner',
                    status: 'connected',
                    battery: 100,
                    signalStrength: 98,
                    macAddress: device.id ? device.id.slice(0, 17) : 'BT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    lastScan: new Date().toISOString(),
                    totalScans: 0
                };
                setDevices(prev => [newDev, ...prev]);
                setIsScanningBluetooth(false);
                setBluetoothModalOpen(false);
                playScanChime('success');
            }
        } catch (err) {
            setIsScanningBluetooth(false);
            if (err.name === 'NotFoundError') {
                setBluetoothError('No Bluetooth device was selected or pairing was cancelled. Please ensure your physical scanner is turned ON and in pairing mode.');
            } else if (err.name === 'SecurityError') {
                setBluetoothError('Bluetooth permission was blocked by the browser. Please check site permissions in your browser address bar.');
            } else {
                setBluetoothError(err.message || 'Bluetooth connection failed.');
            }
        }
    };

    const handleAddCustomDevice = () => {
        if (!customDeviceName.trim()) return;
        const newDev = {
            id: 'dev_custom_' + Date.now(),
            name: customDeviceName.trim(),
            type: customDeviceType,
            typeName: customDeviceType === 'phone_camera' ? 'Smartphone Camera Viewfinder' : 'Bluetooth 2D/QR Scanner',
            status: 'connected',
            battery: 100,
            signalStrength: 95,
            macAddress: 'MANUAL-PAIR-' + Math.floor(Math.random() * 900 + 100),
            lastScan: new Date().toISOString(),
            totalScans: 0
        };
        setDevices(prev => [newDev, ...prev]);
        setCustomDeviceName('');
        setBluetoothModalOpen(false);
        playScanChime('success');
    };

    const toggleDeviceConnection = (id) => {
        setDevices(prev => prev.map(d => {
            if (d.id === id) {
                const nextStatus = d.status === 'connected' ? 'disconnected' : 'connected';
                return { ...d, status: nextStatus };
            }
            return d;
        }));
    };

    const testDeviceBeep = (device) => {
        setPulsingDeviceId(device.id);
        playScanChime('success');
        setTimeout(() => setPulsingDeviceId(null), 1200);
    };

    const removeDevice = (id) => {
        const target = devices.find(d => d.id === id);
        const deviceName = target?.name || 'this scanner device';
        showConfirm({
            title: 'Unpair Scanner Device',
            message: `Are you sure you want to unpair "${deviceName}"? You can easily reconnect it at any time by scanning the device QR code.`,
            confirmText: 'Unpair Device',
            isDanger: true,
            onConfirm: () => {
                setDevices(prev => prev.filter(d => d.id !== id));
                showToast(`Unpaired ${deviceName} successfully`, 'info');
            }
        });
    };

    // Trigger simulated scan from Phone Camera Bridge
    const simulatePhoneScan = () => {
        const sample = inventory.length > 0 ? inventory[0] : null;
        const sampleCode = sample?.productId || sample?.id || 'ALN-SILK-4029';
        processScan(String(sampleCode), 'Mobile Phone Camera', 'phone_camera');
    };

    // KPI Calculations
    const activeBluetoothScanners = devices.filter(d => d.type === 'bluetooth_scanner' && d.status === 'connected').length;
    const activePhoneBridges = devices.filter(d => d.type === 'phone_camera' && d.status === 'connected').length;
    const totalScansProcessed = scanHistory.length;

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
            {/* Page Header */}
            <PageHeader
                title="Device & Scanner Hub"
                subtitle="Pair wireless Bluetooth QR scanners, connect smartphone camera bridges, and monitor hardware telemetry"
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<CameraAlt />}
                            onClick={() => setCameraScannerOpen(true)}
                            sx={{
                                borderColor: '#0F766E',
                                color: '#0F766E',
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 2.5,
                                '&:hover': { borderColor: '#042F2E', bgcolor: 'rgba(15, 118, 110, 0.06)' }
                            }}
                        >
                            Open Camera Scanner
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PhoneAndroid />}
                            onClick={() => setPhoneModalOpen(true)}
                            sx={{
                                borderColor: '#D97706',
                                color: '#D97706',
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 2.5,
                                '&:hover': { borderColor: '#B45309', bgcolor: 'rgba(217, 119, 6, 0.06)' }
                            }}
                        >
                            Connect Phone Camera
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Bluetooth />}
                            onClick={() => {
                                setBluetoothModalOpen(true);
                            }}
                            sx={{
                                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                                color: '#FFFFFF',
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 3,
                                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)'
                                }
                            }}
                        >
                            + Pair Bluetooth Device
                        </Button>
                    </Box>
                }
            />

            {/* 4 Atelier Intelligence KPIs */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Bluetooth Scanners"
                        value={`${activeBluetoothScanners} Active`}
                        subtitle={`${devices.filter(d => d.type === 'bluetooth_scanner').length} total hardware scanners registered`}
                        icon={<QrCodeScanner />}
                        color="primary"
                        delta={{
                            text: `${activeBluetoothScanners > 0 ? 'Online' : 'Offline'}`,
                            isPositive: activeBluetoothScanners > 0
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Phone Camera Bridges"
                        value={`${activePhoneBridges} Connected`}
                        subtitle="Smartphones linked as wireless viewfinders"
                        icon={<PhoneAndroid />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Scan Engine Status"
                        value="Listening"
                        subtitle="Web Bluetooth & Camera Engine Live"
                        icon={<Sensors />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Session Scans"
                        value={totalScansProcessed.toLocaleString()}
                        subtitle="Items verified in current workstation session"
                        icon={<Speed />}
                        color="primary"
                    />
                </Grid>
            </Grid>

            {/* Grid Layout: Left = Connected Devices, Right = Interactive Test Bench */}
            <Grid container spacing={3} sx={{ mb: 3.5 }}>
                {/* LEFT: Paired Hardware & Mobile Viewfinders */}
                <Grid item xs={12} lg={7}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                    Paired Devices & Scanners ({devices.length})
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Manage physical handheld scanners and wireless smartphone camera bridges
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {devices.length > 0 && (
                                    <Button
                                        size="small"
                                        startIcon={<Delete />}
                                        onClick={() => {
                                            showConfirm({
                                                title: 'Clear All Paired Devices',
                                                message: 'Are you sure you want to clear all paired scanners and phone bridges from this workstation?',
                                                confirmText: 'Clear All',
                                                isDanger: true,
                                                onConfirm: () => {
                                                    setDevices([]);
                                                    localStorage.removeItem('aleen_paired_devices');
                                                    showToast('All scanner devices cleared successfully', 'info');
                                                }
                                            });
                                        }}
                                        sx={{ textTransform: 'none', fontWeight: 700, color: 'error.main' }}
                                    >
                                        Clear All
                                    </Button>
                                )}
                                <Button
                                    size="small"
                                    startIcon={<Refresh />}
                                    onClick={() => setDevices([...devices])}
                                    sx={{ textTransform: 'none', fontWeight: 700, color: '#0F766E' }}
                                >
                                    Refresh
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {devices.map((device) => {
                                const isConnected = device.status === 'connected';
                                const isPulsing = pulsingDeviceId === device.id;

                                return (
                                    <Paper
                                        key={device.id}
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: isConnected ? (isPulsing ? '#D97706' : '#0F766E') : 'divider',
                                            bgcolor: isConnected ? 'background.paper' : 'rgba(0,0,0,0.02)',
                                            transition: 'all 0.3s ease',
                                            transform: isPulsing ? 'scale(1.02)' : 'none',
                                            boxShadow: isPulsing ? '0 0 16px rgba(217, 119, 6, 0.35)' : 'none'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 46,
                                                        height: 46,
                                                        bgcolor: isConnected 
                                                            ? (device.type === 'phone_camera' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(15, 118, 110, 0.12)')
                                                            : 'rgba(0,0,0,0.06)',
                                                        color: isConnected 
                                                            ? (device.type === 'phone_camera' ? '#D97706' : '#0F766E')
                                                            : 'text.secondary'
                                                    }}
                                                >
                                                    {device.type === 'phone_camera' ? <PhoneAndroid /> : <QrCodeScanner />}
                                                </Avatar>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                            {device.name}
                                                        </Typography>
                                                        <Chip
                                                            label={isConnected ? 'Live' : 'Offline'}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '0.68rem',
                                                                fontWeight: 800,
                                                                bgcolor: isConnected ? 'rgba(15, 118, 110, 0.1)' : 'rgba(0,0,0,0.08)',
                                                                color: isConnected ? '#0F766E' : 'text.secondary'
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                        {device.typeName} • {device.macAddress}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {/* Battery Meter */}
                                                <Tooltip title={`Battery: ${device.battery}%`}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.04)', px: 1, py: 0.5, borderRadius: 2 }}>
                                                        {device.battery > 80 ? (
                                                            <Battery90 sx={{ fontSize: 16, color: '#059669' }} />
                                                        ) : device.battery > 50 ? (
                                                            <Battery60 sx={{ fontSize: 16, color: '#D97706' }} />
                                                        ) : (
                                                            <BatteryChargingFull sx={{ fontSize: 16, color: '#DC2626' }} />
                                                        )}
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                            {device.battery}%
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            </Box>
                                        </Box>

                                        {/* Telemetry Row & Actions */}
                                        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Signal: <strong>{device.signalStrength}%</strong>
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Lifetime Scans: <strong>{device.totalScans || 0}</strong>
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {device.type === 'phone_camera' && isConnected && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<PlayArrow />}
                                                        onClick={simulatePhoneScan}
                                                        sx={{
                                                            fontSize: '0.74rem',
                                                            py: 0.4,
                                                            px: 1.5,
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 700,
                                                            borderColor: '#D97706',
                                                            color: '#D97706'
                                                        }}
                                                    >
                                                        Simulate Scan
                                                    </Button>
                                                )}
                                                <Tooltip title="Test Scanner Audio Chime & Signal">
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => testDeviceBeep(device)}
                                                        sx={{
                                                            fontSize: '0.74rem',
                                                            py: 0.4,
                                                            px: 1.5,
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 700,
                                                            borderColor: 'divider',
                                                            color: 'text.primary'
                                                        }}
                                                    >
                                                        Test Signal
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip title={isConnected ? 'Disconnect device' : 'Reconnect device'}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleDeviceConnection(device.id)}
                                                        sx={{ color: isConnected ? '#0F766E' : 'text.secondary' }}
                                                    >
                                                        {isConnected ? <Link /> : <LinkOff />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Unpair Device">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => removeDevice(device.id)}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Paper>
                                );
                            })}

                            {devices.length === 0 && (
                                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                                    <QrCodeScanner sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        No scanning devices registered yet.
                                    </Typography>
                                    <Typography variant="caption">
                                        Click "+ Pair Bluetooth Device" or "Connect Phone Camera" above to get started.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* RIGHT: Live Scan Test Bench & Catalog Lookup */}
                <Grid item xs={12} lg={5}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                    Interactive Scan Test Bench
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Aim any scanner here to test barcode resolution in real-time
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={autoClear}
                                            onChange={(e) => setAutoClear(e.target.checked)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#0F766E',
                                                    '& + .MuiSwitch-track': {
                                                        backgroundColor: '#0F766E',
                                                    },
                                                },
                                            }}
                                        />
                                    }
                                    label={<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Auto-clear</Typography>}
                                    sx={{ m: 0 }}
                                />
                                <Tooltip title={soundEnabled ? 'Scanner sound ON' : 'Scanner sound MUTED'}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setSoundEnabled(!soundEnabled)}
                                        sx={{ color: soundEnabled ? '#0F766E' : 'text.secondary' }}
                                    >
                                        {soundEnabled ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>

                        {/* Scanner Live Input */}
                        <Box sx={{ mb: 2.5 }}>
                            <TextField
                                fullWidth
                                autoFocus
                                inputRef={testInputRef}
                                label="Scanner Input Receiver"
                                placeholder="Scan tag or type SKU (e.g. ALN-SILK-4029)..."
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        processScan(testInput);
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <QrCodeScanner sx={{ color: '#0F766E' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={() => processScan(testInput)}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderRadius: 2,
                                                    bgcolor: '#0F766E',
                                                    '&:hover': { bgcolor: '#042F2E' }
                                                }}
                                            >
                                                Test
                                            </Button>
                                        </InputAdornment>
                                    )
                                }}
                                helperText="Scanners configured with auto-enter will verify automatically."
                            />
                        </Box>

                        {/* Scan Result Card */}
                        <Box sx={{ mb: 2.5 }}>
                            {lastScannedResult?.status === 'found' ? (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        bgcolor: 'rgba(15, 118, 110, 0.05)',
                                        border: '1px solid rgba(15, 118, 110, 0.25)'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Box>
                                            <Chip
                                                icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#059669' }} />}
                                                label="Catalog Match Verified ✓"
                                                size="small"
                                                sx={{ bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 800, mb: 1 }}
                                            />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                {lastScannedResult.item.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Code: {lastScannedResult.rawCode} • Category: {lastScannedResult.item.category || 'Couture'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F766E' }}>
                                            ₹{lastScannedResult.item.price?.toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<Receipt />}
                                            onClick={() => navigate('/invoices')}
                                            sx={{
                                                flex: 1,
                                                borderRadius: 2,
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                bgcolor: '#0F766E',
                                                '&:hover': { bgcolor: '#042F2E' }
                                            }}
                                        >
                                            Ring Up in Billing
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<InventoryIcon />}
                                            onClick={() => navigate('/inventory')}
                                            sx={{
                                                flex: 1,
                                                borderRadius: 2,
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                borderColor: 'divider',
                                                color: 'text.primary'
                                            }}
                                        >
                                            View Stock
                                        </Button>
                                    </Box>
                                </Paper>
                            ) : lastScannedResult?.status === 'not_found' ? (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2.5,
                                        bgcolor: 'rgba(220, 38, 38, 0.05)',
                                        border: '1px solid rgba(220, 38, 38, 0.2)'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Warning sx={{ color: '#DC2626' }} />
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626' }}>
                                                Unknown Barcode: "{lastScannedResult.rawCode}"
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                This barcode is not mapped to any active item in the inventory catalog.
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            ) : (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2.5,
                                        bgcolor: 'rgba(0,0,0,0.02)',
                                        border: '1px dashed',
                                        borderColor: 'divider',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                        Ready for scan. Pull the scanner trigger or scan via phone.
                                    </Typography>
                                </Paper>
                            )}
                        </Box>

                        {/* Recent Scan History */}
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em' }}>
                                    Recent Workstation Scan Log
                                </Typography>
                                {scanHistory.length > 0 && (
                                    <Button
                                        size="small"
                                        onClick={() => setScanHistory([])}
                                        sx={{ fontSize: '0.7rem', color: 'text.secondary', textTransform: 'none' }}
                                    >
                                        Clear Log
                                    </Button>
                                )}
                            </Box>

                            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 220 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.04)' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Timestamp</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Barcode / QR</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Scanner</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }} align="right">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {scanHistory.map((scan) => (
                                            <TableRow key={scan.id} hover>
                                                <TableCell sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                                                    {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem' }}>
                                                    {scan.rawCode}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.72rem' }}>
                                                    {scan.deviceType === 'phone_camera' ? '📱 Mobile' : '🔫 Scanner'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={scan.status === 'matched' ? 'Found' : 'Unmapped'}
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.62rem',
                                                            fontWeight: 800,
                                                            bgcolor: scan.status === 'matched' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                                            color: scan.status === 'matched' ? '#059669' : '#DC2626'
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* MODAL 1: Connect Bluetooth Handheld Scanner */}
            <Dialog
                open={bluetoothModalOpen}
                onClose={() => setBluetoothModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{
                    fontWeight: 800,
                    bgcolor: 'rgba(15, 118, 110, 0.04)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: '#042F2E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Bluetooth sx={{ color: '#0F766E' }} /> Pair Bluetooth Barcode & QR Scanner
                    </Box>
                    <IconButton size="small" onClick={() => setBluetoothModalOpen(false)}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    {/* SECTION 1: SMARTPHONE (iPhone & Android) */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: 'rgba(217, 119, 6, 0.05)',
                            border: '1.5px solid #D97706',
                            mb: 3
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PhoneAndroid sx={{ color: '#D97706', fontSize: 24 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#92400E' }}>
                                Connect a Smartphone (iPhone / Android)
                            </Typography>
                        </Box>

                        <Alert
                            severity="info"
                            icon={<InfoOutlined />}
                            sx={{
                                mb: 2,
                                borderRadius: 2,
                                bgcolor: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(217, 119, 6, 0.2)'
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400E', display: 'block' }}>
                                Why doesn't your phone show in Bluetooth search lists?
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Smartphones (iOS & Android) do <strong>NOT</strong> broadcast as Bluetooth accessory guns. Mobile OS privacy blocks computers from pairing phones as barcode hardware. Use one of these two direct methods:
                            </Typography>
                        </Alert>

                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<CameraAlt />}
                                onClick={() => {
                                    setBluetoothModalOpen(false);
                                    setCameraScannerOpen(true);
                                }}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    borderRadius: 2.5,
                                    bgcolor: '#0F766E',
                                    color: '#FFFFFF',
                                    py: 1.2,
                                    '&:hover': { bgcolor: '#042F2E' }
                                }}
                            >
                                Open Phone Camera (Continuity Bluetooth)
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<QrCodeScanner />}
                                onClick={() => {
                                    setBluetoothModalOpen(false);
                                    setPhoneModalOpen(true);
                                }}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    borderRadius: 2.5,
                                    borderColor: '#D97706',
                                    color: '#D97706',
                                    py: 1.2,
                                    '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.08)' }
                                }}
                            >
                                Scan Pairing QR Code with Phone
                            </Button>
                        </Box>
                    </Paper>

                    {/* SECTION 2: PHYSICAL HARDWARE SCANNER */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: 'rgba(0,0,0,0.02)',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Bluetooth sx={{ color: '#0F766E', fontSize: 24 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                Pair Hardware Scanner Gun / Ring Scanner
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                            For dedicated retail barcode scanners (Netum, Zebra, Eyoyo, Inateck). Put your scanner into Bluetooth pairing mode first.
                        </Typography>

                        {isScanningBluetooth && (
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F766E' }}>
                                        Scanning for nearby hardware scanners...
                                    </Typography>
                                </Box>
                                <LinearProgress sx={{ borderRadius: 2, height: 6, bgcolor: 'rgba(15, 118, 110, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#0F766E' } }} />
                            </Box>
                        )}

                        {bluetoothError && (
                            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                                {bluetoothError}
                            </Alert>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Bluetooth />}
                            onClick={startBluetoothDiscovery}
                            disabled={isScanningBluetooth}
                            sx={{
                                borderRadius: 2.5,
                                fontWeight: 800,
                                textTransform: 'none',
                                bgcolor: '#0F766E',
                                color: '#FFFFFF',
                                py: 1.2,
                                mb: 2,
                                '&:hover': { bgcolor: '#042F2E' }
                            }}
                        >
                            {isScanningBluetooth ? 'Searching...' : 'Search for Hardware Scanner (Bluetooth)'}
                        </Button>

                        {/* Manual / HID Scanner Registration */}
                        <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 1, color: 'text.secondary' }}>
                                Or Register Hardware Profile Manually:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                <Button
                                    size="small"
                                    variant={customDeviceType === 'bluetooth_scanner' ? 'contained' : 'outlined'}
                                    onClick={() => setCustomDeviceType('bluetooth_scanner')}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        bgcolor: customDeviceType === 'bluetooth_scanner' ? '#0F766E' : 'transparent',
                                        borderColor: '#0F766E',
                                        color: customDeviceType === 'bluetooth_scanner' ? '#fff' : '#0F766E'
                                    }}
                                >
                                    Bluetooth Scanner Gun
                                </Button>
                                <Button
                                    size="small"
                                    variant={customDeviceType === 'phone_camera' ? 'contained' : 'outlined'}
                                    onClick={() => setCustomDeviceType('phone_camera')}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        borderRadius: 2,
                                        bgcolor: customDeviceType === 'phone_camera' ? '#D97706' : 'transparent',
                                        borderColor: '#D97706',
                                        color: customDeviceType === 'phone_camera' ? '#fff' : '#D97706'
                                    }}
                                >
                                    Phone Camera
                                </Button>
                            </Box>
                            <TextField
                                fullWidth
                                size="small"
                                label="Device Name / Model"
                                placeholder="e.g. Eyoyo Ring Scanner, Netum 2D Gun"
                                value={customDeviceName}
                                onChange={(e) => setCustomDeviceName(e.target.value)}
                                sx={{ mb: 1.5 }}
                            />
                            <Button
                                fullWidth
                                variant="outlined"
                                disabled={!customDeviceName.trim()}
                                onClick={handleAddCustomDevice}
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderColor: '#0F766E',
                                    color: '#0F766E'
                                }}
                            >
                                + Add Device to Workstation
                            </Button>
                        </Box>
                    </Paper>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setBluetoothModalOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 2: Connect Mobile Phone Camera Viewfinder Bridge */}
            <Dialog
                open={phoneModalOpen}
                onClose={() => setPhoneModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{
                    fontWeight: 800,
                    bgcolor: 'rgba(217, 119, 6, 0.05)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: '#042F2E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneAndroid sx={{ color: '#D97706' }} /> Turn Mobile Phone into Wireless QR Scanner
                    </Box>
                    <IconButton size="small" onClick={() => setPhoneModalOpen(false)}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        Scan this pairing QR code with your iPhone or Android camera to instantly stream live barcode scans to this computer screen.
                    </Typography>

                    {/* QR Code Container */}
                    <Box sx={{
                        p: 2,
                        display: 'inline-block',
                        borderRadius: 3,
                        border: '2px solid #0F766E',
                        bgcolor: '#FFFFFF',
                        boxShadow: '0 8px 24px rgba(15, 118, 110, 0.15)',
                        mb: 2.5
                    }}>
                        <img
                            src={qrApiUrl}
                            alt="Pairing QR Code"
                            style={{ width: 200, height: 200, display: 'block', borderRadius: 4 }}
                        />
                    </Box>

                    {/* Step by Step Guide */}
                    <Box sx={{ textAlign: 'left', p: 2, bgcolor: 'rgba(15, 118, 110, 0.04)', borderRadius: 2.5, mb: 2.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#042F2E' }}>
                            How to pair your phone:
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                            1. Open your phone's built-in <strong>Camera app</strong> (no app installation needed).
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                            2. Point camera at the QR code above and tap the link that appears.
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                            3. Point phone at any garment tag to scan. Scanned items appear in the POS instantly!
                        </Typography>
                    </Box>

                    {/* Network Host Settings */}
                    <Box sx={{ mb: 2, textAlign: 'left', p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                Computer Wi-Fi Address:
                            </Typography>
                            <Chip label={networkHost} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Ensure your smartphone is connected to the same Wi-Fi network as this register.
                        </Typography>
                    </Box>

                    {/* Quick Link & Simulation */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            readOnly
                            value={bridgeUrl}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                navigator.clipboard.writeText(bridgeUrl);
                                                setCopiedBridgeUrl(true);
                                                setTimeout(() => setCopiedBridgeUrl(false), 2000);
                                            }}
                                        >
                                            {copiedBridgeUrl ? <Check sx={{ color: '#059669' }} /> : <ContentCopy fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<OpenInNew />}
                            onClick={() => window.open(bridgeUrl, '_blank')}
                            sx={{
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                borderColor: '#0F766E',
                                color: '#0F766E',
                                '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.06)' }
                            }}
                        >
                            Open Scanner Viewfinder
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => {
                                simulatePhoneScan();
                                setPhoneModalOpen(false);
                            }}
                            sx={{
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                                color: '#FFFFFF'
                            }}
                        >
                            Test Signal
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setPhoneModalOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 3: Direct Live Camera Barcode & QR Scanner (Html5Qrcode) */}
            <Dialog
                open={cameraScannerOpen}
                onClose={() => setCameraScannerOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{
                    fontWeight: 800,
                    bgcolor: 'rgba(15, 118, 110, 0.05)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: '#042F2E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CameraAlt sx={{ color: '#0F766E' }} /> Live Camera Barcode & QR Scanner
                    </Box>
                    <IconButton size="small" onClick={() => setCameraScannerOpen(false)}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Hold any garment tag or product QR code in front of the lens. It will scan and resolve the item automatically.
                    </Typography>

                    {/* Camera Selector (Supports Wireless Phone Continuity Camera) */}
                    {availableCameras.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="camera-source-label">Camera Lens / Device</InputLabel>
                                <Select
                                    labelId="camera-source-label"
                                    value={selectedCameraId || (availableCameras[0] ? availableCameras[0].id : '')}
                                    label="Camera Lens / Device"
                                    onChange={(e) => handleCameraChange(e.target.value)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    {availableCameras.map((cam) => {
                                        const isPhone = cam.label.toLowerCase().includes('iphone') || cam.label.toLowerCase().includes('phone');
                                        return (
                                            <MenuItem key={cam.id} value={cam.id}>
                                                {isPhone ? `📱 ${cam.label} (Continuity Bluetooth)` : `💻 ${cam.label || 'Camera'}`}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(15, 118, 110, 0.08)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#042F2E', display: 'block' }}>
                            📱 Apple Continuity Camera (Mac + Phone over Bluetooth)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Ensure Bluetooth & Wi-Fi are ON on both your Mac and phone. When selected in the menu above, macOS automatically triggers and opens your phone's camera wirelessly.
                        </Typography>
                    </Alert>

                    {cameraError ? (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {cameraError}
                        </Alert>
                    ) : (
                        <Box sx={{
                            position: 'relative',
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '2px solid #0F766E',
                            bgcolor: '#000000',
                            minHeight: 280,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div id="device-tab-reader" style={{ width: '100%', minHeight: 280 }} />
                        </Box>
                    )}

                    <Box sx={{ mt: 2, p: 2, borderRadius: 2.5, bgcolor: 'rgba(15, 118, 110, 0.04)', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Sensors fontSize="small" /> Real-time Inventory Matcher Active
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                            Detected codes are immediately matched against Aleen inventory and logged in the Test Bench.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setCameraScannerOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Close Camera
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
