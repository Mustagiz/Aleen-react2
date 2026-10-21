import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { 
    People, 
    Stars, 
    Campaign 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const CLIENTELE_TABS = [
    { label: 'Guests & Customers', path: '/customers', icon: <People sx={{ fontSize: '1.1rem' }} /> },
    { label: 'VIP Loyalty & Privileges', path: '/loyalty', icon: <Stars sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Marketing & Campaigns', path: '/marketing', icon: <Campaign sx={{ fontSize: '1.1rem' }} /> }
];

export default function ClienteleNavTabs() {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine current tab value
    const currentPath = CLIENTELE_TABS.some(t => t.path === location.pathname)
        ? location.pathname
        : '/customers';

    return (
        <Box sx={{ mb: 3.5, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={currentPath}
                onChange={(e, newPath) => navigate(newPath)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#0F766E', // Deep Emerald atelier primary
                        height: 3,
                        borderRadius: '3px 3px 0 0'
                    },
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        minHeight: 48,
                        color: 'text.secondary',
                        px: 2.5,
                        py: 1.25,
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                            color: '#0F766E',
                            fontWeight: 800
                        },
                        '&:hover': {
                            color: '#042F2E',
                            bgcolor: 'rgba(15, 118, 110, 0.04)'
                        }
                    }
                }}
            >
                {CLIENTELE_TABS.map((tab) => (
                    <Tab
                        key={tab.path}
                        value={tab.path}
                        label={tab.label}
                        icon={tab.icon}
                        iconPosition="start"
                    />
                ))}
            </Tabs>
        </Box>
    );
}
