import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, formData);
      
      if (res.data.needs2FA) {
        setShowOTP(true);
        setError('');
        return;
      }

      // Store user, token, role
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('token', res.data.token);
      
      if (res.data.role === 'lostFoundAdmin') {
        navigate('/admin/lost-found');
      } else {
        navigate('/');
      }
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-2fa`, {
        email: formData.email,
        otp
      });
      
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('token', res.data.token);
      
      if (res.data.role === 'lostFoundAdmin') {
        navigate('/admin/lost-found');
      } else {
        navigate('/');
      }
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="text-center text-3xl font-bold text-gray-800">
        Sign in to Campus<span className="text-orange-600">Node</span>
      </h2>
    </div>

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-200">

        {!showOTP ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700 hover:underline font-medium tracking-tight">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-2.5 rounded-lg text-white transition shadow-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/80 cursor-pointer'}`}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerifyOTP}>
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">2-Step Verification</h3>
              <p className="text-sm text-gray-600">Enter the 6-digit code sent to your email.</p>
            </div>
            
            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

            <div>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center text-2xl tracking-widest px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-2.5 rounded-lg text-white transition shadow-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary'}`}
              >
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                 type="button"
                 onClick={() => setShowOTP(false)}
                 className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">New student?</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            to="/register/student"
            className="inline-block text-center py-2 px-8 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition"
          >
            Register as Student
          </Link>
        </div>
      </div>
    </div>
  </div>
);

};

export default Login;
