import React, { useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';

export default function AdminLoginPage({ onAdminLoginSuccess, onBackToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Admin login failed');
        return;
      }

      // Check if user has admin role
      if (data.user.role !== 'admin') {
        setError('You do not have admin privileges');
        return;
      }

      // Success - call the callback with user data and token
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(data.user, data.token);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="py-8 px-8 text-center border-b-2 border-purple-200 bg-white shadow-sm">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Shield size={40} className="text-purple-600" />
          <h1 className="text-5xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-lg text-gray-600 mt-2">Administrator Access Required</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Admin Login Card */}
          <div className="bg-white border-2 border-purple-400 rounded-xl p-10 shadow-2xl hover:shadow-2xl transition">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="bg-purple-100 p-3 rounded-full">
                <Shield size={32} className="text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
            </div>

            {/* Warning Banner */}
            <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
              <p className="text-amber-800 font-semibold text-sm">
                ⚠️ This section is restricted to administrators only. Unauthorized access attempts will be logged.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-red-700 font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* Admin Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-gray-900 font-bold mb-3 text-lg">Admin Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-black placeholder-gray-400 text-lg"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-gray-900 font-bold mb-3 text-lg">Admin Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-black placeholder-gray-400 text-lg"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition disabled:bg-purple-400 disabled:cursor-not-allowed text-lg shadow-md hover:shadow-lg"
              >
                {loading ? 'Verifying Credentials...' : '👑 Admin Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-600 font-semibold">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Back to User Login */}
            <button
              onClick={onBackToLogin}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
            >
              ← Back to User Login
            </button>
          </div>

          
          
        </div>
      </div>
    </div>
  );
}
