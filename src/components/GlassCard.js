import React from 'react';
import { Paper, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useThemeContext } from '../contexts/ThemeContext';

export default function GlassCard({ children, sx = {}, hover = false, glowColor = 'aurora', ...props }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { designSystem, activeSystemConfig } = useThemeContext() || {};

    const getSystemCardStyle = () => {
        const radius = activeSystemConfig?.shape?.cardRadius ?? (designSystem === 'material' ? 24 : (designSystem === 'microsoft' ? 4 : (designSystem === 'linear' || designSystem === 'zoho' ? 6 : (designSystem === 'apple' ? 14 : 16))));

        switch (designSystem) {
            case 'microsoft':
                return {
                    borderRadius: `${radius}px`,
                    background: isDark ? '#201F1E' : '#FFFFFF',
                    border: isDark ? '1px solid #3B3A39' : '1px solid #E1DFDD',
                    boxShadow: isDark ? '0 2px 4px rgba(0,0,0,0.24)' : '0 1.6px 3.6px rgba(0,0,0,0.13), 0 0.3px 0.9px rgba(0,0,0,0.11)',
                    backdropFilter: 'none',
                    hoverShadow: '0 3.2px 7.2px rgba(0,0,0,0.13), 0 0.6px 1.8px rgba(0,0,0,0.11)',
                    hoverBorder: '#0078D4'
                };
            case 'apple':
                return {
                    borderRadius: `${radius}px`,
                    background: isDark ? 'rgba(28, 28, 30, 0.78)' : 'rgba(255, 255, 255, 0.75)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.45)' : '0 8px 30px rgba(0, 0, 0, 0.06)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    hoverShadow: isDark ? '0 12px 40px rgba(0, 0, 0, 0.6)' : '0 14px 44px rgba(0, 113, 227, 0.12)',
                    hoverBorder: '#0071E3'
                };
            case 'zoho':
                return {
                    borderRadius: `${radius}px`,
                    background: isDark ? '#1F2937' : '#FFFFFF',
                    border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                    boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    backdropFilter: 'none',
                    hoverShadow: '0 4px 12px rgba(234, 88, 12, 0.12)',
                    hoverBorder: '#EA580C'
                };
            case 'linear':
                return {
                    borderRadius: `${radius}px`,
                    background: isDark ? '#141517' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'none',
                    hoverShadow: '0 8px 24px rgba(139, 92, 246, 0.25)',
                    hoverBorder: '#8B5CF6'
                };
            case 'material':
                return {
                    borderRadius: `${radius}px`,
                    background: isDark ? '#2B2930' : '#FEF7FF',
                    border: isDark ? '1px solid rgba(208, 188, 255, 0.12)' : '1px solid rgba(103, 80, 164, 0.12)',
                    boxShadow: isDark ? '0 8px 28px rgba(0, 0, 0, 0.35)' : '0 4px 20px rgba(103, 80, 164, 0.08)',
                    backdropFilter: 'none',
                    hoverShadow: '0 12px 32px rgba(103, 80, 164, 0.2)',
                    hoverBorder: '#6750A4'
                };
            case 'stripe':
                return {
                    borderRadius: `${radius}px`,
                    background: isDark ? '#1A1F2C' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                    backdropFilter: 'none',
                    hoverShadow: '0 10px 30px rgba(99, 91, 255, 0.18)',
                    hoverBorder: '#635BFF'
                };
            case 'salesforce':
                return {
                    borderRadius: `${radius}px`,
                    background: isDark ? '#1B2432' : '#FFFFFF',
                    border: isDark ? '1px solid #2B3A4F' : '1px solid #DDDBDA',
                    boxShadow: isDark ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.07)',
                    backdropFilter: 'none',
                    hoverShadow: '0 4px 14px rgba(1, 118, 211, 0.18)',
                    hoverBorder: '#0176D3'
                };
            case 'atelier':
            default:
                return {
                    borderRadius: `${radius}px`,
                    background: isDark
                        ? 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.08) 0%, rgba(12, 26, 25, 0.96) 85%)'
                        : 'rgba(255, 255, 255, 0.97)',
                    border: isDark ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(15, 118, 110, 0.14)',
                    boxShadow: isDark
                        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.5)'
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 8px 24px -4px rgba(15, 118, 110, 0.07)',
                    backdropFilter: 'blur(20px)',
                    hoverShadow: isDark
                        ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 28px rgba(20, 184, 166, 0.35)'
                        : '0 16px 36px -4px rgba(15, 118, 110, 0.24), 0 0 22px rgba(15, 118, 110, 0.18)',
                    hoverBorder: isDark ? '#2DD4BF' : '#0F766E'
                };
        }
    };

    const style = getSystemCardStyle();

    return (
        <Box
            component={hover ? motion.div : 'div'}
            {...(hover ? {
                whileHover: { y: -3, transition: { type: 'spring', stiffness: 420, damping: 26 } },
                whileTap: { scale: 0.985, transition: { duration: 0.1 } }
            } : {})}
            sx={{ height: '100%', transform: 'translateZ(0)' }}
        >
            <Paper
                elevation={0}
                sx={{
                    position: 'relative',
                    height: '100%',
                    background: style.background,
                    backdropFilter: style.backdropFilter,
                    WebkitBackdropFilter: style.backdropFilter,
                    border: style.border,
                    borderRadius: style.borderRadius,
                    boxShadow: style.boxShadow,
                    overflow: 'hidden',
                    transition: hover ? 'border-color 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                    ...(hover ? {
                        '&:hover': {
                            borderColor: style.hoverBorder,
                            boxShadow: style.hoverShadow
                        }
                    } : {}),
                    ...sx
                }}
                {...props}
            >
                {children}
            </Paper>
        </Box>
    );
}
