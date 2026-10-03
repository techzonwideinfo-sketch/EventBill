import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import TamilTransliterationInput from '../components/TamilTransliterationInput';
import { transliterateText } from '../utils/tamilTransliteration';

const EventTypes = () => {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useContext(I18nContext);

  // Modal State for Event
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', tamilName: '', logo: '', description: '', defaultVenue: '', isActive: true });
  const [isTamilEdited, setIsTamilEdited] = useState(false);
  const [modalLoadingState, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Modal State for Services
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  
  // New Service Form
  const [serviceForm, setServiceForm] = useState({ name: '', defaultUnitPrice: 0, defaultQuantity: 1 });

  // Auto-transliterate English name
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
      setFormData({ 
        name: event.name, 
        tamilName: event.tamilName || '', 
        logo: event.logo || '', 
        description: event.description || '', 
        defaultVenue: event.defaultVenue || '', 
        isActive: event.isActive 
      });
      setIsTamilEdited(!!event.tamilName);
    } else {
      setEditingId(null);
      setFormData({ name: '', tamilName: '', logo: '', description: '', defaultVenue: '', isActive: true });
      setIsTamilEdited(false);
    }
    setModalError('');
    setIsModalOpen(true);
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
      setIsModalOpen(false);
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
    if(window.confirm(`Are you sure you want to delete "${event.name}"? If it is used in existing bills, it will be disabled instead.`)) {
      try {
        const { data } = await API.delete(`/event-types/${event._id}`);
        if(data.message.includes('disabled')) alert(data.message);
        fetchEventTypes();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting event type');
      }
    }
  };

  // --- Services Management ---
  const openServices = async (event) => {
    setSelectedEvent(event);
    setIsServicesModalOpen(true);
    fetchServices(event._id);
  };

  const fetchServices = async (eventId) => {
    setServicesLoading(true);
    try {
      const { data } = await API.get(`/event-types/${eventId}/services`);
      setServices(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name) return;
    try {
      await API.post(`/event-types/${selectedEvent._id}/services`, serviceForm);
      setServiceForm({ name: '', defaultUnitPrice: 0, defaultQuantity: 1 });
      fetchServices(selectedEvent._id);
    } catch (err) {
      alert('Error adding service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if(window.confirm('Delete this service?')) {
      try {
        await API.delete(`/services/${serviceId}`);
        fetchServices(selectedEvent._id);
      } catch (err) {
        alert('Error deleting service');
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#253C6D]">Event Management</h1>
          <p className="text-sm text-[#455B8A] mt-1">Configure events, venues, and their service catalogues.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-[#F2842F] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-500">
          + Add Event
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-500">Loading events...</div> : (
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase">Event</th>
                <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase text-center">Status</th>
                <th className="px-5 py-3 text-xs font-bold text-[#455B8A] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eventTypes.map(e => (
                <tr key={e._id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {e.logo ? (
                        <img src={e.logo} alt="logo" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-bold">{e.name.charAt(0)}</div>
                      )}
                      <div>
                        <div className="font-bold text-[#253C6D]">{e.name}</div>
                        <div className="text-xs text-gray-500">{e.tamilName || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => handleToggleStatus(e)} className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {e.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button onClick={() => openServices(e)} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100">
                      Services
                    </button>
                    <button onClick={() => handleOpenModal(e)} className="text-xs font-bold bg-gray-50 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(e)} className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Main Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-[#253C6D] text-lg">{editingId ? 'Edit Event' : 'Add Event'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {modalError && <div className="p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg">{modalError}</div>}
              
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center">
                  {formData.logo ? <img src={formData.logo} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">No Image</span>}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#455B8A] mb-1">Event Logo (Optional)</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#455B8A] mb-1">Name (English)</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#30497D]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#455B8A] mb-1">Tamil Name</label>
                <TamilTransliterationInput language="ta" type="text" value={formData.tamilName} onChange={e => { setIsTamilEdited(true); setFormData({...formData, tamilName: e.target.value}); }} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#30497D]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#455B8A] mb-1">Description (Optional)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#30497D]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#455B8A] mb-1">Default Venue (Optional)</label>
                <input type="text" value={formData.defaultVenue} onChange={e => setFormData({...formData, defaultVenue: e.target.value})} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#30497D]" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white border text-gray-600 py-2.5 rounded-lg font-bold">Cancel</button>
                <button type="submit" disabled={modalLoadingState} className="flex-1 bg-[#253C6D] text-white py-2.5 rounded-lg font-bold">{modalLoadingState ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {isServicesModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-[#253C6D] text-lg">Services for {selectedEvent.name}</h3>
                <p className="text-xs text-gray-500">Configure default prices and items loaded for this event.</p>
              </div>
              <button onClick={() => setIsServicesModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            
            <div className="p-5 bg-blue-50 border-b border-blue-100">
              <form onSubmit={handleAddService} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#455B8A] mb-1">Service Name</label>
                  <TamilTransliterationInput language="ta" required type="text" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full border p-2 rounded outline-none" />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-[#455B8A] mb-1">Def. Qty</label>
                  <input type="number" value={serviceForm.defaultQuantity} onChange={e => setServiceForm({...serviceForm, defaultQuantity: e.target.value})} className="w-full border p-2 rounded outline-none" />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-bold text-[#455B8A] mb-1">Def. Price</label>
                  <input type="number" value={serviceForm.defaultUnitPrice} onChange={e => setServiceForm({...serviceForm, defaultUnitPrice: e.target.value})} className="w-full border p-2 rounded outline-none" />
                </div>
                <button type="submit" className="bg-[#253C6D] text-white px-4 py-2 rounded font-bold h-[38px]">+ Add</button>
              </form>
            </div>

            <div className="flex-1 overflow-auto p-5">
              {servicesLoading ? <div className="text-center text-gray-500">Loading...</div> : services.length === 0 ? <div className="text-center text-gray-500 py-8">No services configured. Add one above.</div> : (
                <div className="space-y-2">
                  {services.map(s => (
                    <div key={s._id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                      <div>
                        <div className="font-bold text-[#253C6D]">{s.name}</div>
                        <div className="text-xs text-gray-500">Qty: {s.defaultQuantity} @ ₹{s.defaultUnitPrice}</div>
                      </div>
                      <button onClick={() => handleDeleteService(s._id)} className="text-red-500 hover:text-red-700">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EventTypes;
