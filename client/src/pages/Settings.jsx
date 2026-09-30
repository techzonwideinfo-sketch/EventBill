import React, { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { I18nContext } from '../layouts/MainLayout';
import TamilTransliterationInput from '../components/TamilTransliterationInput';

const Settings = () => {
  const { user, setUser } = useContext(AuthContext);
  const { t, lang, setLang } = useContext(I18nContext);

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form
  const [profileData, setProfileData] = useState({ name: '', mobile: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password Form
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', mobile: user.mobile || '' });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      const { data } = await API.put('/auth/profile', profileData);
      setUser(data.data); // Update context and header
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Unable to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
    }
    setPasswordLoading(true);
    setPasswordMsg('');
    try {
      await API.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Current password is incorrect' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D]">{t('Settings')}</h1>
        <p className="text-sm text-[#455B8A] mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-row md:flex-col">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex-1 md:flex-none px-4 py-3 text-sm font-bold text-left border-b md:border-b-0 md:border-l-4 ${activeTab === 'profile' ? 'bg-blue-50 text-[#253C6D] border-[#F2842F]' : 'text-[#455B8A] border-transparent hover:bg-gray-50'}`}
            >
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('language')}
              className={`flex-1 md:flex-none px-4 py-3 text-sm font-bold text-left border-b md:border-b-0 md:border-l-4 ${activeTab === 'language' ? 'bg-blue-50 text-[#253C6D] border-[#F2842F]' : 'text-[#455B8A] border-transparent hover:bg-gray-50'}`}
            >
              Language
            </button>
            <button 
              onClick={() => setActiveTab('password')}
              className={`flex-1 md:flex-none px-4 py-3 text-sm font-bold text-left border-b md:border-b-0 md:border-l-4 ${activeTab === 'password' ? 'bg-blue-50 text-[#253C6D] border-[#F2842F]' : 'text-[#455B8A] border-transparent hover:bg-gray-50'}`}
            >
              Password
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#253C6D] border-b border-gray-100 pb-3">Profile Settings</h2>
              
              {profileMsg && (
                <div className={`p-3 rounded-lg text-sm font-bold ${profileMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-[#455B8A] mb-1.5">Email (Read-only)</label>
                  <input type="email" value={user?.email || ''} readOnly className="w-full border border-gray-200 p-2.5 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#455B8A] mb-1.5">Full Name</label>
                  <TamilTransliterationInput language={lang} type="text" required value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#455B8A] mb-1.5">Mobile Number</label>
                  <input type="text" required value={profileData.mobile} onChange={e => setProfileData({...profileData, mobile: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]" />
                </div>
                <button type="submit" disabled={profileLoading} className="bg-[#253C6D] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#30497D] transition-colors disabled:opacity-50">
                  {profileLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* LANGUAGE TAB */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#253C6D] border-b border-gray-100 pb-3">Language Preferences</h2>
              <div className="space-y-4">
                <p className="text-sm text-[#455B8A]">Select your preferred interface language. This changes the application's menus, buttons, and labels.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setLang('en')}
                    className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${lang === 'en' ? 'border-[#F2842F] bg-orange-50 text-[#253C6D]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setLang('ta')}
                    className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${lang === 'ta' ? 'border-[#F2842F] bg-orange-50 text-[#253C6D]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    தமிழ் (Tamil)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASSWORD TAB */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#253C6D] border-b border-gray-100 pb-3">Change Password</h2>
              
              {passwordMsg && (
                <div className={`p-3 rounded-lg text-sm font-bold ${passwordMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-[#455B8A] mb-1.5">Current Password</label>
                  <input type="password" required minLength="6" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#455B8A] mb-1.5">New Password</label>
                  <input type="password" required minLength="6" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#455B8A] mb-1.5">Confirm New Password</label>
                  <input type="password" required minLength="6" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]" />
                </div>
                <button type="submit" disabled={passwordLoading} className="bg-[#253C6D] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#30497D] transition-colors disabled:opacity-50">
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
