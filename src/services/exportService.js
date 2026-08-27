import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportService = {
  /**
   * Captures a DOM node and returns a Canvas scaled at 2x
   */
  captureElement: async (element) => {
    if (!element) throw new Error('Target element not found');

    return await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1080
    });
  },

  /**
   * Download as PNG image
   */
  downloadPNG: async (element, filename = 'Bethesda_AG_Church_Mid_Night_Prayer') => {
    const canvas = await exportService.captureElement(element);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  },

  /**
   * Download as JPG image
   */
  downloadJPG: async (element, filename = 'Bethesda_AG_Church_Mid_Night_Prayer') => {
    const canvas = await exportService.captureElement(element);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    link.click();
  },

  /**
   * Copy image to clipboard
   */
  copyImageToClipboard: async (element) => {
    const canvas = await exportService.captureElement(element);
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            resolve(true);
          } else {
            reject(new Error('Clipboard API not supported in this browser environment'));
          }
        } catch (err) {
          reject(err);
        }
      }, 'image/png');
    });
  },

  /**
   * Export schedule card as PDF
   */
  downloadPDF: async (element, filename = 'Bethesda_AG_Church_Mid_Night_Prayer') => {
    const canvas = await exportService.captureElement(element);
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Create PDF in portrait orientation
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  },

  /**
   * Export tabulated CSV data
   */
  downloadCSV: (headers, rows, filename = 'Bethesda_AG_Church_Report') => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  }
};
