import React, { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadBillPdf } from '../services/billService';
import TamilTransliterationInput from '../components/TamilTransliterationInput';
import { transliterateText } from '../utils/tamilTransliteration';
import { printBill } from '../utils/printUtils';
import CashDenominationCounter from '../components/CashDenominationCounter';

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const isCashItem = (service) => {
    return service === 'Cash' || service === 'பண மொய்' || service === 'Cash Contribution';
  };

  useEffect(() => {
    API.get(`/bills/${id}`).then(res => {
      const data = res.data.data;
      setFormData({
        ...data,
        items: data.items || [],
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
        denominationCounts: data.denominationCounts || {}
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
    setFormData(prev => ({...prev, items: [...(prev.items || []), { service: 'Cash Contribution', quantity: 1, rate: 0, amount: '' }]}));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...(formData.items || [])];
    newItems[index][field] = value;
    setFormData(prev => ({...prev, items: newItems}));
  };

  const handleQuickAmount = (index, amount) => {
    const newItems = [...(formData.items || [])];
    const currentAmt = Number(newItems[index].amount) || 0;
    newItems[index].amount = currentAmt + amount;
    setFormData(prev => ({...prev, items: newItems}));
  };

  const removeItem = (index) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData(prev => ({...prev, items: newItems}));
  };

  const handleDenominationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      denominationCounts: {
        ...(prev.denominationCounts || {}),
        [key]: value
      }
    }));
  };

  const subtotal = formData?.items?.reduce((acc, item) => {
    if (isCashItem(item.service)) {
      return acc + (Number(item.amount) || 0);
    }
    return acc + (Number(item.quantity) * Number(item.rate));
  }, 0) || 0;
  
  const balance = subtotal - Number(formData?.advancePaid || 0);

  const hasCashItems = formData?.items?.some(item => isCashItem(item.service)) || false;
  const enteredCashAmount = formData?.items?.reduce((acc, item) => {
    if (isCashItem(item.service)) return acc + (Number(item.amount) || 0);
    return acc;
  }, 0) || 0;

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
    if (!formData) return;
    const previewBill = {
      ...formData,
      subtotal: subtotal,
      balanceAmount: balance,
      totalAmount: subtotal,
      totalPaid: Number(formData.advancePaid || 0),
      items: (formData.items || []).map(i => {
        if (isCashItem(i.service)) {
          const amt = Number(i.amount) || (Number(i.quantity) * Number(i.rate)) || 0;
          return { service: 'Cash Contribution', quantity: 1, rate: amt, amount: amt };
        }
        return { ...i, amount: Number(i.quantity) * Number(i.rate) };
      }),
      paymentStatus: balance <= 0 ? 'Paid' : (formData.advancePaid > 0 ? 'Partially Paid' : 'Pending')
    };
    await printBill(previewBill);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let countedCashAmount = 0;
      if (hasCashItems && formData.denominationCounts) {
        const denoms = { '500': 500, '200': 200, '100': 100, '50': 50, '20': 20, '10': 10, 'coins': 1 };
        countedCashAmount = Object.entries(formData.denominationCounts).reduce((sum, [key, count]) => {
          return sum + ((denoms[key] || 0) * (count || 0));
        }, 0);
      }

      const dataToSubmit = {
        ...formData,
        countedCashAmount: hasCashItems ? countedCashAmount : 0,
        enteredCashAmount: hasCashItems ? enteredCashAmount : 0,
        cashDifference: hasCashItems ? (countedCashAmount - enteredCashAmount) : 0,
        items: (formData.items || []).map(i => {
          if (isCashItem(i.service)) {
            const amt = Number(i.amount) || (Number(i.quantity) * Number(i.rate)) || 0;
            return { service: 'Cash Contribution', quantity: 1, rate: amt, amount: amt };
          }
          return { ...i, amount: Number(i.quantity) * Number(i.rate) };
        })
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
        <div className={`w-full ${hasCashItems ? 'xl:w-2/3' : 'xl:w-full'}`}>
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
                <div>
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('S/O Name')}</label>
                  <TamilTransliterationInput language={formData.billLanguage} type="text" placeholder="S/O Name" className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.customerSnapshot?.sonOf || ''} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, sonOf: e.target.value}}))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('Native Place')}</label>
                  <TamilTransliterationInput language={formData.billLanguage} type="text" placeholder="Native Place" className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.customerSnapshot?.nativePlace || ''} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, nativePlace: e.target.value}}))} />
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
              
              {(formData.items || []).map((item, index) => {
                const isCash = isCashItem(item.service);
                return (
                <div key={index} className="flex flex-col gap-3 mb-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row w-full gap-3 items-start sm:items-center">
                    <div className="w-full sm:flex-1">
                      <label className="block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Contribution Type', 'பங்களிப்பு வகை')}</label>
                      <TamilTransliterationInput language={formData.billLanguage} type="text" list="service-presets-edit" placeholder={t('Item', 'பொருள்') + " (e.g. Cash Contribution)"} required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-white text-sm" value={item.service} onChange={e=>updateItem(index, 'service', e.target.value)} />
                    </div>
                    
                    {!isCash ? (
                    <div className="flex w-full sm:w-auto gap-3">
                      <div className="w-full sm:w-24">
                        <label className="block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Qty')}</label>
                        <input type="number" placeholder={t('Qty')} required min="1" className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none text-center bg-white text-sm" value={item.quantity} onChange={e=>updateItem(index, 'quantity', e.target.value)} />
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Rate')}</label>
                        <input type="number" placeholder={t('Rate')} required min="0" className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none text-right bg-white text-sm" value={item.rate} onChange={e=>updateItem(index, 'rate', e.target.value)} />
                      </div>
                      <div className="w-full sm:w-32 flex flex-col">
                        <label className="block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Amount')}</label>
                        <span className="w-full p-2.5 bg-gray-100 rounded-lg text-right font-bold text-[#253C6D] text-sm h-full flex items-center justify-end">
                          {formatCurrency(Number(item.quantity) * Number(item.rate))}
                        </span>
                      </div>
                    </div>
                    ) : (
                      <div className="flex w-full sm:w-auto gap-3 flex-col sm:flex-row">
                        <div className="w-full sm:w-48">
                           <label className="block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Cash Amount')}</label>
                           <input type="number" placeholder={t('Amount')} required min="0" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none font-bold text-[#253C6D] text-lg" value={item.amount || (item.quantity * item.rate) || ''} onChange={e=>updateItem(index, 'amount', e.target.value)} />
                        </div>
                      </div>
                    )}
                    
                    {index > 0 && (
                      <div className="self-end mb-1">
                        <button type="button" onClick={()=>removeItem(index)} className="w-10 text-red-500 font-bold p-2 hover:bg-red-50 rounded-lg transition-colors flex justify-center items-center h-10" title="Remove item">✕</button>
                      </div>
                    )}
                  </div>
                  
                  {isCash && (
                    <div className="w-full mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 font-semibold mb-2">Quick Amount:</div>
                      <div className="flex flex-wrap gap-2">
                        {[500, 1000, 2000, 5000, 10000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleQuickAmount(index, amt)}
                            className="bg-white border border-gray-200 text-[#455B8A] px-3 py-1.5 rounded hover:bg-gray-100 hover:text-[#253C6D] transition-colors text-sm font-medium shadow-sm"
                          >
                            +₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
              <button type="button" onClick={addItem} className="text-[#F2842F] font-bold mt-2 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors inline-flex items-center text-sm">+ {t('Add Another Contribution', 'மற்றொரு பொருளைச் சேர்')}</button>
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

        {/* Cash Denomination Counter Section */}
        {hasCashItems && (
          <div className="w-full xl:w-1/3">
            <CashDenominationCounter 
              denominationCounts={formData.denominationCounts || {}} 
              onCountChange={handleDenominationChange} 
              enteredAmount={enteredCashAmount} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditBill;
