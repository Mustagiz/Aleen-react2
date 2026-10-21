/**
 * Aleen Clothing - Native Pixel-Perfect Invoice Print Utility
 * Creates an isolated print context to guarantee proper page margins,
 * column alignments, and background rendering on all browsers and printers.
 */
export const printInvoiceElement = (element, isSlip = false) => {
  if (!element) {
    window.print();
    return;
  }

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

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice</title>
        <style>
          @page {
            size: ${isSlip ? '80mm auto' : 'A4 portrait'};
            margin: ${isSlip ? '3mm' : '8mm 10mm'};
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
          .printable-area, #printable-invoice {
            width: 100% !important;
            max-width: ${isSlip ? '80mm' : '100%'} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            visibility: visible !important;
            position: relative !important;
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

  // Allow styles, fonts, and images to settle, then open native print window
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn('Iframe print fallback triggered:', e);
      window.print();
    }
  }, 300);
};
