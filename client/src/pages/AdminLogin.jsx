import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { adminLogin } = useAuth();
  const { showNotification } = useNotification();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(email, password);
      showNotification('Welcome back, Admin!', 'success');
      // Navigation is handled by AuthContext
    } catch (err) {
      showNotification(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col">
          <div className="text-center mb-8 ">
            <div className="rounded-sm flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-user-line text-4xl" />
            </div>
            <h1 className="text-2xl font-medium text-black  tracking-tight">Admin Portal</h1>
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full px-4 py-3 pr-10 border-2 rounded-sm focus:border-orange-600 outline-none transition-colors font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-black text-white font-black uppercase tracking-widest border-2 border-black rounded-full hover:bg-orange-600 hover:border-orange-600 transition-all  active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Go to Dashboard'}
              </button>
            </div>
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
