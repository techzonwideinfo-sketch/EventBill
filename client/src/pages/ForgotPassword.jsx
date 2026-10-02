import React, { useState } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-password', { email });
      setMessage(data.message || 'Recovery email sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full font-sans bg-white">
      
      {/* Left / Top Branding Panel */}
      <div 
        className="w-full md:w-[46%] lg:w-[45%] h-[200px] md:h-auto relative bg-cover bg-center flex flex-col items-center justify-center shrink-0" 
        style={{ backgroundImage: "url('/event_background.jpg')" }}
      >
        <div className="absolute inset-0 bg-[#253C6D]" style={{ opacity: 0.72 }}></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 md:mt-[-10%]">
          <div className="w-[145px] md:w-[170px]">
            <Logo />
          </div>
          <div className="mt-5 w-[65px] h-[3px] bg-[#F2842F] rounded-[2px] hidden md:block"></div>
        </div>
      </div>

      {/* Right / Bottom Form Panel */}
      <div className="w-full md:w-[54%] lg:w-[55%] flex items-center justify-center bg-white p-6 sm:p-8 md:p-12 min-h-[calc(100vh-200px)] md:min-h-screen">
        <div className="w-full max-w-[450px]">
          
          <div className="text-center md:text-left mb-[40px]">
            <h2 className="text-[32px] font-bold text-[#253C6D] leading-tight">Forgot Password</h2>
            <p className="text-[#455B8A] text-[15px] mt-[8px]">Enter your email to receive a reset link</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col">
            
            {/* Email Field */}
            <div>
              <label className="block text-[14px] font-semibold text-[#253C6D] mb-[6px]">Email</label>
              <input 
                type="email" 
                placeholder="Enter your email" 
                required 
                className="w-full h-[50px] px-[14px] border border-[#D1D5DB] rounded-[8px] focus:ring-1 focus:ring-[#455B8A] focus:border-[#455B8A] outline-none transition-colors bg-white text-[#253C6D]" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
              />
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="mt-[32px] w-full h-[52px] bg-[#253C6D] text-white rounded-[8px] font-bold text-[16px] hover:bg-[#30497D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2842F] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-[30px] text-center text-[14px]">
            <p className="text-[#455B8A]">
              Remember your password? <Link to="/login" className="text-[#F2842F] font-bold hover:underline ml-1">Login here</Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;
