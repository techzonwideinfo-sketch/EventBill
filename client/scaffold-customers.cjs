const fs = require('fs');
const path = require('path');

const files = {
  'src/pages/Customers.jsx': `import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const { t } = useContext(I18nContext);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    API.get('/customers').then(res => setCustomers(res.data.data)).catch(console.error);
  };

  const deleteCustomer = async (id) => {
    if(window.confirm('Are you sure?')) {
      await API.delete(\`/customers/\${id}\`);
      fetchCustomers();
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#253C6D]">{t('Customers')}</h2>
      </div>
      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-2">{t('Name')}</th>
              <th className="p-2">{t('Mobile')}</th>
              <th className="p-2">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id} className="border-b">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.phone}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => deleteCustomer(c._id)} className="text-red-600 underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Customers;
`,
  'src/App.jsx': `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import CreateBill from './pages/CreateBill';
import EditBill from './pages/EditBill';
import Customers from './pages/Customers';

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
            <Route path="bills/:id/edit" element={<EditBill />} />
            <Route path="customers" element={<Customers />} />
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
console.log('Frontend customers scaffolded successfully');
