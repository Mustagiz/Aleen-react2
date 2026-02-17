import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    TextField,
    Autocomplete,
    IconButton,
    Card,
    CardContent,
    Divider,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    TableSortLabel
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
    Print,
    Delete,
    Add,
    QrCode,
    Search,
    FilterList,
    Close
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import JsBarcode from 'jsbarcode';

const BarcodeItem = ({ value, businessName, productName, price, settings, variantName }) => {
    const barcodeRef = useRef(null);
    const { template, showPrice, showName, showBusiness } = settings;

    // Dimensions based on template (in mm, converted to px roughly for preview)
    // standard: 50x25mm, small: 30x20mm
    const isSmall = template === 'small';

    useEffect(() => {
        if (barcodeRef.current && value) {
            try {
                JsBarcode(barcodeRef.current, value, {
                    format: "CODE128",
                    width: isSmall ? 1 : 1.3,
                    height: isSmall ? 25 : 35,
                    displayValue: true,
                    fontSize: isSmall ? 9 : 11,
                    margin: 1,
                    background: "#ffffff"
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [value, isSmall]);

    return (
        <Box sx={{
            border: '1px solid #ddd',
            p: 0.5,
            textAlign: 'center',
            borderRadius: 0,
            overflow: 'hidden',
            height: isSmall ? '20mm' : '25mm',
            width: isSmall ? '38mm' : '50mm', // Adjusted for typical rolls
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            breakInside: 'avoid',
            bgcolor: 'white',
            mx: 'auto',
            '@media print': {
                border: 'none',
                pageBreakInside: 'avoid'
            }
        }}>
            {showBusiness && (
                <Typography sx={{
                    fontSize: isSmall ? '7px' : '9px',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: 'text.primary',
                    textTransform: 'uppercase',
                    mb: 0.2
                }}>
                    {businessName}
                </Typography>
            )}

            {showName && (
                <Typography sx={{
                    fontSize: isSmall ? '8px' : '10px',
                    fontWeight: 700,
                    lineHeight: 1.1,
                    mb: 0.2,
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                }}>
                    {productName}
                    {variantName && <span style={{ fontWeight: 400 }}> ({variantName})</span>}
                </Typography>
            )}

            <svg ref={barcodeRef} style={{ maxWidth: '100%', height: 'auto', display: 'block' }}></svg>

            {showPrice && (
                <Typography sx={{ fontSize: isSmall ? '10px' : '12px', fontWeight: 900, lineHeight: 1 }}>
                    ₹{price}
                </Typography>
            )}
        </Box>
    );
};


const BarcodeGenerator = () => {
    const { inventory, profile } = useData();
    const location = useLocation();
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isBulkSelectOpen, setIsBulkSelectOpen] = useState(false);
    const [tempSelectedIds, setTempSelectedIds] = useState([]);
    const [dialogSearch, setDialogSearch] = useState('');
    const [dialogCategory, setDialogCategory] = useState('');
    const [dialogOrderBy, setDialogOrderBy] = useState('name');
    const [dialogOrder, setDialogOrder] = useState('asc');

    // Print Settings
    const [settings, setSettings] = useState({
        template: 'standard', // standard (50x25), small (30x20)
        showPrice: true,
        showName: true,
        showBusiness: true
    });

    const handleAddProduct = (product) => {
        if (!product) return;
        setSelectedProducts(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (!exists) {
                return [...prev, { ...product, labelCount: Math.max(1, product.quantity || 1) }];
            }
            return prev;
        });
    };

    useEffect(() => {
        if (location.state?.product) {
            handleAddProduct(location.state.product);
            window.history.replaceState({}, document.title);
        } else if (location.state?.purchaseOrder) {
            const po = location.state.purchaseOrder;
            const newProducts = [];

            po.items.forEach(item => {
                const product = inventory.find(p => p.id === item.productId);
                if (product) {
                    // Check if it's a specific variant
                    if (item.variantSku) {
                        const variant = product.variants?.find(v => v.sku === item.variantSku);
                        if (variant) {
                            newProducts.push({
                                ...product,
                                id: `${product.id}-${variant.sku}`, // Unique ID for list
                                productId: variant.sku, // Barcode value
                                name: product.name,
                                variantName: `${variant.size || ''} ${variant.color || ''}`.trim(),
                                price: variant.price || product.price,
                                labelCount: item.quantity
                            });
                            return;
                        }
                    }

                    // Fallback to main product or if no variant specified
                    newProducts.push({
                        ...product,
                        labelCount: item.quantity
                    });
                }
            });

            if (newProducts.length > 0) {
                setSelectedProducts(newProducts);
            }
            window.history.replaceState({}, document.title);
        }
    }, [location.state, inventory]);

    const handleUpdateCount = (productId, count) => {
        setSelectedProducts(selectedProducts.map(p =>
            p.id === productId ? { ...p, labelCount: Math.max(1, count) } : p
        ));
    };

    const handleRemove = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    const handleBulkSelectAdd = () => {
        const productsToAdd = inventory.filter(item => tempSelectedIds.includes(item.id));
        productsToAdd.forEach(item => handleAddProduct(item));
        setIsBulkSelectOpen(false);
        setTempSelectedIds([]);
    };

    const toggleSelectAll = (filteredItems) => {
        if (tempSelectedIds.length === filteredItems.length) {
            setTempSelectedIds([]);
        } else {
            setTempSelectedIds(filteredItems.map(item => item.id));
        }
    };

    const handleDialogSort = (property) => {
        const isAsc = dialogOrderBy === property && dialogOrder === 'asc';
        setDialogOrder(isAsc ? 'desc' : 'asc');
        setDialogOrderBy(property);
    };

    const filteredInventory = inventory.flatMap(item => {
        // If search is active, we filter first
        const matchesSearch = item.name.toLowerCase().includes(dialogSearch.toLowerCase()) ||
            (item.productId || '').toLowerCase().includes(dialogSearch.toLowerCase());
        const matchesCategory = !dialogCategory || item.category === dialogCategory;

        if (!matchesSearch || !matchesCategory) return [];

        if (item.hasVariants && item.variants) {
            return item.variants.map(v => ({
                ...item,
                id: `${item.id}-${v.sku}`,
                name: `${item.name} (${v.size || ''} ${v.color || ''})`.trim(),
                productId: v.sku,
                price: v.price || item.price,
                quantity: v.quantity,
                category: item.category,
                variantName: `${v.size || ''} ${v.color || ''}`.trim(),
                isVariant: true
            }));
        }
        return [item];
    }).sort((a, b) => {
        const isAsc = dialogOrder === 'asc';
        const valA = (a[dialogOrderBy] || '').toString().toLowerCase();
        const valB = (b[dialogOrderBy] || '').toString().toLowerCase();

        if (dialogOrderBy === 'quantity' || dialogOrderBy === 'price') {
            return isAsc ? (a[dialogOrderBy] - b[dialogOrderBy]) : (b[dialogOrderBy] - a[dialogOrderBy]);
        }

        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;
        return 0;
    });

    const categories = Array.from(new Set(inventory.map(item => item.category)));

    const handlePrint = () => {
        window.print();
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Barcode Labels</Typography>
                    <Typography variant="body2" color="text.secondary">Generate and print professional price tags</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setIsBulkSelectOpen(true)}
                        sx={{ px: 3, py: 1.5, borderRadius: 2, fontWeight: 700 }}
                    >
                        Bulk Select
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Print />}
                        onClick={handlePrint}
                        disabled={selectedProducts.length === 0}
                        sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 700 }}
                    >
                        Print Labels
                    </Button>
                </Box>
            </Box>


            {/* Settings Toolbar */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Print Settings:</Typography>

                <TextField
                    select
                    label="Label Size"
                    size="small"
                    value={settings.template}
                    onChange={(e) => setSettings({ ...settings, template: e.target.value })}
                    SelectProps={{ native: true }}
                    sx={{ minWidth: 150 }}
                >
                    <option value="standard">Standard (50x25mm)</option>
                    <option value="small">Small (38x20mm)</option>
                </TextField>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                        <Checkbox size="small" checked={settings.showBusiness} onChange={(e) => setSettings({ ...settings, showBusiness: e.target.checked })} />
                        <Typography variant="body2">Business Name</Typography>
                    </Box>
                    <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                        <Checkbox size="small" checked={settings.showName} onChange={(e) => setSettings({ ...settings, showName: e.target.checked })} />
                        <Typography variant="body2">Product Name</Typography>
                    </Box>
                    <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                        <Checkbox size="small" checked={settings.showPrice} onChange={(e) => setSettings({ ...settings, showPrice: e.target.checked })} />
                        <Typography variant="body2">Price</Typography>
                    </Box>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Select Products to Label</Typography>
                <Autocomplete
                    options={inventory}
                    getOptionLabel={(option) => `${option.name} (${option.productId || 'No ID'})`}
                    onChange={(e, val) => handleAddProduct(val)}
                    renderInput={(params) => (
                        <TextField {...params} label="Search by Name or Product ID" variant="outlined" />
                    )}
                    sx={{ mb: 3 }}
                />

                <Grid container spacing={2}>
                    {selectedProducts.map((product) => (
                        <Grid item xs={12} sm={6} md={4} key={product.id}>
                            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{product.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">ID: {product.productId}</Typography>
                                    </Box>
                                    <TextField
                                        size="small"
                                        type="number"
                                        label="Qty"
                                        value={product.labelCount}
                                        onChange={(e) => handleUpdateCount(product.id, parseInt(e.target.value))}
                                        sx={{ width: 70 }}
                                    />
                                    <IconButton color="error" onClick={() => handleRemove(product.id)}>
                                        <Delete />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Bulk Select Dialog */}
            <Dialog open={isBulkSelectOpen} onClose={() => setIsBulkSelectOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Bulk Select Products
                    <IconButton onClick={() => setIsBulkSelectOpen(false)} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3, mt: 1, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <TextField
                            size="small"
                            placeholder="Search by Name or ID..."
                            value={dialogSearch}
                            onChange={(e) => setDialogSearch(e.target.value)}
                            InputProps={{ startAdornment: <Search size={20} sx={{ mr: 1, color: 'text.secondary' }} /> }}
                            sx={{ flexGrow: 1 }}
                        />
                        <TextField
                            select
                            size="small"
                            label="Category"
                            value={dialogCategory}
                            onChange={(e) => setDialogCategory(e.target.value)}
                            sx={{ minWidth: 150 }}
                            SelectProps={{ native: true }}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </TextField>
                    </Box>

                    <TableContainer sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={tempSelectedIds.length > 0 && tempSelectedIds.length < filteredInventory.length}
                                            checked={filteredInventory.length > 0 && tempSelectedIds.length === filteredInventory.length}
                                            onChange={() => toggleSelectAll(filteredInventory)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={dialogOrderBy === 'name'}
                                            direction={dialogOrderBy === 'name' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('name')}
                                        >
                                            Product Name
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={dialogOrderBy === 'productId'}
                                            direction={dialogOrderBy === 'productId' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('productId')}
                                        >
                                            Product ID
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={dialogOrderBy === 'quantity'}
                                            direction={dialogOrderBy === 'quantity' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('quantity')}
                                        >
                                            Stock
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredInventory.map((item) => (
                                    <TableRow key={item.id} hover onClick={() => {
                                        setTempSelectedIds(prev =>
                                            prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                        );
                                    }} sx={{ cursor: 'pointer' }}>
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={tempSelectedIds.includes(item.id)} />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                                        <TableCell>{item.productId}</TableCell>
                                        <TableCell>
                                            <Chip label={item.category} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1, ml: 1 }}>
                        {tempSelectedIds.length} items selected
                    </Typography>
                    <Button onClick={() => setIsBulkSelectOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleBulkSelectAdd} disabled={tempSelectedIds.length === 0}>
                        Add Selected
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Print Preview Area (Hidden on Screen, Visible on Print) */}
            <Box className="print-only" sx={{ display: 'none', '@media print': { display: 'block' } }}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: settings.template === 'small' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                    gap: '2mm',
                    p: 0,
                    width: '100%'
                }}>
                    {selectedProducts.flatMap(product =>
                        Array.from({ length: product.labelCount }).map((_, i) => (
                            <BarcodeItem
                                key={`${product.id}-${i}`}
                                value={product.variantSku || product.productId || product.id}
                                businessName={profile?.businessName || "Aleen Clothing"}
                                productName={product.name}
                                variantName={product.variantName}
                                price={product.price}
                                settings={settings}
                            />
                        ))
                    )}
                </Box>
            </Box>

            {/* Global CSS for Printing Labels */}
            <style>
                {`
          @media print {
            @page { 
                margin: 0 !important; 
                size: auto;
            }
            body { 
                margin: 0 !important; 
                padding: 0 !important;
                background: white !important;
            }
            body * { 
                visibility: hidden !important; 
            }
            .print-only, .print-only * { 
                visibility: visible !important; 
            }
            .print-only {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 10mm !important;
              box-sizing: border-box !important;
            }
          }
        `}
            </style>
        </Box>
    );
};

export default BarcodeGenerator;

