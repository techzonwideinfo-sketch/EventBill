import React, { useState } from 'react';
import API from '../services/api';

const WhatsAppModal = ({ isOpen, onClose, bill }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error' | 'fallback', message: '', phone?: '', text?: '' }

  if (!isOpen || !bill) return null;

  const handleSend = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await API.post(`/bills/${bill._id}/whatsapp`);
      const { success, message, phone, text } = res.data;
      
      if (!success && message === 'WHATSAPP_NOT_CONFIGURED') {
        setStatus({ type: 'fallback', message: 'WhatsApp API is not configured. The PDF will need to be attached manually.', phone, text });
      } else {
        setStatus({ type: 'success', message: message || 'Bill sent successfully via WhatsApp.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || err.message || 'Unable to send the bill via WhatsApp.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (status?.phone && status?.text) {
      const url = `https://wa.me/${status.phone}?text=${encodeURIComponent(status.text)}`;
      window.open(url, '_blank');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const customerName = bill.customerSnapshot?.name || (bill.customerId ? bill.customerId.name : 'Unknown');
  const customerPhone = bill.customerSnapshot?.phone || (bill.customerId ? bill.customerId.phone : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center gap-3">
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
          <h3 className="font-bold text-green-800 text-lg">Share Bill via WhatsApp</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {!customerPhone && (
             <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm font-medium border border-red-200">
               Mobile number required. Please edit the bill to add a phone number.
             </div>
          )}
          {status && (
            <div className={`p-4 rounded-lg text-sm font-medium ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              status.type === 'fallback' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Customer</p>
              <p className="font-semibold text-[#253C6D]">{customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Mobile</p>
              <p className="font-semibold text-[#253C6D]">{customerPhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Bill</p>
              <p className="font-semibold text-[#253C6D]">{bill.billNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total</p>
              <p className="font-semibold text-[#253C6D]">{formatCurrency(bill.totalAmount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => { setStatus(null); onClose(); }} 
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            {status?.type === 'success' ? 'Close' : 'Cancel'}
          </button>
          
          {status?.type === 'fallback' ? (
            <button 
              type="button" 
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              Open WhatsApp
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSend}
              disabled={loading || status?.type === 'success' || !customerPhone}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send via WhatsApp'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;
