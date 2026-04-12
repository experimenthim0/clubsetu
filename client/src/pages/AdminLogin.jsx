import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('admin', JSON.stringify(res.data.admin));
        localStorage.setItem('token', res.data.token);
        showNotification('Welcome back, Admin!', 'success');
        navigate('/admin-dashboard');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white border-2 border-gray-300 p-8 rounded-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-300 text-black rounded-sm flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ri-shield-user-line" />
            </div>
            <h1 className="text-2xl font-medium text-black  tracking-tight">Admin Portal</h1>
            <p className="text-neutral-500 text-xs font-medium  tracking-widest mt-2">Restricted Access only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-black  tracking-widest mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-sm focus:border-orange-600 outline-none transition-colors font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black  tracking-widest mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border-2 border-black rounded-sm focus:border-orange-600 outline-none transition-colors font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-black uppercase tracking-widest border-2 border-black rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all  active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Go to Dashboard'}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] text-neutral-400 mt-6 font-bold uppercase tracking-widest">
          Authorized personnel only. All access attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
