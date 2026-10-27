import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * ThermalReceipt Component
 * 
 * Optimized for continuous-roll thermal POS printers:
 * - 80mm standard width (approx 72mm printable, 576 dots at 203 DPI)
 * - 58mm mini width (approx 48mm printable, 384 dots at 203 DPI)
 * Uses high-contrast black/white styling, monospace tabular figures, and dashed dividers.
 */
export default function ThermalReceipt({
  invoice,
  profile = {},
  width = '80mm', // '80mm' or '58mm'
  id = 'aleen-thermal-receipt'
}) {
  if (!invoice) return null;

  const is58 = width === '58mm';
  const maxWidth = is58 ? '54mm' : '76mm';
  const fontSizeBase = is58 ? '10px' : '11px';
  const fontSizeSmall = is58 ? '9px' : '9.5px';
  const fontSizeHeader = is58 ? '14px' : '16px';

  const businessName = profile.businessName || 'ALEEN CLOTHING';
  const tagline = profile.tagline || 'Boutique & Bespoke Atelier';
  const phone = profile.phone || '';
  const address = profile.address || '';
  const gstin = profile.gstin || '';

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = Number(invoice.subtotal ?? (invoice.total || 0));
  const tax = Number(invoice.tax || 0);
  const discount = Number(invoice.discount || 0);
  const loyaltyDiscount = Number(invoice.loyaltyDiscount || 0);
  const total = Number(invoice.total || 0);
  const cashTendered = Number(invoice.cashTendered || 0);
  const changeDue = Number(invoice.changeDue || 0);
  const loyaltyPointsEarned = Number(invoice.loyaltyPointsEarned || 0);
  const loyaltyPointsRedeemed = Number(invoice.loyaltyPointsRedeemed || 0);

  const upiId = profile.bankDetails?.upiId || '';
  const upiUrl = upiId
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${total}&cu=INR`
    : '';
  const qrUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=2&data=${encodeURIComponent(upiUrl)}`
    : '';

  const dateStr = invoice.date
    ? new Date(invoice.date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('en-IN');

  const divider = is58
    ? '--------------------------------'
    : '------------------------------------------';

  return (
    <Box
      id={id}
      sx={{
        width: maxWidth,
        margin: '0 auto',
        padding: '3mm 2mm',
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontFamily: '"JetBrains Mono", "Courier New", Courier, monospace',
        fontSize: fontSizeBase,
        lineHeight: 1.35,
        boxSizing: 'border-box',
        '@media print': {
          width: maxWidth,
          padding: 0,
          margin: 0
        }
      }}
    >
      {/* HEADER */}
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: fontSizeHeader,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontFamily: 'inherit'
          }}
        >
          {businessName}
        </Typography>
        <Typography sx={{ fontSize: fontSizeSmall, fontWeight: 600, fontFamily: 'inherit' }}>
          {tagline}
        </Typography>
        {address && (
          <Typography sx={{ fontSize: fontSizeSmall, fontFamily: 'inherit', mt: 0.2 }}>
            {address}
          </Typography>
        )}
        {phone && (
          <Typography sx={{ fontSize: fontSizeSmall, fontFamily: 'inherit' }}>
            Ph: {phone}
          </Typography>
        )}
        {gstin && (
          <Typography sx={{ fontSize: fontSizeSmall, fontFamily: 'inherit', fontWeight: 700 }}>
            GSTIN: {gstin}
          </Typography>
        )}
      </Box>

      <Typography sx={{ fontSize: fontSizeSmall, textAlign: 'center', my: 0.5 }}>
        {divider}
      </Typography>

      {/* METADATA */}
      <Box sx={{ fontSize: fontSizeSmall, mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Invoice #: <strong>{invoice.invoiceNumber || invoice.id || 'N/A'}</strong></span>
          <span>{invoice.paymentStatus?.toUpperCase() || 'PAID'}</span>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date: {dateStr}</span>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Patron: <strong>{invoice.customer || 'Walk-in Patron'}</strong></span>
        </Box>
        {invoice.phone && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Mobile: {invoice.phone}</span>
          </Box>
        )}
      </Box>

      <Typography sx={{ fontSize: fontSizeSmall, textAlign: 'center', my: 0.5 }}>
        {divider}
      </Typography>

      {/* LINE ITEMS */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, mb: 0.5 }}>
          <span style={{ flex: 1 }}>Item</span>
          <span style={{ width: is58 ? '38px' : '48px', textAlign: 'right' }}>Qty</span>
          <span style={{ width: is58 ? '45px' : '55px', textAlign: 'right' }}>Rate</span>
          <span style={{ width: is58 ? '55px' : '65px', textAlign: 'right' }}>Amt (₹)</span>
        </Box>

        {items.map((item, idx) => {
          const qty = Number(item.quantity || 1);
          const price = Number(item.price || item.customPrice || 0);
          const lineTotal = Number(item.lineTotal || (qty * price));
          const name = item.name || item.customName || 'Garment';
          const variant = item.variantDetails ? ` (${item.variantDetails})` : '';

          return (
            <Box key={idx} sx={{ mb: 0.4 }}>
              <Typography sx={{ fontSize: fontSizeSmall, fontWeight: 700, fontFamily: 'inherit' }}>
                {name}{variant}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: fontSizeSmall }}>
                <span style={{ flex: 1, color: '#444' }}>#{idx + 1}</span>
                <span style={{ width: is58 ? '38px' : '48px', textAlign: 'right' }}>{qty}</span>
                <span style={{ width: is58 ? '45px' : '55px', textAlign: 'right' }}>{price.toFixed(0)}</span>
                <span style={{ width: is58 ? '55px' : '65px', textAlign: 'right', fontWeight: 700 }}>
                  {lineTotal.toFixed(2)}
                </span>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Typography sx={{ fontSize: fontSizeSmall, textAlign: 'center', my: 0.5 }}>
        {divider}
      </Typography>

      {/* TOTALS & BREAKDOWN */}
      <Box sx={{ fontSize: fontSizeSmall, display: 'flex', flexDirection: 'column', gap: 0.3, mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </Box>

        {tax > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CGST ({(tax / 2).toFixed(2)}):</span>
              <span>₹{(tax / 2).toFixed(2)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SGST ({(tax / 2).toFixed(2)}):</span>
              <span>₹{(tax / 2).toFixed(2)}</span>
            </Box>
          </>
        )}

        {discount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#000' }}>
            <span>Discount:</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </Box>
        )}

        {loyaltyDiscount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Points Redeemed ({loyaltyPointsRedeemed} pts):</span>
            <span>- ₹{loyaltyDiscount.toFixed(2)}</span>
          </Box>
        )}

        <Typography sx={{ fontSize: fontSizeSmall, textAlign: 'center', my: 0.3 }}>
          {divider}
        </Typography>

        {/* NET TOTAL */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 0.5 }}>
          <span style={{ fontSize: is58 ? '13px' : '15px', fontWeight: 900 }}>NET TOTAL:</span>
          <span style={{ fontSize: is58 ? '14px' : '16px', fontWeight: 900 }}>
            ₹{total.toFixed(2)}
          </span>
        </Box>

        <Typography sx={{ fontSize: fontSizeSmall, textAlign: 'center', my: 0.3 }}>
          {divider}
        </Typography>

        {/* TENDER BREAKDOWN */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Payment Tender:</span>
          <strong>{invoice.paymentMethod || 'Cash'}</strong>
        </Box>

        {cashTendered > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cash Tendered:</span>
              <span>₹{cashTendered.toFixed(2)}</span>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Change Returned:</span>
              <span>₹{changeDue.toFixed(2)}</span>
            </Box>
          </>
        )}

        {/* LOYALTY REWARDS SUMMARY */}
        {(loyaltyPointsEarned > 0 || loyaltyPointsRedeemed > 0) && (
          <Box sx={{ mt: 0.5, p: 0.6, border: '1px dashed #000', borderRadius: '4px', textAlign: 'center' }}>
            {loyaltyPointsEarned > 0 && (
              <Typography sx={{ fontSize: fontSizeSmall, fontWeight: 800, fontFamily: 'inherit' }}>
                ⭐ You Earned: +{loyaltyPointsEarned} Loyalty Points!
              </Typography>
            )}
            {invoice.customerLoyaltyBalance !== undefined && (
              <Typography sx={{ fontSize: '8.5px', fontFamily: 'inherit' }}>
                New Loyalty Balance: {invoice.customerLoyaltyBalance} pts
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* QR CODE FOR UPI / INSTANT PAY */}
      {qrUrl && (
        <Box sx={{ textAlign: 'center', my: 1 }}>
          <img
            src={qrUrl}
            alt="UPI QR Code"
            style={{ width: is58 ? '85px' : '100px', height: is58 ? '85px' : '100px', display: 'block', margin: '0 auto' }}
          />
          <Typography sx={{ fontSize: '8px', mt: 0.3, fontFamily: 'inherit' }}>
            Scan to Pay / Verify Bill
          </Typography>
        </Box>
      )}

      {/* FOOTER POLICIES */}
      <Box sx={{ textAlign: 'center', mt: 1, fontSize: '8.5px' }}>
        <Typography sx={{ fontSize: '8.5px', fontWeight: 700, fontFamily: 'inherit' }}>
          *** THANK YOU FOR VISITING ***
        </Typography>
        <Typography sx={{ fontSize: '8px', fontFamily: 'inherit', mt: 0.3 }}>
          Exchanges accepted within 7 days with original invoice & tag intact.
        </Typography>
        <Typography sx={{ fontSize: '8px', fontFamily: 'inherit', mt: 0.2 }}>
          Bespoke / altered couture items are non-refundable.
        </Typography>
      </Box>

      {/* CUTTING GAP */}
      <Box sx={{ height: '14mm' }} />
    </Box>
  );
}
