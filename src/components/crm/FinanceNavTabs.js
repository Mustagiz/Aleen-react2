import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { 
    AccountBalanceWallet, 
    TrendingUp, 
    ReceiptLong, 
    Insights, 
    BarChart, 
    FactCheck 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const FINANCE_TABS = [
    { label: 'Daily Cash Ledger', path: '/payment-summary', icon: <AccountBalanceWallet sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Profit & Loss', path: '/profit-loss', icon: <TrendingUp sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Expenses Register', path: '/expenses', icon: <ReceiptLong sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Advanced Analytics', path: '/advanced-reports', icon: <Insights sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Sales Reports', path: '/sales-reports', icon: <BarChart sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Stock Audit', path: '/inventory-reports', icon: <FactCheck sx={{ fontSize: '1.1rem' }} /> }
];

export default function FinanceNavTabs() {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine current tab value
    const currentPath = FINANCE_TABS.some(t => t.path === location.pathname)
        ? location.pathname
        : '/payment-summary';

    return (
        <Box sx={{ mb: 3.5, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={currentPath}
                onChange={(e, val) => navigate(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    minHeight: 44,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        minHeight: 44,
                        mr: 1.5,
                        px: 2.25,
                        borderRadius: (t) => `${t.shape?.borderRadius || 8}px ${t.shape?.borderRadius || 8}px 0 0`,
                        color: 'text.secondary',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                            color: 'primary.main',
                            bgcolor: (t) => `${t.palette.primary.main}0D`
                        }
                    },
                    '& .Mui-selected': {
                        color: 'primary.main !important',
                        bgcolor: (t) => `${t.palette.primary.main}14`
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: 'primary.main',
                        height: 3,
                        borderRadius: '3px 3px 0 0'
                    }
                }}
            >
                {FINANCE_TABS.map((tab) => (
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
