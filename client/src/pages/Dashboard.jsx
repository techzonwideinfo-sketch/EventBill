import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { Link, useNavigate } from 'react-router-dom';
import { downloadBillPdf } from '../services/billService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useContext(I18nContext);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/dashboard/stats')
      .then(res => {
        setStats(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-[#455B8A] font-medium">Loading dashboard...</div>;

  const hasBills = stats && stats.totalBills > 0;

  const filteredBills = stats?.recentBills?.filter(b => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const billNo = b.billNumber?.toLowerCase() || '';
    const custName = (b.customerSnapshot?.name || b.customerId?.name || '').toLowerCase();
    const custPhone = (b.customerSnapshot?.phone || b.customerId?.phone || '').toLowerCase();
    return billNo.includes(query) || custName.includes(query) || custPhone.includes(query);
  }) || [];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D]">{t('Dashboard')}</h1>
          <p className="text-sm text-[#455B8A] mt-1">Welcome back, here is your billing overview.</p>
        </div>
        <Link to="/create-bill" className="bg-[#F2842F] text-white px-5 py-2.5 rounded-lg shadow-sm font-semibold hover:bg-orange-500 transition-colors w-full sm:w-auto text-center">
          + {t('Create Bill')}
        </Link>
      </div>

      {!hasBills ? (
        <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm text-center border border-gray-100 max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h2 className="text-xl text-[#253C6D] font-bold mb-2">No bills created yet</h2>
          <p className="text-[#455B8A] mb-6">Create your first event bill to get started.</p>
          <Link to="/create-bill" className="inline-block bg-[#F2842F] text-white px-6 py-2.5 rounded-lg shadow-sm font-semibold hover:bg-orange-500 transition-colors">
            + {t('Create Bill')}
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Cards - Grid: 1 col mobile, 2 cols tablet, 4 cols desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#253C6D] flex flex-col justify-between">
              <p className="text-[#455B8A] text-xs uppercase tracking-wider font-bold">{t('Total Bills')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#253C6D] mt-2">{stats.totalBills}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#30497D] flex flex-col justify-between">
              <p className="text-[#455B8A] text-xs uppercase tracking-wider font-bold">{t('Total Amount')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#253C6D] mt-2">{formatCurrency(stats.totalAmount)}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 flex flex-col justify-between">
              <p className="text-[#455B8A] text-xs uppercase tracking-wider font-bold">{t('Total Paid')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{formatCurrency(stats.totalPaid)}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#F2842F] flex flex-col justify-between">
              <p className="text-[#455B8A] text-xs uppercase tracking-wider font-bold">{t('Pending Amount')}</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F2842F] mt-2">{formatCurrency(stats.totalPending)}</h3>
            </div>
          </div>
          
          {/* Recent Bills Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-[#253C6D]">{t('Recent Bills')}</h3>
              <input 
                type="text" 
                placeholder="Search Bill No, Customer, Mobile..." 
                className="border border-gray-200 p-2.5 rounded-lg w-full sm:w-72 outline-none focus:ring-2 focus:ring-[#30497D] focus:border-transparent text-sm bg-gray-50 transition-shadow"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

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
                  {filteredBills.length > 0 ? filteredBills.map(b => (
                    <tr key={b._id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-sm text-[#253C6D] font-bold">{b.billNumber}</td>
                      <td className="px-5 py-4 text-sm text-gray-800 font-medium">
                        {b.customerSnapshot?.name || (b.customerId ? b.customerId.name : '')}
                      </td>
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
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => navigate(`/bills/${b._id}/edit`)} className="p-1.5 text-gray-400 hover:text-[#253C6D] bg-gray-50 hover:bg-gray-200 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => downloadBillPdf(b._id, b.billNumber)} className="p-1.5 text-gray-400 hover:text-[#F2842F] bg-gray-50 hover:bg-gray-200 rounded transition-colors" title="Download PDF">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                          <button onClick={() => window.open(`/bills/${b._id}/print`, '_blank')} className="p-1.5 text-gray-400 hover:text-purple-600 bg-gray-50 hover:bg-gray-200 rounded transition-colors" title="Print">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="px-5 py-8 text-center text-gray-500">No bills found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-gray-100">
              {filteredBills.length > 0 ? filteredBills.map(b => (
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

                  <div className="flex gap-2 pt-1">
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
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No bills found matching your search.</div>
              )}
            </div>
            
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
