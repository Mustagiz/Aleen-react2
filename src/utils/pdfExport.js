import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Converts an invoice DOM element into a pixel-perfect PDF document
 * matching the selected template and custom letterhead exactly.
 *
 * Ensures full desktop A4 proportions even when triggered from a mobile device (iPhone/Android).
 */
export const generatePdfFromElement = async (element, isSlip = false) => {
  if (!element) throw new Error('Invoice element not found');

  const targetWidth = isSlip ? 480 : 800;

  // 1. Create a hidden offscreen clone container at true desktop/print resolution
  // This guarantees that whether the customer is on an iPhone (375px) or desktop,
  // the captured canvas is ALWAYS rendered in true 800px A4 proportion without squishing!
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${targetWidth}px`;
  container.style.minWidth = `${targetWidth}px`;
  container.style.maxWidth = `${targetWidth}px`;
  container.style.background = '#ffffff';
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';

  const clone = element.cloneNode(true);
  clone.style.width = `${targetWidth}px`;
  clone.style.minWidth = `${targetWidth}px`;
  clone.style.maxWidth = `${targetWidth}px`;
  clone.style.boxSizing = 'border-box';
  clone.style.margin = '0';
  clone.style.transform = 'none';

  container.appendChild(clone);
  document.body.appendChild(container);

  let canvas;
  try {
    canvas = await html2canvas(clone, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: targetWidth,
      windowWidth: 1200
    });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  if (isSlip) {
    // 80mm POS Thermal Slip format
    const slipWidthMm = 80;
    const slipHeightMm = Math.max((canvas.height * slipWidthMm) / canvas.width, 100);
    const pdf = new jsPDF('p', 'mm', [slipWidthMm, slipHeightMm]);
    pdf.addImage(imgData, 'JPEG', 0, 0, slipWidthMm, (canvas.height * slipWidthMm) / canvas.width);
    return pdf;
  } else {
    // Standard A4 format (210mm x 297mm)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Professional clean margins (6mm left/right, 8mm top/bottom)
    const marginX = 6;
    const marginTop = 8;
    const printableWidth = pageWidth - (marginX * 2); // 198mm
    const printableHeight = pageHeight - (marginTop * 2); // 281mm

    const contentHeight = (canvas.height * printableWidth) / canvas.width;

    if (contentHeight <= printableHeight) {
      pdf.addImage(imgData, 'JPEG', marginX, marginTop, printableWidth, contentHeight);
    } else {
      // Scale to fit gracefully on standard A4 page while keeping aspect ratio
      const scaleFactor = printableHeight / contentHeight;
      const finalWidth = printableWidth * scaleFactor;
      const centeredX = (pageWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'JPEG', centeredX, marginTop, finalWidth, printableHeight);
    }
    return pdf;
  }
};
