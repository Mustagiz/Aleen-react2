/**
 * Aleen Clothing - Native Pixel-Perfect Invoice Print Utility
 * Creates an isolated print context with all styles, fonts, and template colors intact,
 * guarantees correct page margins, column alignments, and background rendering, and
 * scales the document down when needed so a bill always lands on a single printed page.
 */

const MM = 96 / 25.4; // CSS pixels per millimetre (96dpi absolute units)
const A4 = { width: 210, height: 297 };
const MIN_FIT = 0.55; // never shrink the bill below ~8pt equivalent
const SETTLE_TIMEOUT = 1200;

// A4 @page margins below must stay in sync with the `pageMargin` written into the frame.
const A4_MARGIN = { top: 12, bottom: 12, left: 14, right: 14 };
const A4_BOX = {
  width: Math.round((A4.width - A4_MARGIN.left - A4_MARGIN.right) * MM),
  height: Math.round((A4.height - A4_MARGIN.top - A4_MARGIN.bottom) * MM)
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Resolve once the frame's webfonts and images are painted, or after a hard timeout. */
const waitForPaint = async (doc) => {
  const fonts = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
  const images = Promise.all(
    Array.from(doc.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          })
    )
  );
  await Promise.race([Promise.all([fonts, images]), wait(SETTLE_TIMEOUT)]);
};

/**
 * Chrome paginates on layout, so `zoom` (not transform) is the only reliable
 * way to force a tall bill back onto one page: it re-lays the text out at the
 * reduced scale instead of merely painting a squashed version of page one.
 */
const fitToSinglePage = (win, root, availablePx) => {
  const { body } = win.document;
  let factor = 1;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const height = root.getBoundingClientRect().height;
    if (height <= availablePx) break;
    factor = Math.max(MIN_FIT, (factor * (availablePx - 6)) / height);
    body.style.zoom = String(factor);
    if (factor <= MIN_FIT) break;
  }

  return factor;
};

export const printInvoiceElement = (element, format = false) => {
  if (!element) {
    window.print();
    return;
  }

  const is58mm = format === '58mm';
  const is80mm = format === '80mm' || format === true;
  const isThermal = is58mm || is80mm;
  const pageSize = is58mm ? '58mm auto' : (is80mm ? '80mm auto' : 'A4 portrait');
  const pageMargin = is58mm ? '2mm 2mm' : (is80mm ? '3mm 2mm' : '12mm 14mm 12mm 14mm');
  const maxContentWidth = is58mm ? '54mm' : (is80mm ? '76mm' : '100%');
  // Lay the frame out at the real printable width so responsive breakpoints,
  // table wrapping and the one-page measurement all match the paper.
  const frameWidth = is58mm ? Math.round(54 * MM) : (is80mm ? Math.round(76 * MM) : A4_BOX.width);

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
  iframe.style.width = `${frameWidth}px`;
  iframe.style.height = `${isThermal ? 1 : A4_BOX.height}px`;
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
            padding: ${isThermal ? '2mm 2mm' : '0'} !important;
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

  const runPrint = () => {
    try {
      // Keep the frame's own scroll height equal to the bill so the paginator
      // never sees a trailing empty band it would push onto page two.
      const root = doc.getElementById(element.id) || doc.body.firstElementChild;
      if (root) {
        iframe.style.height = `${Math.ceil(root.getBoundingClientRect().height) + 2}px`;
      }
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print', e);
      window.print();
    }
  };

  (async () => {
    await waitForPaint(doc);
    if (!isThermal) {
      const root = doc.getElementById(element.id) || doc.body.firstElementChild;
      if (root) fitToSinglePage(iframe.contentWindow, root, A4_BOX.height);
    }
    await wait(80);
    runPrint();
  })();
};
