import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { downloadBillPdf } from '../services/billService';
import { printBill } from '../utils/printUtils';

const Receipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use passed state if available to skip loading/API request
  const [bill, setBill] = useState(location.state?.bill || null);
  const [loading, setLoading] = useState(!location.state?.bill);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bill) {
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
    }
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
        ? `வணக்கம் ${safeCustomerName},\n\nஉங்கள் பில் விவரங்கள்:\nநிகழ்வு: ${eventName}\nமொத்த தொகை: ₹${bill.totalAmount || 0}\nபாக்கி: ₹${bill.balanceAmount || 0}\n\nநன்றி!`
        : `Hello ${safeCustomerName},\n\nYour bill details:\nEvent: ${eventName}\nTotal Amount: ₹${bill.totalAmount || 0}\nOutstanding Balance: ₹${bill.balanceAmount || 0}\n\nThank you!\n- MOI BILL`;
      
      let phone = bill.customerSnapshot?.phone || (bill.customerId && bill.customerId.phone) || '';
      
      if (!phone) {
        alert("Customer phone number is not available.");
        return;
      }
      
      // Normalize Indian phone numbers
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
      } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = '91' + cleaned.substring(1);
      }

      // Fast, reliable WhatsApp Web redirect
      const url = `https://web.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(messageText)}`;
      window.open(url, '_blank');
      
    } catch (err) {
      console.error(err);
      alert('Unable to open WhatsApp. Please try again.');
    }
  };

  const handlePrint = async () => {
    try {
      const res = await printBill(bill);
      if (res && res.success === false) {
         alert('Unable to print receipt');
      }
    } catch (err) {
      alert('Unable to print receipt');
    }
  };

  const handlePdf = () => {
    try {
      downloadBillPdf(bill._id, bill.billNumber);
    } catch (err) {
      alert('Unable to generate receipt PDF');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading receipt details...</div>;
  }

  if (error || !bill) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-red-100 mt-8 max-w-xl mx-auto">
        <h2 className="text-2xl text-gray-900 font-black mb-2">Error</h2>
        <p className="text-gray-500 mb-6">{error || 'Bill not found'}</p>
        <button onClick={() => navigate('/dashboard')} className="bg-[#253C6D] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#30497D] transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 min-h-[70vh]">
      <div className="bg-white p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-gray-100 max-w-md w-full text-center relative overflow-hidden">
        
        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 mb-8 uppercase tracking-tight">Payment Successful</h2>
        
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-4 border border-gray-200">
          <div>
            <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-1">Event</span>
            <span className="font-bold text-gray-900 text-lg">{bill.eventType || bill.eventTypeNameEn}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-1">Customer</span>
            <span className="font-bold text-gray-900 text-lg">{bill.customerSnapshot?.name}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-1">Phone</span>
            <span className="font-bold text-gray-900 text-lg">{bill.customerSnapshot?.phone || '-'}</span>
          </div>
          <div className="flex justify-between items-end border-t border-gray-200 pt-4 mt-2">
            <div>
              <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-1">Date</span>
              <span className="font-bold text-gray-900">{new Date(bill.eventDate || bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-1">Payment</span>
              <span className="font-bold text-gray-900">{bill.paymentMethod || 'Cash'}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-1">Status</span>
              <span className={`font-black uppercase tracking-wider ${bill.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>{bill.paymentStatus}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button onClick={handlePrint} className="w-full py-4 bg-[#253C6D] text-white rounded-2xl font-black text-lg hover:bg-[#30497D] transition-colors flex justify-center items-center gap-2 shadow-lg hover:-translate-y-0.5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            PRINT RECEIPT
          </button>
          
          <div className="flex gap-3">
             <button onClick={handleWhatsAppShare} className="flex-1 py-4 bg-[#25D366] text-white rounded-2xl font-black hover:bg-[#20bd5a] transition-colors shadow-md flex justify-center items-center gap-2">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
               WhatsApp
             </button>
             <button onClick={handlePdf} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-colors">
               PDF
             </button>
          </div>
          
          <button onClick={() => navigate('/select-event')} className="w-full py-4 mt-2 text-gray-500 font-bold uppercase tracking-wider hover:text-gray-900 transition-colors">
            NEW BILL
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
