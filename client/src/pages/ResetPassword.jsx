import React, { useState } from 'react';
import API from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await API.put(`/auth/reset-password/${token}`, { password });
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
            <h2 className="text-[32px] font-bold text-[#253C6D] leading-tight">Reset Password</h2>
            <p className="text-[#455B8A] text-[15px] mt-[8px]">Enter your new password below</p>
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

          <form onSubmit={handleSubmit} className="flex flex-col space-y-[22px]">
            
            {/* Password Field */}
            <div>
              <label className="block text-[14px] font-semibold text-[#253C6D] mb-[6px]">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create new password" 
                  required 
                  className="w-full h-[50px] pl-[14px] pr-[45px] border border-[#D1D5DB] rounded-[8px] focus:ring-1 focus:ring-[#455B8A] focus:border-[#455B8A] outline-none transition-colors bg-white text-[#253C6D]" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[14px] top-[15px] text-[#455B8A] hover:text-[#253C6D] font-medium text-[13px] focus:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-[14px] font-semibold text-[#253C6D] mb-[6px]">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Confirm new password" 
                  required 
                  className="w-full h-[50px] pl-[14px] pr-[45px] border border-[#D1D5DB] rounded-[8px] focus:ring-1 focus:ring-[#455B8A] focus:border-[#455B8A] outline-none transition-colors bg-white text-[#253C6D]" 
                  value={confirmPassword} 
                  onChange={e=>setConfirmPassword(e.target.value)} 
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="mt-[32px] w-full h-[52px] bg-[#253C6D] text-white rounded-[8px] font-bold text-[16px] hover:bg-[#30497D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2842F] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-[30px] text-center text-[14px]">
            <p className="text-[#455B8A]">
              Return to <Link to="/login" className="text-[#F2842F] font-bold hover:underline ml-1">Login</Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ResetPassword;
