import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import TamilTransliterationInput from '../components/TamilTransliterationInput';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentCustomer, setCurrentCustomer] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [apiError, setApiError] = useState(false);

  const { t, lang } = useContext(I18nContext);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    setLoading(true);
    setApiError(false);
    API.get('/customers')
      .then(res => {
        setCustomers(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setApiError(true);
        setLoading(false);
      });
  };

  const openAddModal = () => {
    setModalMode('add');
    setCurrentCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setModalMode('edit');
    setCurrentCustomer(c);
    setFormData({ name: c.name || '', phone: c.phone || '', email: c.email || '', address: c.address || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.name.trim()) {
      setFormError('Customer Name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Mobile Number is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        await API.post('/customers', formData);
      } else {
        await API.put(`/customers/${currentCustomer._id}`, formData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving customer');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCustomer = async (id, name) => {
    if(window.confirm(`Delete Customer?\n\nAre you sure you want to delete ${name}?`)) {
      try {
        await API.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Error deleting customer');
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(query) || phone.includes(query) || email.includes(query);
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D] flex items-center gap-3">
            {t('Customers')}
            {!loading && !apiError && customers.length > 0 && (
              <span className="text-sm font-medium bg-gray-200 text-gray-600 py-1 px-2.5 rounded-full">
                {customers.length} Customers
              </span>
            )}
          </h1>
          <p className="text-sm text-[#455B8A] mt-1">Manage your customer database.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#F2842F] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-sm w-full sm:w-auto h-[44px] flex items-center justify-center shrink-0"
        >
          + Add Customer
        </button>
      </div>

      {apiError ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center border border-red-100">
          <p className="font-semibold text-lg">Unable to load customers.</p>
          <p className="text-sm mt-1">Please try again later or refresh the page.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64 text-[#455B8A] font-medium">
          Loading customers...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Actions Bar */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-[350px]">
              <input 
                type="text" 
                placeholder="Search by name, phone, or email..." 
                className="border border-gray-300 pl-10 p-2.5 rounded-lg w-full outline-none focus:ring-2 focus:ring-[#30497D] focus:border-transparent text-sm bg-white transition-shadow h-[44px]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {customers.length === 0 ? (
            <div className="text-center p-16 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#455B8A] mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#253C6D] mb-2">No customers yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">Add your first customer to start creating event bills faster.</p>
              <button onClick={openAddModal} className="bg-[#F2842F] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors">
                + Add Customer
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center p-16">
              <h3 className="text-lg font-bold text-gray-700 mb-2">No customers found</h3>
              <p className="text-gray-500">Try a different name, phone number, or email.</p>
            </div>
          ) : (
            <>
              {/* Desktop / Tablet Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold text-[#455B8A] uppercase tracking-wider">{t('Customer')}</th>
                      <th className="px-5 py-4 text-xs font-bold text-[#455B8A] uppercase tracking-wider">{t('Phone')}</th>
                      <th className="px-5 py-4 text-xs font-bold text-[#455B8A] uppercase tracking-wider">Email</th>
                      <th className="px-5 py-4 text-xs font-bold text-[#455B8A] uppercase tracking-wider">Bills</th>
                      <th className="px-5 py-4 text-xs font-bold text-[#455B8A] uppercase tracking-wider">Address</th>
                      <th className="px-5 py-4 text-xs font-bold text-[#455B8A] uppercase tracking-wider text-right">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.map(c => (
                      <tr key={c._id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#253C6D]">{c.name}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 font-medium">{c.phone}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{c.email || '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 font-medium">{c.billsCount || 0}</td>
                        <td className="px-5 py-4 text-sm text-gray-500 truncate max-w-[200px]">{c.address || '-'}</td>
                        <td className="px-5 py-4 text-right">
                           <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(c)} className="text-[#30497D] hover:text-[#F2842F] text-sm font-semibold transition-colors" title="Edit">
                                Edit
                              </button>
                              <button onClick={() => deleteCustomer(c._id, c.name)} className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors" title="Delete">
                                Delete
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
                {filteredCustomers.map(c => (
                  <div key={c._id} className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-bold text-[#253C6D]">{c.name}</div>
                        <div className="text-sm font-semibold text-gray-600 mt-0.5">{c.phone}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 pt-3 border-t border-gray-50">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium text-gray-800">{c.email || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Bills</span>
                        <span className="font-medium text-gray-800">{c.billsCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-start text-sm">
                        <span className="text-gray-500 shrink-0">Address</span>
                        <span className="font-medium text-gray-800 text-right pl-4">{c.address || '-'}</span>
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                       <button onClick={() => openEditModal(c)} className="flex-1 bg-blue-50 border border-blue-100 text-[#30497D] py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                          Edit
                       </button>
                       <button onClick={() => deleteCustomer(c._id, c.name)} className="flex-1 bg-red-50 border border-red-100 text-red-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
                          Delete
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-[#253C6D]">
                {modalMode === 'add' ? 'Add Customer' : 'Edit Customer'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-[#253C6D] mb-1.5">Customer Name *</label>
                <TamilTransliterationInput 
                  language={lang}
                  type="text" 
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-white transition-shadow"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#253C6D] mb-1.5">Mobile Number *</label>
                <input 
                  type="tel" 
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-white transition-shadow"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#253C6D] mb-1.5">Email (Optional)</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-white transition-shadow"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#253C6D] mb-1.5">Address (Optional)</label>
                <TamilTransliterationInput 
                  as="textarea"
                  language={lang}
                  rows="2"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#30497D] focus:border-transparent outline-none bg-white transition-shadow resize-none"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter full address"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 bg-[#253C6D] text-white py-3 rounded-lg font-bold hover:bg-[#30497D] transition-colors disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Customers;
