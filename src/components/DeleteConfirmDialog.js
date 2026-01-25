import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const DeleteConfirmDialog = ({ open, onClose, onConfirm, title, content }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    p: 1
                }
            }}
        >
            <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 800 }}>
                {title || 'Confirm Deletion'}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="delete-dialog-description" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {content || 'Are you sure you want to delete this item? This action cannot be undone.'}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ fontWeight: 600 }}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    autoFocus
                    sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 3
                    }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConfirmDialog;
