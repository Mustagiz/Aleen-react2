import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box, Typography } from '@mui/material';
import { DeleteOutline } from './icons';

const DeleteConfirmDialog = ({ open, onClose, onConfirm, title, content }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    p: 0,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 24px 64px -8px rgba(8, 15, 28, 0.2)'
                }
            }}
        >
            <DialogTitle id="delete-dialog-title" sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    <DeleteOutline sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'text.primary' }}>
                    {title || 'Confirm Deletion'}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 2.5, py: 1 }}>
                <DialogContentText id="delete-dialog-description" sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {content || 'Are you sure you want to delete this item? This action cannot be undone.'}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '9999px',
                        px: 2.5,
                        borderColor: 'divider',
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    autoFocus
                    sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '9999px',
                        px: 2.5,
                        bgcolor: '#EF4444',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                        '&:hover': { bgcolor: '#DC2626' }
                    }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConfirmDialog;
