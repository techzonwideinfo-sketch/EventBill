import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../services/api';
import { printBill } from '../utils/printUtils';
import { downloadBillPdf } from '../services/billService';

const Receipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  const [bill, setBill] = useState(state?.billData || null);
  const [loading, setLoading] = useState(!state?.billData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bill) return; // Skip if bill data was passed via router state

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
  }, [id, bill]);

  const handleWhatsAppShare = () => {
    if (!bill) return;
    
    try {
      const isTamil = bill.billLanguage && bill.billLanguage.includes('Tamil');
      const safeCustomerName = bill.customerSnapshot?.name || 'Customer';
      let eventName = '';
      if (isTamil) {
        eventName = bill.eventTypeNameTa || bill.eventTypeNameEn || (bill.eventType === 'Other' ? bill.otherEventType : bill.eventType);
      } else {
        eventName = bill.eventTypeNameEn || (bill.eventType === 'Other' ? bill.otherEventType : bill.eventType);
      }
      
      const messageText = isTamil 
        ? `வணக்கம் ${safeCustomerName},\n\nஉங்கள் பில் விவரங்கள்:\nநிகழ்வு: ${eventName}\nமொத்த தொகை: ₹${bill.totalAmount || 0}\nசெலுத்திய தொகை: ₹${bill.totalPaid || 0}\nபாக்கி: ₹${bill.balanceAmount || 0}\n\nநன்றி!`
        : `Hello ${safeCustomerName},\n\nYour bill details:\nEvent: ${eventName}\nTotal Amount: ₹${bill.totalAmount || 0}\nAmount Paid: ₹${bill.totalPaid || 0}\nOutstanding Balance: ₹${bill.balanceAmount || 0}\n\nThank you!\n\n- EVENTBILL`;
      
      let phone = bill.customerSnapshot?.phone || (bill.customerId && bill.customerId.phone) || '';
      
      if (phone) {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) phone = '91' + cleaned;
        else phone = cleaned;

        const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageText)}`;
        window.open(url, '_blank');
      } else {
        alert("Customer mobile number is not available.");
      }
    } catch (err) {
      console.error(err);
      alert('Unable to open WhatsApp.');
    }
  };

  const handlePrint = async () => {
    try {
      await printBill(bill);
    } catch (err) {
      console.error(err);
      alert('Unable to print receipt');
    }
  };
  
  const handleDownloadPDF = async () => {
    try {
      await downloadBillPdf(bill._id, bill.billNumber);
    } catch (err) {
      console.error(err);
      alert('Unable to generate receipt PDF');
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
        <h2 className="text-xl text-[#253C6D] font-bold mb-2">Error Loading Receipt</h2>
        <p className="text-[#455B8A] mb-6">{error || 'Bill not found'}</p>
        <Link to="/dashboard" className="inline-block bg-[#253C6D] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#30497D] transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isFullyPaid = bill.balanceAmount <= 0;
  
  const eventName = (bill.billLanguage && bill.billLanguage.includes('Tamil')) 
    ? (bill.eventTypeNameTa || bill.eventTypeNameEn || bill.eventType)
    : (bill.eventTypeNameEn || bill.eventType);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 w-full">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center">
        
        <div className="flex items-center justify-center gap-2 text-green-600 mb-6">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
           <h2 className="text-xl font-bold uppercase tracking-wide">Payment Successful</h2>
        </div>
        
        <div className="mb-8">
           <p className="text-4xl font-bold text-[#253C6D]">{formatCurrency(bill.totalPaid)} PAID</p>
           <p className="text-gray-500 font-bold uppercase mt-1 text-sm tracking-widest">{bill.paymentMethod || 'Cash'}</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-5 text-left text-sm space-y-3 mb-8">
           <div>
             <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-0.5">Event</p>
             <p className="font-bold text-gray-800 text-base">{eventName}</p>
           </div>
           
           <div>
             <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-0.5">Customer</p>
             <p className="font-bold text-gray-800 text-base">{bill.customerSnapshot?.name}</p>
           </div>
           
           <div>
             <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-0.5">Phone</p>
             <p className="font-bold text-gray-800">{bill.customerSnapshot?.phone || 'N/A'}</p>
           </div>
           
           <div>
             <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-0.5">Date</p>
             <p className="font-bold text-gray-800">{new Date(bill.eventDate || bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
           </div>
           
           <div>
             <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-0.5">Status</p>
             <p className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-orange-500'}`}>{bill.paymentStatus}</p>
           </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Receipt Actions</p>
          
          <button onClick={handlePrint} className="w-full py-4 bg-[#253C6D] text-white rounded-xl font-bold text-lg hover:bg-[#30497D] transition-colors shadow-sm flex justify-center items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            PRINT RECEIPT
          </button>
          
          <button onClick={handleWhatsAppShare} className="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#20bd5a] transition-colors shadow-sm flex justify-center items-center gap-2">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
             WhatsApp
          </button>
          
          <div className="flex gap-3">
             <button onClick={handleDownloadPDF} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm">
               PDF
             </button>
             <button onClick={() => navigate('/select-event')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-sm">
               New Bill
             </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Receipt;
