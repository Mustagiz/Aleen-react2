import React, { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Paper, Typography, TableContainer, Card, CardContent, Grid, Chip, TablePagination, useTheme } from '@mui/material';
import { Add, Edit, Delete, Store, LocalShipping } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import GlassCard from '../components/GlassCard';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const Vendors = () => {
    const theme = useTheme();
    const { vendors, addVendor, updateVendor, deleteVendor } = useData();
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', email: '', person: '', gst: '', terms: '', address: '', qualityRating: 5 });
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpen = (item = null) => {
        if (item) {
            setEditItem(item);
            setForm(item);
        } else {
            setEditItem(null);
            setForm({ name: '', phone: '', email: '', person: '', gst: '', terms: '', address: '', qualityRating: 5 });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        if (editItem) {
            await updateVendor(editItem.id, form);
        } else {
            await addVendor(form);
        }
        setOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteId) {
            await deleteVendor(deleteId);
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const openDeleteDialog = (id) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>Vendors</Typography>
                    <Typography variant="body2" color="text.secondary">Manage your suppliers and contacts</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
                    boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                        boxShadow: `0 6px 16px ${theme.palette.primary.main}4D`,
                        transform: 'translateY(-2px)'
                    }
                }}>
                    Add Vendor
                </Button>
            </Box>

            {/* Vendor Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <GlassCard sx={{ height: '100%', p: 0 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: 'primary.main' }} />
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em' }}>Total Vendors</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{vendors.length}</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'primary.light', color: 'primary.main' }}><Store /></Box>
                        </CardContent>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <GlassCard sx={{ height: '100%', p: 0 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#c62828' }} />
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em' }}>Total Payable</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: '#c62828' }}>
                                    ₹{vendors.reduce((sum, v) => sum + (v.balance || 0), 0).toLocaleString()}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(198, 40, 40, 0.05)', color: '#c62828' }}><Store /></Box>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <GlassCard sx={{ height: '100%', p: 0 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#0288d1' }} />
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em' }}>Avg Lead Time</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: '#0288d1' }}>
                                    {Math.round(vendors.reduce((sum, v) => sum + (v.performance?.avgLeadTime || 0), 0) / Math.max(1, vendors.filter(v => v.performance?.avgLeadTime).length))} days
                                </Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(2, 136, 209, 0.05)', color: '#0288d1' }}><LocalShipping /></Box>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor Name</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Person</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone / Email</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance Due</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vendors.length > 0 ? (
                                (rowsPerPage > 0
                                    ? vendors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : vendors
                                ).map((vendor) => (
                                    <TableRow key={vendor.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{vendor.name}</Typography>
                                            {vendor.gst && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>GST: {vendor.gst}</Typography>}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{vendor.person || '-'}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>{vendor.phone}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{vendor.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {vendor.performance ? (
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                        {vendor.performance.avgLeadTime} days
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                                                        {vendor.performance.totalOrders} Orders
                                                    </Typography>
                                                    {vendor.qualityRating > 0 && (
                                                        <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 800 }}>
                                                            {'★'.repeat(Math.round(vendor.qualityRating))} ({vendor.qualityRating})
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>No Data</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`₹${(vendor.balance || 0).toLocaleString()}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: (vendor.balance || 0) > 0 ? 'rgba(198, 40, 40, 0.1)' : 'rgba(46, 125, 50, 0.1)',
                                                    color: (vendor.balance || 0) > 0 ? 'error.main' : 'success.main',
                                                    fontWeight: 800,
                                                    borderRadius: 1.5
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => handleOpen(vendor)} sx={{ color: 'primary.main' }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => openDeleteDialog(vendor.id)} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary', fontWeight: 500 }}>No vendors found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={vendors.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </GlassCard>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>{editItem ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField fullWidth label="Vendor / Company Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
                    <TextField fullWidth label="Contact Person" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} margin="normal" />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} margin="normal" />
                        <TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} margin="normal" />
                    </Box>
                    <TextField fullWidth label="GSTIN" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} margin="normal" />
                    <TextField fullWidth label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} margin="normal" multiline rows={2} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField fullWidth label="Payment Terms" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} margin="normal" placeholder="e.g. Net 30" />
                        <TextField
                            fullWidth
                            label="Quality Rating (1-5)"
                            type="number"
                            inputProps={{ min: 1, max: 5, step: 0.5 }}
                            value={form.qualityRating || 5}
                            onChange={(e) => setForm({ ...form, qualityRating: parseFloat(e.target.value) })}
                            margin="normal"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!form.name}>Save Vendor</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
};

export default Vendors;
