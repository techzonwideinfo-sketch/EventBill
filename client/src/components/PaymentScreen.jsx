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
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState(null);
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
          // Immediately navigate instead of artificially waiting
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
        reference: reference,
        status: status
      };

      if (paymentMethod === 'Cash' && showDenominations) {
        payload.denominationCounts = denominationCounts;
      }

      const res = await API.post(`/bills/${bill._id}/payments`, payload);
      setSuccess(true);
      // Backend returns the fully updated bill object, preventing extra GET request
      onComplete(res.data.data.bill);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error recording payment');
      setLoading(false);
    }
  };

  const handleSkipPayment = () => {
    onComplete(bill);
  };

  // Quick amounts
  const handleQuickAmount = (amt) => {
    setAmountReceived(prev => (Number(prev) || 0) + amt);
  };

  // Generate UPI URI
  const upiId = settings?.upiId;
  const merchantName = settings?.merchantName || 'Merchant';
  const amountToPay = bill.balanceAmount || bill.totalAmount;
  let upiUri = '';
  if (upiId) {
    upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amountToPay}&cu=INR`;
  }

  // Denomination subtotal calculation
  const denoms = { '500': 500, '200': 200, '100': 100, '50': 50, '20': 20, '10': 10, 'coins': 1 };
  const countedCash = Object.entries(denominationCounts).reduce((sum, [key, count]) => {
    return sum + ((denoms[key] || 0) * (count || 0));
  }, 0);
  const diff = countedCash - Number(amountReceived || 0);

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 mr-4 font-bold text-sm flex items-center gap-1 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Collect Payment</h2>
        <div className="ml-auto text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-md">Bill #{bill.billNumber}</div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 pb-32">
        
        {/* AMOUNT SUMMARY */}
        <div className="bg-[#253C6D] p-8 rounded-2xl shadow-lg flex justify-between items-center text-white">
          <div className="opacity-80">
            <p className="text-sm font-bold uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold">₹{bill.totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="opacity-80">
            <p className="text-sm font-bold uppercase tracking-wider mb-1">Paid</p>
            <p className="text-3xl font-bold">₹{bill.totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-wider mb-1 text-orange-200">Balance</p>
            <p className="font-black text-5xl text-[#F2842F]">₹{bill.balanceAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* PAYMENT METHOD */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Payment Method</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setPaymentMethod('Cash')}
              className={`py-5 rounded-xl border-2 font-black text-2xl tracking-wide transition-all ${paymentMethod === 'Cash' ? 'border-[#253C6D] bg-[#253C6D] text-white shadow-md' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
            >
              CASH
            </button>
            <button 
              onClick={() => { setPaymentMethod('QR'); if(settings?.dynamicQrProvider === 'Razorpay') generateDynamicQR(); }}
              className={`py-5 rounded-xl border-2 font-black text-2xl tracking-wide transition-all ${paymentMethod === 'QR' ? 'border-[#253C6D] bg-[#253C6D] text-white shadow-md' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
            >
              QR / UPI
            </button>
          </div>
        </div>

        {/* DYNAMIC PAYMENT INTERFACE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {paymentMethod === 'Cash' ? (
            <div className="p-8 space-y-8">
              
              {/* Amount Received Input */}
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Amount Received</label>
                <div className="relative max-w-sm">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-3xl">₹</span>
                  <input 
                    type="number" 
                    value={amountReceived} 
                    onChange={e => setAmountReceived(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-xl text-3xl font-black text-[#253C6D] focus:ring-4 focus:ring-blue-500/20 focus:border-[#253C6D] outline-none transition-all"
                  />
                </div>
                
                {/* Quick Amounts */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[500, 1000, 2000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      className="px-4 py-2 bg-blue-50 text-[#253C6D] font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                  <button 
                    onClick={() => setAmountReceived(bill.balanceAmount)}
                    className="px-4 py-2 bg-orange-50 text-orange-600 font-bold rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors ml-auto"
                  >
                    Exact Balance
                  </button>
                </div>
              </div>

              {Number(amountReceived) > bill.balanceAmount && (
                <div className="bg-green-50 p-5 rounded-xl border-l-4 border-green-500 flex justify-between items-center">
                  <span className="font-bold text-green-800 uppercase tracking-wider">Change to Return</span>
                  <span className="text-3xl font-black text-green-700">₹{(Number(amountReceived) - bill.balanceAmount).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Collapsible Cash Denominations */}
              <div className="border-t border-gray-100 pt-6">
                <button 
                  onClick={() => setShowDenominations(!showDenominations)}
                  className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-wider text-sm hover:text-gray-900 transition-colors"
                >
                  {showDenominations ? '▾ Hide Cash Denominations' : '▸ Show Cash Denominations'}
                </button>
                
                {showDenominations && (
                  <div className="mt-6 flex flex-col md:flex-row gap-8">
                     <div className="md:w-1/2">
                       <CashDenominationCounter 
                         denominationCounts={denominationCounts}
                         onCountChange={(key, val) => setDenominationCounts(prev => ({...prev, [key]: val}))}
                         enteredAmount={amountReceived}
                       />
                     </div>
                     <div className="md:w-1/2 bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-center space-y-4">
                        <div className="flex justify-between items-center text-gray-600">
                           <span className="font-bold uppercase text-sm">Counted Cash</span>
                           <span className="font-bold text-xl">₹{countedCash.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                           <span className="font-bold uppercase text-sm">Amount Received</span>
                           <span className="font-bold text-xl">₹{Number(amountReceived || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-px bg-gray-300 w-full my-2"></div>
                        <div className="flex justify-between items-center">
                           <span className="font-bold uppercase text-sm text-gray-800">Difference</span>
                           <span className={`font-black text-2xl ${diff === 0 ? 'text-green-600' : 'text-red-500'}`}>₹{Math.abs(diff).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                           {diff === 0 ? (
                             <div className="text-center font-black text-green-600 tracking-wider">BALANCED ✓</div>
                           ) : (
                             <div className="text-center font-black text-red-500 tracking-wider">UNBALANCED</div>
                           )}
                        </div>
                     </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            
            // QR / UPI Mode
            <div className="p-10 flex flex-col items-center justify-center text-center space-y-8">
              
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Payment Amount</p>
                <p className="text-5xl font-black text-[#253C6D]">₹{amountToPay.toLocaleString('en-IN')}</p>
              </div>

              {settings?.dynamicQrProvider === 'Razorpay' ? (
                loading && !dynamicQrData ? (
                  <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
                    <span className="font-bold text-gray-400">Loading QR...</span>
                  </div>
                ) : dynamicQrData ? (
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm inline-block">
                    <img src={dynamicQrData.qrImage} alt="Dynamic UPI QR" className="w-64 h-64 object-contain" />
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl max-w-sm">
                    <p className="font-bold text-red-800">Failed to generate dynamic QR.</p>
                  </div>
                )
              ) : (
                // Static QR Mode
                <>
                  {upiId ? (
                    <div className="p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-sm inline-block">
                      <QRCodeSVG value={upiUri} size={256} />
                    </div>
                  ) : settings?.staticQrImage ? (
                    <div className="p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-sm inline-block">
                       <img src={settings.staticQrImage} alt="UPI QR" className="w-64 h-64 object-contain" />
                    </div>
                  ) : (
                    <div className="p-8 bg-orange-50 border-2 border-orange-200 rounded-2xl">
                      <p className="text-orange-700 font-black mb-2 text-xl">No QR Configured</p>
                      <p className="text-orange-600 font-medium">Please configure UPI in Settings.</p>
                    </div>
                  )}
                </>
              )}

              <p className="font-bold text-gray-500 max-w-xs mx-auto text-sm">
                Scan using GPay / PhonePe / Paytm / any supported UPI app
              </p>

              {/* Status Display */}
              {settings?.dynamicQrProvider === 'Razorpay' ? (
                <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full border border-blue-100 text-blue-700 font-bold uppercase tracking-wider text-sm animate-pulse">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  WAITING FOR PAYMENT...
                </div>
              ) : (
                <div className="flex flex-col gap-4 items-center">
                  <div className="text-gray-500 font-bold uppercase tracking-wider text-sm">
                    Status: <span className="text-orange-500">PENDING SCANNED PAYMENT</span>
                  </div>
                  <div className="flex gap-3 mt-2">
                     <button 
                       onClick={() => handleRecordPayment('Pending')} 
                       disabled={loading || success} 
                       className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 uppercase text-sm tracking-wide transition-colors disabled:opacity-50"
                     >
                       Mark as Pending
                     </button>
                     <button 
                       onClick={() => handleRecordPayment('Verified')} 
                       disabled={loading || success} 
                       className="px-6 py-3 bg-green-100 text-green-700 font-bold rounded-xl hover:bg-green-200 uppercase text-sm tracking-wide transition-colors disabled:opacity-50"
                     >
                       Manually Verify
                     </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* FIXED ACTION AREA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            onClick={handleSkipPayment}
            className="w-1/3 py-5 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            Cancel / Pay Later
          </button>
          
          <button 
            onClick={() => handleRecordPayment('Paid')}
            disabled={loading || success || (paymentMethod === 'QR' && settings?.dynamicQrProvider === 'Razorpay')}
            className={`w-2/3 py-5 rounded-2xl font-black text-xl shadow-lg transition-all flex justify-center items-center gap-3 ${loading || success ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#F2842F] text-white hover:bg-orange-500 hover:shadow-xl hover:-translate-y-1'}`}
          >
            {loading ? (
              <>
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                PROCESSING...
              </>
            ) : success ? (
              'PAYMENT SUCCESSFUL ✓'
            ) : (
              paymentMethod === 'Cash' ? 'CONFIRM PAYMENT & PRINT' : 'WAITING FOR VERIFICATION'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
