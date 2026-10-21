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
                    minHeight: 46,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        minHeight: 46,
                        mr: 1.5,
                        px: 2,
                        color: 'text.secondary',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                            color: '#0F766E'
                        }
                    },
                    '& .Mui-selected': {
                        color: '#0F766E !important'
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#0F766E',
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
