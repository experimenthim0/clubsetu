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
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        ...formData,
        role
      });
      
      // Simple Auth: Store user in localStorage
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('role', res.data.role);
      
      navigate('/');
      window.location.reload(); // Quick way to update Navbar state
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
  <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="text-center text-3xl font-bold text-gray-800">
        Sign in to ClubSetu
      </h2>
    </div>

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-200">

        {/* Role Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`px-4 py-2 text-sm font-medium transition ${
                role === 'student'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('club-head')}
              className={`px-4 py-2 text-sm font-medium transition ${
                role === 'club-head'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Club Head
            </button>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {error && (
            <div className="text-red-500 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg text-white bg-primary hover:bg-primary transition shadow-md"
          >
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or register
            </span>
          </div>
        </div>

        {/* Register Links */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            to="/register/student"
            className="text-center py-2 px-4 rounded-lg border-2 border-primary text-primary   transition"
          >
            As Student
          </Link>

          <Link
            to="/register/club-head"
            className="text-center py-2 px-4 rounded-lg border-2 border-primary text-primary  transition"
          >
            As Club Head
          </Link>
        </div>

      </div>
    </div>
  </div>
);

};

export default Login;
