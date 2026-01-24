import React, { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Paper, Typography, TableContainer, Card, CardContent, Grid, Chip, TablePagination, useTheme } from '@mui/material';
import { Add, Edit, Delete, Store } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const Vendors = () => {
    const theme = useTheme();
    const { vendors, addVendor, updateVendor, deleteVendor } = useData();
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', email: '', person: '', gst: '', terms: '', address: '' });

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
            setForm({ name: '', phone: '', email: '', person: '', gst: '', terms: '', address: '' });
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
                    <Card sx={{
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: `0 10px 25px -5px ${theme.palette.primary.main}26`,
                        border: '1px solid',
                        borderColor: 'primary.light',
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}0D 100%)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 24px -10px ${theme.palette.primary.main}40`,
                        }
                    }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: 'primary.main' }} />
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Vendors</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{vendors.length}</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'primary.light', color: 'primary.main' }}><Store /></Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px -5px rgba(198, 40, 40, 0.15)',
                        border: '1px solid rgba(198, 40, 40, 0.1)',
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(198, 40, 40, 0.05) 100%)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 24px -10px rgba(198, 40, 40, 0.3)',
                        }
                    }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#c62828' }} />
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Payable</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#c62828' }}>
                                    ₹{vendors.reduce((sum, v) => sum + (v.balance || 0), 0).toLocaleString()}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(198, 40, 40, 0.05)', color: '#c62828' }}><Store /></Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'primary.light', borderBottom: '2px solid rgba(244, 114, 182, 0.1)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Vendor Name</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Contact Person</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Phone / Email</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Balance Due</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Actions</TableCell>
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
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{vendor.name}</Typography>
                                            {vendor.gst && <Typography variant="caption" color="text.secondary">GST: {vendor.gst}</Typography>}
                                        </TableCell>
                                        <TableCell>{vendor.person || '-'}</TableCell>
                                        <TableCell>
                                            <Typography variant="caption" display="block">{vendor.phone}</Typography>
                                            <Typography variant="caption" color="text.secondary">{vendor.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`₹${(vendor.balance || 0).toLocaleString()}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: (vendor.balance || 0) > 0 ? 'rgba(198, 40, 40, 0.1)' : 'rgba(46, 125, 50, 0.1)',
                                                    color: (vendor.balance || 0) > 0 ? 'error.main' : 'success.main',
                                                    fontWeight: 700
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => handleOpen(vendor)} sx={{ color: 'primary.main' }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => deleteVendor(vendor.id)} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>No vendors found. Add one to get started.</TableCell>
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
            </Paper>

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
                    <TextField fullWidth label="Payment Terms" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} margin="normal" placeholder="e.g. Net 30, Cash on Delivery" />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!form.name}>Save Vendor</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Vendors;
