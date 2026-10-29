import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Avatar
} from '@mui/material';
import { Warning, HelpOutline } from '@mui/icons-material';

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
    // Toast Notification State
    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'success', // 'success' | 'info' | 'warning' | 'error'
        duration: 4000
    });

    // Confirmation Modal Dialog State
    const [confirmState, setConfirmState] = useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        isDanger: true,
        onConfirm: null,
        onCancel: null
    });

    const showToast = useCallback((message, severity = 'success', duration = 4000) => {
        setToast({
            open: true,
            message: typeof message === 'string' ? message : String(message),
            severity,
            duration
        });
    }, []);

    const showConfirm = useCallback(({
        title = 'Confirmation Required',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        isDanger = true,
        onConfirm = null,
        onCancel = null
    }) => {
        setConfirmState({
            open: true,
            title,
            message,
            confirmText,
            cancelText,
            isDanger,
            onConfirm: typeof onConfirm === 'function' ? onConfirm : null,
            onCancel: typeof onCancel === 'function' ? onCancel : null
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmState(prev => ({ ...prev, open: false }));
    }, []);

    const handleConfirmAction = useCallback(() => {
        const action = confirmState.onConfirm;
        closeConfirm();
        if (typeof action === 'function') {
            const res = action();
            if (typeof res === 'function') {
                res();
            }
        }
    }, [confirmState, closeConfirm]);

    const handleCancelAction = useCallback(() => {
        const cancelAction = confirmState.onCancel;
        closeConfirm();
        if (typeof cancelAction === 'function') {
            const res = cancelAction();
            if (typeof res === 'function') {
                res();
            }
        }
    }, [confirmState, closeConfirm]);

    // Safety intercept for window.alert to replace ugly browser alerts with Atelier toast
    useEffect(() => {
        const originalAlert = window.alert;
        window.alert = (msg) => {
            showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'info');
        };
        return () => {
            window.alert = originalAlert;
        };
    }, [showToast]);

    return (
        <FeedbackContext.Provider value={{ showToast, showConfirm }}>
            {children}

            {/* Global Luxury Atelier Toast Notification */}
            <Snackbar
                open={toast.open}
                autoHideDuration={toast.duration}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                sx={{ zIndex: 10000 }}
            >
                <Alert
                    onClose={() => setToast(prev => ({ ...prev, open: false }))}
                    severity={toast.severity}
                    variant="filled"
                    sx={{
                        borderRadius: 3,
                        fontWeight: 700,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        px: 2.5,
                        py: 1,
                        bgcolor: toast.severity === 'success' ? '#0F766E' : undefined
                    }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>

            {/* Global Atelier Luxury Confirmation Dialog */}
            <Dialog
                open={confirmState.open}
                onClose={handleCancelAction}
                PaperProps={{
                    sx: {
                        borderRadius: 3.5,
                        p: 1.5,
                        minWidth: { xs: '90%', sm: 440 },
                        maxWidth: 480,
                        border: '1px solid',
                        borderColor: confirmState.isDanger ? 'rgba(239, 68, 68, 0.25)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.25)',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                        bgcolor: 'background.paper'
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1, pt: 2, px: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 44,
                                height: 44,
                                bgcolor: confirmState.isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.12)',
                                color: confirmState.isDanger ? '#DC2626' : '#0F766E'
                            }}
                        >
                            {confirmState.isDanger ? <Warning /> : <HelpOutline />}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                                {confirmState.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Atelier Studio Confirmation
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ px: 2.5, py: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, fontWeight: 500 }}>
                        {confirmState.message}
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, gap: 1 }}>
                    <Button
                        onClick={handleCancelAction}
                        sx={{
                            fontWeight: 700,
                            color: 'text.secondary',
                            textTransform: 'none',
                            borderRadius: 2.5,
                            px: 2
                        }}
                    >
                        {confirmState.cancelText}
                    </Button>
                    <Button
                        onClick={handleConfirmAction}
                        variant="contained"
                        sx={{
                            fontWeight: 800,
                            borderRadius: 2.5,
                            px: 2.5,
                            textTransform: 'none',
                            bgcolor: confirmState.isDanger ? '#DC2626' : '#0F766E',
                            color: '#FFFFFF',
                            boxShadow: confirmState.isDanger ? '0 4px 14px rgba(220, 38, 38, 0.3)' : '0 4px 14px rgba(15, 118, 110, 0.3)',
                            '&:hover': {
                                bgcolor: confirmState.isDanger ? '#B91C1C' : '#042F2E'
                            }
                        }}
                    >
                        {confirmState.confirmText}
                    </Button>
                </DialogActions>
            </Dialog>
        </FeedbackContext.Provider>
    );
};

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        return {
            showToast: (msg) => console.log(msg),
            showConfirm: ({ onConfirm }) => onConfirm && onConfirm()
        };
    }
    return context;
};

export default FeedbackContext;
