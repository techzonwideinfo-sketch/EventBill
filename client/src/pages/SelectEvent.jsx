import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';

const SelectEvent = () => {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useContext(I18nContext);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/event-types')
      .then(res => {
        const activeEvents = res.data.data.filter(e => e.isActive);
        setEventTypes(activeEvents);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSelectEvent = (event) => {
    navigate('/create-bill', { state: { selectedEvent: event } });
  };

  if (loading) {
    return <div className="p-8 text-center text-[#455B8A] font-medium">Loading events...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D]">{t('Select Event')}</h1>
          <p className="text-sm text-[#455B8A] mt-1">Choose an event type to start creating a new bill.</p>
        </div>
      </div>

      {eventTypes.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-gray-100 mt-8">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl text-[#253C6D] font-bold mb-2">No Active Events</h2>
          <p className="text-[#455B8A] mb-6">Ask your administrator to configure active events before billing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {eventTypes.map(event => (
            <div key={event._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                {event.logo ? (
                  <img src={event.logo} alt={event.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-3xl font-bold uppercase">
                    {event.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-[#253C6D] mb-1">
                  {lang === 'ta' && event.tamilName ? event.tamilName : event.name}
                </h3>
                <p className="text-sm text-gray-500 flex-1">{event.description || 'No description provided.'}</p>
                
                <button 
                  onClick={() => handleSelectEvent(event)} 
                  className="mt-5 w-full bg-[#253C6D] text-white py-2.5 rounded-xl font-bold hover:bg-[#30497D] transition-colors shadow-sm"
                >
                  Select Event
                </button>
              </div>
            </div>
          ))}
          
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate('/settings')}>
             <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-3">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
             </div>
             <h3 className="font-bold text-gray-600">Manage Events</h3>
             <p className="text-xs text-gray-400 mt-1">Configure event types in Settings</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectEvent;
