import API from './api';

export const downloadBillPdf = async (billId, billNumber = 'Bill') => {
  try {
    const response = await API.get(`/bills/${billId}/pdf`, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `EventBill-${billNumber}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        alert('Your session has expired. Please log in again.');
      } else if (error.response.status === 403) {
        alert('You do not have permission to access this bill.');
      } else if (error.response.status === 404) {
        alert('Bill not found.');
      } else {
        alert('Unable to generate PDF. Please try again.');
      }
    } else {
      alert('Network error. Unable to generate PDF.');
    }
  }
};

export const viewBillPdf = async (billId) => {
  try {
    const response = await API.get(`/bills/${billId}/pdf`, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    window.open(url, '_blank');
    
    // Optional: revoke object URL after some time to free memory, 
    // but doing it immediately closes it in some browsers before the new tab renders.
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        alert('Your session has expired. Please log in again.');
      } else if (error.response.status === 403) {
        alert('You do not have permission to access this bill.');
      } else if (error.response.status === 404) {
        alert('Bill not found.');
      } else {
        alert('Unable to generate PDF. Please try again.');
      }
    } else {
      alert('Network error. Unable to generate PDF.');
    }
  }
};
