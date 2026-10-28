import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    TableSortLabel,
    TablePagination,
    MenuItem,
    Tooltip,
    Stack,
    Collapse,
    Badge,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
    Print,
    Delete,
    Add,
    QrCode,
    Search,
    FilterList,
    Close,
    SortByAlpha,
    Tune,
    Visibility,
    CheckCircle,
    RestartAlt,
    Inventory2,
    Layers,
    Straighten,
    PriceChange,
    CurrencyRupee,
    Percent
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useFeedback } from '../contexts/FeedbackContext';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import GlassCard from '../components/GlassCard';
import JsBarcode from 'jsbarcode';

// Individual Barcode Label Card (Screen preview & Print item)
const BarcodeItem = ({ value, businessName, product, settings }) => {
    const barcodeRef = useRef(null);
    const {
        template,
        showPrice,
        showMrp,
        showName,
        showBusiness,
        showSku,
        showCategory,
        showSizeColor,
        barcodeHeight,
        fontSize
    } = settings;

    // Dimensions based on template
    const getDimensions = () => {
        switch (template) {
            case 'small': return { w: '38mm', h: '22mm', barH: 22, barW: 1.0 };
            case 'compact': return { w: '30mm', h: '20mm', barH: 18, barW: 0.9 };
            case 'large': return { w: '60mm', h: '40mm', barH: 38, barW: 1.4 };
            case 'thermal_single': return { w: '50mm', h: '32mm', barH: 30, barW: 1.2 };
            case 'a4_sheet': return { w: '63.5mm', h: '38.1mm', barH: 34, barW: 1.3 };
            default: return { w: '50mm', h: '26mm', barH: barcodeHeight || 28, barW: 1.15 };
        }
    };

    const dims = getDimensions();

    useEffect(() => {
        if (barcodeRef.current && value) {
            try {
                JsBarcode(barcodeRef.current, String(value), {
                    format: "CODE128",
                    width: dims.barW,
                    height: dims.barH,
                    displayValue: false, // We render custom SKU typography below barcode for razor-sharp clarity
                    margin: 0,
                    background: "#ffffff",
                    lineColor: "#000000"
                });
            } catch (e) {
                console.warn("Barcode rendering warning:", e);
            }
        }
    }, [value, dims.barH, dims.barW]);

    const isSmall = template === 'small' || template === 'compact';
    const isLarge = template === 'large' || template === 'a4_sheet';

    const fontScale = fontSize === 'compact' ? 0.85 : fontSize === 'large' ? 1.15 : 1.0;
    const currency = settings.currencySymbol || '₹';
    const mrpPrefix = settings.mrpPrefix || 'MRP';

    // Support for Custom Sales Price and Custom MRP per garment
    const sellingPrice = product?.customPrice !== undefined
        ? (product.customPrice === '' ? 0 : Number(product.customPrice))
        : Number(product?.price || 0);

    const mrpPrice = product?.customMrp !== undefined
        ? (product.customMrp === '' ? 0 : Number(product.customMrp))
        : (product?.mrp ? Number(product.mrp) : Math.round(sellingPrice * (settings.mrpMultiplier || 1.25)));

    return (
        <Box
            sx={{
                border: '1px solid #d1d5db',
                p: isSmall ? 0.4 : 0.75,
                textAlign: 'center',
                borderRadius: 0.5,
                overflow: 'hidden',
                height: dims.h,
                width: dims.w,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                breakInside: 'avoid',
                bgcolor: '#FFFFFF',
                color: '#000000',
                mx: 'auto',
                boxSizing: 'border-box',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                '@media print': {
                    border: '0.25px solid #e5e7eb',
                    pageBreakInside: 'avoid',
                    boxShadow: 'none'
                }
            }}
        >
            {/* Store / Business Name */}
            {showBusiness && (
                <Typography
                    sx={{
                        fontSize: `${(isSmall ? 7 : isLarge ? 10 : 8.5) * fontScale}px`,
                        fontWeight: 900,
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: '#000000',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {businessName || 'ALEEN CLOTHING'}
                </Typography>
            )}

            {/* Product Name & Category */}
            {showName && (
                <Typography
                    sx={{
                        fontSize: `${(isSmall ? 7.5 : isLarge ? 11 : 9) * fontScale}px`,
                        fontWeight: 700,
                        lineHeight: 1.1,
                        width: '100%',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        color: '#111827'
                    }}
                >
                    {product?.name || 'Garment Item'}
                    {showCategory && product?.category && (
                        <span style={{ fontWeight: 400, color: '#4b5563' }}> • {product.category}</span>
                    )}
                </Typography>
            )}

            {/* Size & Color Spec if enabled */}
            {showSizeColor && (product?.size || product?.color || product?.variantName) && (
                <Typography
                    sx={{
                        fontSize: `${(isSmall ? 6.5 : 7.5) * fontScale}px`,
                        fontWeight: 600,
                        color: '#374151',
                        lineHeight: 1,
                        textTransform: 'uppercase'
                    }}
                >
                    {product?.variantName || `${product?.size || 'Free Size'} / ${product?.color || 'Std'}`}
                </Typography>
            )}

            {/* The SVG Barcode */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 0.2 }}>
                <svg ref={barcodeRef} style={{ maxWidth: '98%', height: `${dims.barH}px`, display: 'block' }}></svg>
            </Box>

            {/* Product ID / SKU Under Barcode */}
            {showSku && (
                <Typography
                    sx={{
                        fontSize: `${(isSmall ? 7 : isLarge ? 9.5 : 8) * fontScale}px`,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        letterSpacing: '0.08em',
                        lineHeight: 1,
                        color: '#111827',
                        textTransform: 'uppercase'
                    }}
                >
                    {String(value || '').toUpperCase()}
                </Typography>
            )}

            {/* Price & M.R.P. Row */}
            {showPrice && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, width: '100%', flexWrap: 'nowrap' }}>
                    {showMrp && mrpPrice > 0 && (
                        <Typography
                            sx={{
                                fontSize: `${(isSmall ? 7 : 8.5) * fontScale}px`,
                                color: '#6b7280',
                                textDecoration: 'line-through',
                                fontWeight: 600,
                                lineHeight: 1,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {mrpPrefix} {currency}{mrpPrice.toLocaleString('en-IN')}
                        </Typography>
                    )}
                    <Typography
                        sx={{
                            fontSize: `${(isSmall ? 9.5 : isLarge ? 14 : 11.5) * fontScale}px`,
                            fontWeight: 900,
                            lineHeight: 1,
                            color: '#000000',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {currency}{sellingPrice.toLocaleString('en-IN')}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default function BarcodeGenerator() {
    const theme = useTheme();
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { inventory, profile } = useData();
    const { showToast, showConfirm } = useFeedback();
    const location = useLocation();

    // Print Queue List
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isBulkSelectOpen, setIsBulkSelectOpen] = useState(false);
    const [tempSelectedIds, setTempSelectedIds] = useState([]);

    // Select Product Search, Sort & Filters
    const [productSearch, setProductSearch] = useState('');
    const [sortOption, setSortOption] = useState('name_asc');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [stockFilter, setStockFilter] = useState('all');
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(true);

    // Preview zoom scale (Pic 1: make preview bigger, default 1.35x)
    const [previewZoom, setPreviewZoom] = useState(1.35);

    // Pagination for Garments Selection Table (Pic 2: 10 entries on 1 page)
    const [inventoryPage, setInventoryPage] = useState(0);
    const [inventoryRowsPerPage, setInventoryRowsPerPage] = useState(10);

    // Pagination for Active Print Queue (Pic 2: 10 entries on 1 page)
    const [queuePage, setQueuePage] = useState(0);
    const [queueRowsPerPage, setQueueRowsPerPage] = useState(10);

    // Pagination for Bulk Select Dialog (10 entries on 1 page)
    const [dialogPage, setDialogPage] = useState(0);
    const [dialogRowsPerPage, setDialogRowsPerPage] = useState(10);

    // Dialog state for bulk select
    const [dialogSearch, setDialogSearch] = useState('');
    const [dialogCategory, setDialogCategory] = useState('');
    const [dialogOrderBy, setDialogOrderBy] = useState('name');
    const [dialogOrder, setDialogOrder] = useState('asc');

    // Comprehensive Print Settings with Custom Price & MRP options
    const [settings, setSettings] = useState({
        template: 'standard', // 'standard' (50x25), 'small' (38x20), 'compact' (30x20), 'large' (60x40), 'thermal_single', 'a4_sheet'
        showPrice: true,
        showMrp: true,
        showName: true,
        showBusiness: true,
        showSku: true,
        showCategory: false,
        showSizeColor: true,
        barcodeHeight: 30,
        fontSize: 'normal',
        mrpMode: 'custom', // 'custom' | 'markup_20' | 'markup_25' | 'markup_30' | 'markup_40' | 'markup_50'
        mrpMultiplier: 1.25,
        currencySymbol: '₹',
        mrpPrefix: 'MRP'
    });

    const [previewIndex, setPreviewIndex] = useState(0);

    // Populate from navigation state if routed with specific product
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
                    if (item.variantSku) {
                        const variant = product.variants?.find(v => v.sku === item.variantSku);
                        if (variant) {
                            const selling = variant.price || product.price || 0;
                            const mrp = Number(variant.mrp || product.mrp) || Math.round(selling * (settings.mrpMultiplier || 1.25));
                            newProducts.push({
                                ...product,
                                id: `${product.id}-${String(variant.sku || '').toUpperCase()}`,
                                productId: String(variant.sku || '').toUpperCase(),
                                name: product.name,
                                variantName: `${variant.size || ''} ${variant.color || ''}`.trim(),
                                price: selling,
                                customPrice: selling,
                                customMrp: mrp,
                                labelCount: item.quantity
                            });
                            return;
                        }
                    }
                    const selling = product.price || 0;
                    const mrp = Number(product.mrp) || Math.round(selling * (settings.mrpMultiplier || 1.25));
                    newProducts.push({
                        ...product,
                        customPrice: selling,
                        customMrp: mrp,
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

    const handleAddProduct = (product) => {
        if (!product) return;
        setSelectedProducts(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (!exists) {
                const selling = Number(product.price) || 0;
                const defaultMrp = Number(product.mrp) || Math.round(selling * (settings.mrpMultiplier || 1.25));
                return [...prev, {
                    ...product,
                    customPrice: selling,
                    customMrp: defaultMrp,
                    labelCount: Math.max(1, product.quantity || 1)
                }];
            }
            return prev;
        });
    };

    // Update custom sales price for a queued garment
    const handleUpdatePrice = (productId, val) => {
        const num = val === '' ? '' : Math.max(0, Number(val) || 0);
        setSelectedProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            const updated = { ...p, customPrice: num };
            // Auto update MRP if an auto-markup formula is active
            if (settings.mrpMode !== 'custom' && typeof num === 'number') {
                updated.customMrp = Math.round(num * settings.mrpMultiplier);
            }
            return updated;
        }));
    };

    // Update custom MRP for a queued garment
    const handleUpdateMrp = (productId, val) => {
        const num = val === '' ? '' : Math.max(0, Number(val) || 0);
        setSelectedProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, customMrp: num } : p
        ));
    };

    // Bulk apply MRP markup multiplier to all queued items
    const handleApplyBulkMrpMarkup = (multiplier) => {
        setSelectedProducts(prev => prev.map(p => {
            const selling = Number(p.customPrice !== undefined ? p.customPrice : p.price) || 0;
            return {
                ...p,
                customMrp: Math.round(selling * multiplier)
            };
        }));
    };

    // Reset all customized prices in queue back to catalog defaults
    const handleResetAllPrices = () => {
        setSelectedProducts(prev => prev.map(p => {
            const catalogPrice = Number(p.price) || 0;
            return {
                ...p,
                customPrice: catalogPrice,
                customMrp: Number(p.mrp) || Math.round(catalogPrice * 1.25)
            };
        }));
    };

    const handleUpdateCount = (productId, count) => {
        setSelectedProducts(selectedProducts.map(p =>
            p.id === productId ? { ...p, labelCount: Math.max(1, parseInt(count) || 1) } : p
        ));
    };

    const handleRemove = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    const handleSetAllCounts = (countType) => {
        if (countType === 'one') {
            setSelectedProducts(prev => prev.map(p => ({ ...p, labelCount: 1 })));
        } else if (countType === 'stock') {
            setSelectedProducts(prev => prev.map(p => ({ ...p, labelCount: Math.max(1, p.quantity || 1) })));
        }
    };

    const handleClearQueue = () => {
        if (selectedProducts.length > 0) {
            showConfirm({
                title: 'Clear Barcode Queue',
                message: `Are you sure you want to clear all ${selectedProducts.length} items from the barcode printing queue?`,
                confirmText: 'Clear Queue',
                isDanger: true,
                onConfirm: () => {
                    setSelectedProducts([]);
                    showToast('Barcode print queue cleared', 'info');
                }
            });
        }
    };

    const handleSelectAllFiltered = () => {
        const existingIds = new Set(selectedProducts.map(p => p.id));
        const toAdd = filteredAndSortedInventory
            .filter(item => !existingIds.has(item.id))
            .map(item => {
                const selling = Number(item.price) || 0;
                const defaultMrp = Number(item.mrp) || Math.round(selling * (settings.mrpMultiplier || 1.25));
                return {
                    ...item,
                    customPrice: selling,
                    customMrp: defaultMrp,
                    labelCount: Math.max(1, item.quantity || 1)
                };
            });
        if (toAdd.length === 0) return;
        setSelectedProducts(prev => [...prev, ...toAdd]);
    };

    const handleDeselectFiltered = () => {
        const filteredIds = new Set(filteredAndSortedInventory.map(item => item.id));
        setSelectedProducts(prev => prev.filter(p => !filteredIds.has(p.id)));
    };

    // Extract all distinct categories
    const categories = useMemo(() => {
        return Array.from(new Set(inventory.map(item => item.category).filter(Boolean)));
    }, [inventory]);

    // Flatten products including variants
    const allSearchableProducts = useMemo(() => {
        return inventory.flatMap(item => {
            if (item.hasVariants && item.variants?.length > 0) {
                return item.variants.map(v => ({
                    ...item,
                    id: `${item.id}-${String(v.sku || '').toUpperCase()}`,
                    name: item.name,
                    variantName: `${v.size || ''} ${v.color || ''}`.trim(),
                    productId: String(v.sku || '').toUpperCase(),
                    price: v.price || item.price,
                    quantity: v.quantity,
                    category: item.category
                }));
            }
            return [item];
        });
    }, [inventory]);

    // Filter and Sort inventory for selection
    const filteredAndSortedInventory = useMemo(() => {
        let list = allSearchableProducts.filter(item => {
            // Text Search
            const q = productSearch.toLowerCase().trim();
            const matchesSearch = !q ||
                item.name.toLowerCase().includes(q) ||
                (item.productId || '').toLowerCase().includes(q) ||
                (item.category || '').toLowerCase().includes(q) ||
                (item.color || '').toLowerCase().includes(q);

            // Category Filter
            const matchesCat = !categoryFilter || item.category === categoryFilter;

            // Stock Filter
            let matchesStock = true;
            if (stockFilter === 'instock') matchesStock = (item.quantity || 0) > 0;
            if (stockFilter === 'lowstock') matchesStock = (item.quantity || 0) > 0 && (item.quantity || 0) < 3;
            if (stockFilter === 'outstock') matchesStock = (item.quantity || 0) === 0;

            return matchesSearch && matchesCat && matchesStock;
        });

        // Sorting
        list.sort((a, b) => {
            switch (sortOption) {
                case 'name_asc': // A to Z
                    return (a.name || '').localeCompare(b.name || '');
                case 'name_desc': // Z to A
                    return (b.name || '').localeCompare(a.name || '');
                case 'price_asc': // Price Low to High
                    return (a.price || 0) - (b.price || 0);
                case 'price_desc': // Price High to Low
                    return (b.price || 0) - (a.price || 0);
                case 'stock_desc': // Stock High to Low
                    return (b.quantity || 0) - (a.quantity || 0);
                case 'stock_asc': // Stock Low to High
                    return (a.quantity || 0) - (b.quantity || 0);
                default:
                    return 0;
            }
        });

        return list;
    }, [allSearchableProducts, productSearch, categoryFilter, stockFilter, sortOption]);

    // Total label count across all items
    const totalLabelsCount = selectedProducts.reduce((sum, p) => sum + (p.labelCount || 1), 0);

    const handlePrint = () => {
        if (selectedProducts.length === 0) {
            showToast('Please select at least one garment from your inventory to print labels.', 'info');
            return;
        }
        window.print();
    };

    // Sample item for real-time live preview
    const sampleProduct = selectedProducts[previewIndex] || selectedProducts[0] || {
        name: 'Royal Banarasi Silk Saree',
        productId: 'BL-9842',
        price: 4950,
        customPrice: 4950,
        customMrp: 6499,
        category: 'Sarees',
        size: 'Free Size',
        color: 'Emerald'
    };

    // Bulk select dialog helpers
    const handleBulkSelectAdd = () => {
        const productsToAdd = allSearchableProducts.filter(item => tempSelectedIds.includes(item.id));
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

    const dialogFilteredInventory = allSearchableProducts.filter(item => {
        const matchesSearch = !dialogSearch ||
            item.name.toLowerCase().includes(dialogSearch.toLowerCase()) ||
            (item.productId || '').toLowerCase().includes(dialogSearch.toLowerCase());
        const matchesCat = !dialogCategory || item.category === dialogCategory;
        return matchesSearch && matchesCat;
    }).sort((a, b) => {
        const isAsc = dialogOrder === 'asc';
        const valA = (a[dialogOrderBy] || '').toString().toLowerCase();
        const valB = (b[dialogOrderBy] || '').toString().toLowerCase();
        if (dialogOrderBy === 'quantity' || dialogOrderBy === 'price') {
            return isAsc ? (a[dialogOrderBy] - b[dialogOrderBy]) : (b[dialogOrderBy] - a[dialogOrderBy]);
        }
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    // Reset inventory pagination on search or filter change
    useEffect(() => {
        setInventoryPage(0);
    }, [productSearch, categoryFilter, stockFilter, sortOption]);

    // Reset dialog pagination on search or filter change
    useEffect(() => {
        setDialogPage(0);
    }, [dialogSearch, dialogCategory]);

    // Ensure queuePage does not exceed valid page boundaries
    useEffect(() => {
        const maxQueuePage = Math.max(0, Math.ceil(selectedProducts.length / queueRowsPerPage) - 1);
        if (queuePage > maxQueuePage) {
            setQueuePage(maxQueuePage);
        }
    }, [selectedProducts.length, queueRowsPerPage, queuePage]);

    // Paginated slices for 10 entries on 1 page (Pic 2)
    const paginatedInventory = useMemo(() => {
        return filteredAndSortedInventory.slice(
            inventoryPage * inventoryRowsPerPage,
            (inventoryPage + 1) * inventoryRowsPerPage
        );
    }, [filteredAndSortedInventory, inventoryPage, inventoryRowsPerPage]);

    const paginatedQueue = useMemo(() => {
        return selectedProducts.slice(
            queuePage * queueRowsPerPage,
            (queuePage + 1) * queueRowsPerPage
        );
    }, [selectedProducts, queuePage, queueRowsPerPage]);

    const paginatedDialogInventory = useMemo(() => {
        return dialogFilteredInventory.slice(
            dialogPage * dialogRowsPerPage,
            (dialogPage + 1) * dialogRowsPerPage
        );
    }, [dialogFilteredInventory, dialogPage, dialogRowsPerPage]);

    // Toggle garment selection in the 10-entries table
    const handleToggleProduct = (item) => {
        const isSelected = selectedProducts.some(p => p.id === item.id);
        if (isSelected) {
            setSelectedProducts(prev => prev.filter(p => p.id !== item.id));
        } else {
            const selling = Number(item.price) || 0;
            const defaultMrp = Number(item.mrp) || Math.round(selling * (settings.mrpMultiplier || 1.25));
            setSelectedProducts(prev => [
                ...prev,
                {
                    ...item,
                    customPrice: selling,
                    customMrp: defaultMrp,
                    labelCount: Math.max(1, item.quantity || 1)
                }
            ]);
        }
    };

    return (
        <Box>
            {/* Atelier Page Header */}
            <PageHeader
                title="Barcode & Price Tag Studio"
                subtitle="Design and batch-print thermal price labels, barcode tags, and luxury retail stickers"
                breadcrumbs={[
                    { label: 'Aleen Clothing', path: '/' },
                    { label: 'Merchandise', path: '/inventory' },
                    { label: 'Barcode Studio' }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Add sx={{ fontSize: 19, color: '#0F766E' }} />}
                            onClick={() => setIsBulkSelectOpen(true)}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.75,
                                borderRadius: '24px',
                                border: '1.5px solid #0F766E',
                                color: '#0F766E',
                                bgcolor: 'background.paper',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textTransform: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    border: '1.5px solid #042F2E',
                                    bgcolor: 'rgba(15, 118, 110, 0.05)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Bulk Inventory Picker
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Print sx={{ fontSize: 19, color: '#FFFFFF !important' }} />}
                            onClick={handlePrint}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 3.25,
                                borderRadius: '24px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textTransform: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%) !important',
                                color: '#FFFFFF !important',
                                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
                                opacity: selectedProducts.length > 0 ? 1 : 0.9,
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                '& .MuiSvgIcon-root': {
                                    color: '#FFFFFF !important'
                                },
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #115E59 0%, #021C1B 100%) !important',
                                    boxShadow: '0 6px 18px rgba(15, 118, 110, 0.45)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Print {totalLabelsCount > 0 ? `${totalLabelsCount} Labels` : 'Labels'}
                        </Button>
                    </Box>
                }
            />

            {/* KPI Cards Ribbon: Responsive Grid on Mobile, 3 Columns on Tablet/Desktop */}
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3 } }}>
                <Grid item xs={6} sm={4}>
                    <AtelierKpiCard
                        title="Selected Garments"
                        value={selectedProducts.length}
                        icon={<Inventory2 fontSize="small" />}
                        subtitle="Distinct styles in print queue"
                    />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <AtelierKpiCard
                        title="Total Stickers to Print"
                        value={totalLabelsCount}
                        icon={<QrCode fontSize="small" />}
                        goldAccent={true}
                        subtitle="Total barcode prints"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Label Preset"
                        value={
                            settings.template === 'standard' ? '50 × 25 mm' :
                            settings.template === 'small' ? '38 × 22 mm' :
                            settings.template === 'compact' ? '30 × 20 mm' :
                            settings.template === 'large' ? '60 × 40 mm' :
                            settings.template === 'thermal_single' ? 'Thermal Roll' : 'A4 3×8 Sheet'
                        }
                        icon={<Straighten fontSize="small" />}
                        subtitle="Active printer profile"
                    />
                </Grid>
            </Grid>

            {/* SECTION 1: Advanced Print Settings & Live Visual Preview */}
            <GlassCard sx={{ p: 3, mb: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tune sx={{ color: '#0F766E', fontSize: 20 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Tag Layout & Print Settings
                        </Typography>
                    </Box>
                    <Button
                        size="small"
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                    >
                        {showAdvancedSettings ? 'Hide Options' : 'Customize Options'}
                    </Button>
                </Box>

                <Collapse in={showAdvancedSettings}>
                    <Grid container spacing={3} alignItems="flex-start">
                        {/* Settings Form Controls */}
                        <Grid item xs={12} md={8}>
                            {/* Row 1: Label Dimensions & Density */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Label Dimension / Roll Type"
                                        value={settings.template}
                                        onChange={(e) => setSettings({ ...settings, template: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    >
                                        <MenuItem value="standard">Standard Apparel Tag (50 × 25 mm)</MenuItem>
                                        <MenuItem value="small">Small Jewelry / Accessory (38 × 22 mm)</MenuItem>
                                        <MenuItem value="compact">Compact Barcode (30 × 20 mm)</MenuItem>
                                        <MenuItem value="large">Large Atelier Price Card (60 × 40 mm)</MenuItem>
                                        <MenuItem value="thermal_single">Continuous Thermal Roll (Single Column)</MenuItem>
                                        <MenuItem value="a4_sheet">A4 Sheet (24 Labels - 3 × 8 Grid)</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Barcode Height"
                                        value={settings.barcodeHeight}
                                        onChange={(e) => setSettings({ ...settings, barcodeHeight: Number(e.target.value) })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    >
                                        <MenuItem value={22}>Compact (22px)</MenuItem>
                                        <MenuItem value={30}>Standard (30px)</MenuItem>
                                        <MenuItem value={40}>Tall (40px)</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Font Sizing"
                                        value={settings.fontSize}
                                        onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    >
                                        <MenuItem value="compact">Compact Font</MenuItem>
                                        <MenuItem value="normal">Normal Font</MenuItem>
                                        <MenuItem value="large">Bold & Large</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Row 2: Tag Elements Toggles */}
                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>
                                Content Elements on Price Sticker:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={settings.showBusiness}
                                            onChange={(e) => setSettings({ ...settings, showBusiness: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Atelier Brand Name</Typography>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={settings.showName}
                                            onChange={(e) => setSettings({ ...settings, showName: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Garment Name</Typography>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={settings.showPrice}
                                            onChange={(e) => setSettings({ ...settings, showPrice: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Selling Price (₹)</Typography>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={settings.showMrp}
                                            onChange={(e) => setSettings({ ...settings, showMrp: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>M.R.P. Strike-Through</Typography>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={settings.showSku}
                                            onChange={(e) => setSettings({ ...settings, showSku: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Product SKU / ID</Typography>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={settings.showSizeColor}
                                            onChange={(e) => setSettings({ ...settings, showSizeColor: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Size & Color</Typography>}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={settings.showCategory}
                                            onChange={(e) => setSettings({ ...settings, showCategory: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Collection / Category</Typography>}
                                />
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Row 3: Barcode Pricing Configuration (Custom MRP & Selling Price) */}
                            <Box sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <PriceChange sx={{ color: '#0F766E', fontSize: 18 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                                        Barcode Pricing & MRP Markup Settings:
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    {/* Default MRP Rule */}
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="MRP Calculation Mode"
                                            value={settings.mrpMode}
                                            onChange={(e) => {
                                                const mode = e.target.value;
                                                let mult = 1.25;
                                                if (mode === 'markup_20') mult = 1.20;
                                                if (mode === 'markup_25') mult = 1.25;
                                                if (mode === 'markup_30') mult = 1.30;
                                                if (mode === 'markup_40') mult = 1.40;
                                                if (mode === 'markup_50') mult = 1.50;
                                                setSettings({ ...settings, mrpMode: mode, mrpMultiplier: mult });
                                                if (mode !== 'custom') {
                                                    handleApplyBulkMrpMarkup(mult);
                                                }
                                            }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        >
                                            <MenuItem value="custom">Custom / Manual (Editable per garment)</MenuItem>
                                            <MenuItem value="markup_20">Auto +20% Markup (1.20× Sale Price)</MenuItem>
                                            <MenuItem value="markup_25">Auto +25% Markup (1.25× Sale Price)</MenuItem>
                                            <MenuItem value="markup_30">Auto +30% Markup (1.30× Sale Price)</MenuItem>
                                            <MenuItem value="markup_40">Auto +40% Markup (1.40× Sale Price)</MenuItem>
                                            <MenuItem value="markup_50">Auto +50% Markup (1.50× Sale Price)</MenuItem>
                                        </TextField>
                                    </Grid>

                                    {/* Currency Symbol */}
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="Currency Display"
                                            value={settings.currencySymbol}
                                            onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        >
                                            <MenuItem value="₹">₹ (Indian Rupee)</MenuItem>
                                            <MenuItem value="Rs.">Rs. (Rupees)</MenuItem>
                                            <MenuItem value="$">$ (USD)</MenuItem>
                                            <MenuItem value="AED">AED (Dirham)</MenuItem>
                                        </TextField>
                                    </Grid>

                                    {/* MRP Prefix Label */}
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            label="MRP Tag Prefix"
                                            value={settings.mrpPrefix}
                                            onChange={(e) => setSettings({ ...settings, mrpPrefix: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        >
                                            <MenuItem value="MRP">MRP (Standard)</MenuItem>
                                            <MenuItem value="M.R.P.">M.R.P. (Punctuated)</MenuItem>
                                            <MenuItem value="REG.">REG. (Regular)</MenuItem>
                                            <MenuItem value="VAL.">VAL. (Valued At)</MenuItem>
                                        </TextField>
                                    </Grid>
                                </Grid>

                                {/* Quick Batch Pricing Action Buttons */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                        Batch Actions:
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleApplyBulkMrpMarkup(1.25)}
                                        sx={{ borderRadius: 1.5, fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none', fontWeight: 700 }}
                                    >
                                        Apply +25% MRP to All
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleApplyBulkMrpMarkup(1.35)}
                                        sx={{ borderRadius: 1.5, fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none', fontWeight: 700 }}
                                    >
                                        Apply +35% MRP to All
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleApplyBulkMrpMarkup(1.50)}
                                        sx={{ borderRadius: 1.5, fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none', fontWeight: 700 }}
                                    >
                                        Apply +50% MRP to All
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="text"
                                        onClick={handleResetAllPrices}
                                        sx={{ borderRadius: 1.5, fontSize: '0.7rem', py: 0.25, px: 1, textTransform: 'none', color: 'text.secondary' }}
                                    >
                                        Reset to Catalog Prices
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Live Visual Preview Panel */}
                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: 'action.hover',
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: 220
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                                        ✨ Live Sticker Preview:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {selectedProducts.length > 1 && (
                                            <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700, mr: 0.5 }}>
                                                {previewIndex + 1}/{selectedProducts.length}
                                            </Typography>
                                        )}
                                        <Chip
                                            label="1x"
                                            size="small"
                                            clickable
                                            onClick={() => setPreviewZoom(1.0)}
                                            sx={{
                                                height: 19,
                                                fontSize: '0.62rem',
                                                fontWeight: previewZoom === 1.0 ? 800 : 500,
                                                bgcolor: previewZoom === 1.0 ? '#0F766E' : 'background.paper',
                                                color: previewZoom === 1.0 ? '#FFFFFF' : 'text.secondary',
                                                border: '1px solid',
                                                borderColor: previewZoom === 1.0 ? '#0F766E' : 'divider'
                                            }}
                                        />
                                        <Chip
                                            label="1.35x"
                                            size="small"
                                            clickable
                                            onClick={() => setPreviewZoom(1.35)}
                                            sx={{
                                                height: 19,
                                                fontSize: '0.62rem',
                                                fontWeight: previewZoom === 1.35 ? 800 : 500,
                                                bgcolor: previewZoom === 1.35 ? '#0F766E' : 'background.paper',
                                                color: previewZoom === 1.35 ? '#FFFFFF' : 'text.secondary',
                                                border: '1px solid',
                                                borderColor: previewZoom === 1.35 ? '#0F766E' : 'divider'
                                            }}
                                        />
                                        <Chip
                                            label="1.6x"
                                            size="small"
                                            clickable
                                            onClick={() => setPreviewZoom(1.6)}
                                            sx={{
                                                height: 19,
                                                fontSize: '0.62rem',
                                                fontWeight: previewZoom === 1.6 ? 800 : 500,
                                                bgcolor: previewZoom === 1.6 ? '#0F766E' : 'background.paper',
                                                color: previewZoom === 1.6 ? '#FFFFFF' : 'text.secondary',
                                                border: '1px solid',
                                                borderColor: previewZoom === 1.6 ? '#0F766E' : 'divider'
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Scaled Live Sticker Container (Pic 1: Lil Bigger) */}
                                <Box
                                    sx={{
                                        py: 2.5,
                                        px: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        overflow: 'visible'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            transform: `scale(${previewZoom})`,
                                            transformOrigin: 'center center',
                                            boxShadow: '0 8px 22px rgba(0,0,0,0.08)',
                                            borderRadius: 0.8,
                                            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}
                                    >
                                        <BarcodeItem
                                            value={sampleProduct.productId || 'PRD-1001'}
                                            businessName={profile?.businessName || 'Aleen Clothing'}
                                            product={sampleProduct}
                                            settings={settings}
                                        />
                                    </Box>
                                </Box>

                                {/* Live Price Readout */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                                    <Chip
                                        size="small"
                                        label={`Sale: ${settings.currencySymbol || '₹'}${(sampleProduct.customPrice !== undefined ? sampleProduct.customPrice : sampleProduct.price || 0).toLocaleString('en-IN')}`}
                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }}
                                    />
                                    {settings.showMrp && (
                                        <Chip
                                            size="small"
                                            label={`MRP: ${settings.currencySymbol || '₹'}${(sampleProduct.customMrp !== undefined ? sampleProduct.customMrp : Math.round((sampleProduct.customPrice || sampleProduct.price || 0) * (settings.mrpMultiplier || 1.25))).toLocaleString('en-IN')}`}
                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(217, 119, 6, 0.1)', color: '#D97706' }}
                                        />
                                    )}
                                </Box>

                                {selectedProducts.length > 1 && (
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                        <Button
                                            size="small"
                                            disabled={previewIndex === 0}
                                            onClick={() => setPreviewIndex(p => Math.max(0, p - 1))}
                                            sx={{ fontSize: '0.68rem', py: 0.2, minWidth: 48 }}
                                        >
                                            Prev
                                        </Button>
                                        <Button
                                            size="small"
                                            disabled={previewIndex >= selectedProducts.length - 1}
                                            onClick={() => setPreviewIndex(p => Math.min(selectedProducts.length - 1, p + 1))}
                                            sx={{ fontSize: '0.68rem', py: 0.2, minWidth: 48 }}
                                        >
                                            Next
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Collapse>
            </GlassCard>

            {/* SECTION 2: Select Products to Label (Search, Sort A to Z, Category & Stock Filters) */}
            <GlassCard sx={{ p: 3, mb: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Select Garments to Label
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Search by style, SKU, or filter by category and stock availability
                        </Typography>
                    </Box>

                    {/* Quick batch count actions */}
                    {selectedProducts.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleSetAllCounts('stock')}
                                sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                            >
                                Set Qty = Available Stock
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleSetAllCounts('one')}
                                sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                            >
                                Set Qty = 1
                            </Button>
                            <Button
                                size="small"
                                color="error"
                                onClick={handleClearQueue}
                                sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                            >
                                Clear All
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Filter & Sort Controls Row */}
                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    {/* Search Field */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Type to filter list (e.g. Saree, Lehenga, SKU)..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Grid>

                    {/* Sort Options (A to Z, etc.) */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Sort Order"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            InputProps={{
                                startAdornment: <SortByAlpha sx={{ mr: 1, color: '#D97706', fontSize: 18 }} />
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="name_asc">Alphabetical: A to Z</MenuItem>
                            <MenuItem value="name_desc">Alphabetical: Z to A</MenuItem>
                            <MenuItem value="price_asc">Price: Low to High</MenuItem>
                            <MenuItem value="price_desc">Price: High to Low</MenuItem>
                            <MenuItem value="stock_desc">Available Stock: High to Low</MenuItem>
                            <MenuItem value="stock_asc">Available Stock: Low to High</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Category Filter */}
                    <Grid item xs={12} sm={2.5}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="">All Categories ({allSearchableProducts.length})</MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>
                                    {cat} ({allSearchableProducts.filter(p => p.category === cat).length})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Stock Status Filter */}
                    <Grid item xs={12} sm={2.5}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Stock Status"
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="all">All Inventory</MenuItem>
                            <MenuItem value="instock">In Stock Only (&gt; 0)</MenuItem>
                            <MenuItem value="lowstock">Low Stock Alerts (&lt; 3)</MenuItem>
                            <MenuItem value="outstock">Out of Stock (0)</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>

                {/* Multi-Selection Batch Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Matching Garments: <strong>{filteredAndSortedInventory.length}</strong> items
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<Add fontSize="small" />}
                            onClick={handleSelectAllFiltered}
                            disabled={filteredAndSortedInventory.length === 0}
                            sx={{
                                borderRadius: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                                color: '#ffffff'
                            }}
                        >
                            + Queue All Filtered ({filteredAndSortedInventory.length})
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleDeselectFiltered}
                            disabled={filteredAndSortedInventory.length === 0}
                            sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 700 }}
                        >
                            Deselect Filtered
                        </Button>
                    </Box>
                </Box>

                {/* Multi-Select Autocomplete Dropdown with Checkboxes */}
                <Autocomplete
                    multiple
                    disableCloseOnSelect
                    options={filteredAndSortedInventory}
                    value={selectedProducts}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => `${option.name} (${option.productId || 'No ID'})`}
                    onChange={(event, newValues) => {
                        const existingCountMap = new Map(selectedProducts.map(p => [p.id, p.labelCount]));
                        const updated = newValues.map(item => ({
                            ...item,
                            labelCount: existingCountMap.get(item.id) || Math.max(1, item.quantity || 1)
                        }));
                        setSelectedProducts(updated);
                    }}
                    renderTags={(tagValue, getTagProps) =>
                        tagValue.slice(0, 4).map((option, index) => (
                            <Chip
                                {...getTagProps({ index })}
                                key={option.id}
                                label={`${option.name} (${option.labelCount || 1}x)`}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    bgcolor: 'rgba(15, 118, 110, 0.1)',
                                    color: '#0F766E',
                                    border: '1px solid rgba(15, 118, 110, 0.25)'
                                }}
                            />
                        ))
                    }
                    renderOption={(props, option) => {
                        const isSelected = selectedProducts.some(p => p.id === option.id);
                        return (
                            <Box
                                component="li"
                                {...props}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    py: 1,
                                    px: 1.5,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: isSelected ? 'rgba(15, 118, 110, 0.06)' : 'transparent',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <Checkbox
                                    size="small"
                                    checked={isSelected}
                                    sx={{
                                        color: 'text.secondary',
                                        '&.Mui-checked': { color: '#0F766E' },
                                        p: 0.5
                                    }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                            {option.name}
                                        </Typography>
                                        {option.variantName && (
                                            <Chip
                                                label={option.variantName}
                                                size="small"
                                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#0F766E', fontWeight: 700, textTransform: 'uppercase' }}>
                                            #{String(option.productId || 'NO-SKU').toUpperCase()}
                                        </Typography>
                                        {option.category && (
                                            <Typography variant="caption" color="text.secondary">
                                                • {option.category}
                                            </Typography>
                                        )}
                                        <Typography variant="caption" sx={{ color: (option.quantity || 0) > 0 ? 'text.secondary' : 'error.main' }}>
                                            • Stock: {option.quantity || 0} units
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ textAlign: 'right', pl: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#D97706' }}>
                                        ₹{(option.price || 0).toLocaleString('en-IN')}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: isSelected ? '#0F766E' : 'text.secondary', fontWeight: 700 }}>
                                        {isSelected ? '✓ In Queue' : '+ Add'}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={`Select Multiple Garments from ${filteredAndSortedInventory.length} filtered items`}
                            placeholder={selectedProducts.length > 0 ? `${selectedProducts.length} items in queue...` : "Click or type to select multiple garments..."}
                            variant="outlined"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    )}
                    sx={{ mb: 2 }}
                />

                {/* Garments Catalog Table: 10 entries on 1 page (Pic 2) */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            📋 Browse Catalog Garments (10 entries on 1 page)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700 }}>
                            Page {inventoryPage + 1} of {Math.max(1, Math.ceil(filteredAndSortedInventory.length / inventoryRowsPerPage))} • {filteredAndSortedInventory.length} items
                        </Typography>
                    </Box>

                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            size="small"
                                            indeterminate={
                                                paginatedInventory.some(item => selectedProducts.some(p => p.id === item.id)) &&
                                                !paginatedInventory.every(item => selectedProducts.some(p => p.id === item.id))
                                            }
                                            checked={
                                                paginatedInventory.length > 0 &&
                                                paginatedInventory.every(item => selectedProducts.some(p => p.id === item.id))
                                            }
                                            onChange={() => {
                                                const allPageSelected = paginatedInventory.every(item => selectedProducts.some(p => p.id === item.id));
                                                if (allPageSelected) {
                                                    const pageIds = new Set(paginatedInventory.map(i => i.id));
                                                    setSelectedProducts(prev => prev.filter(p => !pageIds.has(p.id)));
                                                } else {
                                                    const newToAdd = paginatedInventory
                                                        .filter(item => !selectedProducts.some(p => p.id === item.id))
                                                        .map(item => {
                                                            const selling = Number(item.price) || 0;
                                                            const defaultMrp = Number(item.mrp) || Math.round(selling * (settings.mrpMultiplier || 1.25));
                                                            return {
                                                                ...item,
                                                                customPrice: selling,
                                                                customMrp: defaultMrp,
                                                                labelCount: Math.max(1, item.quantity || 1)
                                                            };
                                                        });
                                                    setSelectedProducts(prev => [...prev, ...newToAdd]);
                                                }
                                            }}
                                            sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Garment Style</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>SKU / Product ID</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Category</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Price</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Stock</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Queue Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedInventory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                                            No matching garments found for current filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedInventory.map(item => {
                                        const queued = selectedProducts.find(p => p.id === item.id);
                                        const isSelected = Boolean(queued);

                                        return (
                                            <TableRow
                                                key={item.id}
                                                hover
                                                sx={{
                                                    bgcolor: isSelected ? 'rgba(15, 118, 110, 0.04)' : 'transparent',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => handleToggleProduct(item)}
                                            >
                                                <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleProduct(item)}
                                                        sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                                    {item.name}
                                                    {item.variantName && (
                                                        <Chip
                                                            label={item.variantName}
                                                            size="small"
                                                            sx={{ ml: 1, height: 18, fontSize: '0.62rem', fontWeight: 600 }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', color: '#0F766E', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                                    #{String(item.productId || 'NO-SKU').toUpperCase()}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.category || 'General'}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.68rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#D97706', fontSize: '0.8rem' }}>
                                                    ₹{(item.price || 0).toLocaleString('en-IN')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: (item.quantity || 0) > 0 ? 'text.primary' : 'error.main' }}>
                                                    {item.quantity || 0} pcs
                                                </TableCell>
                                                <TableCell align="center" onClick={e => e.stopPropagation()}>
                                                    {isSelected ? (
                                                        <Chip
                                                            label={`✓ In Queue (${queued.labelCount || 1}x)`}
                                                            size="small"
                                                            color="primary"
                                                            onDelete={() => handleRemove(item.id)}
                                                            sx={{
                                                                height: 22,
                                                                fontSize: '0.68rem',
                                                                fontWeight: 700,
                                                                bgcolor: '#0F766E'
                                                            }}
                                                        />
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleToggleProduct(item)}
                                                            sx={{
                                                                py: 0.1,
                                                                px: 1.2,
                                                                fontSize: '0.68rem',
                                                                borderRadius: 1.2,
                                                                fontWeight: 700,
                                                                minWidth: 64,
                                                                textTransform: 'none'
                                                            }}
                                                        >
                                                            + Queue
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[10, 20, 50]}
                            component="div"
                            count={filteredAndSortedInventory.length}
                            rowsPerPage={inventoryRowsPerPage}
                            page={inventoryPage}
                            onPageChange={(e, newPage) => setInventoryPage(newPage)}
                            onRowsPerPageChange={(e) => {
                                setInventoryRowsPerPage(parseInt(e.target.value, 10));
                                setInventoryPage(0);
                            }}
                            sx={{
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                '& .MuiTablePagination-toolbar': { minHeight: 44 }
                            }}
                        />
                    </TableContainer>
                </Box>

                {/* Queue Summary Badge */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Active Print Queue ({selectedProducts.length} garments • {totalLabelsCount} stickers)
                    </Typography>
                    {selectedProducts.length > 10 && (
                        <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700 }}>
                            Showing page {queuePage + 1} of {Math.max(1, Math.ceil(selectedProducts.length / queueRowsPerPage))} (10 entries per page)
                        </Typography>
                    )}
                </Box>

                {/* Selected Products Cards Grid */}
                {selectedProducts.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                        <QrCode sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            No garments queued for label printing. Select items above or click "Bulk Inventory Picker".
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {paginatedQueue.map((product, idx) => {
                            const globalIdx = queuePage * queueRowsPerPage + idx;
                            const isCurrentPreview = globalIdx === previewIndex;
                            const selling = product.customPrice !== undefined ? product.customPrice : (product.price || 0);
                            const mrp = product.customMrp !== undefined ? product.customMrp : Math.round((product.price || 0) * (settings.mrpMultiplier || 1.25));

                            return (
                                <Grid item xs={12} sm={6} md={4} key={product.id}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2.5,
                                            borderColor: isCurrentPreview ? '#0F766E' : 'divider',
                                            borderWidth: isCurrentPreview ? 1.5 : 1,
                                            transition: 'all 0.15s ease-in-out',
                                            bgcolor: isCurrentPreview ? 'rgba(15, 118, 110, 0.02)' : 'background.paper',
                                            '&:hover': {
                                                borderColor: '#0F766E',
                                                boxShadow: '0 4px 14px rgba(15,118,110,0.1)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            {/* Header: Title, SKU, and Actions */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Box sx={{ minWidth: 0, pr: 1 }}>
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{
                                                            fontWeight: 800,
                                                            overflow: 'hidden',
                                                            whiteSpace: 'nowrap',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {product.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#0F766E', fontWeight: 700, textTransform: 'uppercase' }}>
                                                            #{String(product.productId || '').toUpperCase()}
                                                        </Typography>
                                                        {product.variantName && (
                                                            <Chip
                                                                label={product.variantName}
                                                                size="small"
                                                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                                                            />
                                                        )}
                                                        {product.category && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                • {product.category}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Tooltip title="Preview this sticker">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setPreviewIndex(globalIdx)}
                                                            sx={{ color: isCurrentPreview ? '#0F766E' : 'text.disabled' }}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Remove from queue">
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={() => {
                                                                handleRemove(product.id);
                                                                if (previewIndex >= selectedProducts.length - 1) {
                                                                    setPreviewIndex(Math.max(0, selectedProducts.length - 2));
                                                                }
                                                            }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            {/* Price & Copies Form Inputs */}
                                            <Grid container spacing={1.25} alignItems="center">
                                                {/* Custom Sales Price */}
                                                <Grid item xs={4}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        label={`Sale (${settings.currencySymbol || '₹'})`}
                                                        value={selling}
                                                        onChange={(e) => handleUpdatePrice(product.id, e.target.value)}
                                                        inputProps={{ min: 0 }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 1.5,
                                                                fontWeight: 700,
                                                                fontSize: '0.82rem'
                                                            }
                                                        }}
                                                    />
                                                </Grid>

                                                {/* Custom MRP */}
                                                <Grid item xs={4}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        label={`MRP (${settings.currencySymbol || '₹'})`}
                                                        value={mrp}
                                                        onChange={(e) => handleUpdateMrp(product.id, e.target.value)}
                                                        inputProps={{ min: 0 }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 1.5,
                                                                fontWeight: 700,
                                                                fontSize: '0.82rem'
                                                            }
                                                        }}
                                                    />
                                                </Grid>

                                                {/* Label Copies */}
                                                <Grid item xs={4}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        label="Copies"
                                                        value={product.labelCount || 1}
                                                        onChange={(e) => handleUpdateCount(product.id, e.target.value)}
                                                        inputProps={{ min: 1 }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 1.5,
                                                                fontWeight: 700,
                                                                fontSize: '0.82rem'
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>

                                            {/* Price Comparison Sub-text */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                                                    {Number(mrp) > Number(selling) && Number(mrp) > 0 ? (
                                                        <span style={{ color: '#059669', fontWeight: 700 }}>
                                                            {Math.round(((Number(mrp) - Number(selling)) / Number(mrp)) * 100)}% Discount on Tag
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'text.secondary' }}>MRP = Sale Price</span>
                                                    )}
                                                </Typography>
                                                {Number(product.price) !== Number(selling) && (
                                                    <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700, fontSize: '0.68rem' }}>
                                                        Catalog: ₹{product.price}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* Active Queue Pagination: 10 entries per page (Pic 2) */}
                {selectedProducts.length > 10 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <TablePagination
                            rowsPerPageOptions={[10, 20, 50]}
                            component="div"
                            count={selectedProducts.length}
                            rowsPerPage={queueRowsPerPage}
                            page={queuePage}
                            onPageChange={(e, newPage) => setQueuePage(newPage)}
                            onRowsPerPageChange={(e) => {
                                setQueueRowsPerPage(parseInt(e.target.value, 10));
                                setQueuePage(0);
                            }}
                            sx={{
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                width: '100%',
                                '& .MuiTablePagination-toolbar': { minHeight: 44 }
                            }}
                        />
                    </Box>
                )}
            </GlassCard>

            {/* Bulk Select Dialog */}
            <Dialog 
                open={isBulkSelectOpen} 
                onClose={() => setIsBulkSelectOpen(false)} 
                maxWidth="md" 
                fullWidth
                fullScreen={isTablet}
                PaperProps={{ sx: { borderRadius: isTablet ? 0 : 3.5 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
                    Bulk Select Products for Barcode Batch
                    <IconButton onClick={() => setIsBulkSelectOpen(false)} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2.5, mt: 1, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <TextField
                            size="small"
                            placeholder="Search by Name or Product ID..."
                            value={dialogSearch}
                            onChange={(e) => setDialogSearch(e.target.value)}
                            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> }}
                            sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                            select
                            size="small"
                            label="Category"
                            value={dialogCategory}
                            onChange={(e) => setDialogCategory(e.target.value)}
                            sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="">All Categories</MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <TableContainer sx={{ maxHeight: 420, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <Table stickyHeader size="small" sx={{ minWidth: 540 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={tempSelectedIds.length > 0 && tempSelectedIds.length < dialogFilteredInventory.length}
                                            checked={dialogFilteredInventory.length > 0 && tempSelectedIds.length === dialogFilteredInventory.length}
                                            onChange={() => toggleSelectAll(dialogFilteredInventory)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={dialogOrderBy === 'name'}
                                            direction={dialogOrderBy === 'name' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('name')}
                                            sx={{ fontWeight: 800 }}
                                        >
                                            Garment Name
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={dialogOrderBy === 'productId'}
                                            direction={dialogOrderBy === 'productId' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('productId')}
                                            sx={{ fontWeight: 800 }}
                                        >
                                            Product ID / SKU
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={dialogOrderBy === 'price'}
                                            direction={dialogOrderBy === 'price' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('price')}
                                            sx={{ fontWeight: 800 }}
                                        >
                                            Price (₹)
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={dialogOrderBy === 'quantity'}
                                            direction={dialogOrderBy === 'quantity' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('quantity')}
                                            sx={{ fontWeight: 800 }}
                                        >
                                            Stock
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedDialogInventory.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        hover
                                        onClick={() => {
                                            setTempSelectedIds(prev =>
                                                prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                            );
                                        }}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={tempSelectedIds.includes(item.id)} />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>
                                            {item.name}
                                            {item.variantName && <span style={{ color: '#6b7280', fontWeight: 500 }}> ({item.variantName})</span>}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', textTransform: 'uppercase' }}>{String(item.productId || '').toUpperCase()}</TableCell>
                                        <TableCell>
                                            <Chip label={item.category || 'General'} size="small" variant="outlined" sx={{ height: 22 }} />
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>₹{item.price}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: (item.quantity || 0) > 0 ? 'text.primary' : 'error.main' }}>
                                            {item.quantity || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[10, 20, 50]}
                        component="div"
                        count={dialogFilteredInventory.length}
                        rowsPerPage={dialogRowsPerPage}
                        page={dialogPage}
                        onPageChange={(e, newPage) => setDialogPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setDialogRowsPerPage(parseInt(e.target.value, 10));
                            setDialogPage(0);
                        }}
                        sx={{
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            '& .MuiTablePagination-toolbar': { minHeight: 44 }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1, ml: 1, fontWeight: 700 }}>
                        {tempSelectedIds.length} garments selected
                    </Typography>
                    <Button onClick={() => setIsBulkSelectOpen(false)} sx={{ fontWeight: 700 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleBulkSelectAdd}
                        disabled={tempSelectedIds.length === 0}
                        sx={{
                            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            px: 3
                        }}
                    >
                        Add {tempSelectedIds.length} to Print Queue
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Print Output Grid (Hidden on Screen, Active on Print) */}
            <Box className="print-only" sx={{ display: 'none', '@media print': { display: 'block' } }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns:
                            settings.template === 'thermal_single' ? '1fr' :
                            settings.template === 'compact' ? 'repeat(4, 1fr)' :
                            settings.template === 'small' ? 'repeat(4, 1fr)' :
                            settings.template === 'large' ? 'repeat(2, 1fr)' :
                            'repeat(3, 1fr)',
                        gap: settings.template === 'thermal_single' ? '4mm' : '2mm',
                        p: 0,
                        width: '100%'
                    }}
                >
                    {selectedProducts.flatMap(product =>
                        Array.from({ length: product.labelCount || 1 }).map((_, i) => (
                            <BarcodeItem
                                key={`${product.id}-${i}`}
                                value={String(product.variantSku || product.productId || product.id || '').toUpperCase()}
                                businessName={profile?.businessName || 'Aleen Clothing'}
                                product={product}
                                settings={settings}
                            />
                        ))
                    )}
                </Box>
            </Box>

            {/* Print Specific CSS Stylesheet */}
            <style>
                {`
          @media print {
            @page { 
                margin: ${settings.template === 'thermal_single' ? '0 !important' : '5mm !important'}; 
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
              padding: ${settings.template === 'thermal_single' ? '1mm' : '4mm'} !important;
              box-sizing: border-box !important;
            }
          }
        `}
            </style>
        </Box>
    );
}
