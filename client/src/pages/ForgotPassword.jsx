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
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        { email, role }
      );
      setMessage(res.data.message);
      showNotification(res.data.message, 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-md p-8">
        {/* Header */}
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Forgot <span className="text-orange-600">Password</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Enter your email and we’ll send you a reset link
        </p>

        {/* Role Toggle */}
        <div className="flex justify-center mt-6 mb-8">
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                role === 'student'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('club')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                role === 'club'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Club Head
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              College Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
              placeholder="example@nitj.ac.in"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 text-white font-bold uppercase tracking-wider rounded-md shadow hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div className="mt-6 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium text-center rounded-md">
            {message}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-orange-600 underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
