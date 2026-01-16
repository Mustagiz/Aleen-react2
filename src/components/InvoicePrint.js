import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';
import { useData } from '../contexts/DataContext';
import { forwardRef } from 'react'; // Added forwardRef import

const InvoicePrint = forwardRef(({ invoice }, ref) => {
  const { profile } = useData();

  return (
    <Box ref={ref} className="printable-area" sx={{ p: 4, bgcolor: 'white', maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ borderBottom: 4, borderColor: 'primary.main', pb: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{profile.businessName}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{profile.address}</Typography>
            <Typography variant="body2">Phone: {profile.phone}</Typography>
            <Typography variant="body2">GSTIN: {profile.gstin}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>INVOICE</Typography>
            <Typography variant="h6" sx={{ color: 'primary.main', mt: 1 }}>{invoice.id}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Date: {new Date(invoice.date).toLocaleDateString('en-IN')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Customer Details */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Bill To:</Typography>
        <Typography variant="body1">{invoice.customer || 'Walk-in Customer'}</Typography>
        {invoice.phone && <Typography variant="body2">Phone: {invoice.phone}</Typography>}
      </Box>

      {/* Items Table */}
      <Table size="small" sx={{ mb: 3 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.light' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoice.items?.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.name}</Typography>
                <Typography variant="caption" color="text.secondary">{item.category}</Typography>
              </TableCell>
              <TableCell align="center">{item.quantity}</TableCell>
              <TableCell align="right">₹{item.price?.toFixed(2)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Totals */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Box sx={{ width: 300 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography>Subtotal:</Typography>
            <Typography sx={{ fontWeight: 'bold' }}>₹{invoice.subtotal?.toFixed(2)}</Typography>
          </Box>
          {invoice.discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, color: 'success.main' }}>
              <Typography>Discount ({invoice.discountPercentage || 0}%):</Typography>
              <Typography>-₹{invoice.discount?.toFixed(2)}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography>GST (18%):</Typography>
            <Typography sx={{ fontWeight: 'bold' }}>₹{invoice.tax?.toFixed(2)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              ₹{invoice.total?.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Payment:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{invoice.paymentMethod}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ borderTop: 2, borderColor: 'grey.300', pt: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ mb: 1 }}>Thank you for shopping with ${profile.businessName}!</Typography>
        <Typography variant="caption" color="text.secondary">
          Terms: Goods once sold cannot be returned or exchanged.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>
          {profile.businessName.toUpperCase()} | {profile.address}
        </Typography>
      </Box>
    </Box>
  );
});

export default InvoicePrint;
