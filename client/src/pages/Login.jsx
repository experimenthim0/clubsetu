import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

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
      
      navigate('/');
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
      
      navigate('/');
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
        Sign in to Club<span className="text-orange-600">Setu</span>
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
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" size="sm" className="text-xs text-orange-600 hover:text-orange-700 font-bold uppercase tracking-tight">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg text-white transition shadow-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary'}`}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
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

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg text-white transition shadow-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary'}`}
            >
              {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button
               type="button"
               onClick={() => setShowOTP(false)}
               className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Back to Login
            </button>
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

        <div className="mt-6">
          <Link
            to="/register/student"
            className="block text-center py-2 px-4 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition"
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
