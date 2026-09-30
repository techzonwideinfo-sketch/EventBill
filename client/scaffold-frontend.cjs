const fs = require('fs');
const path = require('path');

const files = {
  'src/i18n/en.json': `{
  "Dashboard": "Dashboard",
  "Create Bill": "Create Bill",
  "Bill History": "Bill History",
  "Customers": "Customers",
  "Event Types": "Event Types",
  "Settings": "Settings",
  "Logout": "Logout",
  "Total Bills": "Total Bills",
  "Total Amount": "Total Amount",
  "Total Paid": "Total Paid",
  "Total Pending": "Total Pending",
  "Recent Bills": "Recent Bills",
  "Customer": "Customer",
  "Event": "Event",
  "Date": "Date",
  "Amount": "Amount",
  "Status": "Status",
  "Actions": "Actions",
  "Login": "Login",
  "Register": "Register",
  "Email": "Email",
  "Password": "Password",
  "Name": "Name",
  "Mobile": "Mobile",
  "Subtotal": "Subtotal",
  "Advance": "Advance Paid",
  "Balance": "Balance Amount"
}`,
  'src/i18n/ta.json': `{
  "Dashboard": "டாஷ்போர்டு",
  "Create Bill": "பில் உருவாக்கவும்",
  "Bill History": "பில் வரலாறு",
  "Customers": "வாடிக்கையாளர்",
  "Event Types": "நிகழ்வு வகை",
  "Settings": "அமைப்புகள்",
  "Logout": "வெளியேறு",
  "Total Bills": "மொத்த பில்கள்",
  "Total Amount": "மொத்த தொகை",
  "Total Paid": "பெறப்பட்ட தொகை",
  "Total Pending": "நிலுவை தொகை",
  "Recent Bills": "சமீபத்திய பில்கள்",
  "Customer": "வாடிக்கையாளர்",
  "Event": "நிகழ்வு",
  "Date": "தேதி",
  "Amount": "தொகை",
  "Status": "நிலை",
  "Actions": "செயல்கள்",
  "Login": "உள்நுழைய",
  "Register": "பதிவு செய்ய",
  "Email": "மின்னஞ்சல்",
  "Password": "கடவுச்சொல்",
  "Name": "பெயர்",
  "Mobile": "தொலைபேசி எண்",
  "Subtotal": "உப-மொத்தம்",
  "Advance": "முன்பணம்",
  "Balance": "மீதமுள்ள தொகை"
}`,
  'src/services/api.js': `import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:5000/api' });
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.authorization = \`Bearer \${token}\`;
  return req;
});
export default API;
`,
  'src/context/AuthContext.jsx': `import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await API.get('/auth/me');
        setUser(data.data);
      } catch (err) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    if (localStorage.getItem('token')) fetchUser();
    else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.data.token);
    setUser(data.data);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
`,
  'src/layouts/MainLayout.jsx': `import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';

export const I18nContext = React.createContext();

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');

  if (!user) {
    navigate('/login');
    return null;
  }

  const t = (key) => (lang === 'en' ? en[key] : ta[key]) || key;

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 bg-[#253C6D] text-white flex flex-col">
          <div className="p-4 text-2xl font-bold border-b border-[#30497D]">EventBill</div>
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/" className="block p-2 hover:bg-[#30497D] rounded">{t('Dashboard')}</Link>
            <Link to="/create-bill" className="block p-2 hover:bg-[#30497D] rounded">{t('Create Bill')}</Link>
            <Link to="/bills" className="block p-2 hover:bg-[#30497D] rounded">{t('Bill History')}</Link>
            <Link to="/customers" className="block p-2 hover:bg-[#30497D] rounded">{t('Customers')}</Link>
          </nav>
          <div className="p-4 border-t border-[#30497D]">
            <button onClick={logout} className="w-full text-left p-2 hover:bg-[#30497D] rounded">{t('Logout')}</button>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white p-4 shadow flex justify-between items-center">
            <h2 className="text-xl text-[#253C6D] font-bold">Event Management</h2>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">English | தமிழ்</span>
              <select value={lang} onChange={e => setLang(e.target.value)} className="border rounded p-1">
                <option value="en">EN</option>
                <option value="ta">TA</option>
              </select>
              <div className="font-semibold">{user.name}</div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </I18nContext.Provider>
  );
};
export default MainLayout;
`,
  'src/pages/Login.jsx': `import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('demo@eventbill.local');
  const [password, setPassword] = useState('Demo@12345');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-96 border-t-4 border-[#F2842F]">
        <h2 className="text-2xl font-bold text-[#253C6D] mb-6 text-center">EventBill Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-[#253C6D] text-white p-2 rounded font-bold hover:bg-[#30497D]">Login</button>
        </form>
      </div>
    </div>
  );
};
export default Login;
`,
  'src/pages/Dashboard.jsx': `import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const { t } = useContext(I18nContext);

  useEffect(() => {
    API.get('/dashboard/stats').then(res => setStats(res.data.data)).catch(console.error);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#253C6D]">{t('Dashboard')}</h1>
        <Link to="/create-bill" className="bg-[#F2842F] text-white px-4 py-2 rounded shadow">+ {t('Create Bill')}</Link>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow border-l-4 border-[#253C6D]">
          <p className="text-gray-500">{t('Total Bills')}</p>
          <h3 className="text-2xl font-bold">{stats.totalBills}</h3>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-[#30497D]">
          <p className="text-gray-500">{t('Total Amount')}</p>
          <h3 className="text-2xl font-bold">₹{stats.totalAmount}</h3>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-[#455B8A]">
          <p className="text-gray-500">{t('Total Paid')}</p>
          <h3 className="text-2xl font-bold text-green-600">₹{stats.totalPaid}</h3>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-[#F2842F]">
          <p className="text-gray-500">{t('Total Pending')}</p>
          <h3 className="text-2xl font-bold text-red-600">₹{stats.totalPending}</h3>
        </div>
      </div>
      
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-xl font-bold mb-4">{t('Recent Bills')}</h3>
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Bill No</th>
              <th className="p-2">{t('Customer')}</th>
              <th className="p-2">{t('Event')}</th>
              <th className="p-2">{t('Amount')}</th>
              <th className="p-2">{t('Status')}</th>
              <th className="p-2">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentBills.map(b => (
              <tr key={b._id} className="border-t">
                <td className="p-2 font-mono text-[#253C6D]">{b.billNumber}</td>
                <td className="p-2">{b.customerSnapshot?.name || (b.customerId ? b.customerId.name : '')}</td>
                <td className="p-2">{b.eventType}</td>
                <td className="p-2">₹{b.totalAmount}</td>
                <td className="p-2"><span className={\`px-2 py-1 rounded text-xs \${b.paymentStatus==='Paid'?'bg-green-100 text-green-800':'bg-orange-100 text-orange-800'}\`}>{b.paymentStatus}</span></td>
                <td className="p-2 space-x-2">
                  <a href={\`http://localhost:5000/api/bills/\${b._id}/pdf\`} target="_blank" className="text-blue-600 underline">PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Dashboard;
`,
  'src/App.jsx': `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            {/* Add more routes here */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
`,
  'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Frontend scaffolded successfully');
