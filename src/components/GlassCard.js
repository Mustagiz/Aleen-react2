import React from 'react';
import { Paper, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const GlassCard = ({ children, sx = {}, hover = false, ...props }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
        >
            <Paper
                elevation={0}
                sx={{
                    position: 'relative',
                    background: isDark
                        ? 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.04) 0%, rgba(14, 28, 28, 0.94) 85%)'
                        : 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(20px)',
                    border: isDark
                        ? '1px solid rgba(20, 184, 166, 0.16)'
                        : '1px solid rgba(15, 118, 110, 0.11)',
                    borderRadius: '16px',
                    boxShadow: isDark
                        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 30px rgba(0, 0, 0, 0.45)'
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 4px 20px -2px rgba(15, 118, 110, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': hover ? {
                        borderColor: isDark ? 'rgba(20, 184, 166, 0.3)' : 'rgba(15, 118, 110, 0.25)',
                        boxShadow: isDark
                            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 36px rgba(0, 0, 0, 0.55)'
                            : 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 8px 28px -4px rgba(15, 118, 110, 0.12), 0 2px 6px rgba(0, 0, 0, 0.03)'
                    } : {},
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
