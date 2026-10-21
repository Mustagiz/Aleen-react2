import React from 'react';
import { Paper, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const GlassCard = ({ children, sx = {}, ...props }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            whileHover={{ y: -3 }}
        >
            <Paper
                elevation={0}
                sx={{
                    background: isDark
                        ? 'rgba(17, 32, 32, 0.85)'
                        : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: isDark
                        ? '1px solid rgba(20, 184, 166, 0.15)'
                        : '1px solid rgba(15, 118, 110, 0.12)',
                    borderRadius: 3.5,
                    boxShadow: isDark
                        ? '0 8px 32px 0 rgba(0, 0, 0, 0.45)'
                        : '0 4px 24px -2px rgba(15, 118, 110, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
                    overflow: 'hidden',
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
