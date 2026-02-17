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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5 }}
        >
            <Paper
                elevation={0}
                sx={{
                    background: isDark
                        ? 'rgba(30, 30, 40, 0.6)'
                        : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: isDark
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: 4,
                    boxShadow: isDark
                        ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                        : '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
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
