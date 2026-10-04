import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { downloadBillPdf, getBillPdfBlob } from '../services/billService';
import { generateHTML } from '../utils/billTemplate';

const Receipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await API.get(`/bills/${id}`);
        setBill(res.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load bill details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id]);

  const handleWhatsAppShare = async () => {
    if (!bill) return;
    setIsSharing(true);
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      const blob = await getBillPdfBlob(bill._id);
      const file = new File([blob], `EventBill-${bill.billNumber}.pdf`, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] }) && isMobileDevice) {
        try {
          await navigator.share({
            files: [file],
            title: 'EventBill Receipt',
            text: 'Please find your bill receipt attached.'
          });
          setIsSharing(false);
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
             setIsSharing(false);
             return;
          }
          console.error("Native share failed, falling back to WhatsApp Web", shareErr);
        }
      }

      const res = await API.post(`/bills/${bill._id}/whatsapp`);
      const { phone, text } = res.data;
      
      downloadBillPdf(bill._id, bill.billNumber);
      
      if (phone) {
        alert("The PDF has been downloaded to your device. Please attach it manually in the WhatsApp chat.");
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      } else {
        alert("Customer mobile number is missing. The PDF has been downloaded. Please send it manually.");
      }
    } catch (err) {
      console.error(err);
      alert('Unable to prepare WhatsApp sharing. Please try downloading the PDF manually.');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrint = async () => {
    if (window.electronAPI) {
      const width = localStorage.getItem('receiptWidth') || '80mm';
      const html = generateHTML(bill, '', width);
      const fullHtml = `
        <html><head><style>
          @page { size: ${width} auto; margin: 0; }
          body { width: ${width}; margin: 0; padding: 4mm; box-sizing: border-box; background: white; }
          .no-print { display: none !important; }
        </style></head><body>
        <div class="print-receipt">
        ${html}
        </div>
        </body></html>
      `;
      await window.electronAPI.printHtml(fullHtml);
    } else {
      window.open(window.location.protocol === 'app:' ? `app://index.html#/bills/${bill._id}/print` : `/bills/${bill._id}/print`, '_blank');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  if (loading) {
    return <div className="p-12 text-center text-[#455B8A] font-medium animate-pulse">Loading receipt details...</div>;
  }

  if (error || !bill) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-red-100 mt-8 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl text-[#253C6D] font-bold mb-2">Error Loading Receipt</h2>
        <p className="text-[#455B8A] mb-6">{error || 'Bill not found'}</p>
        <Link to="/dashboard" className="inline-block bg-[#253C6D] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#30497D] transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isFullyPaid = bill.balanceAmount <= 0;

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-4 space-y-6 min-h-[60vh] rounded-2xl">
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl shadow-green-900/5 border border-green-100 max-w-lg w-full text-center relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>

        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Bill Saved Successfully</h2>
        <p className="text-gray-500 text-sm mb-8">The bill has been recorded and saved.</p>
        
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-8 text-left space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Event</span>
            <span className="font-bold text-gray-900">{bill.eventType || bill.eventTypeNameEn}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Customer</span>
            <span className="font-bold text-gray-900 text-right">
              {bill.customerSnapshot?.name}
              <span className="block text-xs text-gray-500 font-normal mt-0.5">{bill.customerSnapshot?.phone}</span>
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Amount</span>
            <span className="font-bold text-gray-900 text-lg">{formatCurrency(bill.totalAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Amount Paid</span>
            <span className="font-bold text-green-600 text-lg">{formatCurrency(bill.totalPaid)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-200/60">
            <span className="text-gray-600 text-sm font-bold uppercase tracking-wider">Outstanding Balance</span>
            <span className={`font-bold text-xl ${isFullyPaid ? 'text-green-600' : 'text-orange-500'}`}>
              {formatCurrency(bill.balanceAmount)}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button onClick={() => window.open(window.location.protocol === 'app:' ? `app://index.html#/bills/${bill._id}/print` : `/bills/${bill._id}/print`, '_blank')} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex justify-center items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Receipt
          </button>
          <button onClick={() => downloadBillPdf(bill._id, bill.billNumber)} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex justify-center items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download PDF
          </button>
          
          <button onClick={handleWhatsAppShare} disabled={isSharing} className="sm:col-span-2 px-4 py-3.5 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20bd5a] transition-all shadow-md shadow-green-900/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {isSharing ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            )}
            {isSharing ? 'Preparing...' : 'WhatsApp – Share Receipt'}
          </button>
        </div>
        
        <div className="flex gap-3 justify-center pt-4 border-t border-gray-100">
           <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm">
            Finish
          </button>
          <button onClick={() => navigate('/select-event')} className="px-6 py-2 bg-[#253C6D] text-white rounded-lg font-bold hover:bg-[#30497D] transition-colors text-sm shadow-md">
            New Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
