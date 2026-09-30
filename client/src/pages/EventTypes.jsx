import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import TamilTransliterationInput from '../components/TamilTransliterationInput';
import { transliterateText } from '../utils/tamilTransliteration';

const EventTypes = () => {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useContext(I18nContext);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', tamilName: '', isActive: true });
  const [isTamilEdited, setIsTamilEdited] = useState(false);
  const [modalLoading, setFormDataLoading] = useState(false); // rename state to not conflict
  const [modalLoadingState, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Auto-transliterate English name if Tamil name hasn't been manually edited
  useEffect(() => {
    if (isModalOpen && !isTamilEdited && formData.name) {
      const timer = setTimeout(async () => {
        const transliterated = await transliterateText(formData.name);
        if (!isTamilEdited) {
          setFormData(prev => ({ ...prev, tamilName: transliterated }));
        }
      }, 500);
      return () => clearTimeout(timer);
    } else if (isModalOpen && !isTamilEdited && !formData.name) {
      setFormData(prev => ({ ...prev, tamilName: '' }));
    }
  }, [formData.name, isTamilEdited, isModalOpen]);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/event-types');
      setEventTypes(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingId(event._id);
      setFormData({ name: event.name, tamilName: event.tamilName || '', isActive: event.isActive });
      setIsTamilEdited(!!event.tamilName); // if it already has a tamil name, assume it's edited to avoid overwriting on modal open
    } else {
      setEditingId(null);
      setFormData({ name: '', tamilName: '', isActive: true });
      setIsTamilEdited(false);
    }
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      if (editingId) {
        await API.put(`/event-types/${editingId}`, formData);
      } else {
        await API.post('/event-types', formData);
      }
      handleCloseModal();
      fetchEventTypes();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error saving event type');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (event) => {
    try {
      await API.put(`/event-types/${event._id}`, { isActive: !event.isActive });
      fetchEventTypes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling status');
    }
  };

  const handleDelete = async (event) => {
    if(window.confirm(`Are you sure you want to delete "${event.name}"? If it is used in existing bills, it will be disabled instead to preserve historical data.`)) {
      try {
        const { data } = await API.delete(`/event-types/${event._id}`);
        if(data.message.includes('disabled')) {
          alert(data.message);
        }
        fetchEventTypes();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting event type');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D]">{t('Event Types')}</h1>
          <p className="text-sm text-[#455B8A] mt-1">Manage the list of events available for billing.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-[#F2842F] text-white px-5 py-2.5 rounded-lg shadow-sm font-semibold hover:bg-orange-500 transition-colors w-full sm:w-auto text-center flex justify-center items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Event Type
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48 text-[#455B8A] font-medium">Loading event types...</div>
        ) : eventTypes.length === 0 ? (
           <div className="text-center p-12 text-gray-500 border-t border-gray-100">
            No event types found. Click the button above to add one.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider">Name (English)</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider">Tamil Name</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider text-center">Status</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eventTypes.map(e => (
                    <tr key={e._id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#253C6D]">{e.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 font-medium">{e.tamilName || '-'}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          e.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {e.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <div className="flex justify-end space-x-1.5">
                            <button onClick={() => handleToggleStatus(e)} className="px-3 py-1.5 text-xs font-bold rounded bg-gray-50 border border-gray-200 text-[#455B8A] hover:bg-gray-100 transition-colors" title={e.isActive ? "Disable" : "Enable"}>
                              {e.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => handleOpenModal(e)} className="p-1.5 text-gray-400 hover:text-[#253C6D] bg-gray-50 border border-gray-200 hover:bg-gray-200 rounded transition-colors" title="Edit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(e)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 border border-gray-200 hover:bg-gray-200 rounded transition-colors" title="Delete">
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
              {eventTypes.map(e => (
                <div key={e._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-base font-bold text-[#253C6D]">{e.name}</div>
                      <div className="text-sm font-semibold text-gray-600 mt-0.5">{e.tamilName || '-'}</div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      e.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {e.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                     <button onClick={() => handleToggleStatus(e)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                        {e.isActive ? 'Disable' : 'Enable'}
                     </button>
                     <button onClick={() => handleOpenModal(e)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit
                     </button>
                     <button onClick={() => handleDelete(e)} className="flex-none w-10 bg-white border border-gray-200 text-red-600 py-2 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-[#253C6D] text-lg">{editingId ? 'Edit Event Type' : 'Add Event Type'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-[#455B8A] mb-1.5">Event Name (English)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Marriage"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#455B8A] mb-1.5">Tamil Name (Optional)</label>
                <TamilTransliterationInput 
                  language="ta"
                  type="text" 
                  placeholder="e.g. திருமணம்"
                  value={formData.tamilName} 
                  onChange={e => {
                    setIsTamilEdited(true);
                    setFormData({...formData, tamilName: e.target.value});
                  }} 
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]" 
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoadingState} className="flex-1 bg-[#253C6D] text-white py-2.5 rounded-lg font-bold hover:bg-[#30497D] transition-colors disabled:opacity-50">
                  {modalLoadingState ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EventTypes;
