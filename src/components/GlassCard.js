import React from 'react';
import { Paper, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const GLOW_PRESETS = {
    emerald: {
        border: (isDark) => isDark ? '#2DD4BF' : '#0F766E',
        shadow: (isDark) => isDark
            ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 28px rgba(20, 184, 166, 0.35)'
            : '0 16px 36px -4px rgba(15, 118, 110, 0.24), 0 0 22px rgba(15, 118, 110, 0.18)'
    },
    gold: {
        border: (isDark) => isDark ? '#F59E0B' : '#D97706',
        shadow: (isDark) => isDark
            ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 28px rgba(217, 119, 6, 0.38)'
            : '0 16px 36px -4px rgba(217, 119, 6, 0.24), 0 0 22px rgba(245, 158, 11, 0.2)'
    },
    sapphire: {
        border: (isDark) => isDark ? '#38BDF8' : '#0284C7',
        shadow: (isDark) => isDark
            ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 28px rgba(2, 132, 199, 0.38)'
            : '0 16px 36px -4px rgba(2, 132, 199, 0.24), 0 0 22px rgba(56, 189, 248, 0.2)'
    },
    ruby: {
        border: (isDark) => isDark ? '#F87171' : '#DC2626',
        shadow: (isDark) => isDark
            ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 28px rgba(239, 68, 68, 0.38)'
            : '0 16px 36px -4px rgba(239, 68, 68, 0.24), 0 0 22px rgba(248, 113, 113, 0.2)'
    },
    violet: {
        border: (isDark) => isDark ? '#C084FC' : '#7C3AED',
        shadow: (isDark) => isDark
            ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 28px rgba(124, 58, 237, 0.38)'
            : '0 16px 36px -4px rgba(124, 58, 237, 0.24), 0 0 22px rgba(192, 132, 252, 0.2)'
    },
    aurora: {
        border: (isDark) => isDark ? '#2DD4BF' : '#0F766E',
        shadow: (isDark) => isDark
            ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 30px rgba(20, 184, 166, 0.32), 0 0 16px rgba(217, 119, 6, 0.22)'
            : '0 16px 36px -4px rgba(15, 118, 110, 0.22), 0 0 24px rgba(15, 118, 110, 0.16), 0 0 14px rgba(217, 119, 6, 0.14)'
    }
};

const GlassCard = ({ children, sx = {}, hover = true, glowColor = 'aurora', ...props }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const preset = GLOW_PRESETS[glowColor] || GLOW_PRESETS.aurora;
    const hoverBorder = typeof preset.border === 'function' ? preset.border(isDark) : (glowColor || '#0F766E');
    const hoverShadow = typeof preset.shadow === 'function' ? preset.shadow(isDark) : `0 16px 36px -4px rgba(0,0,0,0.3), 0 0 25px ${glowColor}40`;

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            whileHover={hover ? { y: -5, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
            sx={{ height: '100%' }}
        >
            <Paper
                elevation={0}
                sx={{
                    position: 'relative',
                    height: '100%',
                    background: isDark
                        ? 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.05) 0%, rgba(14, 28, 28, 0.95) 85%)'
                        : 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(20px)',
                    border: isDark
                        ? '1px solid rgba(20, 184, 166, 0.16)'
                        : '1px solid rgba(15, 118, 110, 0.12)',
                    borderRadius: '16px',
                    boxShadow: isDark
                        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 30px rgba(0, 0, 0, 0.45)'
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 4px 20px -2px rgba(15, 118, 110, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
                    overflow: 'hidden',
                    transition: 'border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    ...(hover ? {
                        '&:hover': {
                            borderColor: hoverBorder,
                            boxShadow: hoverShadow
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
};

export default GlassCard;
