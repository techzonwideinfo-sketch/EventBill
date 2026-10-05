import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { QRCodeSVG } from 'qrcode.react';
import CashDenominationCounter from './CashDenominationCounter';

const PaymentScreen = ({ bill, onComplete, onCancel }) => {
  const { t } = useContext(I18nContext);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); 
  const [amountReceived, setAmountReceived] = useState(bill.balanceAmount || bill.totalAmount);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dynamicQrData, setDynamicQrData] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState(null);
  
  const [showDenominations, setShowDenominations] = useState(false);
  const [denominationCounts, setDenominationCounts] = useState(bill.denominationCounts || {});

  useEffect(() => {
    API.get('/auth/me')
      .then(res => {
        if (res.data.data.paymentSettings) {
          setSettings(res.data.data.paymentSettings);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [pollIntervalId]);

  const generateDynamicQR = async () => {
    setLoading(true);
    setDynamicQrData(null);
    try {
      const res = await API.post(`/bills/${bill._id}/dynamic-qr`);
      setDynamicQrData(res.data.data);
      setLoading(false);
      startPolling(res.data.data.paymentId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate Dynamic QR');
      setLoading(false);
    }
  };

  const startPolling = (paymentId) => {
    if (pollIntervalId) clearInterval(pollIntervalId);
    setPollingStatus(true);
    
    const id = setInterval(async () => {
      try {
        const res = await API.get(`/payments/${paymentId}/status`);
        if (res.data.data.status === 'Verified' || res.data.data.status === 'Paid') {
          clearInterval(id);
          setPollingStatus(false);
          const billRes = await API.get(`/bills/${bill._id}`);
          setSuccess(true);
          onComplete(billRes.data.data);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 3000);
    setPollIntervalId(id);
  };

  const handleRecordPayment = async (status = 'Paid') => {
    if (loading || success) return;
    
    const amountReceivedNum = Number(amountReceived);
    if (amountReceivedNum <= 0 && bill.totalAmount > 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    let paymentAmount = amountReceivedNum;
    let changeReturned = 0;
    
    if (amountReceivedNum > bill.balanceAmount) {
      paymentAmount = bill.balanceAmount;
      changeReturned = amountReceivedNum - bill.balanceAmount;
    }

    setLoading(true);
    try {
      const payload = {
        amount: paymentAmount,
        amountReceived: amountReceivedNum,
        changeReturned,
        method: paymentMethod === 'QR' ? 'UPI' : 'Cash',
        status: status 
      };

      if (paymentMethod === 'Cash') {
        payload.denominationCounts = denominationCounts;
      }

      const res = await API.post(`/bills/${bill._id}/payments`, payload);
      setLoading(false);
      setSuccess(true);
      
      onComplete(res.data.data.bill);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error recording payment');
      setLoading(false);
    }
  };

  const handleQuickAmount = (amt) => {
    setAmountReceived(amt);
  };

  const amountToPay = bill.balanceAmount || bill.totalAmount;
  const changeReturned = Number(amountReceived) > amountToPay ? (Number(amountReceived) - amountToPay) : 0;

  let upiUri = '';
  if (settings?.upiId) {
    upiUri = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings?.merchantName || 'Merchant')}&am=${amountToPay}&cu=INR`;
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onCancel} className="text-gray-500 hover:text-[#253C6D] font-bold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          Back / Close
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <h2 className="text-xl font-extrabold text-[#253C6D] tracking-wide uppercase">Collect Payment</h2>
        <span className="ml-auto text-xs text-gray-400 font-bold uppercase tracking-wider">Ref: #{bill.billNumber}</span>
      </header>

      <main className="flex-1 p-4 md:p-8 w-full max-w-5xl mx-auto space-y-6 pb-32">
        
        {/* AMOUNT SUMMARY */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center text-center">
          <div className="flex-1 border-r border-gray-200">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total</p>
            <p className="text-3xl font-extrabold text-gray-900">₹{bill.totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex-1 border-r border-gray-200">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Paid</p>
            <p className="text-3xl font-extrabold text-green-600">₹{bill.totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Balance</p>
            <p className="text-4xl font-black text-[#F2842F]">₹{amountToPay.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* PAYMENT METHOD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Payment Method</h3>
           <div className="flex gap-4">
             <button 
                onClick={() => setPaymentMethod('Cash')}
                className={`flex-1 py-5 rounded-xl border-2 font-black text-xl transition-all ${paymentMethod === 'Cash' ? 'border-[#253C6D] bg-blue-50 text-[#253C6D]' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
              >
                CASH
              </button>
              <button 
                onClick={() => { setPaymentMethod('QR'); if(settings?.dynamicQrProvider === 'Razorpay') generateDynamicQR(); }}
                className={`flex-1 py-5 rounded-xl border-2 font-black text-xl transition-all ${paymentMethod === 'QR' ? 'border-[#25D366] bg-green-50 text-[#25D366]' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
              >
                QR / UPI
              </button>
           </div>
        </div>

        {/* DYNAMIC PAYMENT AREA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[300px]">
          
          {paymentMethod === 'Cash' ? (
            
            // CASH MODE
            <div className="max-w-2xl mx-auto space-y-6">
               <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Amount Received</label>
                  <div className="relative max-w-sm mx-auto">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-2xl">₹</span>
                    <input 
                      type="number" 
                      value={amountReceived} 
                      onChange={e => setAmountReceived(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-3xl font-black text-[#253C6D] text-center focus:border-[#253C6D] focus:ring-0 outline-none transition-colors"
                    />
                  </div>
               </div>

               <div className="flex justify-center gap-2 flex-wrap">
                  {[500, 1000, 2000, 5000, 10000].map(amt => (
                    <button key={amt} onClick={() => handleQuickAmount(amt)} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors">
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
               </div>
               
               {changeReturned > 0 && (
                 <div className="bg-orange-50 text-orange-600 border border-orange-200 p-4 rounded-xl text-center flex flex-col items-center justify-center animate-pulse">
                   <span className="text-xs font-bold uppercase tracking-widest">Change Due</span>
                   <span className="text-3xl font-black">₹{changeReturned.toLocaleString('en-IN')}</span>
                 </div>
               )}

               <div className="pt-4 border-t border-gray-100">
                  <button onClick={() => setShowDenominations(!showDenominations)} className="w-full py-3 flex items-center justify-center gap-2 text-[#455B8A] font-bold bg-blue-50/50 hover:bg-blue-50 rounded-xl transition-colors">
                     {showDenominations ? 'Hide Cash Denomination ▴' : 'Show Cash Denomination ▾'}
                  </button>
                  
                  {showDenominations && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                       <CashDenominationCounter 
                          denominationCounts={denominationCounts}
                          onCountChange={(key, val) => setDenominationCounts(prev => ({...prev, [key]: val}))}
                          enteredAmount={amountReceived}
                       />
                    </div>
                  )}
               </div>
            </div>

          ) : (
            
            // QR / UPI MODE
            <div className="flex flex-col items-center justify-center text-center space-y-6">
                <div>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Payment Amount</p>
                   <p className="text-5xl font-black text-[#253C6D]">₹{amountToPay.toLocaleString('en-IN')}</p>
                </div>
                
                {settings?.dynamicQrProvider === 'Razorpay' ? (
                   loading ? (
                     <div className="h-64 flex items-center justify-center"><p className="font-bold text-gray-500 animate-pulse">Generating Dynamic QR...</p></div>
                  ) : dynamicQrData ? (
                     <>
                       <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm inline-block">
                         <img src={dynamicQrData.qrImage} alt="Dynamic UPI QR" className="w-64 h-64 object-contain" />
                       </div>
                       <p className="font-bold text-gray-500">Scan using GPay / PhonePe / Paytm / any supported UPI app</p>
                       <div className="flex items-center gap-2 text-orange-500 mt-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-200 font-bold animate-pulse">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          WAITING FOR PAYMENT
                       </div>
                     </>
                  ) : (
                    <div className="p-6 bg-red-50 border border-red-200 rounded-xl max-w-sm">
                      <p className="font-bold text-red-800">Dynamic QR Error</p>
                      <button onClick={generateDynamicQR} className="mt-4 px-6 py-2 bg-red-100 text-red-800 rounded-lg font-bold hover:bg-red-200 transition-colors">Retry Generate QR</button>
                    </div>
                  )
                ) : (
                  <>
                    {upiId ? (
                      <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm inline-block">
                        <QRCodeSVG value={upiUri} size={256} />
                      </div>
                    ) : settings?.staticQrImage ? (
                      <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm inline-block">
                         <img src={settings.staticQrImage} alt="UPI QR" className="w-64 h-64 object-contain" />
                      </div>
                    ) : (
                      <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl max-w-sm">
                        <p className="text-orange-800 font-bold">No QR Code Configured</p>
                      </div>
                    )}
                    <p className="font-bold text-gray-500">Scan using GPay / PhonePe / Paytm / any supported UPI app</p>
                    <div className="flex gap-4 w-full max-w-md mx-auto pt-4">
                        <button onClick={() => handleRecordPayment('Pending')} disabled={loading || success} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
                           Mark Pending
                        </button>
                        <button onClick={() => handleRecordPayment('Verified')} disabled={loading || success} className="flex-1 py-3 bg-green-100 text-green-700 font-bold rounded-xl hover:bg-green-200 transition-colors disabled:opacity-50">
                           Confirm Verified
                        </button>
                    </div>
                  </>
                )}
            </div>

          )}
        </div>

      </main>

      {/* ACTION AREA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
        <div className="max-w-5xl mx-auto flex gap-4">
          <button 
            onClick={onCancel}
            disabled={loading || success}
            className="w-1/3 py-5 bg-gray-100 text-gray-600 rounded-xl font-black text-xl hover:bg-gray-200 transition-colors disabled:opacity-50 tracking-wide"
          >
            CANCEL / PAY LATER
          </button>
          
          <button 
            onClick={() => handleRecordPayment('Paid')}
            disabled={loading || success || paymentMethod !== 'Cash'}
            className="w-2/3 py-5 bg-[#253C6D] text-white rounded-xl font-black text-xl shadow-lg shadow-blue-900/20 hover:bg-[#30497D] transition-colors disabled:opacity-50 disabled:shadow-none tracking-wide flex justify-center items-center gap-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                 <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 PROCESSING...
              </span>
            ) : (
               'CONFIRM PAYMENT & PRINT'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
