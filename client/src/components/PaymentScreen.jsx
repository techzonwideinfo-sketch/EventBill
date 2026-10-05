import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { QRCodeSVG } from 'qrcode.react';
import CashDenominationCounter from './CashDenominationCounter';

const PaymentScreen = ({ bill, onComplete, onCancel }) => {
  const { t } = useContext(I18nContext);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' or 'QR'
  const [amountReceived, setAmountReceived] = useState(bill.balanceAmount || bill.totalAmount);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dynamicQrData, setDynamicQrData] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState(null);
  
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
          // Wait a moment for user to see success before redirecting to receipt
          setTimeout(() => onComplete(billRes.data.data), 1500);
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
        reference: reference,
        status: status // Passing status explicitly for manual verification
      };

      if (paymentMethod === 'Cash') {
        payload.denominationCounts = denominationCounts;
      }

      const res = await API.post(`/bills/${bill._id}/payments`, payload);
      setLoading(false);
      
      if (status === 'Verified' || status === 'Paid') {
         setSuccess(true);
         setTimeout(() => onComplete(res.data.data.bill), 1500);
      } else {
         // Manual pending state
         onComplete(res.data.data.bill);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error recording payment');
      setLoading(false);
    }
  };

  const handleSkipPayment = () => {
    onComplete(bill);
  };

  // Generate UPI URI
  const upiId = settings?.upiId;
  const merchantName = settings?.merchantName || 'Merchant';
  const amountToPay = bill.balanceAmount || bill.totalAmount;
  let upiUri = '';
  if (upiId) {
    upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amountToPay}&cu=INR`;
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-[#253C6D]">Collect Payment</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6 pb-24 flex flex-col md:flex-row gap-6">
        
        <div className="flex-1 space-y-6">
          {/* Bill Summary */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Total Bill Amount</p>
              <p className="text-3xl font-bold text-[#253C6D]">₹{bill.totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Outstanding Balance</p>
              <p className="font-bold text-3xl text-[#F2842F]">₹{bill.balanceAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 ml-1 uppercase tracking-wider">Select Payment Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPaymentMethod('Cash')}
                className={`p-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'Cash' ? 'border-[#F2842F] bg-orange-50 text-[#F2842F]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                CASH
              </button>
              <button 
                onClick={() => { setPaymentMethod('QR'); if(settings?.dynamicQrProvider === 'Razorpay') generateDynamicQR(); }}
                className={`p-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'QR' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                QR / UPI
              </button>
            </div>
          </div>

          {/* Dynamic Payment Interface based on selection */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            {success ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <h2 className="text-2xl font-bold text-[#253C6D] mb-2">Payment Verified ✓</h2>
                 <p className="text-gray-500 font-medium">Redirecting to receipt...</p>
              </div>
            ) : paymentMethod === 'QR' ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
                
                {settings?.dynamicQrProvider === 'Razorpay' ? (
                   loading ? (
                     <p className="font-bold text-gray-500">Generating Dynamic QR...</p>
                  ) : dynamicQrData ? (
                     <>
                       <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm inline-block">
                         <img src={dynamicQrData.qrImage} alt="Dynamic UPI QR" className="w-64 h-64 object-contain" />
                       </div>
                       <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Scan to pay exact amount: <span className="text-[#253C6D] text-2xl">₹{Number(dynamicQrData.amount).toLocaleString('en-IN')}</span></p>
                       {pollingStatus && (
                         <div className="flex items-center gap-2 text-green-600 mt-2 animate-pulse">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                           <span className="text-sm font-bold">Waiting for payment confirmation...</span>
                         </div>
                       )}
                     </>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-sm">
                      <p className="font-bold text-yellow-800">Dynamic QR requires backend configuration</p>
                      <button onClick={generateDynamicQR} className="mt-3 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-bold hover:bg-yellow-200 transition-colors">Retry Generate QR</button>
                    </div>
                  )
                ) : (
                  // Static QR Manual Verification Mode
                  <>
                    {upiId ? (
                      <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm inline-block">
                        <QRCodeSVG value={upiUri} size={256} />
                      </div>
                    ) : settings?.staticQrImage ? (
                      <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm inline-block">
                         <img src={settings.staticQrImage} alt="UPI QR" className="w-64 h-64 object-contain" />
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded-xl">
                        <p className="text-orange-700 font-bold mb-2">No QR Code Configured</p>
                        <p className="text-orange-600 text-sm">Please configure UPI ID or QR image in Settings.</p>
                      </div>
                    )}
                    
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Amount to Pay: <span className="text-[#253C6D] text-2xl">₹{amountToPay.toLocaleString('en-IN')}</span>
                    </p>
                    
                    <div className="w-full mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-left">
                       <p className="text-yellow-800 font-bold text-sm mb-2">Manual Verification Required</p>
                       <p className="text-yellow-700 text-xs mb-3">Scan the QR code and complete the payment. This is a static QR workflow; you must manually confirm receipt of funds.</p>
                       <div className="flex gap-2">
                         <button onClick={() => handleRecordPayment('Pending')} disabled={loading} className="flex-1 py-2 bg-yellow-100 text-yellow-800 font-bold rounded hover:bg-yellow-200 text-sm disabled:opacity-50">
                           {loading ? 'Processing...' : 'Mark as Pending'}
                         </button>
                         <button onClick={() => handleRecordPayment('Verified')} disabled={loading} className="flex-1 py-2 bg-green-100 text-green-800 font-bold rounded hover:bg-green-200 text-sm disabled:opacity-50">
                           {loading ? 'Processing...' : 'Confirm Payment'}
                         </button>
                       </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Cash Payment Mode
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Amount Received</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                    <input 
                      type="number" 
                      value={amountReceived} 
                      onChange={e => setAmountReceived(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-[#253C6D] focus:ring-2 focus:ring-[#30497D] outline-none transition-shadow"
                    />
                  </div>
                </div>
              
              {Number(amountReceived) > bill.balanceAmount && (
                <div className="bg-green-50 p-3 rounded-xl border border-green-200 mt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-green-700">Change to Return:</span>
                  <span className="text-xl font-bold text-green-700">₹{(Number(amountReceived) - bill.balanceAmount).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            )}
          </div>

        </div>

        {/* Right Side: Cash Denomination Counter */}
        {paymentMethod === 'Cash' && (
          <div className="md:w-1/3">
            <CashDenominationCounter 
              denominationCounts={denominationCounts}
              onCountChange={(key, val) => setDenominationCounts(prev => ({...prev, [key]: val}))}
              enteredAmount={amountReceived}
            />
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button 
            onClick={handleSkipPayment}
            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            Skip / Pay Later
          </button>
          
          {paymentMethod === 'Cash' && (
            <button 
              onClick={() => handleRecordPayment('Paid')}
              disabled={loading || success}
              className="flex-[2] py-4 bg-[#253C6D] text-white rounded-xl font-bold text-lg shadow-md hover:bg-[#30497D] transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Confirm Receipt & Print'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
