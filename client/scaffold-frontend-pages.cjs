const fs = require('fs');
const path = require('path');

const files = {
  'src/pages/Bills.jsx': `import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { Link, useNavigate } from 'react-router-dom';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const { t } = useContext(I18nContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = () => {
    API.get('/bills').then(res => setBills(res.data.data)).catch(console.error);
  };

  const useAsNew = async (id) => {
    try {
      const { data } = await API.post(\`/bills/\${id}/use-as-new\`);
      alert(t('New bill created successfully'));
      navigate(\`/bills/\${data.data._id}/edit\`);
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteBill = async (id) => {
    if(window.confirm('Are you sure you want to delete this bill?')) {
      await API.delete(\`/bills/\${id}\`);
      fetchBills();
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#253C6D]">{t('Bill History')}</h2>
        <Link to="/create-bill" className="bg-[#F2842F] text-white px-4 py-2 rounded">+ {t('Create Bill')}</Link>
      </div>
      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-2">Bill No</th>
              <th className="p-2">{t('Customer')}</th>
              <th className="p-2">{t('Event')}</th>
              <th className="p-2">{t('Date')}</th>
              <th className="p-2">{t('Amount')}</th>
              <th className="p-2">{t('Status')}</th>
              <th className="p-2">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b._id} className="border-b">
                <td className="p-2 font-mono text-[#253C6D]">{b.billNumber}</td>
                <td className="p-2">{b.customerSnapshot?.name || ''}</td>
                <td className="p-2">{b.eventType}</td>
                <td className="p-2">{new Date(b.eventDate).toLocaleDateString()}</td>
                <td className="p-2 font-bold">₹{b.totalAmount}</td>
                <td className="p-2"><span className={\`px-2 py-1 rounded text-xs \${b.paymentStatus==='Paid'?'bg-green-100 text-green-800':'bg-orange-100 text-orange-800'}\`}>{b.paymentStatus}</span></td>
                <td className="p-2 space-x-2">
                  <a href={\`http://localhost:5000/api/bills/\${b._id}/pdf\`} target="_blank" className="text-blue-600 underline">PDF</a>
                  <button onClick={() => useAsNew(b._id)} className="text-[#253C6D] underline">Use As New</button>
                  <button onClick={() => deleteBill(b._id)} className="text-red-600 underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Bills;
`,
  'src/pages/CreateBill.jsx': `import React, { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';

const CreateBill = () => {
  const { t } = useContext(I18nContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerSnapshot: { name: '', phone: '', address: '' },
    eventType: 'Marriage',
    eventDate: new Date().toISOString().slice(0,10),
    venue: '',
    items: [{ service: '', quantity: 1, rate: 0 }],
    advancePaid: 0,
    billLanguage: 'English'
  });

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

  const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const balance = subtotal - formData.advancePaid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        items: formData.items.map(i => ({ ...i, amount: i.quantity * i.rate }))
      };
      await API.post('/bills', dataToSubmit);
      alert(t('Bill created successfully'));
      navigate('/bills');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-[#253C6D]">{t('Create Bill')}</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow rounded space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-[#30497D] mb-2">{t('Customer Details')}</h3>
            <input type="text" placeholder={t('Name')} required className="w-full border p-2 rounded mb-2" value={formData.customerSnapshot.name} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, name: e.target.value}}))} />
            <input type="text" placeholder={t('Mobile')} required className="w-full border p-2 rounded mb-2" value={formData.customerSnapshot.phone} onChange={e=>setFormData(prev=>({...prev, customerSnapshot:{...prev.customerSnapshot, phone: e.target.value}}))} />
          </div>
          <div>
            <h3 className="font-bold text-[#30497D] mb-2">{t('Event Details')}</h3>
            <select className="w-full border p-2 rounded mb-2" value={formData.eventType} onChange={e=>setFormData(prev=>({...prev, eventType: e.target.value}))}>
              <option value="Marriage">Marriage</option>
              <option value="Baby Shower">Baby Shower</option>
              <option value="Housewarming">Housewarming</option>
              <option value="Birthday">Birthday</option>
              <option value="Other">Other</option>
            </select>
            <input type="date" required className="w-full border p-2 rounded mb-2" value={formData.eventDate} onChange={e=>setFormData(prev=>({...prev, eventDate: e.target.value}))} />
          </div>
        </div>

        <div>
          <h3 className="font-bold text-[#30497D] mb-2">{t('Services')}</h3>
          {formData.items.map((item, index) => (
            <div key={index} className="flex space-x-2 mb-2 items-center">
              <input type="text" placeholder="Service" required className="flex-1 border p-2 rounded" value={item.service} onChange={e=>updateItem(index, 'service', e.target.value)} />
              <input type="number" placeholder="Qty" required className="w-20 border p-2 rounded" value={item.quantity} onChange={e=>updateItem(index, 'quantity', e.target.value)} />
              <input type="number" placeholder="Rate" required className="w-32 border p-2 rounded" value={item.rate} onChange={e=>updateItem(index, 'rate', e.target.value)} />
              <span className="w-32 p-2 bg-gray-100 rounded text-right">₹{item.quantity * item.rate}</span>
              {index > 0 && <button type="button" onClick={()=>removeItem(index)} className="text-red-500 font-bold p-2">X</button>}
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-[#F2842F] font-bold">+ Add Item</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-[#30497D] mb-2">{t('Bill Language')}</h3>
            <select className="w-full border p-2 rounded" value={formData.billLanguage} onChange={e=>setFormData(prev=>({...prev, billLanguage: e.target.value}))}>
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="English + Tamil">English + Tamil</option>
            </select>
          </div>
          <div className="bg-gray-50 p-4 rounded border text-right space-y-2">
            <div><span className="text-gray-500 mr-4">{t('Subtotal')}:</span><span className="font-bold text-xl">₹{subtotal}</span></div>
            <div>
              <span className="text-gray-500 mr-4">{t('Advance')}:</span>
              <input type="number" className="border p-1 rounded w-24 text-right" value={formData.advancePaid} onChange={e=>setFormData(prev=>({...prev, advancePaid: Number(e.target.value)}))} />
            </div>
            <div className="pt-2 border-t"><span className="text-gray-500 mr-4">{t('Balance')}:</span><span className="font-bold text-xl text-[#F2842F]">₹{balance}</span></div>
          </div>
        </div>

        <button type="submit" className="w-full bg-[#253C6D] text-white p-3 rounded font-bold hover:bg-[#30497D] shadow">Save Bill</button>
      </form>
    </div>
  );
};
export default CreateBill;
`,
  'src/App.jsx': `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import CreateBill from './pages/CreateBill';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bills" element={<Bills />} />
            <Route path="create-bill" element={<CreateBill />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Frontend pages scaffolded successfully');
