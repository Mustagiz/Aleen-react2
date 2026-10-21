import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Converts an invoice DOM element into a pixel-perfect PDF document
 * matching the selected template and custom letterhead exactly.
 */
export const generatePdfFromElement = async (element, isSlip = false) => {
  if (!element) throw new Error('Invoice element not found');

  // Capture canvas with 2.5x retina scaling for crisp print-grade quality
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

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
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageMaxHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    if (pdfHeight <= pageMaxHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    } else {
      // Scale to fit gracefully on standard A4 page
      const scaleFactor = (pageMaxHeight - 12) / pdfHeight;
      const scaledWidth = pdfWidth * scaleFactor;
      const marginX = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'JPEG', marginX, 6, scaledWidth, pageMaxHeight - 12);
    }
    return pdf;
  }
};
