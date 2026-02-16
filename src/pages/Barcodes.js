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
    Chip
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
    Print,
    Delete,
    Add,
    QrCode
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import JsBarcode from 'jsbarcode';

const BarcodeItem = ({ value, businessName, productName, price }) => {
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (barcodeRef.current && value) {
            try {
                JsBarcode(barcodeRef.current, value, {
                    format: "CODE128",
                    width: 1.2,
                    height: 40,
                    displayValue: true,
                    fontSize: 10,
                    margin: 2,
                    background: "#ffffff"
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [value]);

    return (
        <Box sx={{
            border: '1px solid #eee',
            p: 1.5,
            textAlign: 'center',
            borderRadius: '4px',
            height: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            breakInside: 'avoid',
            bgcolor: 'white',
            mb: 1
        }}>
            <Typography sx={{ fontSize: '9px', fontWeight: 800, mb: 0.5, color: 'text.primary', textTransform: 'uppercase' }}>{businessName}</Typography>
            <Typography sx={{ fontSize: '11px', fontWeight: 700, mb: 0, width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{productName}</Typography>
            <svg ref={barcodeRef} style={{ maxWidth: '100%' }}></svg>
            <Typography sx={{ fontSize: '13px', fontWeight: 900 }}>₹{price}</Typography>
        </Box>
    );
};

const BarcodeGenerator = () => {
    const { inventory, profile } = useData();
    const location = useLocation();
    const [selectedProducts, setSelectedProducts] = useState([]);
    const handleAddProduct = (product) => {
        if (!product) return;
        setSelectedProducts(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (!exists) {
                return [...prev, { ...product, labelCount: 1 }];
            }
            return prev;
        });
    };

    useEffect(() => {
        if (location.state?.product) {
            handleAddProduct(location.state.product);
            // Clear location state to prevent re-adding on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleUpdateCount = (productId, count) => {
        setSelectedProducts(selectedProducts.map(p =>
            p.id === productId ? { ...p, labelCount: Math.max(1, count) } : p
        ));
    };

    const handleRemove = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

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

            {/* Print Preview Area (Hidden on Screen, Visible on Print) */}
            <Box className="print-only" sx={{ display: 'none', '@media print': { display: 'block' } }}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                    p: '10px'
                }}>
                    {selectedProducts.flatMap(product =>
                        Array.from({ length: product.labelCount }).map((_, i) => (
                            <BarcodeItem
                                key={`${product.id}-${i}`}
                                value={product.productId || product.id}
                                businessName={profile?.businessName || "Aleen Clothing"}
                                productName={product.name}
                                price={product.price}
                            />
                        ))
                    )}
                </Box>
            </Box>

            {/* Global CSS for Printing Labels */}
            <style>
                {`
          @media print {
            @page { margin: 0; }
            body * { visibility: hidden; }
            .print-only, .print-only * { visibility: visible; }
            .print-only {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
            </style>
        </Box>
    );
};

export default BarcodeGenerator;

