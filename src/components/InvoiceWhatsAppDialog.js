import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  Avatar,
  Divider,
  Paper,
  Tooltip,
  useMediaQuery,
  useTheme,
  Alert,
  Snackbar,
  InputAdornment,
  Grid
} from '@mui/material';
import {
  Close,
  WhatsApp,
  ContentCopy,
  CheckCircle,
  Refresh,
  BookmarkAdded,
  Edit,
  Send,
  Phone,
  Person,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  Storefront,
  CurrencyRupee,
  DoneAll,
  PictureAsPdf
} from '@mui/icons-material';

export const INVOICE_WHATSAPP_TEMPLATES = [
  {
    id: 'atelier_luxury',
    name: 'Luxury Atelier Summary',
    badge: 'Recommended',
    icon: '✨',
    description: 'Detailed, elegant breakdown with care guarantee and boutique letterhead',
    template: `✨ *{businessName} | LUXURY ATELIER* ✨
📍 {address}
📞 {businessPhone}

Dear *{customer}*,
Thank you for gracing our boutique with your presence. Here is your official e-invoice:

🧾 *INVOICE #{invoiceId}*
📅 *Date:* {date}

🛍️ *PURCHASE SUMMARY:*
{itemList}

──────────────────
💵 *Subtotal:* ₹{subtotal}
{discountSection}🏛️ *GST ({gst}%):* ₹{tax}
💰 *GRAND TOTAL: ₹{total}*
💳 *Payment Mode:* {paymentMethod} ({paymentStatus})
──────────────────

💫 *Care & Service Guarantee:*
Every garment is curated with timeless elegance. We offer complimentary fitting adjustments within 7 days.

Warm Regards,
*{businessName}*`
  },
  {
    id: 'concise_receipt',
    name: 'Quick Compact Receipt',
    badge: 'Fast & Clean',
    icon: '🧾',
    description: 'Short & clean receipt for quick pickups and single items',
    template: `🧾 *E-RECEIPT: {businessName}*
Hi *{customer}*, thank you for shopping with us today!

• *Invoice #:* #{invoiceId}
• *Date:* {date}
• *Items ({itemCount} pcs):* {itemSummary}
• *Grand Total:* *₹{total}* (Paid via {paymentMethod})

📍 *Boutique:* {address}
📞 *Helpdesk:* {businessPhone}

Have a wonderful day! ✨`
  },
  {
    id: 'vip_privilege',
    name: 'VIP Festive & Couture',
    badge: 'VIP Club',
    icon: '🌟',
    description: 'Warm, elite appreciation note with VIP priority fitting privileges',
    template: `🌟 *EXCLUSIVE VIP CLIENT RECEIPT* 🌟
*{businessName} Haute Couture*

Salutations *{customer}*,
It is our distinct privilege curating timeless aesthetics for you.

💎 *Invoice Reference:* #{invoiceId}
📅 *Date:* {date}

🛍️ *Curated Ensembles:*
{itemList}

✨ *Investment:* *₹{total}* via {paymentMethod}

🎁 *VIP Privileges Included:*
• Priority fitting sessions & bespoke adjustments
• Exclusive first-look preview of upcoming festive arrivals
• Complimentary bridal & couture storage consultation

With heartfelt gratitude,
*{businessName}*`
  },
  {
    id: 'balance_due',
    name: 'Payment & Balance Ledger',
    badge: 'Accounts',
    icon: '📋',
    description: 'Clear statement with payment status for credit or split bills',
    template: `📋 *INVOICE & PAYMENT STATEMENT*
*{businessName}*

Dear *{customer}*,
Please find the billing details for your recent purchase:

• *Invoice Number:* #{invoiceId}
• *Date:* {date}
• *Total Bill Value:* *₹{total}*
• *Payment Mode:* {paymentMethod}
• *Settlement Status:* *{paymentStatus}*

🛍️ *Items Accounted:*
{itemList}

For payment inquiries or ledger receipts, please contact {businessPhone}.
Thank you for your ongoing partnership!

*{businessName}*`
  },
  {
    id: 'festive_wedding',
    name: 'Wedding & Trousseau Concierge',
    badge: 'Bridal',
    icon: '🌺',
    description: 'Celebratory note with bridal pressing & couture preservation styling',
    template: `🌺 *SHUBH VIVAH & FESTIVE CONCIERGE* 🌺
*{businessName}*

Heartiest congratulations and warm wishes to *{customer}*! ✨

Your bespoke festive trousseau order is recorded under:
📜 *Invoice #{invoiceId}*
📅 *Date:* {date}

👗 *Selected Ensembles:*
{itemList}

✨ *Grand Total:* *₹{total}*
💳 *Tender:* {paymentMethod}

🕊️ *Complimentary Concierge:*
We offer complimentary garment steaming, trial re-fitting, and bridal preservation styling.

Celebrating your memorable milestones,
*{businessName}*`
  }
];

