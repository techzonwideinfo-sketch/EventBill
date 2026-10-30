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
  const passedEventId = location.state?.eventId || null;

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
        ? `வணக்கம் ${safeCustomerName},\n\nஉங்கள் பில் விவரங்கள்:\nநிகழ்வு: ${eventName}\nமொத்த தொகை: ₹${bill.totalAmount || 0}\nபாக்கி: ₹${bill.balanceAmount || 0}\n\nநன்றி!\n- Venba E-MOI`
        : `Hello ${safeCustomerName},\n\nYour bill details:\nEvent: ${eventName}\nTotal Amount: ₹${bill.totalAmount || 0}\nOutstanding Balance: ₹${bill.balanceAmount || 0}\n\nThank you!\n- Venba E-MOI`;
      
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
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

  // Build event name display
  const eventNameEn = bill.eventTypeNameEn || (bill.eventType === 'Other' ? bill.otherEventType : bill.eventType) || '';
  const eventNameTa = bill.eventTypeNameTa || '';
  const dualEventName = eventNameTa && eventNameTa !== eventNameEn ? `${eventNameEn} ${eventNameTa}` : (eventNameEn || bill.eventType);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[70vh]">
      
      {/* Receipt Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-sm w-full overflow-hidden">
        
        {/* Receipt Content - styled like a thermal receipt */}
        <div className="px-6 py-6" style={{ fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif" }}>
          
          {/* Venba E-MOI Brand Header */}
          <div className="text-center mb-2">
            <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
            <div style={{ fontFamily: "'Dancing Script', 'Georgia', cursive, serif", fontSize: '28px', fontWeight: 700, color: '#111', lineHeight: 1.1 }}>
              Venba
            </div>
            <div className="mx-auto mt-1 mb-1.5" style={{ width: '60px', height: '2px', background: '#333', borderRadius: '1px' }}></div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '4px', color: '#333', textTransform: 'uppercase' }}>
              E - M O I
            </div>
          </div>

          {/* Double line */}
          <div className="border-t-2 border-gray-800 my-2"></div>

          {/* MOI BILL + Event Name */}
          <div className="text-center my-2">
            <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">MOI BILL</div>
            <div className="text-sm font-bold text-gray-900 uppercase mt-1">{dualEventName}</div>
          </div>

          {/* Thin line */}
          <div className="border-t border-gray-400 my-2"></div>

          {/* Bill Info */}
          <div className="text-xs space-y-0.5 my-2">
            <div className="flex">
              <span className="text-gray-500 w-16 shrink-0">Date</span>
              <span className="font-semibold text-gray-900">: {formatDate(bill.eventDate)}</span>
            </div>
            {bill.venue && (
              <div className="flex">
                <span className="text-gray-500 w-16 shrink-0">Venue</span>
                <span className="font-semibold text-gray-900">: {bill.venue}</span>
              </div>
            )}
          </div>

          {/* Dashed line */}
          <div className="border-t border-dashed border-gray-400 my-2"></div>

          {/* Customer Info */}
          <div className="text-xs space-y-0.5 my-2">
            <div className="flex">
              <span className="text-gray-500 w-16 shrink-0">Name</span>
              <span className="font-semibold text-gray-900">: {bill.customerSnapshot?.name || '-'}</span>
            </div>
            {bill.customerSnapshot?.phone && (
              <div className="flex">
                <span className="text-gray-500 w-16 shrink-0">Phone</span>
                <span className="font-semibold text-gray-900">: {bill.customerSnapshot.phone}</span>
              </div>
            )}
          </div>

          {/* Thin line */}
          <div className="border-t border-gray-400 my-2"></div>

          {/* Items Table */}
          <table className="w-full text-xs my-2" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="border-b border-gray-500">
                <th className="text-left py-1 font-bold text-gray-800 uppercase" style={{ width: '42%', fontSize: '9px' }}>Item / Contribution</th>
                <th className="text-center py-1 font-bold text-gray-800 uppercase" style={{ width: '14%', fontSize: '9px' }}>Qty</th>
                <th className="text-right py-1 font-bold text-gray-800 uppercase" style={{ width: '19%', fontSize: '9px' }}>Rate</th>
                <th className="text-right py-1 font-bold text-gray-800 uppercase" style={{ width: '25%', fontSize: '9px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items?.map((item, i) => (
                <tr key={i}>
                  <td className="py-1 font-semibold text-gray-800 pr-1">{item.service}</td>
                  <td className="py-1 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-1 text-right text-gray-700 pr-1">{(Number(item.rate) || 0).toLocaleString('en-IN')}</td>
                  <td className="py-1 text-right font-bold text-gray-800">{(Number(item.amount) || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Double line */}
          <div className="border-t-2 border-gray-800 my-2"></div>

          {/* Total Amount */}
          <div className="flex justify-between items-center my-2">
            <span className="text-sm font-bold text-gray-900 uppercase">Total Amount</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(bill.totalAmount)}</span>
          </div>

          {/* Balance (if outstanding) */}
          {bill.balanceAmount > 0 && (
            <div className="flex justify-between items-center my-1">
              <span className="text-sm font-bold text-red-600 uppercase">Balance</span>
              <span className="text-base font-bold text-red-600">{formatCurrency(bill.balanceAmount)}</span>
            </div>
          )}

          {/* Payment Details */}
          {(bill.paymentMethod || bill.paymentStatus) && (
            <>
              <div className="border-t border-dashed border-gray-400 my-2"></div>
              {bill.paymentMethod && (
                <div className="flex justify-between text-xs my-0.5">
                  <span className="font-semibold text-gray-700">Payment Mode</span>
                  <span className="font-bold text-gray-900 uppercase">{bill.paymentMethod}</span>
                </div>
              )}
              {bill.paymentStatus && (
                <div className="flex justify-between text-xs my-0.5">
                  <span className="font-semibold text-gray-700">Payment Status</span>
                  <span className={`font-bold uppercase ${bill.paymentStatus === 'Paid' ? 'text-green-700' : 'text-orange-600'}`}>{bill.paymentStatus}</span>
                </div>
              )}
            </>
          )}

          {/* Double line */}
          <div className="border-t-2 border-gray-800 my-3"></div>

          {/* Thank You */}
          <div className="text-center my-3">
            <div className="text-xs font-bold italic text-gray-700">Thank you for choosing us!</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Making your special moments memorable.</div>
          </div>

          {/* Company Footer */}
          <div className="text-center mt-2">
            <div className="text-xs font-bold text-gray-800">Venba Tech Solutions</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Contact: 7006472735 | 6362146398</div>
          </div>

        </div>
      </div>
      
      {/* Action Buttons - Outside the receipt card */}
      <div className="max-w-sm w-full mt-6 space-y-3">
        <button onClick={handlePrint} className="w-full py-4 bg-[#253C6D] text-white rounded-2xl font-black text-lg hover:bg-[#30497D] transition-colors flex justify-center items-center gap-2 shadow-lg hover:-translate-y-0.5">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
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
        
        <button onClick={() => navigate(passedEventId ? `/create-bill/${passedEventId}` : '/select-event')} className="w-full py-4 mt-2 text-gray-500 font-bold uppercase tracking-wider hover:text-gray-900 transition-colors">
          NEW BILL
        </button>
      </div>
    </div>
  );
};

export default Receipt;
