import API from './api';
import { generateHTML } from '../utils/billTemplate';
import html2pdf from 'html2pdf.js';

const generateFrontendPdf = async (billId) => {
  const res = await API.get(`/bills/${billId}`);
  const bill = res.data.data;
  
  const width = localStorage.getItem('receiptWidth') || '80mm';
  const html = generateHTML(bill, '', width);
  
  const container = document.createElement('div');
  container.innerHTML = html;
  
  // Set explicit width for html2canvas to render correctly
  container.style.width = width === '80mm' ? '302px' : '794px'; 
  container.style.background = 'white';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  
  document.body.appendChild(container);
  
  const opt = {
    margin:       0,
    filename:     `EventBill-${bill.billNumber}.pdf`,
    image:        { type: 'jpeg', quality: 1 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: width === '80mm' ? [80, 200] : 'a4', orientation: 'portrait' }
  };
  
  try {
    const pdfBlob = await html2pdf().set(opt).from(container).output('blob');
    return { blob: pdfBlob, billNumber: bill.billNumber };
  } finally {
    document.body.removeChild(container);
  }
};

export const getBillPdfBlob = async (billId) => {
  const { blob } = await generateFrontendPdf(billId);
  return blob;
};

export const downloadBillPdf = async (billId, fallbackBillNumber = 'Bill') => {
  try {
    const { blob, billNumber } = await generateFrontendPdf(billId);
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `EventBill-${billNumber || fallbackBillNumber}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF Generation error:", error);
    alert('Unable to generate PDF. Please try again.');
  }
};

export const viewBillPdf = async (billId) => {
  try {
    const { blob } = await generateFrontendPdf(billId);
    const url = window.URL.createObjectURL(blob);
    
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch (error) {
    console.error("PDF Generation error:", error);
    alert('Unable to generate PDF. Please try again.');
  }
};
