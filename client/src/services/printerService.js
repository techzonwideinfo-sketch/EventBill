/**
 * Printer Service
 * A hardware-independent printing abstraction for EventBill.
 */

export const printReceipt = async (htmlContent, billId) => {
  // Check if we are in an Android WebView wrapper with an injected JS bridge
  if (window.AndroidPrinter) {
    try {
      // In a real device, this might send the HTML or raw text commands to the BT/Internal Printer
      await window.AndroidPrinter.print(htmlContent);
      return { success: true, method: 'android_native' };
    } catch (err) {
      console.error('Android Printer Error:', err);
      return { success: false, error: err };
    }
  }

  // Check if we are in Electron
  const isElectron = navigator.userAgent.toLowerCase().includes('electron');
  
  if (isElectron && window.electronAPI && window.electronAPI.printSilent) {
    try {
      // If we have an IPC bridge configured for silent printing
      await window.electronAPI.printSilent(htmlContent);
      return { success: true, method: 'electron_silent' };
    } catch (err) {
      console.error('Electron Print Error:', err);
      // Fallback to standard window.print if silent printing fails
    }
  }

  // Default fallback: Standard Browser Print
  // We use the existing `/bills/:id/print` route which opens a new tab and triggers window.print()
  try {
    const printWindow = window.open(`/bills/${billId}/print`, '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for printing.');
    }
    return { success: true, method: 'browser_standard' };
  } catch (err) {
    console.error('Browser Print Error:', err);
    return { success: false, error: err };
  }
};
