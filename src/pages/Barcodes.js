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
    useTheme,
    InputAdornment,
    Menu
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

/**
 * Formats SKU/Product ID in uppercase and ensures a hyphen (-) exists between alphabets and numbers
 * e.g. ES50 -> ES-50, D000 -> D-000, DC00 -> DC-00, SAR1002 -> SAR-1002, SAR-1002 -> SAR-1002
 */
export const formatSkuWithHyphen = (sku) => {
    if (!sku) return '';
    let str = String(sku).trim().toUpperCase();
    str = str.replace(/^#+/, '');
    // Insert hyphen between letters and numbers if missing
    str = str.replace(/([A-Z]+)(\d+)/g, '$1-$2');
    str = str.replace(/(\d+)([A-Z]+)/g, '$1-$2');
    str = str.replace(/-+/g, '-');
    return str;
};

/**
 * Couture category color theme palette
 */
export const getCategoryStyle = (category = '') => {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('saree')) return { bg: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' };
    if (cat.includes('unstitched') || cat.includes('stitch')) return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    if (cat.includes('lehenga')) return { bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
    if (cat.includes('kurti')) return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    if (cat.includes('blouse') || cat.includes('bespoke')) return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
    return { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };
};

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

    // Dimensions based on template (Standard A4 Sticker Sheets e.g. 3 cols x 8 rows = 24 up)
    const getDimensions = () => {
        switch (template) {
            case 'small': return { w: '44mm', maxWidth: '44mm', h: '24mm', barH: 22, barW: 1.0 };
            case 'compact': return { w: '36mm', maxWidth: '36mm', h: '20mm', barH: 18, barW: 0.9 };
            case 'large': return { w: '90mm', maxWidth: '90mm', h: '42mm', barH: 38, barW: 1.4 };
            case 'thermal_single': return { w: '52mm', maxWidth: '52mm', h: '32mm', barH: 30, barW: 1.2 };
            case 'a4_sheet': return { w: '64mm', maxWidth: '64mm', h: '36mm', barH: 32, barW: 1.25 };
            default: return { w: '64mm', maxWidth: '64mm', h: '34mm', barH: barcodeHeight || 28, barW: 1.15 };
        }
    };

    const dims = getDimensions();

    useEffect(() => {
        if (barcodeRef.current && value) {
            try {
                JsBarcode(barcodeRef.current, formatSkuWithHyphen(value) || String(value), {
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

    const specText = [
        product?.size && product.size !== 'Free Size' ? product.size : null,
        product?.color || null,
        showCategory && product?.category ? product.category : null
    ].filter(Boolean).join(' • ') || (product?.variantName || (product?.size ? `${product.size}` : 'Free Size'));

    return (
        <Box
            sx={{
                border: '1px solid #1E293B',
                p: isSmall ? '2px 4px' : '4px 6px',
                textAlign: 'center',
                borderRadius: '4px',
                overflow: 'hidden',
                minHeight: dims.h,
                height: dims.h,
                width: dims.w,
                maxWidth: dims.maxWidth || dims.w,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                breakInside: 'avoid',
                bgcolor: '#FFFFFF',
                color: '#000000',
                mx: 'auto',
                boxSizing: 'border-box',
                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                position: 'relative',
                '@media print': {
                    border: '1px solid #94A3B8',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                    boxShadow: 'none',
                    width: '100% !important',
                    maxWidth: `${dims.maxWidth || dims.w} !important`,
                    height: `${dims.h} !important`,
                    bgcolor: '#FFFFFF !important',
                    color: '#000000 !important'
                }
            }}
        >
            {/* Top Brand & Header Section */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {showBusiness && (
                    <Typography
                        sx={{
                            fontSize: `${(isSmall ? 7 : isLarge ? 10.5 : 9) * fontScale}px`,
                            fontWeight: 900,
                            lineHeight: 1.1,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: '#000000',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            pb: 0.2
                        }}
                    >
                        {businessName || 'ALEEN CLOTHING'}
                    </Typography>
                )}

                {/* Garment Title */}
                {showName && (
                    <Typography
                        sx={{
                            fontSize: `${(isSmall ? 7.5 : isLarge ? 11.5 : 9.5) * fontScale}px`,
                            fontWeight: 800,
                            lineHeight: 1.15,
                            width: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            color: '#0F172A',
                            letterSpacing: '0.01em'
                        }}
                    >
                        {product?.name || 'Garment Item'}
                    </Typography>
                )}

                {/* Variant & Spec Capsule */}
                {showSizeColor && specText && (
                    <Box
                        sx={{
                            display: 'inline-block',
                            mt: 0.2,
                            px: 0.6,
                            py: 0.1,
                            bgcolor: '#F1F5F9',
                            borderRadius: '3px',
                            maxWidth: '96%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            lineHeight: 1
                        }}
                    >
                        <Typography
                            component="span"
                            sx={{
                                fontSize: `${(isSmall ? 6.5 : 7.5) * fontScale}px`,
                                fontWeight: 700,
                                color: '#475569',
                                lineHeight: 1,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em'
                            }}
                        >
                            {specText}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Barcode SVG */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 0.15 }}>
                <svg ref={barcodeRef} style={{ maxWidth: '98%', height: `${dims.barH}px`, display: 'block' }}></svg>
            </Box>

            {/* Bottom SKU & Pricing Section */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {showSku && (
                    <Typography
                        sx={{
                            fontSize: `${(isSmall ? 7 : isLarge ? 9.5 : 8.5) * fontScale}px`,
                            fontWeight: 800,
                            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                            letterSpacing: '0.14em',
                            lineHeight: 1,
                            color: '#1E293B',
                            textTransform: 'uppercase',
                            mb: 0.3
                        }}
                    >
                        {formatSkuWithHyphen(value)}
                    </Typography>
                )}

                {/* Price & MRP Row */}
                {showPrice && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, width: '100%', flexWrap: 'nowrap' }}>
                        {showMrp && mrpPrice > 0 && (
                            <Typography
                                sx={{
                                    fontSize: `${(isSmall ? 6.5 : 8) * fontScale}px`,
                                    color: '#64748B',
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
                                whiteSpace: 'nowrap',
                                letterSpacing: '-0.02em'
                            }}
                        >
                            {currency}{sellingPrice.toLocaleString('en-IN')}
                        </Typography>
                        {settings.showDiscountBadge && mrpPrice > sellingPrice && (
                            <Typography
                                sx={{
                                    fontSize: `${(isSmall ? 6 : 7.5) * fontScale}px`,
                                    fontWeight: 900,
                                    bgcolor: '#0F172A',
                                    color: '#FFFFFF',
                                    px: 0.45,
                                    py: 0.1,
                                    borderRadius: '3px',
                                    lineHeight: 1,
                                    whiteSpace: 'nowrap',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                {Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)}% OFF
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
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
        showDiscountBadge: false, // Print discount % badge on sticker tag
        barcodeHeight: 30,
        fontSize: 'normal',
        mrpMode: 'custom', // 'custom' | 'markup_20' | 'markup_25' | 'markup_30' | 'markup_40' | 'markup_50'
        mrpMultiplier: 1.25,
        currencySymbol: '₹',
        mrpPrefix: 'MRP'
    });

    const [previewIndex, setPreviewIndex] = useState(0);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [bulkDiscountAnchor, setBulkDiscountAnchor] = useState(null);
    const [printSingleTarget, setPrintSingleTarget] = useState(null);

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
            if (typeof num === 'number') {
                if (p.customDiscount !== undefined && p.customDiscount > 0) {
                    updated.customMrp = Math.round(num / (1 - (p.customDiscount / 100)));
                } else if (settings.mrpMode !== 'custom') {
                    updated.customMrp = Math.round(num * settings.mrpMultiplier);
                }
            }
            return updated;
        }));
    };

    // Update custom MRP for a queued garment
    const handleUpdateMrp = (productId, val) => {
        const num = val === '' ? '' : Math.max(0, Number(val) || 0);
        setSelectedProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            const selling = Number(p.customPrice !== undefined ? p.customPrice : p.price) || 0;
            const disc = (typeof num === 'number' && num > selling && num > 0)
                ? Math.round(((num - selling) / num) * 100)
                : 0;
            return { ...p, customMrp: num, customDiscount: disc };
        }));
    };

    // Update custom discount % for a queued garment
    const handleUpdateDiscount = (productId, discountVal) => {
        const pct = discountVal === '' ? '' : Math.min(99, Math.max(0, Number(discountVal) || 0));
        setSelectedProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            const selling = Number(p.customPrice !== undefined ? p.customPrice : p.price) || 0;
            let newMrp = selling;
            if (pct !== '' && pct > 0) {
                newMrp = Math.round(selling / (1 - (pct / 100)));
            }
            return {
                ...p,
                customDiscount: pct,
                customMrp: newMrp
            };
        }));
    };

    // Bulk apply discount % to all queued garments
    const handleApplyBulkDiscount = (pct) => {
        const discountVal = Math.min(99, Math.max(0, Number(pct) || 0));
        setSelectedProducts(prev => prev.map(p => {
            const selling = Number(p.customPrice !== undefined ? p.customPrice : p.price) || 0;
            const newMrp = discountVal > 0 ? Math.round(selling / (1 - (discountVal / 100))) : selling;
            return {
                ...p,
                customDiscount: discountVal,
                customMrp: newMrp
            };
        }));
        setBulkDiscountAnchor(null);
        showToast(discountVal > 0 ? `Applied ${discountVal}% discount to all queued garments` : 'Reset discounts for all queued garments', 'success');
    };

    // Print single sticker directly from preview dialog
    const handlePrintSingle = (product) => {
        if (!product) return;
        setPrintSingleTarget(product);
        setTimeout(() => {
            window.print();
            setPrintSingleTarget(null);
        }, 200);
    };

    // Bulk apply MRP markup multiplier to all queued items
    const handleApplyBulkMrpMarkup = (multiplier) => {
        setSelectedProducts(prev => prev.map(p => {
            const selling = Number(p.customPrice !== undefined ? p.customPrice : p.price) || 0;
            const newMrp = Math.round(selling * multiplier);
            const disc = newMrp > selling && newMrp > 0 ? Math.round(((newMrp - selling) / newMrp) * 100) : 0;
            return {
                ...p,
                customMrp: newMrp,
                customDiscount: disc
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
        setSelectedProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            if (count === '') return { ...p, labelCount: '' };
            const parsed = parseInt(count, 10);
            return { ...p, labelCount: isNaN(parsed) ? '' : Math.max(0, parsed) };
        }));
    };

    const handleCountBlur = (productId) => {
        setSelectedProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            const parsed = parseInt(p.labelCount, 10);
            return { ...p, labelCount: (!parsed || parsed < 1) ? 1 : parsed };
        }));
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
    const totalLabelsCount = selectedProducts.reduce((sum, p) => sum + (parseInt(p.labelCount) || 1), 0);

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
                            startIcon={<Add sx={{ fontSize: 19, color: 'primary.main' }} />}
                            onClick={() => setIsBulkSelectOpen(true)}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.75,
                                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                borderColor: 'primary.main',
                                color: 'primary.main',
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
                                    borderColor: 'primary.dark',
                                    bgcolor: (t) => `${t.palette.primary.main}0A`,
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Bulk Inventory Picker
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Print sx={{ fontSize: 19, color: '#FFFFFF !important' }} />}
                            onClick={handlePrint}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 3.25,
                                borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textTransform: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                color: '#FFFFFF !important',
                                opacity: selectedProducts.length > 0 ? 1 : 0.9,
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                '& .MuiSvgIcon-root': {
                                    color: '#FFFFFF !important'
                                },
                                '&:hover': {
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
                        <Tune sx={{ color: (t) => t.palette.primary.main, fontSize: 20 }} />
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
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={settings.showDiscountBadge}
                                            onChange={(e) => setSettings({ ...settings, showDiscountBadge: e.target.checked })}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Discount Tag Badge (e.g. 20% OFF)</Typography>}
                                />
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Row 3: Barcode Pricing Configuration (Custom MRP & Selling Price) */}
                            <Box sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <PriceChange sx={{ color: (t) => t.palette.primary.main, fontSize: 18 }} />
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
                                            <Typography variant="caption" sx={{ color: (t) => t.palette.primary.main, fontWeight: 700, mr: 0.5 }}>
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
                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)', color: (t) => t.palette.primary.main }}
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
                                background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
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
                    getOptionLabel={(option) => `${option.name} (${formatSkuWithHyphen(option.productId) || 'No ID'})`}
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
                                    bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                                    color: (t) => t.palette.primary.main,
                                    border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.25)'
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
                                        '&.Mui-checked': { color: (t) => t.palette.primary.main },
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
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: (t) => t.palette.primary.main, fontWeight: 700, textTransform: 'uppercase' }}>
                                            #{formatSkuWithHyphen(option.productId || 'NO-SKU')}
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

                {/* Garments Catalog Table: 10 entries on 1 page (Picture 1 Redesign) */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1.5,
                        px: 0.5,
                        flexWrap: 'wrap',
                        gap: 1
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Box sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                                color: (t) => t.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)'
                            }}>
                                <Inventory2 sx={{ fontSize: 19 }} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem', letterSpacing: 0.2 }}>
                                    Browse Catalog Garments
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                                    Select garments to queue for barcode sticker printing
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                label="10 items per page"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
                                    color: (t) => t.palette.primary.main,
                                    fontWeight: 700,
                                    fontSize: '0.68rem',
                                    borderRadius: 1.5
                                }}
                            />
                            <Typography variant="caption" sx={{ color: (t) => t.palette.primary.main, fontWeight: 800, fontSize: '0.76rem' }}>
                                Page {inventoryPage + 1} of {Math.max(1, Math.ceil(filteredAndSortedInventory.length / inventoryRowsPerPage))} • {filteredAndSortedInventory.length} items
                            </Typography>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{
                        borderRadius: 3,
                        border: '1px solid rgba(15, 118, 110, 0.16)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                        overflow: 'hidden'
                    }}>
                        <Table size="small">
                            <TableHead sx={{
                                background: 'linear-gradient(180deg, #F0FDF4 0%, #E6F4F1 100%)',
                                borderBottom: '2px solid rgba(var(--primary-rgb, 15, 118, 110), 0.15)'
                            }}>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ py: 1.2 }}>
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
                                            sx={{ color: (t) => t.palette.primary.main, '&.Mui-checked': { color: (t) => t.palette.primary.main } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', color: (t) => t.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.2 }}>Garment Style</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', color: (t) => t.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.2 }}>SKU / Product ID</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', color: (t) => t.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.2 }}>Category</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.74rem', color: (t) => t.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.2 }}>Price</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.74rem', color: (t) => t.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.2 }}>Stock</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.74rem', color: (t) => t.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1.2 }}>Queue Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedInventory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                                            <Inventory2 sx={{ fontSize: 36, color: '#CBD5E1', mb: 1, display: 'block', mx: 'auto' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>No matching garments found</Typography>
                                            <Typography variant="caption">Try adjusting search filters or selecting a different category</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedInventory.map((item, index) => {
                                        const queued = selectedProducts.find(p => p.id === item.id);
                                        const isSelected = Boolean(queued);
                                        const catStyle = getCategoryStyle(item.category);
                                        const formattedSku = formatSkuWithHyphen(item.productId || 'NO-SKU');
                                        const qty = item.quantity || 0;

                                        return (
                                            <TableRow
                                                key={item.id}
                                                hover
                                                sx={{
                                                    bgcolor: isSelected ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.05)' : index % 2 === 1 ? 'rgba(248, 250, 252, 0.7)' : '#FFFFFF',
                                                    borderLeft: isSelected ? '4px solid #0F766E' : '4px solid transparent',
                                                    transition: 'all 0.18s ease',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(15, 118, 110, 0.06) !important',
                                                        boxShadow: 'inset 0 0 0 1px rgba(var(--primary-rgb, 15, 118, 110), 0.1)'
                                                    }
                                                }}
                                                onClick={() => handleToggleProduct(item)}
                                            >
                                                <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleProduct(item)}
                                                        sx={{ color: (t) => t.palette.primary.main, '&.Mui-checked': { color: (t) => t.palette.primary.main } }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ py: 1.4 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                        <Box sx={{
                                                            width: 30,
                                                            height: 30,
                                                            borderRadius: 1.5,
                                                            bgcolor: isSelected ? '#0F766E' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
                                                            color: isSelected ? '#FFFFFF' : '#0F766E',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.74rem',
                                                            fontWeight: 800,
                                                            flexShrink: 0,
                                                            border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.15)'
                                                        }}>
                                                            {item.name ? item.name.charAt(0).toUpperCase() : 'G'}
                                                        </Box>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A', lineHeight: 1.3 }}>
                                                                {item.name}
                                                            </Typography>
                                                            {item.variantName && (
                                                                <Chip
                                                                    label={item.variantName}
                                                                    size="small"
                                                                    sx={{ mt: 0.3, height: 18, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(0,0,0,0.04)' }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.4 }}>
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        px: 1,
                                                        py: 0.35,
                                                        borderRadius: 1.5,
                                                        bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
                                                        border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)',
                                                        fontFamily: '"JetBrains Mono", monospace',
                                                        fontWeight: 800,
                                                        fontSize: '0.76rem',
                                                        color: (t) => t.palette.primary.main,
                                                        letterSpacing: '0.04em'
                                                    }}>
                                                        {formattedSku}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.4 }}>
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.6,
                                                        px: 1,
                                                        py: 0.3,
                                                        borderRadius: 1.5,
                                                        bgcolor: catStyle.bg,
                                                        border: `1px solid ${catStyle.border}`,
                                                        color: catStyle.color,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700
                                                    }}>
                                                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: catStyle.color }} />
                                                        {item.category || 'General'}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1.4 }}>
                                                    <Typography sx={{
                                                        fontWeight: 800,
                                                        color: '#B45309',
                                                        fontSize: '0.85rem',
                                                        fontFamily: '"Plus Jakarta Sans", sans-serif'
                                                    }}>
                                                        ₹{(item.price || 0).toLocaleString('en-IN')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1.4 }}>
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 0.6,
                                                        px: 0.9,
                                                        py: 0.25,
                                                        borderRadius: 1.5,
                                                        bgcolor: qty > 5 ? 'rgba(16, 185, 129, 0.1)' : qty > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: qty > 5 ? '#065F46' : qty > 0 ? '#92400E' : '#991B1B',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700
                                                    }}>
                                                        <Box sx={{
                                                            width: 5,
                                                            height: 5,
                                                            borderRadius: '50%',
                                                            bgcolor: qty > 5 ? '#10B981' : qty > 0 ? '#F59E0B' : '#EF4444'
                                                        }} />
                                                        {qty > 0 ? `${qty} pcs` : 'Out of stock'}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 1.4 }} onClick={e => e.stopPropagation()}>
                                                    {isSelected ? (
                                                        <Chip
                                                            icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#FFFFFF !important' }} />}
                                                            label={`In Queue (${queued.labelCount || 1}x)`}
                                                            size="small"
                                                            color="primary"
                                                            onDelete={() => handleRemove(item.id)}
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                bgcolor: (t) => t.palette.primary.main,
                                                                '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#FFFFFF' } }
                                                            }}
                                                        />
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<Add sx={{ fontSize: 14 }} />}
                                                            onClick={() => handleToggleProduct(item)}
                                                            sx={{
                                                                py: 0.35,
                                                                px: 1.4,
                                                                fontSize: '0.7rem',
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                borderColor: 'rgba(15, 118, 110, 0.4)',
                                                                color: (t) => t.palette.primary.main,
                                                                textTransform: 'none',
                                                                transition: 'all 0.15s ease',
                                                                '&:hover': {
                                                                    bordercolor: (t) => t.palette.primary.main,
                                                                    bgcolor: (t) => t.palette.primary.main,
                                                                    color: '#FFFFFF'
                                                                }
                                                            }}
                                                        >
                                                            Queue
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
                                borderTop: '1px solid rgba(0,0,0,0.06)',
                                bgcolor: '#FAFAFA',
                                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'text.secondary'
                                }
                            }}
                        />
                    </TableContainer>
                </Box>

                {/* Queue Summary Badge & Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            Active Print Queue ({selectedProducts.length} garments • {totalLabelsCount} stickers)
                        </Typography>
                        {selectedProducts.length > 0 && (
                            <Chip
                                label="Preview Ready"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                            />
                        )}
                        {selectedProducts.length > 10 && (
                            <Typography variant="caption" sx={{ color: (t) => t.palette.primary.main, fontWeight: 700 }}>
                                • Page {queuePage + 1} of {Math.max(1, Math.ceil(selectedProducts.length / queueRowsPerPage))}
                            </Typography>
                        )}
                    </Box>

                    {selectedProducts.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility sx={{ fontSize: 16 }} />}
                                onClick={() => setPreviewModalOpen(true)}
                                sx={{
                                    borderRadius: 2,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    color: (t) => t.palette.primary.main,
                                    bordercolor: (t) => t.palette.primary.main,
                                    bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)',
                                    '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)', borderColor: (t) => t.palette.primary.dark }
                                }}
                            >
                                Preview Stickers
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Percent sx={{ fontSize: 16 }} />}
                                onClick={(e) => setBulkDiscountAnchor(e.currentTarget)}
                                sx={{
                                    borderRadius: 2,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    color: '#B45309',
                                    borderColor: '#D97706',
                                    bgcolor: 'rgba(217, 119, 6, 0.04)',
                                    '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.1)', borderColor: '#B45309' }
                                }}
                            >
                                Set Discount for All
                            </Button>
                            <Menu
                                anchorEl={bulkDiscountAnchor}
                                open={Boolean(bulkDiscountAnchor)}
                                onClose={() => setBulkDiscountAnchor(null)}
                                PaperProps={{ sx: { borderRadius: 2.5, minWidth: 220, p: 0.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
                            >
                                <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                                    Set Custom Tag Discount
                                </Typography>
                                {[10, 15, 20, 25, 30, 40, 50].map((disc) => (
                                    <MenuItem
                                        key={disc}
                                        onClick={() => handleApplyBulkDiscount(disc)}
                                        sx={{ fontSize: '0.82rem', fontWeight: 600, py: 0.75 }}
                                    >
                                        Apply {disc}% Discount on All Tags
                                    </MenuItem>
                                ))}
                                <Divider sx={{ my: 0.5 }} />
                                <MenuItem onClick={() => handleApplyBulkDiscount(0)} sx={{ fontSize: '0.82rem', color: 'text.secondary', py: 0.75 }}>
                                    Reset (0% Discount / MRP = Sale)
                                </MenuItem>
                            </Menu>
                        </Box>
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
                            const currentDiscount = (Number(mrp) > Number(selling) && Number(mrp) > 0)
                                ? Math.round(((Number(mrp) - Number(selling)) / Number(mrp)) * 100)
                                : 0;
                            const savings = Number(mrp) > Number(selling) ? Number(mrp) - Number(selling) : 0;

                            return (
                                <Grid item xs={12} sm={6} md={4} key={product.id}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2.5,
                                            borderColor: isCurrentPreview ? '#0F766E' : 'divider',
                                            borderWidth: isCurrentPreview ? 1.5 : 1,
                                            transition: 'all 0.15s ease-in-out',
                                            bgcolor: isCurrentPreview ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.02)' : 'background.paper',
                                            '&:hover': {
                                                bordercolor: (t) => t.palette.primary.main,
                                                boxShadow: '0 4px 14px rgba(var(--primary-rgb, 15, 118, 110), 0.1)'
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
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: (t) => t.palette.primary.main, fontWeight: 700, textTransform: 'uppercase' }}>
                                                            #{formatSkuWithHyphen(product.productId)}
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
                                                    <Tooltip title="Preview this sticker (Click to view full preview)">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setPreviewIndex(globalIdx);
                                                                setPreviewModalOpen(true);
                                                            }}
                                                            sx={{
                                                                color: (t) => t.palette.primary.main,
                                                                bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
                                                                '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.2)' }
                                                            }}
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

                                            {/* Price, Discount & Copies Form Inputs */}
                                            <Grid container spacing={1} alignItems="center">
                                                {/* Custom Sales Price */}
                                                <Grid item xs={6}>
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
                                                <Grid item xs={6}>
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

                                                {/* Custom Discount % */}
                                                <Grid item xs={6}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        label="Discount %"
                                                        value={currentDiscount > 0 ? currentDiscount : (product.customDiscount !== undefined ? product.customDiscount : '')}
                                                        onChange={(e) => handleUpdateDiscount(product.id, e.target.value)}
                                                        inputProps={{ min: 0, max: 99 }}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end" sx={{ '& p': { fontSize: '0.72rem', fontWeight: 700 } }}>%</InputAdornment>
                                                        }}
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
                                                <Grid item xs={6}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            label="Copies"
                                                            value={product.labelCount !== undefined ? product.labelCount : 1}
                                                            onChange={(e) => handleUpdateCount(product.id, e.target.value)}
                                                            onBlur={() => handleCountBlur(product.id)}
                                                            inputProps={{ min: 1, max: 9999 }}
                                                            InputProps={{
                                                                endAdornment: <InputAdornment position="end" sx={{ '& p': { fontSize: '0.7rem' } }}>pcs</InputAdornment>
                                                            }}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: 1.5,
                                                                    fontWeight: 700,
                                                                    fontSize: '0.82rem'
                                                                }
                                                            }}
                                                        />
                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                            <Chip
                                                                label="-1"
                                                                size="small"
                                                                clickable
                                                                onClick={() => handleUpdateCount(product.id, Math.max(1, (parseInt(product.labelCount, 10) || 1) - 1))}
                                                                sx={{ height: 16, fontSize: '0.58rem', px: 0.2 }}
                                                            />
                                                            <Chip
                                                                label="+1"
                                                                size="small"
                                                                clickable
                                                                onClick={() => handleUpdateCount(product.id, (parseInt(product.labelCount, 10) || 1) + 1)}
                                                                sx={{ height: 16, fontSize: '0.58rem', px: 0.2 }}
                                                            />
                                                            <Chip
                                                                label="24 (Sheet)"
                                                                size="small"
                                                                clickable
                                                                onClick={() => handleUpdateCount(product.id, 24)}
                                                                sx={{ height: 16, fontSize: '0.58rem', px: 0.2, fontWeight: 700, bgcolor: 'rgba(15, 118, 110, 0.08)', color: '#0F766E' }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </Grid>

                                            {/* Quick Discount Presets Chips */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                                <Typography variant="caption" sx={{ fontSize: '0.64rem', fontWeight: 700, color: 'text.secondary', mr: 0.25 }}>
                                                    Quick Disc:
                                                </Typography>
                                                {[0, 10, 15, 20, 25, 30, 40, 50].map((d) => (
                                                    <Chip
                                                        key={d}
                                                        label={d === 0 ? '0%' : `${d}%`}
                                                        size="small"
                                                        clickable
                                                        onClick={() => handleUpdateDiscount(product.id, d)}
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.62rem',
                                                            fontWeight: currentDiscount === d ? 800 : 600,
                                                            bgcolor: currentDiscount === d ? '#0F766E' : 'rgba(0,0,0,0.04)',
                                                            color: currentDiscount === d ? '#FFFFFF' : 'text.primary',
                                                            '&:hover': {
                                                                bgcolor: currentDiscount === d ? '#115E59' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)'
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </Box>

                                            {/* Price Comparison Sub-text */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                                                    {Number(mrp) > Number(selling) && Number(mrp) > 0 ? (
                                                        <span style={{ color: '#059669', fontWeight: 800 }}>
                                                            ✓ {currentDiscount}% Discount (Save ₹{savings.toLocaleString('en-IN')})
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
                PaperProps={{ 
                    sx: { 
                        borderRadius: isTablet ? 0 : 3.5,
                        overflow: 'hidden',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.22)'
                    } 
                }}
            >
                {/* Luxury Atelier Header Banner */}
                <Box
                    sx={{
                        p: { xs: 2, sm: 2.5 },
                        background: (t) => t.custom?.designSystem?.topBar?.background || 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 2.5,
                                bgcolor: 'rgba(255, 255, 255, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <Layers sx={{ color: '#FFFFFF', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: { xs: '1rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
                                Bulk Select Products for Barcode Batch
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.78rem' }}>
                                Queue catalog garments for batch sticker printing with custom pricing and layout
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton 
                        onClick={() => setIsBulkSelectOpen(false)} 
                        size="small"
                        sx={{ 
                            color: 'rgba(255,255,255,0.8)', 
                            '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.15)' } 
                        }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: (t) => t.palette.background.default }}>
                    {/* Search & Category Filter Bar */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
                        <TextField
                            size="small"
                            placeholder="Search by garment name, SKU or fabric..."
                            value={dialogSearch}
                            onChange={(e) => setDialogSearch(e.target.value)}
                            InputProps={{ 
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 19 }} />,
                                ...(dialogSearch ? {
                                    endAdornment: (
                                        <IconButton size="small" onClick={() => setDialogSearch('')}>
                                            <Close sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    )
                                } : {})
                            }}
                            sx={{ 
                                flexGrow: 1, 
                                '& .MuiOutlinedInput-root': { 
                                    borderRadius: 2.5,
                                    bgcolor: (t) => t.palette.background.paper 
                                } 
                            }}
                        />
                        <TextField
                            select
                            size="small"
                            label="Category"
                            value={dialogCategory}
                            onChange={(e) => setDialogCategory(e.target.value)}
                            sx={{ 
                                minWidth: { xs: '100%', sm: 190 }, 
                                '& .MuiOutlinedInput-root': { 
                                    borderRadius: 2.5,
                                    bgcolor: (t) => t.palette.background.paper 
                                } 
                            }}
                        >
                            <MenuItem value="">All Categories ({categories.length})</MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    {/* Quick Selection Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            Showing {dialogFilteredInventory.length} products
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                onClick={() => toggleSelectAll(dialogFilteredInventory)}
                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', py: 0.3 }}
                            >
                                {tempSelectedIds.length === dialogFilteredInventory.length && dialogFilteredInventory.length > 0 
                                    ? 'Deselect All' 
                                    : `Select All (${dialogFilteredInventory.length})`}
                            </Button>
                            {tempSelectedIds.length > 0 && (
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={() => setTempSelectedIds([])}
                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', py: 0.3 }}
                                >
                                    Clear ({tempSelectedIds.length})
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Table Container with Ample Height to Prevent 10th Row Cutoff (Pic 5) */}
                    <TableContainer 
                        sx={{ 
                            minHeight: 380,
                            maxHeight: { xs: 380, sm: 490, md: 530 }, 
                            overflowX: 'auto', 
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: (t) => t.palette.background.paper,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                            '&::-webkit-scrollbar': { width: '6px', height: '6px' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.18)', borderRadius: '3px' }
                        }}
                    >
                        <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
                            <TableHead>
                                <TableRow sx={{ '& th': { bgcolor: (t) => t.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC', py: 1.2 } }}>
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
                                            sx={{ fontWeight: 800, fontSize: '0.82rem' }}
                                        >
                                            Garment Name
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={dialogOrderBy === 'productId'}
                                            direction={dialogOrderBy === 'productId' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('productId')}
                                            sx={{ fontWeight: 800, fontSize: '0.82rem' }}
                                        >
                                            Product ID / SKU
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.82rem' }}>Category</TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={dialogOrderBy === 'price'}
                                            direction={dialogOrderBy === 'price' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('price')}
                                            sx={{ fontWeight: 800, fontSize: '0.82rem' }}
                                        >
                                            Price (₹)
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={dialogOrderBy === 'quantity'}
                                            direction={dialogOrderBy === 'quantity' ? dialogOrder : 'asc'}
                                            onClick={() => handleDialogSort('quantity')}
                                            sx={{ fontWeight: 800, fontSize: '0.82rem' }}
                                        >
                                            Stock
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedDialogInventory.map((item) => {
                                    const isSelected = tempSelectedIds.includes(item.id);
                                    const catStyle = getCategoryStyle(item.category);
                                    const inStock = (item.quantity || 0) > 0;

                                    return (
                                        <TableRow
                                            key={item.id}
                                            hover
                                            selected={isSelected}
                                            onClick={() => {
                                                setTempSelectedIds(prev =>
                                                    prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                                );
                                            }}
                                            sx={{ 
                                                cursor: 'pointer',
                                                transition: 'background-color 0.15s ease',
                                                '&.Mui-selected': {
                                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                                    '&:hover': {
                                                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.14)'
                                                    }
                                                }
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={isSelected} />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.15 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.25 }}>
                                                    {item.name}
                                                </Typography>
                                                {item.variantName && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                        {item.variantName}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.15 }}>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                                                        fontWeight: 700,
                                                        fontSize: '0.78rem',
                                                        letterSpacing: '0.04em',
                                                        bgcolor: 'rgba(0,0,0,0.04)',
                                                        px: 0.8,
                                                        py: 0.2,
                                                        borderRadius: 1,
                                                        color: 'text.primary'
                                                    }}
                                                >
                                                    {formatSkuWithHyphen(item.productId)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.15 }}>
                                                <Chip 
                                                    label={item.category || 'General'} 
                                                    size="small" 
                                                    sx={{ 
                                                        height: 22,
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700,
                                                        bgcolor: catStyle.bg,
                                                        color: catStyle.color,
                                                        border: `1px solid ${catStyle.border}`
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.15, fontWeight: 800, fontSize: '0.88rem' }}>
                                                ₹{Number(item.price || 0).toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.15 }}>
                                                <Chip
                                                    label={inStock ? `${item.quantity || 0} in stock` : 'Out of stock'}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        bgcolor: inStock ? '#ECFDF5' : '#FEF2F2',
                                                        color: inStock ? '#047857' : '#DC2626',
                                                        border: `1px solid ${inStock ? '#A7F3D0' : '#FECACA'}`
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination Bar Cleanly Positioned Below Container */}
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
                            mt: 1.5,
                            '& .MuiTablePagination-toolbar': { minHeight: 46 }
                        }}
                    />
                </DialogContent>

                {/* Footer with Selection Count and Luxury Actions */}
                <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: (t) => t.palette.background.paper }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, ml: 0.5 }}>
                        <Chip
                            label={`${tempSelectedIds.length} garments selected`}
                            color={tempSelectedIds.length > 0 ? "primary" : "default"}
                            variant={tempSelectedIds.length > 0 ? "filled" : "outlined"}
                            size="medium"
                            sx={{ fontWeight: 800, fontSize: '0.82rem' }}
                        />
                    </Box>
                    <Button 
                        onClick={() => setIsBulkSelectOpen(false)} 
                        sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none', px: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleBulkSelectAdd}
                        disabled={tempSelectedIds.length === 0}
                        startIcon={<Add />}
                        sx={{
                            background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                            color: '#FFFFFF',
                            fontWeight: 800,
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                        }}
                    >
                        Add {tempSelectedIds.length} to Print Queue
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal: Live Sticker Preview Dialog */}
            <Dialog
                open={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3.5,
                        overflow: 'hidden',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.2)'
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                        color: '#FFFFFF',
                        py: 1.75,
                        px: 2.5
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Visibility sx={{ color: '#FCD34D', fontSize: 22 }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                                Price Sticker Live Preview
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>
                                {selectedProducts.length > 0 ? `Garment ${previewIndex + 1} of ${selectedProducts.length}` : 'Sample Preview'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setPreviewModalOpen(false)} size="small" sx={{ color: '#FFFFFF' }}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 2.5, bgcolor: '#F8FAFC' }}>
                    {/* Preset dimension bar & Zoom controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label={
                                settings.template === 'standard' ? 'Standard Tag (50 × 25 mm)' :
                                settings.template === 'small' ? 'Small Accessory (38 × 22 mm)' :
                                settings.template === 'compact' ? 'Compact Barcode (30 × 20 mm)' :
                                settings.template === 'large' ? 'Large Card (60 × 40 mm)' :
                                settings.template === 'thermal_single' ? 'Thermal Roll' : 'A4 Sheet Label'
                            }
                            size="small"
                            sx={{ bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)', color: (t) => t.palette.primary.main, fontWeight: 700, fontSize: '0.72rem' }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
                                Zoom:
                            </Typography>
                            {[1.0, 1.35, 1.6, 2.0].map((z) => (
                                <Chip
                                    key={z}
                                    label={`${z}x`}
                                    size="small"
                                    clickable
                                    onClick={() => setPreviewZoom(z)}
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        fontWeight: previewZoom === z ? 800 : 500,
                                        bgcolor: previewZoom === z ? '#0F766E' : 'background.paper',
                                        color: previewZoom === z ? '#FFFFFF' : 'text.primary',
                                        border: '1px solid',
                                        borderColor: previewZoom === z ? '#0F766E' : 'divider'
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Sticker Render Stage */}
                    <Box
                        sx={{
                            p: 3,
                            bgcolor: '#FFFFFF',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 180,
                            overflow: 'visible'
                        }}
                    >
                        <Box
                            sx={{
                                transform: `scale(${previewZoom})`,
                                transformOrigin: 'center center',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                borderRadius: 0.8,
                                transition: 'transform 0.15s ease-out'
                            }}
                        >
                            <BarcodeItem
                                value={sampleProduct.variantSku || sampleProduct.productId || 'PRD-1001'}
                                businessName={profile?.businessName || 'Aleen Clothing'}
                                product={sampleProduct}
                                settings={settings}
                            />
                        </Box>
                    </Box>

                    {/* Live Adjuster for Garment Pricing & Custom Discount */}
                    {selectedProducts.length > 0 && sampleProduct.id && (
                        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2.5, bgcolor: '#FFFFFF' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                            {sampleProduct.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: (t) => t.palette.primary.main, fontWeight: 700 }}>
                                            #{formatSkuWithHyphen(sampleProduct.productId)} {sampleProduct.category ? `• ${sampleProduct.category}` : ''}
                                        </Typography>
                                    </Box>
                                    {sampleProduct.labelCount && (
                                        <Chip
                                            label={`${sampleProduct.labelCount} stickers`}
                                            size="small"
                                            sx={{ bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)', color: (t) => t.palette.primary.main, fontWeight: 700 }}
                                        />
                                    )}
                                </Box>

                                {/* Quick Discount Presets inside preview */}
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                        Custom Discount for this Tag:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                        {[0, 10, 15, 20, 25, 30, 40, 50].map((d) => {
                                            const s = sampleProduct.customPrice !== undefined ? sampleProduct.customPrice : (sampleProduct.price || 0);
                                            const m = sampleProduct.customMrp !== undefined ? sampleProduct.customMrp : Math.round(s * (settings.mrpMultiplier || 1.25));
                                            const curD = m > s && m > 0 ? Math.round(((m - s) / m) * 100) : 0;
                                            const isSel = curD === d;
                                            return (
                                                <Chip
                                                    key={d}
                                                    label={d === 0 ? 'No Disc' : `${d}% OFF`}
                                                    size="small"
                                                    clickable
                                                    onClick={() => handleUpdateDiscount(sampleProduct.id, d)}
                                                    sx={{
                                                        height: 24,
                                                        fontSize: '0.72rem',
                                                        fontWeight: isSel ? 800 : 600,
                                                        bgcolor: isSel ? '#0F766E' : 'rgba(0,0,0,0.05)',
                                                        color: isSel ? '#FFFFFF' : 'text.primary',
                                                        border: '1px solid',
                                                        borderColor: isSel ? '#0F766E' : 'divider'
                                                    }}
                                                />
                                            );
                                        })}
                                    </Box>
                                </Box>

                                {/* Numeric inputs in preview */}
                                <Grid container spacing={1.25} sx={{ mt: 0.5 }}>
                                    <Grid item xs={4}>
                                        <TextField
                                            size="small"
                                            type="number"
                                            label={`Sale (${settings.currencySymbol || '₹'})`}
                                            value={sampleProduct.customPrice !== undefined ? sampleProduct.customPrice : (sampleProduct.price || 0)}
                                            onChange={(e) => handleUpdatePrice(sampleProduct.id, e.target.value)}
                                            inputProps={{ min: 0 }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontWeight: 700 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <TextField
                                            size="small"
                                            type="number"
                                            label={`MRP (${settings.currencySymbol || '₹'})`}
                                            value={sampleProduct.customMrp !== undefined ? sampleProduct.customMrp : Math.round((sampleProduct.price || 0) * (settings.mrpMultiplier || 1.25))}
                                            onChange={(e) => handleUpdateMrp(sampleProduct.id, e.target.value)}
                                            inputProps={{ min: 0 }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontWeight: 700 } }}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <TextField
                                            size="small"
                                            type="number"
                                            label="Discount %"
                                            value={(() => {
                                                const s = sampleProduct.customPrice !== undefined ? sampleProduct.customPrice : (sampleProduct.price || 0);
                                                const m = sampleProduct.customMrp !== undefined ? sampleProduct.customMrp : Math.round(s * (settings.mrpMultiplier || 1.25));
                                                return m > s && m > 0 ? Math.round(((m - s) / m) * 100) : '';
                                            })()}
                                            onChange={(e) => handleUpdateDiscount(sampleProduct.id, e.target.value)}
                                            inputProps={{ min: 0, max: 99 }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontWeight: 700 } }}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {/* Carousel Stepper if multiple items in queue */}
                    {selectedProducts.length > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Button
                                size="small"
                                disabled={previewIndex === 0}
                                onClick={() => setPreviewIndex(p => Math.max(0, p - 1))}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                                ← Previous Sticker
                            </Button>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                {previewIndex + 1} of {selectedProducts.length}
                            </Typography>
                            <Button
                                size="small"
                                disabled={previewIndex >= selectedProducts.length - 1}
                                onClick={() => setPreviewIndex(p => Math.min(selectedProducts.length - 1, p + 1))}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                                Next Sticker →
                            </Button>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={() => handlePrintSingle(sampleProduct)}
                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', color: (t) => t.palette.primary.main, bordercolor: (t) => t.palette.primary.main }}
                    >
                        Print This Sticker
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => setPreviewModalOpen(false)}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            textTransform: 'none',
                            bgcolor: (t) => t.palette.primary.main,
                            '&:hover': { bgcolor: 'text.primary' }
                        }}
                    >
                        Done
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Print Output Grid (Hidden on Screen, Active on Print) */}
            <Box 
                className="print-only" 
                sx={{ 
                    display: 'none', 
                    '@media print': { 
                        display: 'block !important',
                        bgcolor: '#FFFFFF !important',
                        color: '#000000 !important'
                    } 
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns:
                            settings.template === 'thermal_single' ? '1fr' :
                            settings.template === 'compact' ? 'repeat(4, 1fr)' :
                            settings.template === 'small' ? 'repeat(4, 1fr)' :
                            settings.template === 'large' ? 'repeat(2, 1fr)' :
                            'repeat(3, 1fr)',
                        gap: settings.template === 'thermal_single' ? '4mm' : '3mm',
                        p: 0,
                        width: '100%',
                        maxWidth: '100%',
                        margin: '0 auto',
                        boxSizing: 'border-box',
                        justifyItems: 'center',
                        alignItems: 'start'
                    }}
                >
                    {(printSingleTarget ? [printSingleTarget] : selectedProducts).flatMap(product =>
                        Array.from({ length: parseInt(product.labelCount, 10) || 1 }).map((_, i) => (
                            <BarcodeItem
                                key={`${product.id}-${i}`}
                                value={formatSkuWithHyphen(product.variantSku || product.productId || product.id)}
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
                margin: ${settings.template === 'thermal_single' ? '0 !important' : '6mm !important'}; 
                size: ${settings.template === 'thermal_single' ? '58mm 40mm' : 'A4 portrait'};
            }
            *, *::before, *::after {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
            }
            html, body { 
                margin: 0 !important; 
                padding: 0 !important;
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                width: 100% !important;
                height: auto !important;
                min-height: 100% !important;
                overflow: visible !important;
            }
            /* Hide UI overlays, dialogs, and navigation to prevent black screen and page shifts */
            aside, header, nav, footer, .no-print, .app-sidebar, .app-topbar, 
            .MuiDrawer-root, .MuiBackdrop-root, .MuiDialog-root, .MuiModal-root, 
            .MuiPopover-root, .MuiSnackbar-root {
                display: none !important;
                visibility: hidden !important;
                width: 0 !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                opacity: 0 !important;
            }
            #root, #root > div, main, main > div {
                display: block !important;
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
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
                right: 0 !important;
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: ${settings.template === 'thermal_single' ? '1mm' : '2mm 0'} !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                z-index: 9999999 !important;
            }
          }
        `}
            </style>
        </Box>
    );
}
