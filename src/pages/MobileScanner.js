import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Paper,
    Chip,
    Alert
} from '@mui/material';
import {
    QrCodeScanner,
    CameraAlt,
    CheckCircle,
    FlipCameraAndroid,
    VolumeUp,
    VolumeOff,
    Sensors,
    PhotoCamera
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function MobileScanner() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || 'default_session';

    const [isScanning, setIsScanning] = useState(false);
    const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
    const [scannerError, setScannerError] = useState('');
    const [lastScannedCode, setLastScannedCode] = useState(null);
    const [scanCount, setScanCount] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [sendStatus, setSendStatus] = useState('ready'); // 'ready', 'sending', 'sent', 'error'

    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);
    const isProcessingRef = useRef(false);

    // Audio chime synthesis
    const playBeep = () => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.frequency.setValueAtTime(1174, audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        } catch (e) {}
    };

    // Haptic vibration
    const triggerHaptic = () => {
        if (navigator.vibrate) {
            try { navigator.vibrate([80, 40, 80]); } catch (e) {}
        }
    };

    // Transmit scanned code to Workstation
    const transmitScan = async (code) => {
        if (!code || isProcessingRef.current) return;
        isProcessingRef.current = true;
        setSendStatus('sending');
        setLastScannedCode(code);
        setScanCount(prev => prev + 1);

        playBeep();
        triggerHaptic();

        // 1. BroadcastChannel (for same browser / network test)
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('aleen_scanner_bridge');
                bc.postMessage({ token, code, timestamp: Date.now() });
                bc.close();
            }
        } catch (e) {}

        // 2. LocalStorage bridge
        try {
            localStorage.setItem('aleen_last_phone_scan', JSON.stringify({
                token,
                code,
                timestamp: Date.now()
            }));
        } catch (e) {}

        // 3. Firestore Realtime Document
        try {
            const scanData = {
                code,
                token,
                deviceName: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iPhone Camera' : (/Android/.test(navigator.userAgent) ? 'Android Camera' : 'Mobile Camera'),
                timestamp: Date.now()
            };
            const sessionRef = doc(db, 'scanner_sessions', token);
            await setDoc(sessionRef, scanData, { merge: true });

            // Global session broadcast document so any workstation screen receives it
            const globalRef = doc(db, 'scanner_sessions', 'latest_scan');
            await setDoc(globalRef, scanData, { merge: true });

            setSendStatus('sent');
        } catch (err) {
            console.warn('Firestore session sync warning:', err);
            // Even if offline, local broadcast succeeded
            setSendStatus('sent');
        }

        // Allow next scan after 1.4 seconds cooldown
        setTimeout(() => {
            isProcessingRef.current = false;
            setSendStatus('ready');
        }, 1400);
    };

    // Start Live Video Viewfinder
    const startCamera = async (facing = cameraFacing) => {
        setScannerError('');
        setIsScanning(false);

        try {
            // Clean up existing instance if any
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            }

            const qr = new Html5Qrcode('mobile-viewfinder-reader');
            html5QrCodeRef.current = qr;

            const config = {
                fps: 15,
                qrbox: { width: 260, height: 260 },
                aspectRatio: 1.0
            };

            const onDecoded = (decodedText) => {
                if (!isProcessingRef.current) {
                    transmitScan(decodedText.trim());
                }
            };

            await qr.start(
                { facingMode: facing },
                config,
                onDecoded,
                () => {} // Ignore scan search errors
            );

            setIsScanning(true);
        } catch (err) {
            console.warn('Primary camera facing mode failed:', err);
            // Try fallback facing mode
            try {
                const fallbackFacing = facing === 'environment' ? 'user' : 'environment';
                const qr = html5QrCodeRef.current || new Html5Qrcode('mobile-viewfinder-reader');
                html5QrCodeRef.current = qr;
                await qr.start(
                    { facingMode: fallbackFacing },
                    { fps: 15, qrbox: { width: 260, height: 260 } },
                    (decodedText) => {
                        if (!isProcessingRef.current) {
                            transmitScan(decodedText.trim());
                        }
                    },
                    () => {}
                );
                setIsScanning(true);
            } catch (fallbackErr) {
                console.error('All camera attempts failed:', fallbackErr);
                setScannerError(
                    'Camera access permission was denied or insecure HTTP blocked video. Use the "Take Photo & Scan" button below!'
                );
                setIsScanning(false);
            }
        }
    };

    // Stop Camera
    const stopCamera = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (e) {}
        }
        setIsScanning(false);
    };

    // Flip Camera (Front / Back)
    const toggleCameraFacing = async () => {
        const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
        setCameraFacing(nextFacing);
        await startCamera(nextFacing);
    };

    // Handle File / Native Camera Capture Fallback
    const handleFileScan = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
            let qr = html5QrCodeRef.current;
            if (!qr) {
                qr = new Html5Qrcode('mobile-viewfinder-reader');
                html5QrCodeRef.current = qr;
            }
            const decoded = await qr.scanFile(file, true);
            if (decoded) {
                transmitScan(decoded.trim());
            }
        } catch (err) {
            setScannerError('Could not detect a barcode or QR code in that photo. Please try again.');
        } finally {
            e.target.value = '';
        }
    };

    // Mount lifecycle: Auto-start camera after slight mount delay
    useEffect(() => {
        const timer = setTimeout(() => {
            startCamera('environment');
        }, 400);

        return () => {
            clearTimeout(timer);
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#042F2E',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Top Bar */}
            <Box
                sx={{
                    px: 2.5,
                    py: 1.8,
                    bgcolor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: (t) => t.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #D97706'
                        }}
                    >
                        <QrCodeScanner sx={{ fontSize: 18, color: '#FFFFFF' }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.1 }}>
                            ALEEN SCANNER
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#D97706', fontSize: '0.68rem', fontWeight: 700 }}>
                            ● WIRELESS BRIDGE ACTIVE
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={sendStatus === 'sending' ? 'Sending...' : 'Linked'}
                        size="small"
                        sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            bgcolor: sendStatus === 'sending' ? 'rgba(217, 119, 6, 0.25)' : 'rgba(5, 150, 105, 0.25)',
                            color: sendStatus === 'sending' ? '#F59E0B' : '#10B981',
                            border: '1px solid',
                            borderColor: sendStatus === 'sending' ? '#D97706' : '#059669'
                        }}
                    />
                    <IconButton
                        size="small"
                        onClick={toggleCameraFacing}
                        sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' }}
                    >
                        <FlipCameraAndroid fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        sx={{ color: soundEnabled ? '#059669' : 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.1)' }}
                    >
                        {soundEnabled ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}
                    </IconButton>
                </Box>
            </Box>

            {/* Error Message if camera failed */}
            {scannerError && (
                <Box sx={{ p: 2 }}>
                    <Alert
                        severity="warning"
                        sx={{
                            borderRadius: 2.5,
                            bgcolor: 'rgba(217, 119, 6, 0.15)',
                            color: '#FDE68A',
                            border: '1px solid #D97706'
                        }}
                    >
                        {scannerError}
                    </Alert>
                </Box>
            )}

            {/* Camera Viewfinder Area */}
            <Box
                sx={{
                    flexGrow: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#000000',
                    overflow: 'hidden'
                }}
            >
                {/* HTML5 QR Code Container */}
                <div
                    id="mobile-viewfinder-reader"
                    style={{
                        width: '100%',
                        maxWidth: 480,
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />

                {/* Overlaid Scanning Reticle */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 250,
                        height: 250,
                        pointerEvents: 'none',
                        border: '2px solid rgba(217, 119, 6, 0.7)',
                        borderRadius: 3,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, #D97706, #0F766E, transparent)',
                            boxShadow: '0 0 8px #D97706',
                            animation: 'scannerLaser 2s ease-in-out infinite'
                        },
                        '@keyframes scannerLaser': {
                            '0%': { top: '0%' },
                            '50%': { top: '98%' },
                            '100%': { top: '0%' }
                        }
                    }}
                >
                    {/* Reticle Corner Brackets */}
                    <Box sx={{ position: 'absolute', top: -2, left: -2, width: 22, height: 22, borderTop: '4px solid #D97706', borderLeft: '4px solid #D97706', borderTopLeftRadius: 10 }} />
                    <Box sx={{ position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderTop: '4px solid #D97706', borderRight: '4px solid #D97706', borderTopRightRadius: 10 }} />
                    <Box sx={{ position: 'absolute', bottom: -2, left: -2, width: 22, height: 22, borderBottom: '4px solid #D97706', borderLeft: '4px solid #D97706', borderBottomLeftRadius: 10 }} />
                    <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderBottom: '4px solid #D97706', borderRight: '4px solid #D97706', borderBottomRightRadius: 10 }} />
                </Box>

                {!isScanning && (
                    <Box
                        sx={{
                            position: 'absolute',
                            zIndex: 10,
                            textAlign: 'center',
                            p: 3,
                            bgcolor: 'rgba(4, 47, 46, 0.92)',
                            borderRadius: 3.5,
                            border: '1px solid #0F766E',
                            maxWidth: 320
                        }}
                    >
                        <CameraAlt sx={{ fontSize: 48, color: '#D97706', mb: 1.5 }} />
                        <Typography variant="body1" sx={{ fontWeight: 800, mb: 1 }}>
                            Camera Initializing...
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 2 }}>
                            Tap the button below if your phone prompts to allow camera access.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => startCamera(cameraFacing)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                bgcolor: (t) => t.palette.primary.main,
                                color: '#FFFFFF',
                                borderRadius: 2.5,
                                px: 3,
                                '&:hover': { bgcolor: '#042F2E' }
                            }}
                        >
                            Grant Camera Permission
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Bottom Panel: Scanned feedback and controls */}
            <Box
                sx={{
                    p: 2.5,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {/* Last Scanned Result Pill */}
                {lastScannedCode ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'rgba(5, 150, 105, 0.2)',
                            border: '1px solid #059669',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CheckCircle sx={{ color: '#10B981', fontSize: 28 }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: '#6EE7B7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ✓ Sent to Workstation POS
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: 'monospace', color: '#FFFFFF' }}>
                                    {lastScannedCode}
                                </Typography>
                            </Box>
                        </Box>
                        <Chip
                            label={`${scanCount} Scanned`}
                            size="small"
                            sx={{ bgcolor: '#059669', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                    </Paper>
                ) : (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                            Point lens at barcode or QR code
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Scans transfer automatically to your computer register
                        </Typography>
                    </Box>
                )}

                {/* Instant Native Camera Snap Button (Universal Fallback) */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleFileScan}
                />
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PhotoCamera />}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    sx={{
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 800,
                        textTransform: 'none',
                        fontSize: '0.92rem',
                        background: 'linear-gradient(135deg, #0F766E 0%, #D97706 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 16px rgba(15, 118, 110, 0.4)'
                    }}
                >
                    Snap & Scan via Native Camera
                </Button>

                {/* Session telemetry footer */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.8 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Sensors sx={{ fontSize: 13, color: '#10B981' }} />
                        Session: {token.slice(0, 10)}...
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#D97706', fontSize: '0.68rem', fontWeight: 700 }}>
                        Aleen Boutique Atelier
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
