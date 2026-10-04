import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { downloadBillPdf } from '../services/billService';
import WhatsAppModal from './WhatsAppModal';

const PaymentScreen = ({ bill, onComplete, onCancel }) => {
  const { t } = useContext(I18nContext);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState(bill.balanceAmount || bill.totalAmount);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [success, setSuccess] = useState(false);
  const [updatedBill, setUpdatedBill] = useState(bill);
  const [dynamicQrData, setDynamicQrData] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState(null);

  useEffect(() => {
    // Fetch user settings to get Static QR data
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
          // Refresh bill
          const billRes = await API.get(`/bills/${bill._id}`);
          onComplete(billRes.data.data);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 3000);
    setPollIntervalId(id);
  };

  const handleRecordPayment = async () => {
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
      const res = await API.post(`/bills/${bill._id}/payments`, {
        amount: paymentAmount,
        amountReceived: amountReceivedNum,
        changeReturned,
        method: paymentMethod,
        reference: reference
      });
      setLoading(false);
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

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-[#253C6D]">Collect Payment</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6 pb-24">
        
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button 
              onClick={() => setPaymentMethod('Cash')}
              className={`p-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'Cash' ? 'border-[#F2842F] bg-orange-50 text-[#F2842F]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('StaticQR')}
              className={`p-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'StaticQR' ? 'border-[#F2842F] bg-orange-50 text-[#F2842F]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              Manual UPI
            </button>
            {settings?.dynamicQrProvider === 'Razorpay' && (
              <button 
                onClick={() => { setPaymentMethod('DynamicQR'); generateDynamicQR(); }}
                className={`p-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'DynamicQR' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Automatic UPI
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Payment Interface based on selection */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          
          {paymentMethod === 'StaticQR' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              {settings?.staticQrImage ? (
                <>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm inline-block">
                    <img src={settings.staticQrImage} alt="UPI QR" className="w-48 h-48 object-contain" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Scan to pay <span className="text-[#253C6D] text-lg">₹{Number(amountReceived).toLocaleString('en-IN')}</span></p>
                  {settings.upiId && <p className="text-xs text-gray-400 font-mono bg-gray-100 px-3 py-1 rounded-full">{settings.upiId}</p>}
                </>
              ) : (
                <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-orange-700 font-bold mb-2">No QR Code Configured</p>
                  <p className="text-orange-600 text-sm">Please upload your Merchant QR code in Settings.</p>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'DynamicQR' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
              {loading ? (
                 <p className="font-bold text-gray-500">Generating Dynamic QR...</p>
              ) : dynamicQrData ? (
                 <>
                   <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm inline-block">
                     <img src={dynamicQrData.qrImage} alt="Dynamic UPI QR" className="w-48 h-48 object-contain" />
                   </div>
                   <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Scan to pay exact amount: <span className="text-[#253C6D] text-lg">₹{Number(dynamicQrData.amount).toLocaleString('en-IN')}</span></p>
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
              )}
            </div>
          )}

          {paymentMethod !== 'DynamicQR' && (
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
            
            {(paymentMethod === 'StaticQR' || paymentMethod === 'Other') && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Ref / UTR (Optional)</label>
                <input 
                  type="text" 
                  value={reference} 
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. UPI Ref No"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base text-[#253C6D] focus:ring-2 focus:ring-[#30497D] outline-none transition-shadow uppercase"
                />
              </div>
            )}
          </div>
          )}
        </div>

      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button 
            onClick={handleSkipPayment}
            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            Skip / Pay Later
          </button>
          {paymentMethod !== 'DynamicQR' && (
            <button 
              onClick={handleRecordPayment}
              disabled={loading}
              className="flex-[2] py-4 bg-[#253C6D] text-white rounded-xl font-bold text-lg shadow-md hover:bg-[#30497D] transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Confirm Receipt'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
