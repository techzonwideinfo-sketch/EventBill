import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const validateMobile = (mobile) => {
    // Basic 10-digit Indian mobile validation
    const cleaned = mobile.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (!validateMobile(mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, mobile, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full font-sans bg-[#F8FAFC]">
      
      {/* Left Branding Panel */}
      <div className="w-full md:w-[45%] lg:w-[40%] bg-[#253C6D] flex flex-col items-center justify-center p-10 shrink-0 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-white opacity-5"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white opacity-5"></div>
        
        <div className="relative z-10 text-center flex flex-col items-center py-10 md:py-0">
          <div className="mb-6 flex items-center justify-center bg-white p-4 rounded-2xl shadow-2xl">
             <span className="text-[#253C6D] font-black text-4xl tracking-tighter uppercase">
               MOI <span className="text-[#F2842F]">BILL</span>
             </span>
          </div>
          <h1 className="text-white text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Create Account
          </h1>
          <p className="text-[#93A5C9] text-lg font-medium tracking-wide max-w-sm">
            Professional Moi Management System
          </p>
          <div className="mt-8 w-16 h-1 bg-[#F2842F] rounded-full"></div>
          <p className="text-[#93A5C9] text-sm mt-8 opacity-80">
            Simple. Fast. Reliable.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full md:w-[55%] lg:w-[60%] flex items-center justify-center bg-[#F8FAFC] p-6 sm:p-10 md:p-16">
        <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 my-8">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1E293B] mb-2">Register</h2>
            <p className="text-[#64748B] text-sm">Register to manage your MOI bills</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 text-sm font-medium flex items-center">
              <svg className="w-5 h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-2">Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  required 
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-[#1E293B] font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C6D] focus:border-transparent transition-all disabled:opacity-50" 
                  value={name} 
                  onChange={e => {setName(e.target.value); setError('');}} 
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  required 
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-[#1E293B] font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C6D] focus:border-transparent transition-all disabled:opacity-50" 
                  value={email} 
                  onChange={e => {setEmail(e.target.value); setError('');}} 
                />
              </div>
            </div>
            
            {/* Mobile Field */}
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-2">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  type="tel" 
                  placeholder="Enter your mobile number" 
                  required 
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-[#1E293B] font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C6D] focus:border-transparent transition-all disabled:opacity-50" 
                  value={mobile} 
                  onChange={e => {setMobile(e.target.value); setError('');}} 
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a password" 
                  required 
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-[#1E293B] font-medium placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C6D] focus:border-transparent transition-all disabled:opacity-50" 
                  value={password} 
                  onChange={e => {setPassword(e.target.value); setError('');}} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#253C6D] focus:outline-none transition-colors disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 mt-4 bg-[#253C6D] text-white rounded-xl font-bold text-[16px] hover:bg-[#30497D] transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-[#93A5C9] disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#64748B]">
              Already have an account? 
              <Link to="/login" className="text-[#F2842F] font-bold hover:text-[#d77224] transition-colors ml-1">
                Login
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Register;
