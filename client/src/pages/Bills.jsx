import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { Link, useNavigate } from 'react-router-dom';
import { downloadBillPdf } from '../services/billService';
import WhatsAppModal from '../components/WhatsAppModal';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [shareBill, setShareBill] = useState(null);
  
  const { t } = useContext(I18nContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = () => {
    setLoading(true);
    API.get('/bills')
      .then(res => {
        setBills(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const useAsNew = async (id) => {
    try {
      const { data } = await API.post(`/bills/${id}/use-as-new`);
      navigate(`/bills/${data.data._id}/edit`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error creating new bill');
    }
  };

  const deleteBill = async (id) => {
    if(window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      try {
        await API.delete(`/bills/${id}`);
        fetchBills();
      } catch(err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete bill');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const filteredBills = bills.filter(b => {
    const query = searchQuery.toLowerCase();
    const billNo = b.billNumber?.toLowerCase() || '';
    const custName = (b.customerSnapshot?.name || b.customerId?.name || '').toLowerCase();
    
    const matchesSearch = !searchQuery || billNo.includes(query) || custName.includes(query);
    const matchesStatus = !statusFilter || b.paymentStatus === statusFilter;
    const matchesEvent = !eventFilter || b.eventType === eventFilter;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const eventTypes = [...new Set(bills.map(b => b.eventType).filter(Boolean))];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D]">{t('Bill History')}</h1>
          <p className="text-sm text-[#455B8A] mt-1">Manage and track your event bills.</p>
        </div>
        <Link to="/create-bill" className="bg-[#F2842F] text-white px-5 py-2.5 rounded-lg shadow-sm font-semibold hover:bg-orange-500 transition-colors w-full sm:w-auto text-center">
          + {t('Create Bill')}
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Search Bill No, Customer..." 
            className="border border-gray-200 p-2.5 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-[#30497D] focus:border-transparent text-sm bg-gray-50 transition-shadow"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select 
              className="border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#30497D] text-sm bg-gray-50 w-full sm:w-48 transition-shadow"
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
            >
              <option value="">All Events</option>
              {eventTypes.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select 
              className="border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#30497D] text-sm bg-gray-50 w-full sm:w-48 transition-shadow"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 text-[#455B8A] font-medium">Loading bills...</div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center p-12 text-gray-500 border-t border-gray-100">
            No bills found matching your criteria.
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider">Bill No</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider">{t('Customer')}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider">{t('Event')}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider text-right">{t('Total')}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider text-right">Paid</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider text-right">Balance</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider text-center">{t('Status')}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBills.map(b => (
                    <tr key={b._id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-sm text-[#253C6D] font-bold">{b.billNumber}</td>
                      <td className="px-5 py-4 text-sm text-gray-800 font-medium">{b.customerSnapshot?.name || (b.customerId ? b.customerId.name : '')}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        <div>{b.eventType}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDate(b.eventDate || b.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-800 text-right">{formatCurrency(b.totalAmount)}</td>
                      <td className="px-5 py-4 text-sm text-green-600 font-medium text-right">{formatCurrency(b.totalPaid)}</td>
                      <td className="px-5 py-4 text-sm text-[#F2842F] text-right font-bold">{formatCurrency(b.balanceAmount)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 
                          b.paymentStatus === 'Partially Paid' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {b.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end space-x-1.5">
                          <button onClick={() => navigate(`/bills/${b._id}/edit`)} className="p-1.5 text-gray-400 hover:text-[#253C6D] bg-gray-50 hover:bg-gray-200 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => setShareBill(b)} className="p-1.5 text-gray-400 hover:text-[#25D366] bg-gray-50 hover:bg-gray-200 rounded transition-colors" title="Share via WhatsApp">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                          </button>
                          <button onClick={() => deleteBill(b._id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-gray-200 rounded transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-gray-100">
              {filteredBills.map(b => (
                <div key={b._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm text-[#253C6D] font-bold">{b.billNumber}</div>
                      <div className="text-sm font-semibold text-gray-800 mt-1">{b.customerSnapshot?.name || (b.customerId ? b.customerId.name : '')}</div>
                      <div className="text-xs text-gray-500">{b.eventType} • {formatDate(b.eventDate || b.createdAt)}</div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      b.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 
                      b.paymentStatus === 'Partially Paid' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {b.paymentStatus || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg text-xs">
                    <div>
                      <div className="text-gray-500 mb-0.5">Total</div>
                      <div className="font-bold text-[#253C6D]">{formatCurrency(b.totalAmount)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Paid</div>
                      <div className="font-bold text-green-600">{formatCurrency(b.totalPaid)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Balance</div>
                      <div className="font-bold text-[#F2842F]">{formatCurrency(b.balanceAmount)}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => navigate(`/bills/${b._id}/edit`)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Edit
                    </button>
                    <button onClick={() => downloadBillPdf(b._id, b.billNumber)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      PDF
                    </button>
                    <button onClick={() => window.open(`/bills/${b._id}/print`, '_blank')} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Print
                    </button>
                    <button onClick={() => setShareBill(b)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-semibold hover:bg-green-50 hover:text-green-600 transition-colors flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      WA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <WhatsAppModal 
        isOpen={!!shareBill} 
        onClose={() => setShareBill(null)} 
        bill={shareBill} 
      />
    </div>
  );
};

export default Bills;
