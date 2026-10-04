import React, { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadBillPdf } from '../services/billService';
import { generateHTML } from '../utils/billTemplate';
import TamilTransliterationInput from '../components/TamilTransliterationInput';
import { transliterateText } from '../utils/tamilTransliteration';

const EditBillSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-pulse">
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-12 bg-gray-200 rounded w-full"></div>
        <div className="h-12 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-32 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const EditBill = () => {
  const { t, lang } = useContext(I18nContext);
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [eventTypesError, setEventTypesError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  useEffect(() => {
    API.get(`/bills/${id}`).then(res => {
      const data = res.data.data;
      setFormData({
        ...data,
        items: data.items || [],
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      });
    }).catch(err => alert(err.response?.data?.message || err.message || 'Error fetching bill'));

    setEventTypesLoading(true);
    setEventTypesError(false);
    API.get('/event-types').then(res => {
      setEventTypes(res.data.data.filter(e => e.isActive));
      setEventTypesLoading(false);
    }).catch(err => {
      console.error(err);
      setEventTypesError(true);
      setEventTypesLoading(false);
    });
  }, [id]);

  const addItem = () => {
    setFormData(prev => ({...prev, items: [...(prev.items || []), { service: '', quantity: 1, rate: 0 }]}));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...(formData.items || [])];
    newItems[index][field] = value;
    setFormData(prev => ({...prev, items: newItems}));
  };

  const removeItem = (index) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData(prev => ({...prev, items: newItems}));
  };

  const subtotal = formData?.items?.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.rate)), 0) || 0;
  const balance = subtotal - Number(formData?.advancePaid || 0);

  useEffect(() => {
    if (!formData) return;
    const previewBill = {
      ...formData,
      subtotal: subtotal,
      balanceAmount: balance,
      totalAmount: subtotal,
      totalPaid: Number(formData.advancePaid || 0),
      items: (formData.items || []).map(i => ({ ...i, amount: Number(i.quantity) * Number(i.rate) })),
      paymentStatus: balance <= 0 ? 'Paid' : (formData.advancePaid > 0 ? 'Partially Paid' : 'Pending')
    };
    setPreviewHtml(generateHTML(previewBill));
  }, [formData, subtotal, balance]);

  // Transliterate 'otherEventType'
  useEffect(() => {
    if (formData && formData.eventType === 'Other' && formData.otherEventType) {
      const timer = setTimeout(async () => {
        const transliterated = await transliterateText(formData.otherEventType);
        setFormData(prev => ({ ...prev, otherEventTypeTa: transliterated }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData?.otherEventType, formData?.eventType]);

  const handlePrint = async () => {
    if (window.electronAPI && window.electronAPI.printHtml) {
      const printRes = await window.electronAPI.printHtml(previewHtml);
      if (!printRes.success) {
        alert("Print failed: " + printRes.reason);
      }
    } else {
      window.open(window.location.protocol === 'app:' ? `app://index.html#/bills/${id}/print` : `/bills/${id}/print`, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        items: (formData.items || []).map(i => ({ ...i, amount: Number(i.quantity) * Number(i.rate) }))
      };
      if (dataToSubmit.eventType === 'Other') {
        dataToSubmit.eventTypeNameEn = dataToSubmit.otherEventType;
        dataToSubmit.eventTypeNameTa = dataToSubmit.otherEventTypeTa || dataToSubmit.otherEventType;
      }
      await API.put(`/bills/${id}`, dataToSubmit);
      setLoading(false);
      navigate('/bills');
    } catch (err) {
      setLoading(false);
      alert(err.response?.data?.message || err.message || 'Error updating bill');
    }
  };

  if (!formData) return <EditBillSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D]">Edit Bill</h1>
          <p className="text-sm text-[#455B8A] mt-1">Update details for the existing bill.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <button type="button" onClick={handlePrint} className="flex-1 sm:flex-none bg-white border border-[#455B8A] text-[#455B8A] px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span className="hidden sm:inline">Print</span>
          </button>
          <button type="button" onClick={() => downloadBillPdf(id, formData.billNumber)} className="flex-1 sm:flex-none bg-[#F2842F] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-500 transition-colors flex items-center justify-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Form Section */}
        <div className="w-full xl:w-2/3">
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 shadow-sm rounded-xl border border-gray-100 border-t-4 border-t-[#253C6D] space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="bg-blue-50 text-[#30497D] w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  {t('Customer Details')}
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('Name')}</label>
                  <TamilTransliterationInput language={formData.billLanguage} type="text" placeholder="Customer Name" required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.customerSnapshot?.name || ''} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, name: e.target.value}}))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('Mobile')}</label>
                  <input type="text" placeholder="Mobile Number" required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.customerSnapshot?.phone || ''} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, phone: e.target.value}}))} />
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="bg-blue-50 text-[#30497D] w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  {t('Event Details')}
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('Event Type')}</label>
                  <div className="w-full border border-gray-200 p-2.5 rounded-lg bg-gray-100 text-gray-500 font-medium">
                    {lang === 'ta' && formData.eventTypeNameTa ? formData.eventTypeNameTa : formData.eventType}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('Date')}</label>
                  <input type="date" required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.eventDate} onChange={e=>setFormData(prev=>({...prev, eventDate: e.target.value}))} />
                </div>
                
                <datalist id="venue-presets">
                  <option value="Sri Devi Mahal" />
                  <option value="KRS Mahal" />
                  <option value="Lakshmi Hall" />
                  <option value="Sree Convention Centre" />
                  <option value="Other" />
                </datalist>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('Venue')}</label>
                  <TamilTransliterationInput language={formData.billLanguage} type="text" list="venue-presets" placeholder={t('Venue') + " (e.g. Sri Devi Mahal)"} required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.venue || ''} onChange={e=>setFormData(prev=>({...prev, venue: e.target.value}))} />
                </div>
              </div>
            </div>

            {/* Contributions / Items */}
            <div className="space-y-4">
              <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="bg-blue-50 text-[#30497D] w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                {t('Contributions / Items', 'பங்களிப்புகள் / பொருட்கள்')}
              </h3>

              <datalist id="service-presets-edit">
                <option value="Cash Contribution" />
                <option value="Gold Ring" />
                <option value="Gold Chain" />
                <option value="Silver Item" />
                <option value="Gift Item" />
                <option value="Other" />
                <option value="பண மொய்" />
                <option value="தங்க மோதிரம்" />
                <option value="தங்க சங்கிலி" />
                <option value="வெள்ளி பொருள்" />
                <option value="பரிசு பொருள்" />
                <option value="மற்றவை" />
              </datalist>
              
              <div className="hidden sm:flex space-x-3 mb-2 text-xs font-bold text-[#455B8A] uppercase tracking-wider px-2">
                <div className="flex-1">{t('Item', 'பொருள்')}</div>
                <div className="w-24 text-center">{t('Qty')}</div>
                <div className="w-32 text-center">{t('Rate')}</div>
                <div className="w-32 text-right">{t('Amount')}</div>
                <div className="w-10"></div>
              </div>
              
              {(formData.items || []).map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-2 items-center bg-gray-50 p-4 sm:bg-transparent sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-gray-200">
                  <div className="w-full sm:flex-1">
                    <label className="sm:hidden block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Item', 'பொருள்')}</label>
                    <TamilTransliterationInput language={formData.billLanguage} type="text" list="service-presets-edit" placeholder={t('Item', 'பொருள்') + " (e.g. Cash Contribution)"} required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-white sm:bg-gray-50 text-sm" value={item.service} onChange={e=>updateItem(index, 'service', e.target.value)} />
                  </div>
                  
                  <div className="flex w-full sm:w-auto gap-3">
                    <div className="w-full sm:w-24">
                      <label className="sm:hidden block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Qty')}</label>
                      <input type="number" placeholder={t('Qty')} required min="1" className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none text-center bg-white sm:bg-gray-50 text-sm" value={item.quantity} onChange={e=>updateItem(index, 'quantity', e.target.value)} />
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="sm:hidden block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Rate')}</label>
                      <input type="number" placeholder={t('Rate')} required min="0" className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none text-right bg-white sm:bg-gray-50 text-sm" value={item.rate} onChange={e=>updateItem(index, 'rate', e.target.value)} />
                    </div>
                  </div>

                  <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end mt-2 sm:mt-0">
                    <span className="sm:hidden text-sm font-bold text-gray-500 uppercase tracking-wider">{t('Amount')}:</span>
                    <span className="w-full sm:w-32 p-2.5 bg-gray-100 sm:bg-gray-50 rounded-lg text-right font-bold text-[#253C6D] text-sm">
                      {formatCurrency(Number(item.quantity) * Number(item.rate))}
                    </span>
                  </div>
                  
                  {index > 0 ? (
                    <button type="button" onClick={()=>removeItem(index)} className="w-full sm:w-10 text-red-500 font-bold p-2 hover:bg-red-50 rounded-lg transition-colors flex justify-center items-center h-10 mt-2 sm:mt-0" title="Remove item">✕</button>
                  ) : (
                    <div className="hidden sm:block w-10"></div>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-[#F2842F] font-bold mt-2 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors inline-flex items-center text-sm">+ {t('Add Another Item', 'மற்றொரு பொருளைச் சேர்')}</button>
            </div>

            {/* Payment & Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
              <div className="space-y-4">
                <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="bg-blue-50 text-[#30497D] w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                  {t('Bill Language')}
                </h3>
                <select className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.billLanguage} onChange={e=>setFormData(prev=>({...prev, billLanguage: e.target.value}))}>
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="English + Tamil">English + Tamil</option>
                </select>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-right space-y-4 h-fit">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#253C6D] font-bold text-sm tracking-wide uppercase">{t('Total Amount', 'மொத்த தொகை')}</span>
                  <span className="font-bold text-3xl text-[#F2842F]">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full bg-[#253C6D] text-white p-4 rounded-lg font-bold text-lg hover:bg-[#30497D] shadow-md transition-colors disabled:opacity-50">
                {loading ? 'Updating Bill...' : 'Update & Save Bill'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Section */}
        <div className="w-full xl:w-1/3 flex flex-col xl:h-auto">
          <div className="bg-gray-200 p-4 rounded-t-xl flex justify-between items-center border border-gray-300 border-b-0">
            <h3 className="font-bold text-[#253C6D] text-sm tracking-wider uppercase flex items-center gap-2">
              <span className="bg-[#253C6D] text-white w-4 h-4 rounded-full flex justify-center items-center text-[10px]">👁</span>
              Live Preview
            </h3>
            <span className="text-xs text-gray-500 font-mono">80mm Thermal</span>
          </div>
          <div className="bg-[#e5e7eb] p-6 flex-1 rounded-b-xl border border-gray-300 flex justify-center overflow-auto items-start min-h-[500px]">
            <div className="shadow-lg">
               <style>
                {`
                  .preview-wrapper { width: 80mm; background: white; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transform-origin: top center; }
                  @media (max-width: 640px) { .preview-wrapper { transform: scale(0.9); } }
                `}
              </style>
              <div className="preview-wrapper" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditBill;
