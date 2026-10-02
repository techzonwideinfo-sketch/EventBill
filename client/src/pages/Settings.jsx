import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { I18nContext } from '../layouts/MainLayout';

const Settings = () => {
  const { t } = useContext(I18nContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    staticQrImage: '',
    upiId: '',
    dynamicQrProvider: 'None',
    razorpayKeyId: '',
    razorpayKeySecret: ''
  });

  useEffect(() => {
    API.get('/auth/me')
      .then(res => {
        if (res.data.data.paymentSettings) {
          setSettings(res.data.data.paymentSettings);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, staticQrImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/settings/payments', { paymentSettings: settings });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving settings');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-[#455B8A]">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#253C6D]">Account Settings</h1>
        <p className="text-sm text-[#455B8A] mt-1">Configure your business profile and payment integrations.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 shadow-sm rounded-xl border border-gray-100 border-t-4 border-t-[#253C6D] space-y-8">
        
        {/* Static QR Configuration */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-2">
            Static Merchant QR (UPI)
          </h3>
          <p className="text-sm text-gray-500">Upload your business UPI QR code. This will be shown on the POS payment screen for customers to scan.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">UPI ID (VPA)</label>
              <input 
                type="text" 
                placeholder="e.g. merchant@upi"
                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]"
                value={settings.upiId || ''}
                onChange={e => setSettings(prev => ({ ...prev, upiId: e.target.value }))}
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">QR Code Image</label>
              {settings.staticQrImage && (
                <div className="w-32 h-32 border border-gray-200 rounded-lg p-2 bg-white flex items-center justify-center">
                  <img src={settings.staticQrImage} alt="QR Code" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#30497D] hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Dynamic QR Configuration (Optional) */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-[#30497D] text-lg border-b border-gray-100 pb-2">
            Dynamic QR Provider (Optional)
          </h3>
          <p className="text-sm text-gray-500">Enable automatic payment verification through supported providers. Leave as "None" if you prefer manual static QR reconciliation.</p>
          
          <div>
            <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">Select Provider</label>
            <select 
              className="w-full sm:w-1/2 border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-gray-50 text-[#253C6D]"
              value={settings.dynamicQrProvider || 'None'}
              onChange={e => setSettings(prev => ({ ...prev, dynamicQrProvider: e.target.value }))}
            >
              <option value="None">None (Mock Mode / Manual)</option>
              <option value="Razorpay">Razorpay</option>
            </select>
          </div>

          {settings.dynamicQrProvider === 'Razorpay' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50 p-4 rounded-xl border border-orange-100 mt-4">
              <div className="md:col-span-2">
                <p className="text-sm font-bold text-orange-700">Razorpay Configuration</p>
                <p className="text-xs text-orange-600">Enter your Razorpay API credentials. These are securely stored and used to generate dynamic UPI QR codes and verify webhooks.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">Key ID</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-white text-[#253C6D]"
                  value={settings.razorpayKeyId || ''}
                  onChange={e => setSettings(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#455B8A] mb-1.5">Key Secret</label>
                <input 
                  type="password" 
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-[#30497D] outline-none bg-white text-[#253C6D]"
                  value={settings.razorpayKeySecret || ''}
                  onChange={e => setSettings(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-3 bg-[#F2842F] text-white rounded-lg font-bold hover:bg-orange-500 shadow-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
