import React, { useContext, useState, useRef, useEffect } from 'react';
import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';
import Logo from '../components/Logo';

export const I18nContext = React.createContext();

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const profileRef = useRef(null);
  
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const t = (key) => (lang === 'en' ? en[key] : ta[key]) || key;
  
  const getNavClass = (path) => {
    const baseClass = "flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 border-l-4";
    const isActive = (path === '/' && location.pathname === '/') || (path !== '/' && location.pathname.startsWith(path));
    
    if (isActive) {
      return `${baseClass} bg-[#455B8A] text-white border-[#F2842F]`;
    }
    return `${baseClass} border-transparent text-gray-300 hover:bg-[#30497D] hover:text-white`;
  };

  const navLinks = [
    { name: t('Dashboard'), path: '/' },
    { name: t('Create Bill'), path: '/create-bill' },
    { name: t('Bill History'), path: '/bills' },
    { name: t('Customers'), path: '/customers' },
    // Mock routes for requested UI
    { name: t('Event Types'), path: '/event-types' },
    { name: t('Settings'), path: '/settings' }
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] md:w-[250px] md:max-w-none bg-[#253C6D] text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          
          {/* Mobile Sidebar Header */}
          <div className="md:hidden flex items-center justify-between h-[56px] px-4 border-b border-[#30497D]">
            <span className="font-bold text-gray-200">Navigation</span>
            <button 
              className="text-white w-[40px] h-[40px] flex items-center justify-center text-2xl bg-[#30497D] hover:bg-[#455B8A] rounded transition-colors" 
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className={getNavClass(link.path)}>
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>
          
          <div className="p-4 border-t border-[#30497D] mt-auto">
            <button onClick={logout} className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:bg-[#30497D] hover:text-white rounded transition-colors">
              {t('Logout')}
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header */}
          <header className="h-[60px] md:h-[68px] bg-white shadow-sm border-b flex items-center justify-between pl-[20px] md:pl-[24px] lg:pl-[32px] pr-4 sm:pr-6 z-30 shrink-0">
            <div className="flex items-center h-full">
              <button 
                className="mr-4 text-gray-500 hover:text-[#253C6D] focus:outline-none md:hidden text-2xl flex items-center justify-center w-[40px] h-[40px] shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
              <Link to="/" className="header-logo-container">
                <Logo className="header-logo" />
              </Link>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              
              {/* Language Switcher */}
              <div className="relative">
                <select 
                  value={lang} 
                  onChange={e => setLang(e.target.value)} 
                  className="appearance-none bg-gray-50 border border-gray-200 text-[#455B8A] text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#30497D] font-medium cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ்</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#455B8A]">
                  ▼
                </div>
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none hover:bg-gray-50 p-1 rounded-md transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-8 h-8 rounded bg-[#F2842F] text-white flex items-center justify-center font-bold text-sm">
                    {getInitials(user?.name)}
                  </div>
                  <div className="hidden md:flex items-center space-x-1">
                    <span className="text-sm font-semibold text-[#253C6D] max-w-[120px] truncate">{user?.name}</span>
                    <span className="text-xs text-[#455B8A]">▼</span>
                  </div>
                </button>
                
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                      <p className="text-sm font-semibold text-[#253C6D] truncate">{user?.name}</p>
                    </div>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#253C6D]">Profile Settings</Link>
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </div>
                )}
              </div>
            </div>
          </header>
          
          {/* Scrollable Content Container */}
          <main className="flex-1 overflow-auto bg-gray-50 pt-[30px] px-4 sm:px-6 md:px-8 pb-8">
            <div className="max-w-[1400px] w-full mx-auto">
              <Outlet />
            </div>
          </main>
          
        </div>
      </div>
    </I18nContext.Provider>
  );
};

export default MainLayout;