export const generateInvoiceWhatsAppText = (templateText, invoice, profile) => {
  if (!invoice || !templateText) return '';

  const customerName = invoice.customer ? invoice.customer.trim() : 'Valued Patron';
  const invoiceId = invoice.id || 'N/A';
  const invoiceDate = invoice.date
    ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN');
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const formattedItemList = items.map((it, idx) => {
    const qty = it.quantity || 1;
    const price = Number(it.price || 0);
    const lineTotal = price * qty;
    return `  ${idx + 1}. *${it.name || 'Garment'}* (x${qty}) — ₹${lineTotal.toLocaleString('en-IN')}`;
  }).join('\n') || '  1. Garment (x1)';

  const itemSummary = items.map(it => it.name).filter(Boolean).join(', ') || 'Apparel';

  const subtotal = Number(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const total = Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tax = Number(invoice.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const gst = Number(invoice.gst || 0);
  const discountVal = Number(invoice.discount || 0);
  const discountSection = discountVal > 0
    ? `🏷️ *Discount Applied:* -₹${discountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
    : '';

  const paymentMethod = invoice.paymentMethod || 'Cash';
  const paymentStatus = (invoice.paymentStatus || 'paid').toUpperCase();
  const businessName = profile?.businessName || 'Aleen Clothing';
  const address = profile?.address || 'Pune, Maharashtra';
  const businessPhone = profile?.phone || '+91 98765 43210';

  return templateText
    .replace(/{customer}/g, customerName)
    .replace(/{invoiceId}/g, invoiceId)
    .replace(/{date}/g, invoiceDate)
    .replace(/{itemList}/g, formattedItemList)
    .replace(/{itemSummary}/g, itemSummary)
    .replace(/{itemCount}/g, String(items.length || 1))
    .replace(/{subtotal}/g, subtotal)
    .replace(/{discountSection}/g, discountSection)
    .replace(/{gst}/g, String(gst))
    .replace(/{tax}/g, tax)
    .replace(/{total}/g, total)
    .replace(/{paymentMethod}/g, paymentMethod)
    .replace(/{paymentStatus}/g, paymentStatus)
    .replace(/{businessName}/g, businessName)
    .replace(/{address}/g, address)
    .replace(/{businessPhone}/g, businessPhone);
};

// Render WhatsApp formatted text into safe styled HTML for preview
const renderWhatsAppFormattedText = (rawText) => {
  if (!rawText) return '';
  return rawText.split('\n').map((line, lineIdx) => {
    // Process formatting: *bold*, _italic_, ~strike~
    let formatted = line;
    const parts = [];
    let cur = '';
    let isBold = false;

    // Simple formatting handler for bold
    const boldTokens = line.split('*');
    return (
      <Box key={lineIdx} component="span" sx={{ display: 'block', minHeight: line ? 'auto' : '1em' }}>
        {boldTokens.map((segment, sIdx) => {
          if (sIdx % 2 === 1) {
            return (
              <Box key={sIdx} component="strong" sx={{ fontWeight: 800, color: 'inherit' }}>
                {segment}
              </Box>
            );
          }
          return segment;
        })}
      </Box>
    );
  });
};

const InvoiceWhatsAppDialog = ({ open, onClose, invoice, profile, onSharePDF }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get saved template id or default to 'atelier_luxury'
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    return localStorage.getItem('aleen_last_whatsapp_template') || 'atelier_luxury';
  });

  const activeTemplateObj = useMemo(() => {
    return INVOICE_WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || INVOICE_WHATSAPP_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Recipient phone state
  const [recipientPhone, setRecipientPhone] = useState('');
  // Editable text state
  const [messageText, setMessageText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Whenever invoice or template changes, populate the phone and message
  useEffect(() => {
    if (invoice) {
      const rawPhone = invoice.phone || '';
      setRecipientPhone(rawPhone);

      // Check if user has saved a customized raw template for this templateId
      const customSavedTemplate = localStorage.getItem(`aleen_custom_template_${selectedTemplateId}`);
      const rawTemplateToUse = customSavedTemplate || activeTemplateObj.template;
      const initialGenerated = generateInvoiceWhatsAppText(rawTemplateToUse, invoice, profile);
      setMessageText(initialGenerated);
    }
  }, [invoice, selectedTemplateId, activeTemplateObj, profile]);

  const handleSelectTemplate = (id) => {
    setSelectedTemplateId(id);
    localStorage.setItem('aleen_last_whatsapp_template', id);
    const targetObj = INVOICE_WHATSAPP_TEMPLATES.find(t => t.id === id) || INVOICE_WHATSAPP_TEMPLATES[0];
    const customSaved = localStorage.getItem(`aleen_custom_template_${id}`);
    const generated = generateInvoiceWhatsAppText(customSaved || targetObj.template, invoice, profile);
    setMessageText(generated);
  };

  const handleResetToDefault = () => {
    localStorage.removeItem(`aleen_custom_template_${selectedTemplateId}`);
    const generated = generateInvoiceWhatsAppText(activeTemplateObj.template, invoice, profile);
    setMessageText(generated);
    setSnackbar({ open: true, message: `Reset "${activeTemplateObj.name}" to factory default.`, severity: 'info' });
  };

  const handleSaveAsDefault = () => {
    localStorage.setItem(`aleen_custom_template_${selectedTemplateId}`, messageText);
    setSnackbar({ open: true, message: 'Template saved! Future invoices with this style will use your customizations.', severity: 'success' });
  };

  const handleInsertVariable = (textToInsert) => {
    setMessageText(prev => prev + ' ' + textToInsert);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setSnackbar({ open: true, message: 'Message copied to clipboard!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to copy message.', severity: 'error' });
    }
  };

  const handleSendWhatsApp = () => {
    if (!messageText) return;
    const cleanPhone = (recipientPhone || '').replace(/[^0-9]/g, '');
    let formattedPhone = cleanPhone;
    if (formattedPhone && !formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    const encodedText = encodeURIComponent(messageText);
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(url, '_blank');
    onClose();
  };

  const handleSendPDFWhatsApp = async () => {
    if (!invoice) return;
    try {
      if (onSharePDF) {
        await onSharePDF(invoice, recipientPhone, messageText);
        onClose();
      } else {
        handleSendWhatsApp();
      }
    } catch (err) {
      console.error('Error sharing PDF on WhatsApp:', err);
      setSnackbar({ open: true, message: 'Failed to share PDF. Opening text bill instead.', severity: 'error' });
      handleSendWhatsApp();
    }
  };

  if (!invoice) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3.5,
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0,0,0,0.25)'
        }
      }}
    >
      {/* Emerald & WhatsApp Themed Dialog Title */}
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #075E54 0%, #128C7E 50%, #042F2E 100%)',
        color: '#FFFFFF',
        p: { xs: 2, sm: 2.5 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#25D366', color: '#FFFFFF', width: 42, height: 42, boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)' }}>
            <WhatsApp />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.25rem' }, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                Dispatch Invoice via WhatsApp
              </Typography>
              <Chip
                label={`#${invoice.id}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  height: 22
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
              Select a luxury boutique template, edit text in real-time, and dispatch with 1-click
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.85)', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.12)' } }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
        {/* Recipient Phone & Client Header Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {invoice.customer || 'Walk-in Patron'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Total: ₹{Number(invoice.total || 0).toLocaleString('en-IN')} • {invoice.items?.length || 0} items • {invoice.paymentMethod}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: { sm: 320 } }}>
            <TextField
              size="small"
              fullWidth
              label="Recipient WhatsApp Number"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+91 98765 43210"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ fontSize: 18, color: '#25D366' }} />
                  </InputAdornment>
                )
              }}
              helperText="Auto-formatted with Indian international +91 prefix"
            />
          </Box>
        </Paper>

        {/* Template Selector Pills */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', mb: 1.2 }}>
            Choose Invoice Template
          </Typography>

          <Grid container spacing={1.5}>
            {INVOICE_WHATSAPP_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <Grid item xs={12} sm={6} md={2.4} key={tmpl.id}>
                  <Paper
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: isSelected ? '#0F766E' : 'divider',
                      bgcolor: isSelected ? 'rgba(15, 118, 110, 0.08)' : 'background.paper',
                      boxShadow: isSelected ? '0 4px 14px rgba(15, 118, 110, 0.15)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      '&:hover': {
                        borderColor: '#0F766E',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                        <Typography sx={{ fontSize: '1.25rem' }}>{tmpl.icon}</Typography>
                        <Chip
                          label={tmpl.badge}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            bgcolor: isSelected ? '#0F766E' : 'action.hover',
                            color: isSelected ? '#FFFFFF' : 'text.secondary'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: isSelected ? '#0F766E' : 'text.primary', mb: 0.4 }}>
                        {tmpl.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {tmpl.description}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Two-Column Editor & Live Chat Preview */}
        <Grid container spacing={2.5}>
          {/* Left Column: Live Editable Textarea & Formatting Tools */}
          <Grid item xs={12} md={7}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Edit sx={{ fontSize: 18, color: '#0F766E' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                    Customise & Edit Message
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Refresh />}
                    onClick={handleResetToDefault}
                    sx={{ textTransform: 'none', fontSize: '0.76rem', color: 'text.secondary', fontWeight: 600 }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<BookmarkAdded />}
                    onClick={handleSaveAsDefault}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      borderRadius: '16px',
                      color: '#0F766E',
                      borderColor: '#0F766E',
                      '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.08)', borderColor: '#042F2E' }
                    }}
                  >
                    Save as My Custom
                  </Button>
                </Box>
              </Box>

              {/* Fast Insert Quick Tags */}
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, alignSelf: 'center', mr: 0.5, color: 'text.secondary' }}>
                  Add:
                </Typography>
                <Chip
                  label="+ Customer Name"
                  size="small"
                  onClick={() => handleInsertVariable(invoice.customer || 'Valued Patron')}
                  sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                />
                <Chip
                  label="+ Total (₹)"
                  size="small"
                  onClick={() => handleInsertVariable(`₹${Number(invoice.total || 0).toLocaleString('en-IN')}`)}
                  sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                />
                <Chip
                  label="+ Invoice #"
                  size="small"
                  onClick={() => handleInsertVariable(`#${invoice.id}`)}
                  sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                />
                <Chip
                  label="+ Fitting Guarantee"
                  size="small"
                  onClick={() => handleInsertVariable('💫 Complimentary trial refitting included within 7 days.')}
                  sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                />
                <Chip
                  label="+ Boutique Phone"
                  size="small"
                  onClick={() => handleInsertVariable(profile?.phone || '+91 98765 43210')}
                  sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                />
              </Box>

              <TextField
                multiline
                rows={14}
                fullWidth
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your WhatsApp message..."
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.88rem',
                  flex: 1,
                  '& .MuiInputBase-root': {
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }
                }}
              />
            </Paper>
          </Grid>

          {/* Right Column: Live WhatsApp Bubble Preview */}
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                p: 0,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
              }}
            >
              {/* WhatsApp App Mock Header */}
              <Box sx={{
                bgcolor: '#075E54',
                color: '#FFFFFF',
                p: 1.8,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <Avatar sx={{ bgcolor: '#25D366', color: '#FFFFFF', width: 36, height: 36 }}>
                  <Storefront fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, noWrap: true }}>
                    {profile?.businessName || 'Aleen Clothing'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.7rem' }}>
                    Official Business Account • Online
                  </Typography>
                </Box>
                <Chip label="Live Preview" size="small" sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
              </Box>

              {/* Chat Bubble Canvas Background */}
              <Box sx={{
                flex: 1,
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? '#0B141A' : '#EFEAE2',
                overflowY: 'auto',
                maxHeight: 460,
                backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
                backgroundSize: '16px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start'
              }}>
                {/* Outgoing Message Bubble */}
                <Box
                  sx={{
                    maxWidth: '92%',
                    alignSelf: 'flex-end',
                    bgcolor: theme.palette.mode === 'dark' ? '#005C4B' : '#DCF8C6',
                    color: theme.palette.mode === 'dark' ? '#E9EDEF' : '#111827',
                    borderRadius: '12px 0px 12px 12px',
                    p: 1.8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    fontSize: '0.84rem',
                    lineHeight: 1.55
                  }}
                >
                  {renderWhatsAppFormattedText(messageText)}

                  {/* Message Timestamp & Checkmarks */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: theme.palette.mode === 'dark' ? 'rgba(233, 237, 239, 0.6)' : 'rgba(0, 0, 0, 0.45)' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <DoneAll sx={{ fontSize: 15, color: '#53BDEB' }} />
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions: Copy & Direct Send on WhatsApp */}
      <DialogActions sx={{
        p: { xs: 2, sm: 2.5 },
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5
      }}>
        <Button
          onClick={handleCopyText}
          variant="outlined"
          startIcon={<ContentCopy />}
          sx={{
            borderRadius: '24px',
            fontWeight: 700,
            color: 'text.secondary',
            borderColor: 'divider',
            px: 2.5,
            textTransform: 'none',
            '&:hover': {
              borderColor: 'text.primary',
              bgcolor: 'action.hover'
            }
          }}
        >
          Copy Message
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            onClick={onClose}
            sx={{ fontWeight: 600, color: 'text.secondary', px: 2 }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSendPDFWhatsApp}
            variant="outlined"
            size="large"
            startIcon={<PictureAsPdf sx={{ fontSize: 20, color: '#0F766E' }} />}
            sx={{
              px: 3,
              py: 1.1,
              borderRadius: '24px',
              fontWeight: 800,
              fontSize: '0.9rem',
              borderColor: '#0F766E',
              color: '#0F766E',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#0D6861',
                bgcolor: 'rgba(15, 118, 110, 0.08)'
              }
            }}
          >
            Send PDF Bill
          </Button>

          <Button
            onClick={handleSendWhatsApp}
            variant="contained"
            size="large"
            startIcon={<WhatsApp sx={{ fontSize: 22 }} />}
            sx={{
              px: 3.5,
              py: 1.1,
              borderRadius: '24px',
              fontWeight: 800,
              fontSize: '0.92rem',
              bgcolor: '#25D366 !important',
              color: '#FFFFFF !important',
              boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#1EBE5D !important',
                boxShadow: '0 6px 20px rgba(37, 211, 102, 0.55)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Send Text Bill
          </Button>
        </Box>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 700, borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default InvoiceWhatsAppDialog;
