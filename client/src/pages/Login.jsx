import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
            <h2 className="text-[32px] font-bold text-[#253C6D] leading-tight">Welcome Back</h2>
            <p className="text-[#455B8A] text-[15px] mt-[8px]">Login to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm">
              {error}
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
            
            {/* Password Field */}
            <div className="mt-[22px]">
              <label className="block text-[14px] font-semibold text-[#253C6D] mb-[6px]">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password" 
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

            {/* Forgot Password */}
            <div className="text-right mt-[10px]">
              <Link to="/forgot-password" className="text-[13.5px] text-[#30497D] hover:text-[#F2842F] transition-colors font-medium">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="mt-[32px] w-full h-[52px] bg-[#253C6D] text-white rounded-[8px] font-bold text-[16px] hover:bg-[#30497D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2842F] focus:ring-offset-2"
            >
              Login
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-[30px] text-center text-[14px]">
            <p className="text-[#455B8A]">
              Don't have an account? <Link to="/register" className="text-[#F2842F] font-bold hover:underline ml-1">Register here</Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;
