import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email, role });
      setMessage(res.data.message);
      showNotification(res.data.message, 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-black text-black">
          Forgot <span className="text-orange-600">Password</span>
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 font-bold uppercase tracking-widest">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border-2 border-black shadow-[8px_8px_0px_#000] rounded-sm">
          
          <div className="flex justify-center mb-6">
            <div className="inline-flex border-2 border-black rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex-1 py-1 text-sm font-bold tracking-tight border-2 border-black rounded transition-colors ${
                  role === 'member' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-50'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('club')}
                className={`flex-1 py-1 text-sm font-bold tracking-tight border-2 border-black rounded transition-colors ${
                  role === 'club' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-50'
                }`}
              >
                Club Head
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                College Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black rounded-sm focus:outline-none focus:ring-0 focus:border-orange-600 transition-colors"
                placeholder="name.branch.year@nitj.ac.in"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>

          {message && (
            <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-200 text-orange-700 text-sm font-bold text-center">
              {message}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-xs font-black uppercase tracking-widest text-black hover:text-orange-600 underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
