import React from 'react';
import { Box } from '@mui/material';
import { 
    People, 
    Stars, 
    Campaign 
} from '../icons';
import { useNavigate, useLocation } from 'react-router-dom';

const CLIENTELE_TABS = [
    { label: 'Guests & Customers', path: '/customers', icon: <People sx={{ fontSize: '0.95rem' }} /> },
    { label: 'VIP Loyalty & Privileges', path: '/loyalty', icon: <Stars sx={{ fontSize: '0.95rem' }} /> },
    { label: 'Marketing & Campaigns', path: '/marketing', icon: <Campaign sx={{ fontSize: '0.95rem' }} /> }
];

export default function ClienteleNavTabs() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E1E4EA',
                    borderRadius: '9999px',
                    p: '3px 4px',
                    gap: 0.5,
                    boxShadow: '0 2px 8px rgba(8, 15, 28, 0.04)'
                }}
            >
                {CLIENTELE_TABS.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <Box
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            sx={{
                                px: 2,
                                py: 0.55,
                                borderRadius: '9999px',
                                bgcolor: isActive ? '#080F1C' : 'transparent',
                                color: isActive ? '#FFFFFF' : '#66707B',
                                fontSize: '0.78rem',
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    color: isActive ? '#FFFFFF' : '#080F1C',
                                    bgcolor: isActive ? '#080F1C' : '#F4F5F7'
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', color: isActive ? '#FFFFFF' : '#66707B' }}>
                                {tab.icon}
                            </Box>
                            <span>{tab.label}</span>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
