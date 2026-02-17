import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOnlineMessage(true);
            setTimeout(() => setShowOnlineMessage(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <>
            <Snackbar
                open={!isOnline}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                TransitionComponent={Slide}
            >
                <Alert icon={<WifiOff fontSize="inherit" />} severity="warning" variant="filled" sx={{ width: '100%' }}>
                    You are offline. Changes will be saved locally.
                </Alert>
            </Snackbar>

            <Snackbar
                open={showOnlineMessage}
                autoHideDuration={3000}
                onClose={() => setShowOnlineMessage(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                TransitionComponent={Slide}
            >
                <Alert icon={<Wifi fontSize="inherit" />} severity="success" variant="filled" sx={{ width: '100%' }}>
                    Back online. Syncing data...
                </Alert>
            </Snackbar>
        </>
    );
};

export default NetworkStatus;
