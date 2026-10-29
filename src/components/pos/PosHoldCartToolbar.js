import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Paper
} from '@mui/material';
import {
  PauseCircle,
  PlayCircle,
  DeleteOutline,
  ShoppingBag,
  Person,
  CurrencyRupee,
  AccessTime,
  Close
} from '@mui/icons-material';
import { getHeldCarts, saveHeldCartSlot, releaseHeldCartSlot } from '../../engine/billingEngine';

/**
 * PosHoldCartToolbar
 * Multi-Basket Hold & Recall management for high-traffic boutique checkout
 */
export default function PosHoldCartToolbar({
  currentCartItems = [],
  currentCustomer = null,
  currentDiscount = 0,
  onRestoreCart,
  onHoldSuccess
}) {
  const [heldCarts, setHeldCarts] = useState(getHeldCarts);
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [holdNote, setHoldNote] = useState('');

  const refreshHeldCarts = () => {
    setHeldCarts(getHeldCarts());
  };

  useEffect(() => {
    refreshHeldCarts();
  }, []);

  const totalHeldCount = Object.keys(heldCarts).length;

  const handleOpenHoldDialog = (slot) => {
    setSelectedSlot(slot);
    setHoldNote(currentCustomer ? `${currentCustomer.name || 'Client'} - Fitting Room` : '');
    setHoldDialogOpen(true);
  };

  const handleConfirmHold = () => {
    if (!currentCartItems || currentCartItems.length === 0) return;

    const cartPayload = {
      items: currentCartItems,
      customer: currentCustomer,
      discount: currentDiscount
    };

    saveHeldCartSlot(selectedSlot, cartPayload, holdNote);
    refreshHeldCarts();
    setHoldDialogOpen(false);
    if (onHoldSuccess) onHoldSuccess(selectedSlot);
  };

  const handleRecallSlot = (slot) => {
    const restored = releaseHeldCartSlot(slot);
    refreshHeldCarts();
    if (restored && onRestoreCart) {
      onRestoreCart(restored);
    }
  };

  const handleDiscardSlot = (slot, e) => {
    e.stopPropagation();
    releaseHeldCartSlot(slot);
    refreshHeldCarts();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {[1, 2, 3].map((slot) => {
        const isHeld = !!heldCarts[String(slot)];
        const slotData = heldCarts[String(slot)];
        const itemCount = slotData?.items?.length || 0;
        const totalAmount = slotData?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

        return (
          <Box key={slot} sx={{ display: 'inline-flex' }}>
            {isHeld ? (
              <Tooltip
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                      {slotData.note || `Basket #${slot}`}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                      {itemCount} item(s) • ₹{totalAmount.toLocaleString('en-IN')}
                    </Typography>
                    {slotData.customer && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#FCD34D' }}>
                        Client: {slotData.customer.name}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.68rem', mt: 0.5, color: 'text.secondary' }}>
                      Click to recall basket to POS
                    </Typography>
                  </Box>
                }
              >
                <Chip
                  icon={<PlayCircle sx={{ fontSize: '16px !important', color: '#D97706 !important' }} />}
                  label={`Basket ${slot} (${itemCount})`}
                  onClick={() => handleRecallSlot(slot)}
                  onDelete={(e) => handleDiscardSlot(slot, e)}
                  deleteIcon={<Close sx={{ fontSize: '14px !important' }} />}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    bgcolor: 'rgba(217, 119, 6, 0.12)',
                    color: '#B45309',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(217, 119, 6, 0.22)'
                    }
                  }}
                />
              </Tooltip>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<PauseCircle fontSize="small" />}
                disabled={!currentCartItems || currentCartItems.length === 0}
                onClick={() => handleOpenHoldDialog(slot)}
                sx={{
                  py: 0.3,
                  px: 1.2,
                  minHeight: 28,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  borderColor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.25)',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)'
                  }
                }}
              >
                Hold #{slot}
              </Button>
            )}
          </Box>
        );
      })}

      {/* Hold Confirmation Dialog */}
      <Dialog
        open={holdDialogOpen}
        onClose={() => setHoldDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Hold Current Basket #{selectedSlot}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Park this order temporarily while the client browses or attends a fitting trial. You can recall it anytime.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Basket Note / Client Name"
            placeholder="e.g. Ananya - Trying Festive Gown"
            value={holdNote}
            onChange={(e) => setHoldNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setHoldDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmHold}
            sx={{ fontWeight: 700 }}
          >
            Confirm Hold
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
