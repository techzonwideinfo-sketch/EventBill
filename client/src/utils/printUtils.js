import { generateHTML } from './billTemplate';
import eventHistoryCss from '../styles/event-history-print.css?raw';

export const printBill = async (bill) => {
  const width = localStorage.getItem('receiptWidth') || '80mm';
  const html = generateHTML(bill, '', width);
  const fullHtml = `
    <html><head><style>
      @page { size: ${width} auto; margin: 0; }
      body { width: ${width}; margin: 0; padding: 4mm; box-sizing: border-box; background: white; font-family: sans-serif; }
      .print-receipt { width: 100%; max-width: 100%; }
      .no-print { display: none !important; }
    </style></head><body>
    <div class="print-receipt">
    ${html}
    </div>
    </body></html>
  `;

  // 1. Electron IPC Native Printing
  if (window.electronAPI && window.electronAPI.printHtml) {
    try {
      await window.electronAPI.printHtml(fullHtml);
      return { success: true, method: 'electron' };
    } catch (err) {
      console.error("Electron print failed", err);
    }
  }

  // 2. Web Iframe Printing (Bypasses popup blockers and new windows)
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(fullHtml);
      doc.close();
      
      iframe.contentWindow.focus();
      // Wait for fonts and images to render before calling print
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
             document.body.removeChild(iframe);
          }
          resolve({ success: true, method: 'iframe' });
        }, 1000); // Cleanup after print dialog opens
      }, 500);
    } catch (err) {
      console.error("Iframe print failed", err);
      resolve({ success: false, error: err });
    }
  });
};

export const printA4Report = async (htmlContent) => {
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Event Bill History Report</title>
        <style>
          ${eventHistoryCss}
        </style>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = { corePlugins: { preflight: false } }
        </script>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  if (window.electronAPI && window.electronAPI.printHtml) {
    try {
      await window.electronAPI.printHtml(fullHtml);
      return { success: true, method: 'electron' };
    } catch (err) {
      console.error("Electron print failed", err);
    }
  }

  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(fullHtml);
      doc.close();
      
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
             document.body.removeChild(iframe);
          }
          resolve({ success: true, method: 'iframe' });
        }, 1000);
      }, 1000); // give a bit more time for tailwind cdn to process
    } catch (err) {
      console.error("Iframe print failed", err);
      resolve({ success: false, error: err });
    }
  });
};
