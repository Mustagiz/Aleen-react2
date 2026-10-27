/**
 * Aleen Clothing - Native Pixel-Perfect Invoice Print Utility
 * Creates an isolated print context with all styles, fonts, and template colors intact,
 * guaranteeing correct page margins, column alignments, and background rendering.
 */
export const printInvoiceElement = (element, format = false) => {
  if (!element) {
    window.print();
    return;
  }

  const is58mm = format === '58mm';
  const is80mm = format === '80mm' || format === true;
  const isThermal = is58mm || is80mm;
  const pageSize = is58mm ? '58mm auto' : (is80mm ? '80mm auto' : 'A4 portrait');
  const pageMargin = is58mm ? '2mm 2mm' : (is80mm ? '3mm 2mm' : '14mm 16mm 14mm 16mm');
  const maxContentWidth = is58mm ? '54mm' : (is80mm ? '76mm' : '100%');

  // Remove any stale print frame from previous prints
  const existingFrame = document.getElementById('aleen-print-iframe');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'aleen-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  // 1. Harvest all CSS rules from active document stylesheets (including Emotion / MUI inserted rules)
  let allStyles = '';
  try {
    for (const sheet of document.styleSheets) {
      try {
        if (sheet.cssRules) {
          for (const rule of sheet.cssRules) {
            allStyles += rule.cssText + '\n';
          }
        }
      } catch (e) {
        // Handle cross-origin stylesheet
        if (sheet.href) {
          allStyles += `@import url("${sheet.href}");\n`;
        }
      }
    }
  } catch (e) {
    console.warn('Error harvesting document.styleSheets:', e);
  }

  // 2. Harvest all font links and style tags from document.head
  const headLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML)
    .join('\n');

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice</title>
        ${headLinks}
        <style>
          ${allStyles}

          @page {
            size: ${pageSize};
            margin: ${pageMargin};
          }
          * {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0F172A !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            -webkit-font-smoothing: antialiased;
          }
          .printable-area, #printable-invoice, #aleen-thermal-receipt {
            width: 100% !important;
            max-width: ${maxContentWidth} !important;
            margin: 0 auto !important;
            padding: ${isThermal ? '2mm 2mm' : '6mm 6mm 10mm 6mm'} !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            visibility: visible !important;
            position: relative !important;
            box-sizing: border-box !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }
          th, td {
            font-variant-numeric: tabular-nums !important;
            word-break: break-word !important;
          }
          tr, .no-break, .printable-area > div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Allow styles, fonts, and images to settle in the iframe, then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print', e);
      window.print();
    }
  }, 350);
};
