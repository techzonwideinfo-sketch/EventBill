import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from 'react-router-dom';

const isElectron = navigator.userAgent.toLowerCase().includes('electron');
const Router = isElectron ? HashRouter : BrowserRouter;

function RouteTitle() {
  const location = useLocation();
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('login') || path.includes('register')) {
      document.title = 'EventBill';
    } else if (path === '/' || path === '/dashboard') {
      document.title = 'EventBill | Dashboard';
    } else if (path.includes('create-bill')) {
      document.title = 'EventBill | Create Bill';
    } else if (path.includes('edit')) {
      document.title = 'EventBill | Edit Bill';
    } else if (path.includes('bills') && !path.includes('print')) {
      document.title = 'EventBill | Bill History';
    } else if (path.includes('customers')) {
      document.title = 'EventBill | Customers';
    } else if (path.includes('event-types')) {
      document.title = 'EventBill | Event Types';
    } else if (path.includes('settings')) {
      document.title = 'EventBill | Settings';
    } else {
      document.title = 'EventBill';
    }
  }, [location]);
  return null;
}
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import CreateBill from './pages/CreateBill';
import EditBill from './pages/EditBill';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import PrintBill from './pages/PrintBill';
import SelectEvent from './pages/SelectEvent';
import EventTypes from './pages/EventTypes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <RouteTitle />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bills" element={<Bills />} />
            <Route path="select-event" element={<SelectEvent />} />
            <Route path="create-bill" element={<CreateBill />} />
            <Route path="bills/:id/edit" element={<EditBill />} />
            <Route path="customers" element={<Customers />} />
            <Route path="event-types" element={<EventTypes />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/bills/:id/print" element={<PrintBill />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
