import React, { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import TamilTransliterationInput from '../components/TamilTransliterationInput';
import PaymentScreen from '../components/PaymentScreen';
import CashDenominationCounter from '../components/CashDenominationCounter';

const CreateBill = () => {
  const { t, lang } = useContext(I18nContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [successBill, setSuccessBill] = useState(null);
  const [createdBill, setCreatedBill] = useState(null);

  const [formData, setFormData] = useState({
    customerSnapshot: { name: '', phone: '', address: '', sonOf: '', nativePlace: '' },
    eventType: location.state?.selectedEvent?.name || 'E-MOI',
    eventTypeNameEn: location.state?.selectedEvent?.name || 'E-MOI',
    eventTypeNameTa: location.state?.selectedEvent?.tamilName || 'E-MOI',
    otherEventType: '',
    otherEventTypeTa: '',
    eventDate: new Date().toISOString().slice(0,10),
    venue: '',
    items: [{ service: 'Cash Contribution', quantity: 1, rate: 0, amount: '' }],
    advancePaid: 0,
    billLanguage: 'English',
    notes: '',
    denominationCounts: {}
  });
  
  const { eventId } = useParams();
  const [loading, setLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerMode, setCustomerMode] = useState('new');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const isCashItem = (service) => {
    return service === 'Cash' || service === 'பண மொய்' || service === 'Cash Contribution';
  };

  const addItem = () => {
    setFormData(prev => ({...prev, items: [...prev.items, { service: 'Cash Contribution', quantity: 1, rate: 0, amount: '' }]}));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({...prev, items: newItems}));
  };

  const handleQuickAmount = (index, amount) => {
    const newItems = [...formData.items];
    const currentAmt = Number(newItems[index].amount) || 0;
    newItems[index].amount = currentAmt + amount;
    setFormData(prev => ({...prev, items: newItems}));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({...prev, items: newItems}));
  };

  const handleDenominationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      denominationCounts: {
        ...prev.denominationCounts,
        [key]: value
      }
    }));
  };

  const subtotal = formData.items.reduce((acc, item) => {
    if (isCashItem(item.service)) {
      return acc + (Number(item.amount) || 0);
    }
    return acc + (Number(item.quantity) * Number(item.rate));
  }, 0);
  const balance = subtotal - Number(formData.advancePaid);

  const hasCashItems = formData.items.some(item => isCashItem(item.service));
  const enteredCashAmount = formData.items.reduce((acc, item) => {
    if (isCashItem(item.service)) return acc + (Number(item.amount) || 0);
    return acc;
  }, 0);

  useEffect(() => {
    if (!eventId) {
      navigate('/select-event');
      return;
    }
    API.get(`/event-types/${eventId}`)
      .then(res => {
        const event = res.data.data;
        if (!event.isActive) {
          setEventError("This event is not active and cannot be used for new bills.");
        } else {
          setFormData(prev => ({
            ...prev,
            eventType: event.name,
            eventTypeNameEn: event.name,
            eventTypeNameTa: event.tamilName || event.name,
            venue: event.defaultVenue || ''
          }));
        }
        setIsLoadingEvent(false);
      })
      .catch(err => {
        console.error(err);
        setEventError("Failed to load event details. Please select an event again.");
        setIsLoadingEvent(false);
      });
  }, [eventId, navigate]);

  useEffect(() => {
    API.get('/customers').then(res => {
      setCustomers(res.data.data);
    }).catch(err => console.error(err));
  }, []);

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
        eventLogo: '',
        countedCashAmount: hasCashItems ? countedCashAmount : 0,
        enteredCashAmount: hasCashItems ? enteredCashAmount : 0,
        cashDifference: hasCashItems ? (countedCashAmount - enteredCashAmount) : 0,
        items: formData.items.map(i => {
          if (isCashItem(i.service)) {
            const amt = Number(i.amount) || (Number(i.quantity) * Number(i.rate)) || 0;
            return { service: 'Cash Contribution', quantity: 1, rate: amt, amount: amt };
          }
          return { ...i, amount: Number(i.quantity) * Number(i.rate) };
        })
      };
      
      const res = await API.post('/bills', dataToSubmit);
      setLoading(false);
      setCreatedBill(res.data.data);
    } catch (err) {
      setLoading(false);
      alert(err.response?.data?.message || err.message || 'Error creating bill');
    }
  };

  if (isLoadingEvent) {
    return <div className="p-8 text-center text-[#455B8A] font-medium">Loading event details...</div>;
  }

  if (eventError) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-red-100 mt-8 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl text-[#253C6D] font-bold mb-2">Error Loading Event</h2>
        <p className="text-[#455B8A] mb-6">{eventError}</p>
        <Link to="/select-event" className="inline-block bg-[#253C6D] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#30497D] transition-colors">
          Return to Event Selection
        </Link>
      </div>
    );
  }

  if (createdBill) {
    return (
      <PaymentScreen 
        bill={createdBill} 
        onComplete={(updatedBill) => navigate(`/bills/${updatedBill._id}/receipt`)} 
        onCancel={() => navigate(`/bills/${createdBill._id}/receipt`)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D]">{t('Create Bill')}</h1>
          <p className="text-sm text-[#455B8A] mt-1">Fill in the details to generate a new bill.</p>
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
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-[#455B8A]">Customer Details</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setCustomerMode(prev => prev === 'new' ? 'existing' : 'new');
                        if (customerMode === 'existing') {
                          setFormData(prev => ({...prev, customerSnapshot: { name: '', phone: '', address: '', sonOf: '', nativePlace: '' }, customerId: null}));
                        }
                      }}
                      className="text-xs font-bold text-[#F2842F] hover:text-orange-600"
                    >
                      {customerMode === 'new' ? 'Select Existing' : '+ Add New Customer'}
                    </button>
                  </div>
                  
                  {customerMode === 'existing' ? (
                    <select 
                      className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow mb-4"
                      value={formData.customerId || ''}
                      onChange={e => {
                        const selected = customers.find(c => c._id === e.target.value);
                        if (selected) {
                          setFormData(prev => ({
                            ...prev,
                            customerId: selected._id,
                            customerSnapshot: { name: selected.name, phone: selected.phone, address: selected.address || '', sonOf: selected.sonOf || '', nativePlace: selected.nativePlace || '' }
                          }));
                        }
                      }}
                    >
                      <option value="" disabled>-- Select Customer --</option>
                      {customers.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  ) : null}

                  <div className="space-y-4">
                    <TamilTransliterationInput language={formData.billLanguage} type="text" placeholder="Customer Name" required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.customerSnapshot.name} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, name: e.target.value}}))} disabled={customerMode === 'existing'} />
                    <input type="text" placeholder="Mobile Number" required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.customerSnapshot.phone} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, phone: e.target.value}}))} disabled={customerMode === 'existing'} />
                    <TamilTransliterationInput language={formData.billLanguage} type="text" placeholder="S/O Name" className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.customerSnapshot.sonOf} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, sonOf: e.target.value}}))} disabled={customerMode === 'existing'} />
                    <TamilTransliterationInput language={formData.billLanguage} type="text" placeholder="Native Place" className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.customerSnapshot.nativePlace} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, nativePlace: e.target.value}}))} disabled={customerMode === 'existing'} />
                  </div>
                </div>
              </div>

              {/* Bill Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="bg-blue-50 text-[#30497D] w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  {t('Bill Details', 'பில் விவரங்கள்')}
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('Date')}</label>
                  <input type="date" required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow mb-4" value={formData.eventDate} onChange={e=>setFormData(prev=>({...prev, eventDate: e.target.value}))} />
                  
                  <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">{t('Venue')}</label>
                  <TamilTransliterationInput language={formData.billLanguage} type="text" placeholder={t('Venue')} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-gray-50 text-[#253C6D] transition-shadow" value={formData.venue} onChange={e=>setFormData(prev=>({...prev, venue: e.target.value}))} />
                </div>
              </div>
            </div>

            {/* Contributions / Items */}
            <div className="space-y-4">
              <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="bg-blue-50 text-[#30497D] w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                {t('Contributions / Items', 'பங்களிப்புகள் / பொருட்கள்')}
              </h3>
              
              <datalist id="service-presets">
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
              
              {formData.items.map((item, index) => {
                const isCash = isCashItem(item.service);
                return (
                <div key={index} className="flex flex-col gap-3 mb-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row w-full gap-3 items-start sm:items-center">
                    <div className="w-full sm:flex-1">
                      <label className="block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Contribution Type', 'பங்களிப்பு வகை')}</label>
                      <TamilTransliterationInput language={formData.billLanguage} type="text" list="service-presets" placeholder={t('Item', 'பொருள்') + " (e.g. Cash Contribution)"} required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-white text-sm" value={item.service} onChange={e=>updateItem(index, 'service', e.target.value)} />
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
                           <input type="number" placeholder={t('Amount')} required min="0" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none font-bold text-[#253C6D] text-lg" value={item.amount || ''} onChange={e=>updateItem(index, 'amount', e.target.value)} />
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
                {loading ? 'Saving Bill...' : 'Save & Continue to Payment'}
              </button>
            </div>
          </form>
        </div>

        {/* Cash Denomination Counter Section */}
        {hasCashItems && (
          <div className="w-full xl:w-1/3">
            <CashDenominationCounter 
              denominationCounts={formData.denominationCounts} 
              onCountChange={handleDenominationChange} 
              enteredAmount={enteredCashAmount} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBill;
