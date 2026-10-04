import React, { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { generateHTML } from '../utils/billTemplate';
import { downloadBillPdf } from '../services/billService';
import WhatsAppModal from '../components/WhatsAppModal';
import TamilTransliterationInput from '../components/TamilTransliterationInput';
import PaymentScreen from '../components/PaymentScreen';
import { transliterateText } from '../utils/tamilTransliteration';

const CreateBill = () => {
  const { t, lang } = useContext(I18nContext);
  const navigate = useNavigate();
  
  const [successBill, setSuccessBill] = useState(null);
  const [checkoutBill, setCheckoutBill] = useState(null);

  const [formData, setFormData] = useState({
    customerSnapshot: { name: '', phone: '', address: '', sonOf: '', nativePlace: '' },
    eventType: location.state?.selectedEvent?.name || 'E-MOI',
    eventTypeNameEn: location.state?.selectedEvent?.name || 'E-MOI',
    eventTypeNameTa: location.state?.selectedEvent?.tamilName || 'E-MOI',
    otherEventType: '',
    otherEventTypeTa: '',
    eventDate: new Date().toISOString().slice(0,10),
    venue: '',
    items: [{ service: '', quantity: 1, rate: 0 }],
    advancePaid: 0,
    billLanguage: 'English',
    notes: ''
  });
  
  const { eventId } = useParams();
  const [loading, setLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerMode, setCustomerMode] = useState('new');
  const [previewHtml, setPreviewHtml] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const addItem = () => {
    setFormData(prev => ({...prev, items: [...prev.items, { service: '', quantity: 1, rate: 0 }]}));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({...prev, items: newItems}));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({...prev, items: newItems}));
  };

  const subtotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.rate)), 0);
  const balance = subtotal - Number(formData.advancePaid);

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
    const previewBill = {
      ...formData,
      subtotal: subtotal,
      balanceAmount: balance,
      totalAmount: subtotal,
      totalPaid: Number(formData.advancePaid),
      items: formData.items.map(i => ({ ...i, amount: Number(i.quantity) * Number(i.rate) })),
      paymentStatus: balance <= 0 ? 'Paid' : (formData.advancePaid > 0 ? 'Partially Paid' : 'Pending')
    };
    const width = localStorage.getItem('receiptWidth') || '80mm';
    setPreviewHtml(generateHTML(previewBill, '', width));
  }, [formData, subtotal, balance]);

  useEffect(() => {
    API.get('/customers').then(res => {
      setCustomers(res.data.data);
    }).catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        eventLogo: '',
        items: formData.items.map(i => ({ ...i, amount: Number(i.quantity) * Number(i.rate) }))
      };
      const res = await API.post('/bills', dataToSubmit);
      setLoading(false);
      setCheckoutBill(res.data.data);
    } catch (err) {
      setLoading(false);
      alert(err.response?.data?.message || err.message || 'Error creating bill');
    }
  };

  const handleCreateAnother = () => {
    setSuccessBill(null);
    setFormData({
      customerSnapshot: { name: '', phone: '', address: '', sonOf: '', nativePlace: '' },
      eventType: formData.eventType,
      eventTypeNameEn: formData.eventTypeNameEn,
      eventTypeNameTa: formData.eventTypeNameTa,
      otherEventType: '',
      otherEventTypeTa: '',
      eventDate: new Date().toISOString().slice(0,10),
      venue: '',
      items: [{ service: '', quantity: 1, rate: 0 }],
      advancePaid: 0,
      billLanguage: 'English'
    });
    setCustomerMode('new');
  };

  if (checkoutBill) {
    return (
      <PaymentScreen 
        bill={checkoutBill}
        onComplete={(finalBill) => {
          setCheckoutBill(null);
          setSuccessBill(finalBill);
        }}
        onCancel={() => {
          setCheckoutBill(null);
          setSuccessBill(checkoutBill); // treat as pending
        }}
      />
    );
  }

  if (successBill) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#253C6D] mb-1">Bill Created Successfully!</h2>
          <p className="text-[#455B8A] text-sm mt-2 mb-6">Bill has been successfully generated and saved.</p>
          
          <div className="grid grid-cols-3 gap-2 bg-gray-50 p-4 rounded-lg text-sm mb-8 text-left">
            <div>
              <div className="text-gray-500 mb-0.5">Total</div>
              <div className="font-bold text-[#253C6D]">{formatCurrency(successBill.totalAmount)}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-0.5">Paid</div>
              <div className="font-bold text-green-600">{formatCurrency(successBill.totalPaid)}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-0.5">Balance</div>
              <div className="font-bold text-[#F2842F]">{formatCurrency(successBill.balanceAmount)}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => window.open(window.location.protocol === 'app:' ? `app://index.html#/bills/${successBill._id}/print` : `/bills/${successBill._id}/print`, '_blank')} className="px-4 py-2.5 bg-white border border-[#455B8A] text-[#455B8A] rounded-lg font-semibold hover:bg-blue-50 transition-colors flex justify-center items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
            <button onClick={() => downloadBillPdf(successBill._id, successBill.billNumber)} className="px-4 py-2.5 bg-white border border-[#F2842F] text-[#F2842F] rounded-lg font-semibold hover:bg-orange-50 transition-colors flex justify-center items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download PDF
            </button>
            <button onClick={() => setSuccessBill({...successBill, showWhatsApp: true})} className="px-4 py-2.5 bg-[#25D366] text-white rounded-lg font-semibold hover:bg-[#20bd5a] transition-colors flex justify-center items-center gap-2 sm:col-span-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              Share on WhatsApp
            </button>
            <button onClick={() => navigate(`/bills/${successBill._id}/edit`)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex justify-center items-center sm:col-span-1 text-sm">
              View Bill
            </button>
            <button onClick={handleCreateAnother} className="px-4 py-2.5 bg-[#253C6D] text-white rounded-lg font-semibold hover:bg-[#30497D] transition-colors flex justify-center items-center sm:col-span-1 text-sm">
              Create Another Bill
            </button>
          </div>
        </div>
        
        {successBill.showWhatsApp && (
          <WhatsAppModal 
            isOpen={true} 
            onClose={() => setSuccessBill({...successBill, showWhatsApp: false})} 
            bill={successBill} 
          />
        )}
      </div>
    );
  }

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

              <div className="hidden sm:flex space-x-3 mb-2 text-xs font-bold text-[#455B8A] uppercase tracking-wider px-2">
                <div className="flex-1">{t('Item', 'பொருள்')}</div>
                <div className="w-24 text-center">{t('Qty')}</div>
                <div className="w-32 text-center">{t('Rate')}</div>
                <div className="w-32 text-right">{t('Amount')}</div>
                <div className="w-10"></div>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-2 items-center bg-gray-50 p-4 sm:bg-transparent sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-gray-200">
                  <div className="w-full sm:flex-1">
                    <label className="sm:hidden block text-xs font-bold text-[#455B8A] uppercase tracking-wider mb-1">{t('Item', 'பொருள்')}</label>
                    <TamilTransliterationInput language={formData.billLanguage} type="text" list="service-presets" placeholder={t('Item', 'பொருள்') + " (e.g. Cash Contribution)"} required className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-white sm:bg-gray-50 text-sm" value={item.service} onChange={e=>updateItem(index, 'service', e.target.value)} />
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
                {loading ? 'Saving Bill...' : 'Save & Generate Bill'}
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
            <span className="text-xs text-gray-500 font-mono">{localStorage.getItem('receiptWidth') || '80mm'} Thermal</span>
          </div>
          <div className="bg-[#e5e7eb] p-6 flex-1 rounded-b-xl border border-gray-300 flex justify-center overflow-auto items-start min-h-[500px]">
            <div className="shadow-lg">
               <style>
                {`
                  .preview-wrapper { width: ${localStorage.getItem('receiptWidth') || '80mm'}; background: white; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transform-origin: top center; }
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

export default CreateBill;
