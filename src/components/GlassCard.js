import React from 'react';
import { Paper, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const GlassCard = ({ children, sx = {}, hover = true, ...props }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            whileHover={hover ? { y: -4, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
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
                    transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
                    ...(hover ? {
                        '&:hover': {
                            borderColor: isDark ? 'rgba(45, 212, 191, 0.45)' : 'rgba(15, 118, 110, 0.32)',
                            boxShadow: isDark
                                ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(20, 184, 166, 0.12)'
                                : 'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 14px 32px -4px rgba(15, 118, 110, 0.14), 0 4px 12px rgba(0, 0, 0, 0.03)'
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
